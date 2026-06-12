/**
 * Netlify Scheduled Function — runs every 30 minutes.
 * Fetches completed World Cup matches from the ESPN unofficial API,
 * applies scoring to team_status, and records results in the matches table.
 * Each match is only processed once (idempotent via espn_event_id).
 *
 * Required Netlify env vars (set in Site settings → Environment variables):
 *   SUPABASE_URL            — same value as VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY — from Supabase → Project Settings → API (secret, server-only)
 */

import type { Config } from "@netlify/functions";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ── Constants ────────────────────────────────────────────────────────────────

const ESPN_SCOREBOARD =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";

/** Points awarded per knockout stage win. */
const KNOCKOUT_PTS: Record<string, number> = {
  round_of_32: 3,
  round_of_16: 5,
  quarterfinal: 7,
  semifinal: 10,
  final: 14,
};

/** Stage a team moves to after winning in a given knockout round. */
const NEXT_STAGE: Record<string, string> = {
  group: "round_of_32",
  round_of_32: "round_of_16",
  round_of_16: "quarterfinal",
  quarterfinal: "semifinal",
  semifinal: "final",
  final: "champion",
};

/** Map ESPN season slugs → our stage keys. */
const ESPN_SLUG_TO_STAGE: Record<string, string> = {
  "group-stage": "group",
  "round-of-32": "round_of_32",
  "round-of-16": "round_of_16",
  "quarterfinals": "quarterfinal",
  "semifinals": "semifinal",
  "3rd-place-match": "third_place",
  "final": "final",
};

/** Map ESPN team displayName → our Supabase team slug. */
const ESPN_NAME_TO_SLUG: Record<string, string> = {
  // Favorites
  France: "france",
  Spain: "spain",
  Brazil: "brazil",
  England: "england",
  // Elite Contenders
  Argentina: "argentina",
  Portugal: "portugal",
  Germany: "germany",
  // Contenders
  Netherlands: "netherlands",
  Belgium: "belgium",
  Colombia: "colombia",
  Norway: "norway",
  // Dark Horses
  Morocco: "morocco",
  Switzerland: "switzerland",
  Uruguay: "uruguay",
  Japan: "japan",
  // Hosts
  Mexico: "mexico",
  "United States": "united-states",
  USA: "united-states",
  Canada: "canada",
  // Dark Horses
  Croatia: "croatia",
  Ecuador: "ecuador",
  // Mid-Tier
  Austria: "austria",
  Turkey: "turkey",
  Türkiye: "turkey",
  "Ivory Coast": "cote-divoire",
  "Côte d'Ivoire": "cote-divoire",
  "Cote d'Ivoire": "cote-divoire",
  Czechia: "czechia",
  "Czech Republic": "czechia",
  Senegal: "senegal",
  "South Korea": "south-korea",
  Sweden: "sweden",
  Algeria: "algeria",
  Egypt: "egypt",
  Paraguay: "paraguay",
  // Value
  "Bosnia and Herzegovina": "bosnia-and-herzegovina",
  "Bosnia & Herzegovina": "bosnia-and-herzegovina",
  "Bosnia-Herzegovina": "bosnia-and-herzegovina",
  "Bosnia Herzegovina": "bosnia-and-herzegovina",
  Ghana: "ghana",
  Iran: "iran",
  Australia: "australia",
  "Congo DR": "dr-congo",
  "DR Congo": "dr-congo",
  "Democratic Republic of Congo": "dr-congo",
  Scotland: "scotland",
  Tunisia: "tunisia",
  // Sleepers
  Qatar: "qatar",
  "Saudi Arabia": "saudi-arabia",
  "South Africa": "south-africa",
  // Value/Long Shot
  "New Zealand": "new-zealand",
  Panama: "panama",
  Uzbekistan: "uzbekistan",
  Iraq: "iraq",
  Jordan: "jordan",
  "Cabo Verde": "cabo-verde",
  "Cape Verde": "cabo-verde",
  Curacao: "curacao",
  "Curaçao": "curacao",
  Haiti: "haiti",
};

