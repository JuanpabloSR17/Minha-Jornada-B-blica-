import AsyncStorage from '@react-native-async-storage/async-storage';
import { restoreMission, type MissionSession } from './session';
import type { DailyGoalState, MissionResult } from './mission.service';

const sessionKey = (userId: string) => `jb.mission.session.${userId}`;
const resultKey = (userId: string) => `jb.mission.result.${userId}`;
const revealKey = (userId: string, sessionId: string) => `jb.mission.reveal.${userId}.${sessionId}`;
const choiceKey = (userId: string, day: string) => `jb.mission.goal-choice.${userId}.${day}`;

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
      if (!raw) return null;
      const result = JSON.parse(raw) as MissionResult | null;
      if (!result?.sessionId) return result;
      const daily = result.dailyGoal;
      const [seen, choice] = await Promise.all([
        result.revealed || AsyncStorage.getItem(revealKey(userId, result.sessionId)).catch(() => null),
        daily?.goal && !daily.goal.chosenItem ? AsyncStorage.getItem(choiceKey(userId, daily.day)).catch(() => null) : null,
      ]);
      if (choice && daily?.goal) {
        result.dailyGoal = { ...daily, goal: { ...daily.goal, chosenItem: choice, choicePending: false } };
      }
      if (seen) result.revealed = true;
      return result;
    } catch {
      return null;
    }
  },
  saveResult: (userId: string, r: MissionResult) => AsyncStorage.setItem(resultKey(userId), JSON.stringify(r)).catch(() => undefined),
  // A retentativa da mesma sessão pode gravar outra cópia do recibo sem apagar a marca de leitura.
  markRevealed: (userId: string, sessionId: string) =>
    AsyncStorage.setItem(revealKey(userId, sessionId), '1').catch(() => undefined),
  async saveGoalChoice(userId: string, goal: DailyGoalState) {
    if (goal.chosenItem) await AsyncStorage.setItem(choiceKey(userId, goal.day), goal.chosenItem).catch(() => undefined);
  },
};
