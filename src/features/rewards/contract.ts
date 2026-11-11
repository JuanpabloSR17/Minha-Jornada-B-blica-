/**
 * Contrato entre o futuro sistema de leitura / Modo Missão e o motor de recompensas.
 *
 * Os eventos são registrados SOMENTE pelo servidor, por meio de
 *   private.record_event(user_id, type, source_event_id, payload)
 * chamado de dentro de RPCs autenticadas que validam a leitura (ex.: complete_chapter, no próximo marco).
 * O app nunca envia estes eventos diretamente. Este arquivo documenta os formatos em TypeScript
 * para que o código do cliente e das funções de servidor fale a mesma língua.
 */

export type BookCode = string; // código USFM de 3 caracteres, ex.: 'GEN', '1SA' (ver reading/bible-books.json)

export type RewardEvent =
  /** Capítulo concluído. Deve existir em bible_books (1..chapters). Releitura usa outro source, não conta de novo. */
  | { type: 'CHAPTER_COMPLETED'; source: `chapter:${string}`; payload: { book: BookCode; chapter: number } }
  /** Livro concluído. O servidor recusa (book_incomplete) se faltar algum capítulo registrado. */
  | { type: 'BOOK_COMPLETED'; source: `book:${string}`; payload: { book: BookCode } }
  /** Mundo concluído. O id precisa estar cadastrado e ativo em reward_triggers (kind = 'world'). */
  | { type: 'WORLD_COMPLETED'; source: `world:${string}`; payload: { world: string } }
  /** Missão concluída. O id precisa estar cadastrado e ativo em reward_triggers (kind = 'mission'). */
  | { type: 'MISSION_COMPLETED'; source: `mission:${string}`; payload: { mission: string } }
  /** Marco especial alcançado. O id precisa estar em reward_triggers (kind = 'milestone'). */
  | { type: 'MILESTONE_REACHED'; source: `milestone:${string}`; payload: { milestone: string } }
  | { type: 'READING_STREAK_REACHED'; source: `streak:${string}`; payload: { days: number } }
  | { type: 'ACHIEVEMENT_UNLOCKED'; source: `achievement:${string}`; payload: { achievement: string } };
// COLLECTION_COMPLETED é emitido pelo próprio motor quando o usuário possui todos os itens.

export type RewardResult = {
  /** true quando o mesmo (usuário, tipo, source) já tinha sido registrado: nada é concedido de novo */
  duplicate: boolean;
  eventId?: string;
  /** IDs dos itens concedidos por este evento (pode incluir recompensas pendentes liberadas agora) */
  granted: string[];
};

/** Tipos de regra de desbloqueio (item_unlock_rules.rule_type) e o evento que os avalia. */
export const RULE_EVENT: Record<string, RewardEvent['type'] | 'COLLECTION_COMPLETED' | null> = {
  starter: null,
  chapter_completed: 'CHAPTER_COMPLETED',
  book_completed: 'CHAPTER_COMPLETED', // todos os capítulos do livro
  chapters_count: 'CHAPTER_COMPLETED', // capítulos distintos
  world_completed: 'WORLD_COMPLETED',
  mission_completed: 'MISSION_COMPLETED',
  milestone_reached: 'MILESTONE_REACHED',
  reading_streak: 'READING_STREAK_REACHED',
  achievement_unlocked: 'ACHIEVEMENT_UNLOCKED',
  collection_completed: 'COLLECTION_COMPLETED',
};

/** Erros estáveis que o servidor pode devolver ao registrar eventos. */
export type RewardError = 'invalid_event_type' | 'invalid_event_payload' | 'book_incomplete' | 'unknown_trigger' | 'collection_incomplete' | 'profile_required';