// ── Types ────────────────────────────────────────────────────────────────────

interface ESPNEvent {
  id: string;
  date: string;
  season: { slug: string };
  competitions: ESPNCompetition[];
}

interface ESPNCompetition {
  status: { type: { completed: boolean; name: string } };
  competitors: ESPNCompetitor[];
}

interface ESPNCompetitor {
  homeAway: "home" | "away";
  winner: boolean;
  score: string;
  team: { displayName: string };
}

interface TeamRow {
  id: string;
  group_letter: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolve an ESPN team display name to our Supabase slug.
 * Tries the exact name first, then a normalised version (strip diacritics,
 * collapse hyphens/ampersands to spaces) so novel ESPN variants don't
 * silently break scoring.
 */
function resolveSlug(espnName: string): string | undefined {
  if (ESPN_NAME_TO_SLUG[espnName]) return ESPN_NAME_TO_SLUG[espnName];
  // Normalise: NFD → strip combining marks → replace - and & with space → collapse spaces
  const normalised = espnName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")   // strip diacritics (é→e, ü→u, ç→c …)
    .replace(/[-&]/g, " ")              // hyphens and & → space
    .replace(/\s+/g, " ")              // collapse multiple spaces
    .trim();
  if (normalised !== espnName && ESPN_NAME_TO_SLUG[normalised]) {
    console.log(`Slug resolved via normalisation: "${espnName}" → "${normalised}"`);
    return ESPN_NAME_TO_SLUG[normalised];
  }
  return undefined;
}

/** Return the last N calendar dates as YYYYMMDD strings (UTC). */
function recentDates(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.now() - i * 86_400_000);
    return d.toISOString().slice(0, 10).replace(/-/g, "");
  });
}

async function fetchScoreboard(date: string): Promise<ESPNEvent[]> {
  try {
    const res = await fetch(`${ESPN_SCOREBOARD}?dates=${date}`);
    if (!res.ok) return [];
    const json = await res.json() as { events?: ESPNEvent[] };
    return json.events ?? [];
  } catch {
    return [];
  }
}

async function insertScoringEvent(
  sb: SupabaseClient,
  teamId: string,
  espnEventId: string,
  eventType: string,
  stage: string,
  points: number,
  label: string,
) {
  await sb.from("scoring_events").insert({
    team_id: teamId,
    event_type: eventType,
    stage,
    points,
    label,
  });
}

