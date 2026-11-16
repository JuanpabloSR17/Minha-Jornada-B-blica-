export function normalizeReference(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim().replace(/\s+/g, ' ');
}

export function parseReferenceSearch(query: string) {
  const normalized = normalizeReference(query);
  const match = /^(.+?)\s+(\d+)(?:\s*:\s*\d+(?:\s*[–-]\s*\d+)?)?$/.exec(normalized);
  if (!match) return { book: normalized, chapter: null };
  return { book: match[1]!.trim(), chapter: Number(match[2]) };
}
