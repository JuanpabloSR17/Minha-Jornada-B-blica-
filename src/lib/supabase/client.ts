import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** Só a chave pública (anon/publishable) vai para o app. Nunca a service role. */
export const isSupabaseConfigured = /^https?:\/\//.test(url) && anonKey.length > 20 && !url.includes('SEU-PROJETO');

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
        flowType: 'pkce',
      },
    })
  : null;

export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new AppError('not_configured');
  return supabase;
}

// No mobile, renova o token só com o app em primeiro plano (recomendação do Supabase).
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export class AppError extends Error {
  constructor(public code: string, message?: string) {
    super(message ?? code);
  }
}
