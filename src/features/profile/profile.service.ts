import { requireSupabase } from '@/lib/supabase/client';
import { throwIfError } from '@/lib/errors';

export type PrivacyMode = 'private' | 'friends' | 'public';

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  privacy_mode: PrivacyMode;
  avatar_onboarding_completed_at: string | null;
  onboarding_completed_at: string | null;
};

export type ReadingPreferences = {
  plan_mode: 'daily_goal' | 'free';
  target_chapters_per_day: number | null;
};

const PROFILE_COLUMNS = 'id, username, display_name, privacy_mode, avatar_onboarding_completed_at, onboarding_completed_at';

export async function fetchMyProfile(userId: string): Promise<Profile | null> {
  const res = await requireSupabase().from('profiles').select(PROFILE_COLUMNS).eq('id', userId).maybeSingle();
  return throwIfError(res) as Profile | null;
}

export async function fetchMyReadingPreferences(userId: string): Promise<ReadingPreferences | null> {
  const res = await requireSupabase()
    .from('reading_preferences')
    .select('plan_mode, target_chapters_per_day')
    .eq('user_id', userId)
    .maybeSingle();
  return throwIfError(res) as ReadingPreferences | null;
}

export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export function normalizeUsername(raw: string) {
  return raw.trim().toLowerCase();
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const res = await requireSupabase().rpc('is_username_available', { p_username: normalizeUsername(username) });
  return throwIfError(res) as boolean;
}

export async function claimProfile(username: string, displayName: string): Promise<Profile> {
  const res = await requireSupabase().rpc('claim_profile', { p_username: username, p_display_name: displayName });
  return throwIfError(res) as Profile;
}

export async function setReadingPreferences(input: { mode: 'daily_goal' | 'free'; target: number | null }) {
  const res = await requireSupabase().rpc('set_reading_preferences', {
    p_plan_mode: input.mode,
    p_target: input.mode === 'free' ? null : input.target,
  });
  return throwIfError(res) as ReadingPreferences;
}
