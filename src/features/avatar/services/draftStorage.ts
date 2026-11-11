import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeLook } from '../domain/avatar.rules';
import type { AvatarLook } from '../domain/avatar.types';

/**
 * Rascunhos locais do criador. Servem para não perder escolhas (app fechado, sem rede)
 * e para o modo "Experimentar". Nunca são tratados como salvamento na conta.
 */
const GUEST_KEY = 'jb:guest-look:v1';
const userKey = (userId: string) => `jb:draft-look:v1:${userId}`;

export type StoredDraft = { look: AvatarLook; step: number; updatedAt: string };

async function read(key: string): Promise<StoredDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredDraft>;
    return {
      look: normalizeLook(parsed.look),
      step: typeof parsed.step === 'number' ? Math.max(0, Math.min(3, parsed.step)) : 0,
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function write(key: string, look: AvatarLook, step: number) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ look, step, updatedAt: new Date().toISOString() }));
    return true;
  } catch {
    return false;
  }
}

export const draftStorage = {
  readGuest: () => read(GUEST_KEY),
  writeGuest: (look: AvatarLook, step: number) => write(GUEST_KEY, look, step),
  clearGuest: () => AsyncStorage.removeItem(GUEST_KEY).catch(() => undefined),
  readUser: (userId: string) => read(userKey(userId)),
  writeUser: (userId: string, look: AvatarLook, step: number) => write(userKey(userId), look, step),
  clearUser: (userId: string) => AsyncStorage.removeItem(userKey(userId)).catch(() => undefined),
};
