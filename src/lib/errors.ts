import { strings } from '@/i18n';
import { AppError } from './supabase/client';

const KNOWN = new Set(Object.keys(strings.errors));

export function isNetworkError(e: unknown): boolean {
  const msg = String((e as { message?: string })?.message ?? e ?? '').toLowerCase();
  return (
    msg.includes('network request failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('fetch failed') ||
    msg.includes('networkerror') ||
    msg.includes('load failed') ||
    (e as { name?: string })?.name === 'AuthRetryableFetchError'
  );
}

/** Código de erro estável vindo do servidor (RAISE ... message = 'codigo'). */
export function errorCode(e: unknown): string {
  if (e instanceof AppError) return e.code;
  if (isNetworkError(e)) return 'offline';
  const msg = String((e as { message?: string })?.message ?? '');
  return KNOWN.has(msg) ? msg : 'generic';
}

export function errorMessage(e: unknown): string {
  const code = errorCode(e);
  return (strings.errors as Record<string, string>)[code] ?? strings.errors.generic;
}

/** Converte o erro de uma resposta do Supabase em exceção. */
export function throwIfError<T>(res: { data: T; error: unknown }): T {
  if (res.error) throw res.error;
  return res.data;
}
