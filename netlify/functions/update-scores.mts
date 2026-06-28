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

/**
 * Hardcoded overrides keyed by ESPN's stable numeric event ID, for fixtures
 * where ESPN's `team.displayName` is still a bracket-position placeholder
 * ("Group A 2nd Place", "Best Third Place A/B/C/D/F", etc.) instead of a real
 * country name. Checked BEFORE resolveSlug() — if an event ID has an entry
 * here, that wins outright and the displayName is never consulted, so this is
 * safe to leave in place even after ESPN backfills real names.
 *
 * Currently covers all 16 Round of 32 matches (official FIFA Match 73–88),
 * confirmed via the final group standings + FIFA's third-place combination
 * table. Round of 16 onward will hit the same placeholder problem — add a
 * similar block here once those ESPN event IDs are known (they won't exist
 * with fixed real-team meaning until Round of 32 concludes, ~July 3–4 2026).
 */
const ESPN_EVENT_ID_OVERRIDE: Record<string, { home: string; away: string }> = {
  "760486": { home: "south-africa",  away: "canada" },               // Match 73
  "760487": { home: "brazil",        away: "japan" },                // Match 76
  "760489": { home: "germany",       away: "paraguay" },              // Match 74
  "760488": { home: "netherlands",   away: "morocco" },               // Match 75
  "760490": { home: "cote-divoire",  away: "norway" },                // Match 78
  "760492": { home: "france",        away: "sweden" },                // Match 77
  "760491": { home: "mexico",        away: "ecuador" },               // Match 79
  "760495": { home: "england",       away: "dr-congo" },              // Match 80
  "760493": { home: "belgium",       away: "senegal" },               // Match 82
  "760494": { home: "united-states", away: "bosnia-and-herzegovina" }, // Match 81
  "760497": { home: "spain",         away: "austria" },                // Match 84
  "760496": { home: "portugal",      away: "croatia" },                // Match 83
  "760498": { home: "switzerland",   away: "algeria" },                // Match 85
  "760499": { home: "australia",     away: "egypt" },                  // Match 88
  "760500": { home: "argentina",     away: "cabo-verde" },              // Match 86
  "760501": { home: "colombia",      away: "ghana" },                  // Match 87
};

/** Reverse of ESPN_NAME_TO_SLUG, for friendly logging when ESPN_EVENT_ID_OVERRIDE
 *  kicks in and home.team.displayName/away.team.displayName are still placeholders. */
const SLUG_TO_DISPLAY_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(ESPN_NAME_TO_SLUG).map(([name, slug]) => [slug, name]),
);

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

  const bonuses     = [4, 2, 0, 0];
  // 1st/2nd are confirmed Round of 32 teams. 4th is eliminated. 3rd place is
  // PENDING — whether they advance depends on comparing all 12 groups' best
  // third-place records, so they stay alive but at 'group' stage until
  // reconcile_third_place_advancement() confirms them via real R32 results.
  const alive       = [true, true, true, false];
  const groupFinish = [1, 2, 3, 4];

  for (let i = 0; i < sorted.length; i++) {
    const [slug] = sorted[i];
    const bonus = bonuses[i];
    const isAlive = alive[i];
    const newStage = i < 2 ? "round_of_32" : "group";

    await sb.rpc("add_group_finish_bonus", {
      p_team_id: slug,
      p_bonus: bonus,
      p_is_alive: isAlive,
      p_stage: newStage,
      p_group_finish: groupFinish[i],
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

  console.log(`Group ${groupLetter} complete. Standings:`, sorted.map(([id]) => id));
}

/**
 * Once all 16 Round of 32 matches have been recorded, the ground truth of
 * who the 8 best third-place qualifiers actually were is fully known.
 * Award the +1 "3rd and advance" bonus to qualifiers and correctly
 * eliminate (and freeze max_possible_points for) non-qualifiers.
 * Safe to call repeatedly — the RPC skips teams already reconciled.
 */
async function maybeReconcileThirdPlace(sb: SupabaseClient) {
  const { count } = await sb
    .from("matches")
    .select("id", { count: "exact", head: true })
    .eq("stage", "round_of_32")
    .eq("status", "complete");

  if ((count ?? 0) < 16) return; // not all Round of 32 matches in yet

  const { data, error } = await sb.rpc("reconcile_third_place_advancement");
  if (error) {
    console.error("reconcile_third_place_advancement failed:", error);
    return;
  }
  if (data && data.length > 0) {
    console.log("Third-place reconciliation:", data);
  }
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

        const override = ESPN_EVENT_ID_OVERRIDE[event.id];
        const homeSlug = override?.home ?? resolveSlug(home.team.displayName);
        const awaySlug = override?.away ?? resolveSlug(away.team.displayName);

        if (!homeSlug || !awaySlug) {
          const unknown = [!homeSlug && home.team.displayName, !awaySlug && away.team.displayName].filter(Boolean);
          errors.push(`Unknown team name(s): ${unknown.map((n) => `"${n}"`).join(", ")}`);
          continue;
        }

        const homeScore = parseInt(home.score, 10);
        const awayScore = parseInt(away.score, 10);
        const stage = ESPN_SLUG_TO_STAGE[event.season?.slug ?? ""] ?? "group";
        // Friendly names for logging — when the override map kicks in, ESPN's
        // own displayName is still a bracket-position placeholder, so prefer
        // the real country name resolved from the override slug.
        const homeDisplay = override ? (SLUG_TO_DISPLAY_NAME[homeSlug] ?? homeSlug) : home.team.displayName;
        const awayDisplay = override ? (SLUG_TO_DISPLAY_NAME[awaySlug] ?? awaySlug) : away.team.displayName;
        const matchLabel = `${homeDisplay} ${homeScore}–${awayScore} ${awayDisplay}`;

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
            const label = homePts === 3 ? `Group win vs ${awayDisplay} (+3)` : `Group draw vs ${awayDisplay} (+1)`;
            await insertScoringEvent(sb, homeSlug, event.id, "group_match", "group", homePts, label);
          }
          if (awayPts > 0) {
            const label = awayPts === 3 ? `Group win vs ${homeDisplay} (+3)` : `Group draw vs ${homeDisplay} (+1)`;
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
          const winnerName = homeScore > awayScore ? homeDisplay : awayDisplay;
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

          if (stage === "round_of_32") {
            await maybeReconcileThirdPlace(sb);
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
