/**
 * Resolves the static knockout bracket (src/data/knockoutBracket.ts) against
 * live match results, and computes the bracket-collision-aware "Best Score"
 * upside for a portfolio.
 */
import { supabase } from './supabaseClient';
import {
  KNOCKOUT_BRACKET,
  KNOCKOUT_ROUND_POINTS,
  type BracketMatch,
  type KnockoutStage,
} from '../data/knockoutBracket';

export interface ResolvedBracketMatch {
  matchNumber: number;
  stage: KnockoutStage;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeLabel: string;
  awayLabel: string;
  homeScore: number | null;
  awayScore: number | null;
  winnerTeamId: string | null;
  loserTeamId: string | null;
  isComplete: boolean;
}

interface RawMatchRow {
  stage: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
}

const KNOCKOUT_STAGES = ['round_of_32', 'round_of_16', 'quarterfinal', 'semifinal', 'third_place', 'final'];

/** Precomputed once: for each match number, which earlier match (if any) feeds its
 *  home/away slot via "winnerOf". Used by the Best Score DP — loserOf (the
 *  third-place match) is intentionally excluded since it's a dead end worth 0 points. */
const FEEDER_MAP: Record<number, { home: number | null; away: number | null }> = {};
for (const m of KNOCKOUT_BRACKET) {
  FEEDER_MAP[m.matchNumber] = {
    home: m.home.winnerOf ?? null,
    away: m.away.winnerOf ?? null,
  };
}

async function fetchKnockoutResultRows(): Promise<RawMatchRow[]> {
  const { data } = await supabase
    .from('matches')
    .select('stage, home_team_id, away_team_id, home_score, away_score, status')
    .in('stage', KNOCKOUT_STAGES);
  return (data ?? []) as RawMatchRow[];
}

/** Find a recorded, completed result between two specific teams — tolerant of home/away order. */
function findResult(rows: RawMatchRow[], teamA: string, teamB: string): RawMatchRow | null {
  for (const r of rows) {
    if (r.status !== 'complete') continue;
    if ((r.home_team_id === teamA && r.away_team_id === teamB) ||
        (r.home_team_id === teamB && r.away_team_id === teamA)) {
      return r;
    }
  }
  return null;
}

/**
 * Resolve every bracket match against live results, in official match-number
 * order. This order is safe because "winnerOf"/"loserOf" references always
 * point to a strictly lower match number.
 */
export function resolveBracket(rows: RawMatchRow[]): ResolvedBracketMatch[] {
  const byNumber = new Map<number, ResolvedBracketMatch>();
  const sorted = [...KNOCKOUT_BRACKET].sort((a, b) => a.matchNumber - b.matchNumber);

  function resolveSlot(slot: BracketMatch['home']): { teamId: string | null; label: string } {
    if (slot.teamId) return { teamId: slot.teamId, label: slot.label };
    if (slot.winnerOf != null) {
      const prev = byNumber.get(slot.winnerOf);
      return { teamId: prev?.winnerTeamId ?? null, label: slot.label };
    }
    if (slot.loserOf != null) {
      const prev = byNumber.get(slot.loserOf);
      return { teamId: prev?.loserTeamId ?? null, label: slot.label };
    }
    return { teamId: null, label: slot.label };
  }

  for (const m of sorted) {
    const home = resolveSlot(m.home);
    const away = resolveSlot(m.away);

    let winnerTeamId: string | null = null;
    let loserTeamId: string | null = null;
    let isComplete = false;
    let homeScore: number | null = null;
    let awayScore: number | null = null;

    if (home.teamId && away.teamId) {
      const result = findResult(rows, home.teamId, away.teamId);
      if (result) {
        isComplete = true;
        if (result.home_team_id === home.teamId) {
          homeScore = result.home_score;
          awayScore = result.away_score;
        } else {
          homeScore = result.away_score;
          awayScore = result.home_score;
        }
        if ((homeScore ?? 0) > (awayScore ?? 0)) {
          winnerTeamId = home.teamId;
          loserTeamId = away.teamId;
        } else if ((awayScore ?? 0) > (homeScore ?? 0)) {
          winnerTeamId = away.teamId;
          loserTeamId = home.teamId;
        }
        // A tied scoreline shouldn't happen in a knockout match (penalties
        // always produce a winner) — if it does, winner/loser stay null and
        // descendant slots simply remain unresolved until it's corrected.
      }
    }

    byNumber.set(m.matchNumber, {
      matchNumber: m.matchNumber,
      stage: m.stage,
      homeTeamId: home.teamId,
      awayTeamId: away.teamId,
      homeLabel: home.label,
      awayLabel: away.label,
      homeScore,
      awayScore,
      winnerTeamId,
      loserTeamId,
      isComplete,
    });
  }

  return sorted.map((m) => byNumber.get(m.matchNumber)!);
}

