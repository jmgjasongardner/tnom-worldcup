import { supabase } from './supabaseClient';
import { withExtras } from './teamsApi';
import { TEAMS as STATIC_TEAMS } from '../data/teams';
import type { Team } from '../types/domain';

export interface LeaderboardEntry {
  id: string;
  displayName: string;
  emailUser: string;   // everything before @technomics.net
  email: string;
  totalCost: number;
  teamIds: string[];
  teams: Team[];
  currentPoints: number;
  maxPossiblePoints: number;
  teamsAlive: number;
  rank: number;
  /** Average pairwise Jaccard distance vs all other portfolios, 0–100. Higher = more unique. */
  diversityScore: number;
  /** Per-team scoring status, keyed by team id. */
  teamStatuses: Record<string, TeamStatusRow>;
}

export interface TeamLeaderboardRow {
  team: Team;
  pickCount: number;
  pickPct: number;
  currentPoints: number;
  maxPossiblePoints: number;
  isAlive: boolean;
  currentStage: string;
}

export interface TeamPicker {
  entryId: string;
  displayName: string;
  emailUser: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function emailUser(email: string): string {
  return email.split('@')[0] ?? email;
}

/** Sort teams: cost descending, then country ascending. */
function sortTeams(teams: Team[]): Team[] {
  return [...teams].sort((a, b) => b.cost - a.cost || a.country.localeCompare(b.country));
}

/** Build a map of teamId → Team, preferring Supabase data enriched with extras. */
async function buildTeamMap(): Promise<Record<string, Team>> {
  const { data } = await supabase.from('teams').select('*');
  const rows: Team[] = data && data.length > 0
    ? withExtras(data.map(rowToTeam))
    : withExtras(STATIC_TEAMS);
  const map: Record<string, Team> = {};
  for (const t of rows) map[t.id] = t;
  return map;
}

function rowToTeam(row: Record<string, unknown>): Team {
  return {
    id: row.id as string,
    country: row.country as string,
    groupLetter: row.group_letter as string,
    cost: row.cost as number,
    tier: row.tier as Team['tier'],
    keyPlayer: (row.key_player as string) ?? '',
    playerPosition: (row.player_position as string) ?? null,
    playerClub: (row.player_club as string) ?? null,
    flagEmoji: (row.flag_emoji as string) ?? '',
    flagUrl: (row.flag_url as string) ?? null,
    fifaRank: (row.fifa_rank as number) ?? null,
    groupWinOdds: (row.group_win_odds as string) ?? null,
    advanceOdds: null,
    titleOdds: (row.title_odds as string) ?? null,
    whyPick: (row.why_pick as string) ?? null,
    poolAngle: (row.pool_angle as string) ?? null,
  };
}

export interface TeamStatusRow {
  teamId: string;
  currentPoints: number;
  maxPossiblePoints: number;
  isAlive: boolean;
  currentStage: string;
}

async function fetchAllTeamStatus(): Promise<Record<string, TeamStatusRow>> {
  const { data } = await supabase.from('team_status').select('*');
  const map: Record<string, TeamStatusRow> = {};
  if (data) {
    for (const row of data) {
      map[row.team_id as string] = {
        teamId: row.team_id as string,
        currentPoints: (row.total_points as number) ?? 0,
        maxPossiblePoints: (row.max_possible_points as number) ?? 50,
        isAlive: (row.is_alive as boolean) ?? true,
        currentStage: (row.current_stage as string) ?? 'group',
      };
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Fetch all entries with their teams, enriched with scoring data. */
export async function fetchLeaderboardEntries(): Promise<LeaderboardEntry[]> {
  const [{ data: entriesData }, teamMap, statusMap, { data: allPicksData }] = await Promise.all([
    supabase
      .from('entries')
      .select('id, display_name, email, total_cost, entry_teams(team_id)'),
    buildTeamMap(),
    fetchAllTeamStatus(),
    supabase.from('entry_teams').select('team_id'),
  ]);

  if (!entriesData) return [];

  // Compute pick rates for popularity-weighted diversity
  const totalEntries = entriesData.length;
  const pickCounts: Record<string, number> = {};
  for (const row of allPicksData ?? []) {
    const id = row.team_id as string;
    pickCounts[id] = (pickCounts[id] ?? 0) + 1;
  }

  const entries: LeaderboardEntry[] = entriesData.map((row) => {
    const teamIds = ((row.entry_teams as { team_id: string }[]) ?? []).map((et) => et.team_id);
    const teams = sortTeams(teamIds.map((id) => teamMap[id]).filter(Boolean) as Team[]);

    let currentPoints = 0;
    let maxPossiblePoints = 0;
    let teamsAlive = 0;

    for (const t of teams) {
      const status = statusMap[t.id];
      currentPoints += status?.currentPoints ?? 0;
      maxPossiblePoints += status?.maxPossiblePoints ?? 50;
      if (status?.isAlive !== false) teamsAlive++;
    }

    return {
      id: row.id as string,
      displayName: row.display_name as string,
      email: row.email as string,
      emailUser: emailUser(row.email as string),
      totalCost: row.total_cost as number,
      teamIds,
      teams,
      currentPoints,
      maxPossiblePoints,
      teamsAlive,
      teamStatuses: statusMap,
      rank: 0, // assigned below
      diversityScore: totalEntries > 1
        ? Math.round(
            (teams.reduce((sum, t) => sum + (1 - (pickCounts[t.id] ?? 0) / totalEntries), 0) /
              Math.max(teams.length, 1)) *
              100,
          )
        : 0,
    };
  });

  // Sort by currentPoints desc, then maxPossiblePoints desc, then name asc
  entries.sort((a, b) =>
    b.currentPoints - a.currentPoints ||
    b.maxPossiblePoints - a.maxPossiblePoints ||
    a.displayName.localeCompare(b.displayName)
  );

  // Assign ranks (handle ties)
  let rank = 1;
  for (let i = 0; i < entries.length; i++) {
    if (i > 0 && entries[i].currentPoints < entries[i - 1].currentPoints) {
      rank = i + 1;
    }
    entries[i].rank = rank;
  }

  return entries;
}

/** Fetch a single participant's entry by email username (part before @technomics.net). */
export async function fetchParticipantEntry(emailUserParam: string): Promise<LeaderboardEntry | null> {
  const fullEmail = emailUserParam.includes('@')
    ? emailUserParam
    : `${emailUserParam}@technomics.net`;

  const [{ data: row }, teamMap, statusMap] = await Promise.all([
    supabase
      .from('entries')
      .select('id, display_name, email, total_cost, entry_teams(team_id)')
      .eq('email', fullEmail)
      .maybeSingle(),
    buildTeamMap(),
    fetchAllTeamStatus(),
  ]);

  if (!row) return null;

  const teamIds = ((row.entry_teams as { team_id: string }[]) ?? []).map((et) => et.team_id);
  const teams = sortTeams(teamIds.map((id) => teamMap[id]).filter(Boolean) as Team[]);

  let currentPoints = 0;
  let maxPossiblePoints = 0;
  let teamsAlive = 0;
  for (const t of teams) {
    const status = statusMap[t.id];
    currentPoints += status?.currentPoints ?? 0;
    maxPossiblePoints += status?.maxPossiblePoints ?? 50;
    if (status?.isAlive !== false) teamsAlive++;
  }

  return {
    id: row.id as string,
    displayName: row.display_name as string,
    email: row.email as string,
    emailUser: emailUser(row.email as string),
    totalCost: row.total_cost as number,
    teamIds,
    teams,
    currentPoints,
    maxPossiblePoints,
    teamsAlive,
    teamStatuses: statusMap,
    rank: 0,
    diversityScore: 0,
  };
}

/** Fetch all teams enriched with pick counts and tournament status. */
export async function fetchTeamLeaderboard(): Promise<TeamLeaderboardRow[]> {
  const [teamMap, statusMap, { data: pickData }] = await Promise.all([
    buildTeamMap(),
    fetchAllTeamStatus(),
    supabase.from('entry_teams').select('team_id'),
  ]);

  // Count picks per team
  const pickCounts: Record<string, number> = {};
  for (const row of pickData ?? []) {
    const id = row.team_id as string;
    pickCounts[id] = (pickCounts[id] ?? 0) + 1;
  }

  const totalEntries = (pickData ?? []).length > 0
    ? Math.max(...Object.values(pickCounts)) > 0
      ? Object.values(pickCounts).reduce((a, b) => a + b, 0) / 6 // 6 picks per entry
      : 0
    : 0;

  return Object.values(teamMap).map((team) => {
    const status = statusMap[team.id];
    const count = pickCounts[team.id] ?? 0;
    return {
      team,
      pickCount: count,
      pickPct: totalEntries > 0 ? Math.round((count / totalEntries) * 100) : 0,
      currentPoints: status?.currentPoints ?? 0,
      maxPossiblePoints: status?.maxPossiblePoints ?? 50,
      isAlive: status?.isAlive ?? true,
      currentStage: status?.currentStage ?? 'group',
    };
  });
}

export interface CoPickRow {
  team: Team;
  count: number;
  pct: number;  // % of entries that picked THIS team also picked the co-team
}

/**
 * For a given team, find how many times each other team was co-picked alongside it.
 * E.g. if France was picked 10 times, and 8 of those entries also picked Spain,
 * Spain appears with count=8, pct=80%.
 */
export async function fetchTeamCoPicks(teamId: string): Promise<CoPickRow[]> {
  const [teamMap, { data: pickersData }] = await Promise.all([
    buildTeamMap(),
    // Get all entry_ids that picked this team
    supabase.from('entry_teams').select('entry_id').eq('team_id', teamId),
  ]);

  if (!pickersData || pickersData.length === 0) return [];

  const entryIds = pickersData.map((r) => r.entry_id as string);
  const pickerCount = entryIds.length;

  // Get all teams picked by those entries (excluding the current team)
  const { data: coPicks } = await supabase
    .from('entry_teams')
    .select('team_id')
    .in('entry_id', entryIds)
    .neq('team_id', teamId);

  if (!coPicks) return [];

  // Count occurrences of each co-picked team
  const counts: Record<string, number> = {};
  for (const row of coPicks) {
    const id = row.team_id as string;
    counts[id] = (counts[id] ?? 0) + 1;
  }

  return Object.entries(counts)
    .map(([id, count]) => ({
      team: teamMap[id],
      count,
      pct: Math.round((count / pickerCount) * 100),
    }))
    .filter((r) => r.team != null)
    .sort((a, b) => b.count - a.count || a.team.country.localeCompare(b.team.country));
}

export interface SimilarPortfolio {
  entry: LeaderboardEntry;
  overlapCount: number;
  sharedTeams: Team[];       // teams both portfolios have
  differentTeams: Team[];    // teams the other portfolio has that the current one doesn't
}

/**
 * Find other participants whose portfolio shares 3–6 teams with the given portfolio.
 * Results are sorted by overlap count desc, then by displayName asc.
 */
export async function fetchSimilarPortfolios(
  currentEmailUser: string,
  currentTeamIds: string[],
): Promise<SimilarPortfolio[]> {
  const entries = await fetchLeaderboardEntries();
  const currentSet = new Set(currentTeamIds);

  const results: SimilarPortfolio[] = [];
  for (const entry of entries) {
    if (entry.emailUser === currentEmailUser) continue;
    const shared = entry.teamIds.filter((id) => currentSet.has(id));
    if (shared.length >= 3) {
      results.push({
        entry,
        overlapCount: shared.length,
        sharedTeams: sortTeams(entry.teams.filter((t) => currentSet.has(t.id))),
        differentTeams: sortTeams(entry.teams.filter((t) => !currentSet.has(t.id))),
      });
    }
  }

  results.sort(
    (a, b) =>
      b.overlapCount - a.overlapCount ||
      a.entry.displayName.localeCompare(b.entry.displayName),
  );
  return results;
}

/**
 * Fetch a map of teamId → list of participant display names who picked that team.
 * Single query — efficient for rendering "who picked" for every team at once.
 */
export async function fetchAllPickers(): Promise<Record<string, string[]>> {
  const { data } = await supabase
    .from('entry_teams')
    .select('team_id, entries(display_name)');

  const map: Record<string, string[]> = {};
  for (const row of (data ?? [])) {
    const id = row.team_id as string;
    const entry = row.entries as { display_name: string } | null;
    if (!entry) continue;
    if (!map[id]) map[id] = [];
    map[id].push(entry.display_name as string);
  }
  return map;
}

/** Fetch the display names of everyone who picked a given team. */
export async function fetchTeamPickers(teamId: string): Promise<TeamPicker[]> {
  const { data } = await supabase
    .from('entry_teams')
    .select('entry_id, entries(id, display_name, email)')
    .eq('team_id', teamId);

  if (!data) return [];

  return data
    .map((row) => {
      const entry = row.entries as { id: string; display_name: string; email: string } | null;
      if (!entry) return null;
      return {
        entryId: entry.id,
        displayName: entry.display_name,
        emailUser: emailUser(entry.email),
      };
    })
    .filter(Boolean) as TeamPicker[];
}
