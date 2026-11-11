import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  fetchMyProfile,
  fetchMyReadingPreferences,
  type Profile,
  type ReadingPreferences,
} from '@/features/profile/profile.service';

type Status = 'loading' | 'signedOut' | 'signedIn';

type AuthValue = {
  status: Status;
  session: Session | null;
  userId: string | null;
  profile: Profile | null;
  readingPreferences: ReadingPreferences | null;
  /** carregamento do perfil falhou (ex.: offline) — não confundir com "sem perfil" */
  profileError: unknown;
  profileLoaded: boolean;
  passwordRecovery: boolean;
  refreshProfile: () => Promise<void>;
  clearPasswordRecovery: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<Status>(supabase ? 'loading' : 'signedOut');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [prefs, setPrefs] = useState<ReadingPreferences | null>(null);
  const [profileError, setProfileError] = useState<unknown>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const userId = session?.user.id ?? null;
  const loadSeq = useRef(0);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setStatus(data.session ? 'signedIn' : 'signedOut');
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
      setSession(next);
      setStatus(next ? 'signedIn' : 'signedOut');
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!userId) return;
    const seq = ++loadSeq.current;
    try {
      const [p, r] = await Promise.all([fetchMyProfile(userId), fetchMyReadingPreferences(userId)]);
      if (seq !== loadSeq.current) return;
      setProfile(p);
      setPrefs(r);
      setProfileError(null);
    } catch (e) {
      if (seq !== loadSeq.current) return;
      setProfileError(e);
    } finally {
      if (seq === loadSeq.current) setProfileLoaded(true);
    }
  }, [userId]);

  useEffect(() => {
    setProfile(null);
    setPrefs(null);
    setProfileError(null);
    setProfileLoaded(false);
    if (userId) void refreshProfile();
  }, [userId, refreshProfile]);

  const value = useMemo<AuthValue>(
    () => ({
      status,
      session,
      userId,
      profile,
      readingPreferences: prefs,
      profileError,
      profileLoaded,
      passwordRecovery,
      refreshProfile,
      clearPasswordRecovery: () => setPasswordRecovery(false),
    }),
    [status, session, userId, profile, prefs, profileError, profileLoaded, passwordRecovery, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth fora do AuthProvider');
  return ctx;
}

/** Próxima etapa do onboarding para o usuário logado. */
export function onboardingStep(profile: Profile | null): 'identity' | 'avatar' | 'pace' | 'done' {
  if (!profile) return 'identity';
  if (!profile.avatar_onboarding_completed_at) return 'avatar';
  if (!profile.onboarding_completed_at) return 'pace';
  return 'done';
}
