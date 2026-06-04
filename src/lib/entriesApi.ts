import { supabase } from './supabaseClient';
import type { Team } from '../types/domain';

export interface MyEntry {
  id: string;
  email: string;
  displayName: string;
  totalCost: number;
  teamIds: string[];
}

/** Fetch an existing entry by email. Returns null if none found. */
export async function fetchMyEntry(email: string): Promise<MyEntry | null> {
  const { data: entry, error } = await supabase
    .from('entries')
    .select('id, email, display_name, total_cost')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (error || !entry) return null;

  const { data: teamRows } = await supabase
    .from('entry_teams')
    .select('team_id')
    .eq('entry_id', entry.id);

  return {
    id: entry.id as string,
    email: entry.email as string,
    displayName: entry.display_name as string,
    totalCost: entry.total_cost as number,
    teamIds: (teamRows ?? []).map((r: { team_id: string }) => r.team_id),
  };
}

/** Submit or update a portfolio. Uses email as the unique key (upsert). */
export async function submitPortfolio(
  email: string,
  displayName: string,
  teams: Team[],
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const totalCost = teams.reduce((s, t) => s + t.cost, 0);

  try {
    // Upsert entry by email
    const { data: entry, error: entryError } = await supabase
      .from('entries')
      .upsert(
        {
          email: normalizedEmail,
          display_name: displayName.trim(),
          total_cost: totalCost,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' },
      )
      .select('id')
      .single();

    if (entryError || !entry) {
      return { success: false, error: entryError?.message ?? 'Failed to save entry.' };
    }

    const entryId = entry.id as string;

    // Replace team selections
    await supabase.from('entry_teams').delete().eq('entry_id', entryId);

    const teamRows = teams.map((t) => ({ entry_id: entryId, team_id: t.id }));
    const { error: teamsError } = await supabase.from('entry_teams').insert(teamRows);

    if (teamsError) {
      return { success: false, error: teamsError.message };
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
