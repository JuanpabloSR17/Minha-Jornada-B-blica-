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
  /** Comuns e raros do catálogo oficial: oferecidos como escolha pelo Modo Missão. Nunca concedidos automaticamente. */
  mission_pool: null,
};

/**
 * Conclusão real de capítulo (Modo Missão): public.complete_reading_mission(sessionId, book,
 * chapter, mode, startedAt, activeSeconds) — ver docs/MODO-MISSAO.md e
 * src/features/reading/mission/mission.service.ts (MissionResult).
 *  1. A RPC valida o capítulo e chama
 *     private.record_event(uid, 'CHAPTER_COMPLETED', 'chapter:GEN.37', { book: 'GEN', chapter: 37 })
 *     (releitura: origem 'mission:<sessão>', que não conta capítulo novo nem repete recompensas).
 *     Missões/marcos curados com book_code/chapter em reward_triggers geram MISSION_COMPLETED /
 *     MILESTONE_REACHED; XP vai para xp_ledger com chave única.
 *  2. O motor recalcula no servidor: capítulos distintos, conclusão do livro (todos os capítulos),
 *     lendário do livro, épicos de capítulo e coleções — de forma idempotente.
 *  3. O app lê o resultado por get_wardrobe (posse) e get_reading_progress (progresso).
 * Itens Santos (milestone_reached) só vêm de marcos curados cadastrados em reward_triggers,
 * e comuns/raros (mission_pool) só pelo Modo Missão. Nenhum item real é concedido por evento fictício.
 */
export type ReadingProgress = {
  chaptersCompleted: number;
  totalChapters: number; // 1189
  percent: number;
  booksCompleted: number;
  books: {
    book: BookCode;
    name: string;
    completed: number;
    total: number;
    isComplete: boolean;
    /** ID canônico do lendário do livro (catálogo oficial: book_xxx, ou ID histórico preservado) */
    legendaryItemId: string | null;
    legendaryOwned: boolean;
  }[];
  /** Recompensas de leitura ainda não conquistadas e quanto falta para cada uma. */
  rewardsAvailable: { itemId: string; rule: 'chapter_completed' | 'book_completed' | 'chapters_count'; book: BookCode | null; chapter: number | null; remaining: number }[];
};

/**
 * IDs de item: o banco e o app usam o ID canônico. IDs oficiais (snake_case) que coincidem com
 * itens já existentes, e IDs do rascunho, ficam em cosmetic_item_aliases / catalog.json#idAliases.
 * equip_item aceita qualquer um deles; a posse antiga é migrada por private.apply_item_aliases().
 */
/**
 * Meta diária v1 (servidor): o primeiro CHAPTER_COMPLETED inédito do dia (fuso do perfil) grava
 * daily_goals + siclos_ledger ('DAILY_GOAL', 'goal:<dia>', 40) e até 3 opções de Comuns
 * (regra mission_pool). O item é concedido só por claim_daily_goal_item(dia, item).
 */
export type DailyGoalReward = { day: string; siclos: number; options: string[]; chosenItem: string | null };

export type ItemIdAlias = { aliasId: string; itemId: string; source: 'official' | 'draft' };

/** Erros estáveis que o servidor pode devolver ao registrar eventos. */
export type RewardError = 'invalid_event_type' | 'invalid_event_payload' | 'book_incomplete' | 'unknown_trigger' | 'collection_incomplete' | 'profile_required';
