import { BOOKS } from '@/features/reading/refs';

export const WORLDS = [
  { id: 'origens', name: 'Origens e Aliança', codes: ['GEN', 'EXO', 'LEV', 'NUM', 'DEU'] },
  { id: 'reinos', name: 'Terra e Reinos', codes: ['JOS', 'JDG', 'RUT', '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST'] },
  { id: 'sabedoria', name: 'Poesia e Sabedoria', codes: ['JOB', 'PSA', 'PRO', 'ECC', 'SNG'] },
  { id: 'profetas', name: 'Voz dos Profetas', codes: ['ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL'] },
  { id: 'evangelhos', name: 'Vida e Ensino de Jesus', codes: ['MAT', 'MRK', 'LUK', 'JHN'] },
  { id: 'igreja', name: 'Caminhos da Igreja', codes: ['ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD'] },
  { id: 'nova-criacao', name: 'Visão da Nova Criação', codes: ['REV'] },
] as const;

export function journeyProgress(chaptersByBook: Record<string, number[]>) {
  return WORLDS.map(({ id, name, codes }) => {
    const books = BOOKS.filter((book) => (codes as readonly string[]).includes(book.code)).map((book) => {
      const chaptersRead = new Set((chaptersByBook[book.code] ?? []).filter(
        (chapter) => Number.isInteger(chapter) && chapter >= 1 && chapter <= book.chapters,
      ));
      const nextChapter = Array.from({ length: book.chapters }, (_, i) => i + 1)
        .find((chapter) => !chaptersRead.has(chapter));
      return { ...book, chaptersRead, nextChapter };
    });
    const total = books.reduce((sum, book) => sum + book.chapters, 0);
    const done = books.reduce((sum, book) => sum + book.chaptersRead.size, 0);
    return { id, name, books, total, done };
  });
}