/** After a group match, check if all 6 group matches are done and award finish bonuses. */
async function maybeAwardGroupBonuses(
  sb: SupabaseClient,
  groupLetter: string,
  teamsByGroup: Record<string, string[]>, // groupLetter → [slugs]
) {
  const groupTeams = teamsByGroup[groupLetter];
  if (!groupTeams || groupTeams.length !== 4) return;

  // Fetch all complete group-stage matches involving these teams
  const { data: matches } = await sb
    .from("matches")
    .select("home_team_id, away_team_id, home_score, away_score")
    .eq("stage", "group")
    .eq("status", "complete")
    .in("home_team_id", groupTeams);

  // A 4-team group has 6 matches (each team plays 3 home matches in our query isn't correct —
  // we need matches where EITHER side is in the group)
  const { data: awayMatches } = await sb
    .from("matches")
    .select("home_team_id, away_team_id, home_score, away_score")
    .eq("stage", "group")
    .eq("status", "complete")
    .in("away_team_id", groupTeams);

  const allMatches = [
    ...(matches ?? []),
    ...(awayMatches ?? []).filter(
      (am) => !(matches ?? []).some(
        (m) => m.home_team_id === am.home_team_id && m.away_team_id === am.away_team_id,
      ),
    ),
  ];

  if (allMatches.length < 6) return; // group not yet complete

  // Check if bonuses were already awarded (look for group_finish_bonus events)
  const { data: existingBonuses } = await sb
    .from("scoring_events")
    .select("team_id")
    .eq("event_type", "group_finish")
    .in("team_id", groupTeams);

  if ((existingBonuses?.length ?? 0) > 0) return; // already done

  // Compute standings
  const standings: Record<string, { pts: number; gd: number; gf: number }> = {};
  for (const slug of groupTeams) standings[slug] = { pts: 0, gd: 0, gf: 0 };

  for (const m of allMatches) {
    const hs = m.home_score ?? 0;
    const as_ = m.away_score ?? 0;
    if (standings[m.home_team_id]) {
      standings[m.home_team_id].pts += hs > as_ ? 3 : hs === as_ ? 1 : 0;
      standings[m.home_team_id].gf += hs;
      standings[m.home_team_id].gd += hs - as_;
    }
    if (standings[m.away_team_id]) {
      standings[m.away_team_id].pts += as_ > hs ? 3 : hs === as_ ? 1 : 0;
      standings[m.away_team_id].gf += as_;
      standings[m.away_team_id].gd += as_ - hs;
    }
  }

  // Sort: points → goal diff → goals for → alphabetical
  const sorted = Object.entries(standings).sort(([aId, a], [bId, b]) =>
    b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || aId.localeCompare(bId),
  );

  const bonuses = [4, 2, 0, 0]; // 3rd-place advancement (+1) handled manually — see NOTE below
  const alive   = [true, true, true, false]; // 4th place eliminated; 3rd stays alive pending 8-best check

  for (let i = 0; i < sorted.length; i++) {
    const [slug] = sorted[i];
    const bonus = bonuses[i];
    const isAlive = alive[i];
    const newStage = isAlive ? "round_of_32" : "group";

    await sb.rpc("add_group_finish_bonus", {
      p_team_id: slug,
      p_bonus: bonus,
      p_is_alive: isAlive,
      p_stage: newStage,
    });

    if (bonus > 0) {
      await insertScoringEvent(
        sb, slug, `group_finish_${groupLetter}`, "group_finish", "group",
        bonus,
        i === 0 ? `Won Group ${groupLetter} (+4)` : `2nd in Group ${groupLetter} (+2)`,
      );
    }

    // Eliminate 4th-place team
    if (!isAlive) {
      await sb.rpc("eliminate_team", { p_team_id: slug });
    }
  }

  // NOTE: 3rd-place advancement (+1 bonus) requires knowing all 12 groups' final 3rd-place records.
  // Once all group stage matches are complete, run this in Supabase SQL editor to award it:
  //
  //   SELECT award_third_place_bonuses();   -- (function not yet created — do manually for now)
  //
  // Or use the Admin page to manually add +1 to the 8 qualifying 3rd-place teams.
  console.log(`Group ${groupLetter} complete. Standings:`, sorted.map(([id]) => id));
}

// ── Main handler ─────────────────────────────────────────────────────────────

