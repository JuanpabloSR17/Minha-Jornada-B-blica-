import { BOOKS } from '@/features/reading/refs';
import { earnedWorldMedals, nextBookObjective, readingLevel } from './progression';

describe('progressão da Jornada', () => {
  it('avança de nível nos limites do XP e reinicia a barra sem perder o total', () => {
    expect(readingLevel(119)).toMatchObject({ level: 1, currentXp: 119, remainingXp: 1, percent: 99 });
    expect(readingLevel(120)).toMatchObject({ level: 2, currentXp: 0, xpForLevel: 200, xpTotal: 120 });
    expect(readingLevel(320)).toMatchObject({ level: 3, currentXp: 0, xpForLevel: 280 });
    expect(readingLevel(600)).toMatchObject({ level: 4, title: 'Explorador', rankIcon: 'compass' });
    expect(readingLevel(-25)).toMatchObject({ level: 1, currentXp: 0 });
  });

  it('sugere Rute ao começar e escolhe o livro iniciado mais perto de concluir, contando capítulos válidos únicos', () => {
    expect(nextBookObjective({})).toMatchObject({ book: 'RUT', chapter: 1, remaining: 4 });
    expect(nextBookObjective({ GEN: [1], RUT: [1, 1, 3, 7], OBA: [1] }))
      .toMatchObject({ book: 'RUT', chapter: 2, chaptersRead: 2, remaining: 2, worldId: 'reinos' });
    expect(nextBookObjective(Object.fromEntries(BOOKS.map(({ code, chapters }) =>
      [code, Array.from({ length: chapters }, (_, i) => i + 1)])))).toBeNull();
  });

  it('ordena por data real e mantém fora do histórico o mundo sem registro de conclusão', () => {
    const medal = { name: 'Mundo', chapters: 22, done: 22 };
    expect(earnedWorldMedals([
      { ...medal, id: 'old', position: 1, completedAt: '2026-11-13T15:00:00Z' },
      { ...medal, id: 'unset', position: 2, completedAt: null },
      { ...medal, id: 'recent', position: 3, completedAt: '2026-11-17T12:00:00Z' },
    ]).map(({ id }) => id)).toEqual(['recent', 'old']);
  });
});
