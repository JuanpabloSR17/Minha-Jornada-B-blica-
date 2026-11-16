import type { journeyProgress } from './worlds';

export type AtlasWorld = ReturnType<typeof journeyProgress>[number];

export function worldStatus(world: AtlasWorld, completed: boolean) {
  if (completed) return 'complete';
  return world.done ? 'started' : 'unexplored';
}

export function nextPassage(world: AtlasWorld) {
  const unread = world.books.filter((book) => book.nextChapter != null);
  const started = unread.filter((book) => book.chaptersRead.size > 0);
  // Dê continuidade a um livro já começado. Se vários estiverem abertos, destaque o mais perto do fim.
  const book = started.reduce<AtlasWorld['books'][number] | undefined>((best, candidate) => (
    !best || candidate.chapters - candidate.chaptersRead.size < best.chapters - best.chaptersRead.size ? candidate : best
  ), undefined) ?? unread[0];
  return book?.nextChapter == null ? null : {
    code: book.code,
    chapter: book.nextChapter,
    remainingInBook: book.chapters - book.chaptersRead.size,
  };
}

export function featuredWorld(worlds: AtlasWorld[], completed: ReadonlySet<string>) {
  const unread = worlds.filter((world) => !completed.has(world.id) && world.done < world.total);
  const started = unread.filter((world) => world.done > 0);
  return started.reduce<AtlasWorld | undefined>((best, world) => (
    !best || world.total - world.done < best.total - best.done ? world : best
  ), undefined) ?? unread[0];
}