/** Fetch live results and resolve the full bracket in one call. */
export async function fetchResolvedBracket(): Promise<ResolvedBracketMatch[]> {
  const rows = await fetchKnockoutResultRows();
  return resolveBracket(rows);
}

/**
 * Bracket-collision-aware "Best Score" upside — the realistic ceiling on
 * remaining points, as opposed to "Max Possible" (which naively sums each
 * team's individual ceiling and double-counts round bonuses when two owned
 * teams are on a collision course to play each other).
 *
 * For any not-yet-played match, its round-win bonus only belongs in the
 * upside total if at least one owned, still-alive team could still reach it.
 * Whether a match has been decided already determines whether we treat its
 * entrant as a fixed known team (no longer a "could be either" choice) or as
 * still-open (recurse into its own feeders).
 *
 *   upside(match) = 0                                            if already played,
 *                                                                  or unreachable by any owned/alive team
 *   upside(match) = upside(homeFeeder) + upside(awayFeeder) + roundPoints(match)   otherwise
 *
 * Summing this from the Final backward naturally resolves collisions: if two
 * owned teams are bracketed to meet, the shared ancestor match's bonus is
 * only ever added once (the recursion doesn't care which of the two teams
 * "is" the home/away branch — it just asks whether the branch contains any
 * of our teams at all).
 */
export function computeBestUpside(
  ownedAliveTeamIds: ReadonlySet<string>,
  resolved: ResolvedBracketMatch[],
): number {
  const byNumber = new Map(resolved.map((m) => [m.matchNumber, m]));
  const reachableCache = new Map<number, ReadonlySet<string>>();
  const upsideCache = new Map<number, number>();

  function reachableAt(matchNumber: number): ReadonlySet<string> {
    const cached = reachableCache.get(matchNumber);
    if (cached) return cached;

    const m = byNumber.get(matchNumber);
    const feeders = FEEDER_MAP[matchNumber];
    const result = new Set<string>();

    if (m && feeders) {
      const sides: Array<{ feeder: number | null; teamId: string | null }> = [
        { feeder: feeders.home, teamId: m.homeTeamId },
        { feeder: feeders.away, teamId: m.awayTeamId },
      ];
      for (const { feeder, teamId } of sides) {
        if (feeder == null) {
          // Leaf (Round of 32) — a literal, known team.
          if (teamId && ownedAliveTeamIds.has(teamId)) result.add(teamId);
          continue;
        }
        const feederMatch = byNumber.get(feeder);
        if (!feederMatch) continue;
        if (feederMatch.isComplete) {
          if (feederMatch.winnerTeamId && ownedAliveTeamIds.has(feederMatch.winnerTeamId)) {
            result.add(feederMatch.winnerTeamId);
          }
        } else {
          for (const id of reachableAt(feeder)) result.add(id);
        }
      }
    }

    reachableCache.set(matchNumber, result);
    return result;
  }

  function upsideAt(matchNumber: number): number {
    const cached = upsideCache.get(matchNumber);
    if (cached != null) return cached;

    const m = byNumber.get(matchNumber);
    if (!m || m.isComplete) {
      upsideCache.set(matchNumber, 0);
      return 0;
    }

    const reachable = reachableAt(matchNumber);
    if (reachable.size === 0) {
      upsideCache.set(matchNumber, 0);
      return 0;
    }

    const feeders = FEEDER_MAP[matchNumber] ?? { home: null, away: null };
    const homeUpside = feeders.home != null && !byNumber.get(feeders.home)?.isComplete
      ? upsideAt(feeders.home)
      : 0;
    const awayUpside = feeders.away != null && !byNumber.get(feeders.away)?.isComplete
      ? upsideAt(feeders.away)
      : 0;

    const value = homeUpside + awayUpside + (KNOCKOUT_ROUND_POINTS[m.stage] ?? 0);
    upsideCache.set(matchNumber, value);
    return value;
  }

  // Match 104 (the Final) is the root every scoring-relevant match feeds into.
  // The third-place match (103) is a dead end worth 0 points and isn't part
  // of this graph at all (it's fed by losers, not winners).
  return upsideAt(104);
}
