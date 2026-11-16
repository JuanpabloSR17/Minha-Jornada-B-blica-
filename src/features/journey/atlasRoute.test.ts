import { featuredWorld, nextPassage, worldStatus } from './atlasRoute';
import { journeyProgress } from './worlds';

const chapters = (count: number) => Array.from({ length: count }, (_, i) => i + 1);

test('um viajante que ainda não tem progresso recebe as Origens como primeiro destino', () => {
  const worlds = journeyProgress({});
  expect(featuredWorld(worlds, new Set())?.id).toBe('origens');
  expect(nextPassage(worlds[0]!)).toEqual({ code: 'GEN', chapter: 1, remainingInBook: 50 });
});

test('a próxima passagem prioriza terminar um livro aberto e nunca sugere capítulo lido', () => {
  const worlds = journeyProgress({ JOS: [1], RUT: [1, 3, 4] });
  const reinos = worlds.find((world) => world.id === 'reinos')!;
  expect(nextPassage(reinos)).toEqual({ code: 'RUT', chapter: 2, remainingInBook: 1 });
  expect(worldStatus(reinos, false)).toBe('started');
});

test('a sugestão ignora mundos completos e usa a conclusão registrada para exibir a medalha', () => {
  const worlds = journeyProgress({ GEN: [1], REV: chapters(22) });
  const nova = worlds.find((world) => world.id === 'nova-criacao')!;
  expect(nextPassage(nova)).toBeNull();
  expect(worldStatus(nova, false)).toBe('started');
  expect(worldStatus(nova, true)).toBe('complete');
  expect(featuredWorld(worlds, new Set(['nova-criacao']))?.id).toBe('origens');
});