export default async function updateScores(_req: Request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return new Response("Missing env vars", { status: 500 });
  }

  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // Build group → [team slugs] map from Supabase teams table
  const { data: teamsData } = await sb.from("teams").select("id, group_letter");
  const teamsByGroup: Record<string, string[]> = {};
  const teamGroupMap: Record<string, string> = {};
  for (const t of (teamsData ?? []) as TeamRow[]) {
    teamsByGroup[t.group_letter] ??= [];
    teamsByGroup[t.group_letter].push(t.id);
    teamGroupMap[t.id] = t.group_letter;
  }

  const processed: string[] = [];
  const skipped:   string[] = [];
  const errors:    string[] = [];

  for (const date of recentDates(3)) {
    const events = await fetchScoreboard(date);

    for (const event of events) {
      const comp = event.competitions?.[0];
      if (!comp?.status?.type?.completed) continue; // not finished yet

      // Dedup — skip if already in matches table
      const { data: existing } = await sb
        .from("matches")
        .select("id")
        .eq("espn_event_id", event.id)
        .maybeSingle();
      if (existing) { skipped.push(event.id); continue; }

      try {
        const home = comp.competitors.find((c) => c.homeAway === "home");
        const away = comp.competitors.find((c) => c.homeAway === "away");
        if (!home || !away) continue;

        const homeSlug = resolveSlug(home.team.displayName);
        const awaySlug = resolveSlug(away.team.displayName);

        if (!homeSlug || !awaySlug) {
          const unknown = [!homeSlug && home.team.displayName, !awaySlug && away.team.displayName].filter(Boolean);
          errors.push(`Unknown team name(s): ${unknown.map((n) => `"${n}"`).join(", ")}`);
          continue;
        }

        const homeScore = parseInt(home.score, 10);
        const awayScore = parseInt(away.score, 10);
        const stage = ESPN_SLUG_TO_STAGE[event.season?.slug ?? ""] ?? "group";
        const matchLabel = `${home.team.displayName} ${homeScore}–${awayScore} ${away.team.displayName}`;

        // Record the match
        await sb.from("matches").insert({
          espn_event_id: event.id,
          stage,
          home_team_id: homeSlug,
          away_team_id: awaySlug,
          home_score: homeScore,
          away_score: awayScore,
          status: "complete",
          played_at: event.date,
        });

        if (stage === "group") {
          // ── Group stage: award 3/1/0 match points ────────────────────────
          const homePts = homeScore > awayScore ? 3 : homeScore === awayScore ? 1 : 0;
          const awayPts = awayScore > homeScore ? 3 : homeScore === awayScore ? 1 : 0;

          await sb.rpc("add_group_match_points", { p_team_id: homeSlug, p_points: homePts });
          await sb.rpc("add_group_match_points", { p_team_id: awaySlug, p_points: awayPts });

          // Recalculate max possible for both teams (loser's max drops, winner's rises)
          await sb.rpc("update_team_max_possible", { p_team_id: homeSlug });
          await sb.rpc("update_team_max_possible", { p_team_id: awaySlug });

          if (homePts > 0) {
            const label = homePts === 3 ? `Group win vs ${away.team.displayName} (+3)` : `Group draw vs ${away.team.displayName} (+1)`;
            await insertScoringEvent(sb, homeSlug, event.id, "group_match", "group", homePts, label);
          }
          if (awayPts > 0) {
            const label = awayPts === 3 ? `Group win vs ${home.team.displayName} (+3)` : `Group draw vs ${home.team.displayName} (+1)`;
            await insertScoringEvent(sb, awaySlug, event.id, "group_match", "group", awayPts, label);
          }

          // Check if group is now complete and award finish bonuses
          const groupLetter = teamGroupMap[homeSlug];
          if (groupLetter) {
            await maybeAwardGroupBonuses(sb, groupLetter, teamsByGroup);
          }

        } else if (stage !== "third_place") {
          // ── Knockout stage: award win points, eliminate loser ─────────────
          const winnerSlug = homeScore > awayScore ? homeSlug : awaySlug;
          const loserSlug  = homeScore > awayScore ? awaySlug : homeSlug;
          const winnerName = homeScore > awayScore ? home.team.displayName : away.team.displayName;
          const pts = KNOCKOUT_PTS[stage] ?? 0;
          const newStage = NEXT_STAGE[stage] ?? stage;

          await sb.rpc("add_knockout_win", {
            p_team_id: winnerSlug,
            p_points: pts,
            p_new_stage: newStage,
          });
          await sb.rpc("eliminate_team", { p_team_id: loserSlug });

          if (pts > 0) {
            await insertScoringEvent(
              sb, winnerSlug, event.id, `${stage}_win`, stage, pts,
              `Won ${stage.replace(/_/g, " ")} (+${pts})`,
            );
          }

          console.log(`Knockout: ${winnerName} advances (+${pts})`);
        }

        processed.push(matchLabel);
        console.log(`Processed: ${matchLabel}`);
      } catch (err) {
        errors.push(`Event ${event.id}: ${String(err)}`);
        console.error(`Error processing event ${event.id}:`, err);
      }
    }
  }

  // Stamp last update time
  await sb.from("app_settings").update({
    last_score_update_at: new Date().toISOString(),
  }).eq("id", true);

  const summary = { processed, skipped: skipped.length, errors };
  console.log("update-scores done:", summary);
  return Response.json(summary);
}

export const config: Config = {
  schedule: "*/30 * * * *",
};
