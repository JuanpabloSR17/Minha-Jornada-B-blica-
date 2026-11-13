import { BOOKS } from '@/features/reading/refs';
import { journeyProgress } from './worlds';

it('organiza os 66 livros e seus capítulos em mundos sem duplicação', () => {
  const worlds = journeyProgress({});
  expect(worlds.flatMap((world) => world.books.map((book) => book.code))).toEqual(BOOKS.map((book) => book.code));
  expect(worlds.reduce((total, world) => total + world.total, 0)).toBe(1189);
});

it('calcula progresso por capítulo válido e sugere o primeiro inédito', () => {
  const worlds = journeyProgress({ GEN: [3, 1, 1, 0, 51], REV: Array.from({ length: 22 }, (_, i) => i + 1) });
  const origins = worlds.find((world) => world.id === 'origens')!;
  expect(origins.done).toBe(2);
  expect(origins.books[0]?.nextChapter).toBe(2);
  const revelation = worlds.find((world) => world.id === 'nova-criacao')!;
  expect(revelation.done).toBe(revelation.total);
  expect(revelation.books[0]?.nextChapter).toBeUndefined();
});
