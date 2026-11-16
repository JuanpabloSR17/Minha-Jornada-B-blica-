import type { IconName } from '@/ui';
import type { WorldProgress } from '@/features/reading/mission/mission.service';
import { journeyProgress } from './worlds';

const RANKS: { from: number; title: string; icon: IconName }[] = [
  { from: 15, title: 'Guardião das Rotas', icon: 'crown' },
  { from: 8, title: 'Cartógrafo', icon: 'map' },
  { from: 4, title: 'Explorador', icon: 'compass' },
  { from: 1, title: 'Viajante', icon: 'camp' },
];

/** As primeiras etapas pedem 120, 200 e 280 XP. A cada nível, a etapa cresce 80 XP. */
export function readingLevel(total: number) {
  const xpTotal = Number.isSafeInteger(total) ? Math.max(0, total) : 0;
  const completed = Math.floor(Math.sqrt(1 + xpTotal / 40) - 1);
  const level = completed + 1;
  const currentXp = xpTotal - 40 * completed * (completed + 2);
  const xpForLevel = 120 + completed * 80;
  const rank = RANKS.find(({ from }) => level >= from) ?? RANKS[RANKS.length - 1]!;

  return {
    level, xpTotal, currentXp, xpForLevel,
    title: rank.title, rankIcon: rank.icon,
    remainingXp: xpForLevel - currentXp,
    percent: Math.floor(100 * currentXp / xpForLevel),
  };
}

export type BookObjective = {
  book: string;
  bookName: string;
  worldId: ReturnType<typeof journeyProgress>[number]['id'];
  worldName: string;
  chapter: number;
  chaptersRead: number;
  chaptersTotal: number;
  remaining: number;
};

/** Prioriza livros iniciados mais próximos de concluir. Rute é o ponto de partida da trilha guiada. */
export function nextBookObjective(chaptersByBook: Record<string, number[]>): BookObjective | null {
  const candidates = journeyProgress(chaptersByBook).flatMap((world) => world.books.flatMap((book): BookObjective[] => {
    if (!book.nextChapter) return [];
    return [{
      book: book.code, bookName: book.name, worldId: world.id, worldName: world.name,
      chapter: book.nextChapter, chaptersRead: book.chaptersRead.size, chaptersTotal: book.chapters,
      remaining: book.chapters - book.chaptersRead.size,
    }];
  }));
  const reading = candidates.filter((book) => book.chaptersRead > 0).sort((a, b) => a.remaining - b.remaining);
  return reading[0] ?? candidates.find((book) => book.book === 'RUT') ?? candidates[0] ?? null;
}

export function earnedWorldMedals(worlds: WorldProgress[]) {
  return worlds
    .filter((world): world is WorldProgress & { completedAt: string } => Boolean(world.completedAt))
    .sort((a, b) => (Date.parse(b.completedAt) || 0) - (Date.parse(a.completedAt) || 0) || a.position - b.position);
}
