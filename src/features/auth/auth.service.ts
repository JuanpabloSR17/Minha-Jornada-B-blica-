import * as Linking from 'expo-linking';
import { requireSupabase } from '@/lib/supabase/client';
import { strings } from '@/i18n';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const MIN_PASSWORD = 8;

export function validateCredentials(email: string, password?: string) {
  const errors: { email?: string; password?: string } = {};
  if (!EMAIL_RE.test(email.trim())) errors.email = strings.auth.errors.invalidEmail;
  if (password !== undefined && password.length < MIN_PASSWORD) errors.password = strings.auth.errors.shortPassword;
  return errors;
}

export function authErrorMessage(e: unknown): string {
  const err = e as { code?: string; message?: string; status?: number };
  const code = err?.code ?? '';
  const msg = (err?.message ?? '').toLowerCase();
  if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) return strings.auth.errors.invalidCredentials;
  if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) return strings.auth.errors.emailNotConfirmed;
  if (code === 'user_already_exists' || msg.includes('already registered')) return strings.auth.errors.alreadyRegistered;
  if (code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit' || err?.status === 429) return strings.auth.errors.rateLimited;
  if (code === 'weak_password') return strings.auth.errors.weakPassword;
  if (msg.includes('fetch') || msg.includes('network')) return strings.errors.offline;
  return strings.errors.generic;
}

const redirectTo = () => Linking.createURL('/auth/callback');

export async function signIn(email: string, password: string) {
  const { error } = await requireSupabase().auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
}

/** Retorna true se a conta já está ativa (sem confirmação de e-mail pendente). */
export async function signUp(email: string, password: string): Promise<{ needsConfirmation: boolean }> {
  const { data, error } = await requireSupabase().auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo: redirectTo() },
  });
  if (error) throw error;
  return { needsConfirmation: !data.session };
}

export async function requestPasswordReset(email: string) {
  const { error } = await requireSupabase().auth.resetPasswordForEmail(email.trim(), {
    redirectTo: Linking.createURL('/auth/callback', { queryParams: { next: 'update-password' } }),
  });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const { error } = await requireSupabase().auth.updateUser({ password });
  if (error) throw error;
}

export async function exchangeCode(code: string) {
  const { error } = await requireSupabase().auth.exchangeCodeForSession(code);
  if (error) throw error;
}

export async function signOut() {
  await requireSupabase().auth.signOut();
}
