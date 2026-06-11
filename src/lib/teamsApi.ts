import { supabase } from './supabaseClient';
import type { Team } from '../types/domain';
import { TEAMS as STATIC_TEAMS } from '../data/teams';
import { TEAM_EXTRAS } from '../data/teamExtras';

/** Enrich static team data with FIFA ranks and betting odds. */
export function withExtras(teams: Team[]): Team[] {
  return teams.map((t) => {
    const extra = TEAM_EXTRAS[t.id];
    if (!extra) return t;
    return {
      ...t,
      fifaRank: t.fifaRank ?? extra.fifaRank ?? null,
      titleOdds: t.titleOdds ?? extra.titleOdds ?? null,
      groupWinOdds: t.groupWinOdds ?? extra.groupWinOdds ?? null,
      advanceOdds: t.advanceOdds ?? extra.advanceOdds ?? null,
    };
  });
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
    advanceOdds: null, // not stored in DB, always comes from teamExtras
    titleOdds: (row.title_odds as string) ?? null,
    whyPick: (row.why_pick as string) ?? null,
    poolAngle: (row.pool_angle as string) ?? null,
  };
}

export async function fetchTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('cost', { ascending: false });

  if (error || !data || data.length === 0) {
    // Fall back to static data if Supabase isn't seeded yet
    return withExtras(STATIC_TEAMS);
  }

  // Supabase data already has ranks/odds from patch_001.sql,
  // but fall back to local extras if they're still null.
  return withExtras(data.map(rowToTeam));
}

export async function fetchAppSettings() {
  const { data, error } = await supabase
    .from('app_settings')
    .select('picks_locked, bracket_lock_at, last_score_update_at')
    .single();

  if (error || !data) {
    return { picksLocked: false, bracketLockAt: null, lastScoreUpdateAt: null };
  }

  return {
    picksLocked: data.picks_locked as boolean,
    bracketLockAt: data.bracket_lock_at as string | null,
    lastScoreUpdateAt: data.last_score_update_at as string | null,
  };
}
