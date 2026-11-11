import AsyncStorage from '@react-native-async-storage/async-storage';
import { restoreMission, type MissionSession } from './session';
import type { MissionResult } from './mission.service';

const sessionKey = (userId: string) => `jb.mission.session.${userId}`;
const resultKey = (userId: string) => `jb.mission.result.${userId}`;

/** Sessão em andamento ou pendente, por conta (nunca vaza para outra conta no mesmo aparelho). */
export const missionStorage = {
  async load(userId: string): Promise<MissionSession | null> {
    try {
      const raw = await AsyncStorage.getItem(sessionKey(userId));
      if (!raw) return null;
      const s = JSON.parse(raw) as MissionSession;
      return s && s.userId === userId && s.id ? restoreMission(s) : null;
    } catch {
      return null;
    }
  },
  /** Gravação falha é relatada: quem chama decide se pode seguir sem persistir. */
  save: (s: MissionSession) => AsyncStorage.setItem(sessionKey(s.userId), JSON.stringify(s)),
  clear: (userId: string) => AsyncStorage.removeItem(sessionKey(userId)).catch(() => undefined),

  async loadResult(userId: string): Promise<MissionResult | null> {
    try {
      const raw = await AsyncStorage.getItem(resultKey(userId));
      return raw ? (JSON.parse(raw) as MissionResult) : null;
    } catch {
      return null;
    }
  },
  saveResult: (userId: string, r: MissionResult) => AsyncStorage.setItem(resultKey(userId), JSON.stringify(r)).catch(() => undefined),
};
