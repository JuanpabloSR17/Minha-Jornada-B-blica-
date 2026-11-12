import { requireSupabase } from '@/lib/supabase/client';
import { throwIfError } from '@/lib/errors';
import { activeSeconds, type MissionSession } from './session';

/** Resposta de public.complete_reading_mission (calculada no servidor). */
export type MissionResult = {
  sessionId: string;
  chapter: number;
  mode: 'physical' | 'digital';
  activeSeconds: number;
  /** capítulo já estava concluído: releitura (não conta de novo nem repete recompensas) */
  alreadyCompleted: boolean;
  /** a mesma finalização já tinha sido registrada (nova tentativa): nada foi concedido de novo */
  duplicate: boolean;
  xpAwarded: number;
  xpTotal: number;
  /** itens efetivamente concedidos por esta missão */
  granted: string[];
  missions: { id: string; kind: 'mission' | 'milestone'; name: string }[];
  bookJustCompleted: boolean;
  chaptersCompleted: number;
  totalChapters: number;
  percent: number;
  booksCompleted: number;
  book: { code: string; name: string; total: number; completed: number; isComplete: boolean; legendaryItemId: string | null };
  /** meta diária v1 (calculada no servidor, no fuso do perfil) */
  dailyGoal?: {
    day: string;
    planMode?: 'daily_goal' | 'free';
    target?: number | null;
    remaining?: number | null;
    xpBonus?: number;
    achievedNow: boolean;
    achievedToday: boolean;
    siclosAwarded: number;
    siclosBalance: number;
    newChaptersToday: number;
    goal: DailyGoalState | null;
  };
};

/** Meta de um dia: opções apresentadas e escolha (no máximo um item por meta). */
export type DailyGoalState = {
  day: string;
  timeZone: string;
  siclosAwarded: number;
  xpBonus?: number;
  target?: number | null;
  ruleVersion?: number;
  options: string[];
  /** opções que o jogador ainda não possui */
  available: string[];
  chosenItem: string | null;
  choicePending: boolean;
  book: string;
  chapter: number;
};

export type DailyGoalStatus = {
  today: string;
  timeZone: string;
  timeZoneSource: 'default' | 'device' | 'user';
  planMode: 'daily_goal' | 'free';
  /** meta do dia (snapshot); null no ritmo livre sem missão escolhida */
  target: number | null;
  targetSource: 'preference' | 'free_choice' | 'legacy_v1';
  needsFreeChoice: boolean;
  canChooseFreeTarget: boolean;
  newChaptersToday: number;
  remaining: number | null;
  achievedToday: boolean;
  goalRuleVersion: number | null;
  reward: { siclos: number; xpBonus: number; commonChoices: number; xpPerChapter: number };
  pendingChange: { planMode: 'daily_goal' | 'free'; target: number | null; effectiveDay: string } | null;
  siclosBalance: number;
  siclosPerGoal: number;
  xpTotal: number;
  pending: DailyGoalState[];
};

export type ClaimResult = { duplicate: boolean; itemId: string; granted: string[]; goal: DailyGoalState; siclosBalance: number };

export type MissionOverview = {
  chaptersCompleted: number;
  totalChapters: number;
  percent: number;
  booksCompleted: number;
  xpTotal: number;
  siclosBalance: number;
  chaptersByBook: Record<string, number[]>;
  missions: { id: string; kind: string; name: string; description: string | null; book: string; chapter: number; completed: boolean }[];
};

const rpc = async (fn: string, args?: Record<string, unknown>) => throwIfError(await requireSupabase().rpc(fn, args));

/** Finaliza a missão. Idempotente pelo ID da sessão: pode ser repetida após falha de conexão. */
export async function completeMission(s: MissionSession): Promise<MissionResult> {
  return (await rpc('complete_reading_mission', {
    p_session_id: s.id,
    p_book: s.book,
    p_chapter: s.chapter,
    p_mode: s.mode,
    p_started_at: s.startedAt,
    p_active_seconds: activeSeconds(s),
  })) as MissionResult;
}

export const getMissionOverview = async () => (await rpc('get_mission_overview')) as MissionOverview;

export const getDailyGoalStatus = async () => (await rpc('get_daily_goal_status')) as DailyGoalStatus;

/** Resgata o Comum escolhido. Idempotente: repetir a mesma escolha não concede de novo. */
export const claimDailyGoalItem = async (day: string, itemId: string) =>
  (await rpc('claim_daily_goal_item', { p_day: day, p_item: itemId })) as ClaimResult;

export type TimeZoneSync = { timeZone: string; source: string; suggestion: string | null };

export const deviceTimeZone = (): string | null => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    return null;
  }
};

/**
 * Informa o fuso do aparelho. O servidor só o adota se o usuário nunca definiu um fuso;
 * caso contrário devolve uma sugestão, sem trocar nada.
 */
export async function syncTimeZone(): Promise<TimeZoneSync | null> {
  const tz = deviceTimeZone();
  if (!tz) return null;
  return (await rpc('sync_time_zone', { p_time_zone: tz })) as TimeZoneSync;
}

/** Escolha explícita do fuso de leitura (no máximo uma troca a cada 24 h). */
export const setTimeZone = async (tz: string) => (await rpc('set_time_zone', { p_time_zone: tz })) as DailyGoalStatus;

/** Ritmo livre: escolher a missão do dia (>= 1 capítulo) antes do primeiro capítulo inédito. */
export const setDailyMissionTarget = async (target: number) => (await rpc('set_daily_mission_target', { p_target: target })) as DailyGoalStatus;
