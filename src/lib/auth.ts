import { supabase } from './supabaseClient';
import { EMAIL_DOMAIN } from './validation';

export async function sendMagicLink(email: string): Promise<{ error: string | null }> {
  if (!email.trim().toLowerCase().endsWith(EMAIL_DOMAIN)) {
    return { error: `Please use your Technomics email (${EMAIL_DOMAIN}).` };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: `${window.location.origin}/pick`,
    },
  });

  if (error) return { error: error.message };
  return { error: null };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, is_admin')
    .eq('id', userId)
    .single();

  if (error) return null;
  return data;
}

export async function updateDisplayName(userId: string, displayName: string): Promise<void> {
  await supabase
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', userId);
}
