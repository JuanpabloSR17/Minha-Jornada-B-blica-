/**
 * Sessão de missão de leitura (estado local, sem dependências de React).
 * O tempo ativo é calculado a partir de marcas de tempo persistidas, então sobrevive a
 * bloquear a tela, sair do app ou reabri-lo. Só pausar interrompe a contagem: na leitura
 * física a pessoa lê fora do app, com a tela bloqueada.
 */
export type MissionMode = 'physical' | 'digital';

export type MissionStatus =
  | 'running' // cronômetro contando
  | 'paused'
  | 'finishing' // jogador confirmou; tempo congelado, aguardando o servidor
  | 'pending'; // a finalização falhou (ex.: sem conexão) — pode tentar de novo com a mesma sessão

export type MissionSession = {
  /** UUID gerado no aparelho: chave de idempotência da finalização no servidor */
  id: string;
  userId: string;
  book: string;
  chapter: number;
  mode: MissionMode;
  startedAt: string;
  accumulatedMs: number;
  runningSince: number | null;
  status: MissionStatus;
  lastError?: string | null;
};

export function uuidv4(random: (n: number) => Uint8Array = defaultRandom): string {
  const b = random(16);
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function defaultRandom(n: number): Uint8Array {
  const out = new Uint8Array(n);
  const c = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto;
  if (c?.getRandomValues) return c.getRandomValues(out);
  for (let i = 0; i < n; i++) out[i] = Math.floor(Math.random() * 256);
  return out;
}

export function startMission(input: { userId: string; book: string; chapter: number; mode: MissionMode }, now = Date.now(), id = uuidv4()): MissionSession {
  return { id, ...input, startedAt: new Date(now).toISOString(), accumulatedMs: 0, runningSince: now, status: 'running', lastError: null };
}

/** Tempo ativo em ms (relógio do aparelho voltando no tempo nunca reduz o total). */
export function activeMs(s: MissionSession, now = Date.now()): number {
  return s.accumulatedMs + (s.runningSince != null ? Math.max(0, now - s.runningSince) : 0);
}

export function pauseMission(s: MissionSession, now = Date.now()): MissionSession {
  if (s.status !== 'running') return s;
  return { ...s, accumulatedMs: activeMs(s, now), runningSince: null, status: 'paused' };
}

export function resumeMission(s: MissionSession, now = Date.now()): MissionSession {
  if (s.status !== 'paused') return s;
  return { ...s, runningSince: now, status: 'running' };
}

/** Jogador confirmou a finalização: o tempo para de contar e não muda nas novas tentativas. */
export function freezeForFinish(s: MissionSession, now = Date.now()): MissionSession {
  if (s.status === 'finishing' || s.status === 'pending') return { ...s, status: 'finishing', lastError: null };
  return { ...s, accumulatedMs: activeMs(s, now), runningSince: null, status: 'finishing', lastError: null };
}

export function markPending(s: MissionSession, error: string): MissionSession {
  return { ...s, status: 'pending', lastError: error };
}

/** Ao reabrir o app no meio de uma finalização interrompida, ela vira pendente (pode tentar de novo). */
export function restoreMission(s: MissionSession): MissionSession {
  return s.status === 'finishing' ? { ...s, status: 'pending' } : s;
}

export const activeSeconds = (s: MissionSession, now = Date.now()) => Math.floor(activeMs(s, now) / 1000);

export function formatClock(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Próximo capítulo da Bíblia (ou null no fim de Apocalipse). */
export function nextChapter(books: { code: string; chapters: number }[], book: string, chapter: number): { book: string; chapter: number } | null {
  const i = books.findIndex((b) => b.code === book);
  if (i < 0) return null;
  if (chapter < books[i]!.chapters) return { book, chapter: chapter + 1 };
  const next = books[i + 1];
  return next ? { book: next.code, chapter: 1 } : null;
}
