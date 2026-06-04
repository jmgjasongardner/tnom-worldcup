import { supabase } from './supabaseClient';
import type { Team } from '../types/domain';

export interface EntryWithTeams {
  id: string;
  userId: string;
  displayName: string;
  totalCost: number;
  submittedAt: string;
  teamIds: string[];
}

export async function fetchMyEntry(userId: string): Promise<EntryWithTeams | null> {
  const { data: entry, error } = await supabase
    .from('entries')
    .select('id, user_id, display_name, total_cost, submitted_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !entry) return null;

  const { data: entryTeams } = await supabase
    .from('entry_teams')
    .select('team_id')
    .eq('entry_id', entry.id);

  return {
    id: entry.id as string,
    userId: entry.user_id as string,
    displayName: entry.display_name as string,
    totalCost: entry.total_cost as number,
    submittedAt: entry.submitted_at as string,
    teamIds: (entryTeams ?? []).map((r: { team_id: string }) => r.team_id),
  };
}

export async function submitPortfolio(
  userId: string,
  displayName: string,
  teams: Team[]
): Promise<{ error: string | null }> {
  const totalCost = teams.reduce((s, t) => s + t.cost, 0);

  // 1. Upsert the entry row
  const { data: entry, error: entryError } = await supabase
    .from('entries')
    .upsert(
      { user_id: userId, display_name: displayName, total_cost: totalCost },
      { onConflict: 'user_id' }
    )
    .select('id')
    .single();

  if (entryError || !entry) {
    return { error: entryError?.message ?? 'Failed to save portfolio.' };
  }

  const entryId = entry.id as string;

  // 2. Delete existing team selections
  const { error: deleteError } = await supabase
    .from('entry_teams')
    .delete()
    .eq('entry_id', entryId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  // 3. Insert new team selections
  const { error: insertError } = await supabase
    .from('entry_teams')
    .insert(teams.map((t) => ({ entry_id: entryId, team_id: t.id })));

  if (insertError) {
    return { error: insertError.message };
  }

  // 4. Sync display_name to profile
  await supabase
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', userId);

  return { error: null };
}
