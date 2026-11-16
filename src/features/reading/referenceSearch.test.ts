import { normalizeReference, parseReferenceSearch } from './referenceSearch';

describe('busca bíblica', () => {
  it('aceita livros numerados e ignora acentos e espaços repetidos', () => {
    expect(parseReferenceSearch('  1   Reis ')).toEqual({ book: '1 reis', chapter: null });
    expect(normalizeReference('Êxodo')).toBe('exodo');
  });

  it('mantém a referência no capítulo quando a pessoa inclui o versículo', () => {
    expect(parseReferenceSearch('1 Reis 19:4')).toEqual({ book: '1 reis', chapter: 19 });
    expect(parseReferenceSearch('Êxodo 25:10–22')).toEqual({ book: 'exodo', chapter: 25 });
    expect(parseReferenceSearch('Rute 2')).toEqual({ book: 'rute', chapter: 2 });
    expect(parseReferenceSearch('Salmos 150')).toEqual({ book: 'salmos', chapter: 150 });
  });
});
