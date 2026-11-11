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
};

export type MissionOverview = {
  chaptersCompleted: number;
  totalChapters: number;
  percent: number;
  booksCompleted: number;
  xpTotal: number;
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
