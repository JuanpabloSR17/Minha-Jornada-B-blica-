// Importa o catálogo oficial de raridades (ex.: catalogo_raridades_144_itens_v2.json) para
// src/features/avatar/catalog/catalog.json, substituindo o RASCUNHO da série "rarities-v1".
//
// Uso:
//   node scripts/import-rarities-catalog.mjs caminho/catalogo.json            # só valida e mostra o relatório
//   node scripts/import-rarities-catalog.mjs caminho/catalogo.json --write    # grava (depois: aumente "version" e rode npm run catalog:sql)
//
// Aceita campos em português ou inglês (id/codigo, nome/name, raridade/rarity, slot/encaixe,
// categoria/category, referencia/scriptureRef, livro/book, regra/obtencao/unlock...).
// IDs já existentes no app nunca são removidos: se o arquivo não os trouxer, eles são mantidos.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = join(root, 'src/features/avatar/catalog/catalog.json');
const bible = JSON.parse(readFileSync(join(root, 'src/features/reading/bible-books.json'), 'utf8'));

const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const RARITY = { comum: 'common', common: 'common', raro: 'rare', rara: 'rare', rare: 'rare', epico: 'epic', epica: 'epic', epic: 'epic', lendario: 'legendary', lendaria: 'legendary', legendary: 'legendary', santo: 'holy', santa: 'holy', sagrado: 'holy', holy: 'holy' };
const SLOT = { outfit: 'outfit', tunica: 'outfit', roupa: 'outfit', vestimenta: 'outfit', back: 'back', manto: 'back', capa: 'back', costas: 'back', feet: 'feet', pes: 'feet', calcado: 'feet', waist: 'waist', cintura: 'waist', cinto: 'waist', neck: 'neck', pescoco: 'neck', head: 'head', cabeca: 'head', hands: 'hands', mao: 'hands', maos: 'hands', background: 'background', fundo: 'background', frame: 'frame', moldura: 'frame', relic: 'relic', reliquia: 'relic', santuario: 'relic', nenhum: 'relic' };
const EXPECTED = { common: 22, rare: 18, epic: 16, legendary: 66, holy: 22 };

function bookCode(v) {
  if (!v) return undefined;
  const n = norm(v);
  const b = bible.find((x) => norm(x.code) === n || norm(x.name) === n);
  return b?.code;
}
const pick = (o, ...keys) => keys.map((k) => o[k]).find((v) => v !== undefined && v !== null && v !== '');

/** Converte a regra de obtenção para o formato interno (aceita objeto ou texto). */
function toUnlock(raw, rarity, book) {
  if (rarity === 'legendary' && book) return { type: 'book_completed', payload: { book }, label: `Conclua todos os capítulos de ${bible.find((b) => b.code === book).name}` };
  if (!raw) return null;
  if (typeof raw === 'object') {
    const type = pick(raw, 'type', 'tipo');
    const map = { capitulo: 'chapter_completed', chapter: 'chapter_completed', chapter_completed: 'chapter_completed', livro: 'book_completed', book_completed: 'book_completed', missao: 'mission_completed', mission: 'mission_completed', mission_completed: 'mission_completed', marco: 'milestone_reached', milestone: 'milestone_reached', milestone_reached: 'milestone_reached', mundo: 'world_completed', world_completed: 'world_completed', colecao: 'collection_completed', collection_completed: 'collection_completed', capitulos: 'chapters_count', chapters_count: 'chapters_count' };
    const t = map[norm(type)];
    if (!t) return null;
    const payload = { ...(raw.payload ?? {}) };
    const b = bookCode(pick(raw, 'book', 'livro') ?? payload.book);
    if (b) payload.book = b;
    const ch = pick(raw, 'chapter', 'capitulo') ?? payload.chapter;
    if (ch !== undefined) payload.chapter = Number(ch);
    for (const [k, alias] of [['mission', 'missao'], ['milestone', 'marco'], ['world', 'mundo'], ['collection', 'colecao'], ['count', 'quantidade']]) {
      const v = pick(raw, k, alias) ?? payload[k];
      if (v !== undefined) payload[k] = k === 'count' ? Number(v) : v;
    }
    return { type: t, payload, label: pick(raw, 'label', 'descricao', 'texto') };
  }
  // texto livre: "Gênesis 37" → capítulo
  const m = /^(.+?)\s+(\d+)$/.exec(String(raw).replace(/^conclu\w*\s+(a leitura de\s+)?/i, '').trim());
  const b = m ? bookCode(m[1]) : undefined;
  return b ? { type: 'chapter_completed', payload: { book: b, chapter: Number(m[2]) }, label: String(raw) } : { type: 'manual_review', payload: {}, label: String(raw) };
}

export function convert(input) {
  const list = Array.isArray(input) ? input : input.items ?? input.itens ?? input.catalogo ?? [];
  const errors = [];
  const items = list.map((r, i) => {
    const id = pick(r, 'id', 'codigo', 'slug');
    const rarity = RARITY[norm(pick(r, 'rarity', 'raridade'))];
    const slot = SLOT[norm(pick(r, 'slot', 'encaixe', 'slot_equipamento'))] ?? (rarity === 'holy' ? 'relic' : undefined);
    const book = bookCode(pick(r, 'book', 'livro', 'livro_codigo'));
    const it = {
      id: id ? String(id).toLowerCase().replace(/[^a-z0-9-]+/g, '-') : undefined,
      name: pick(r, 'name', 'nome'),
      description: pick(r, 'description', 'descricao'),
      rarity,
      category: pick(r, 'category', 'categoria') ?? 'item',
      slot,
      scriptureRef: pick(r, 'scriptureRef', 'referencia', 'referencia_biblica', 'reference'),
      acquisition: pick(r, 'acquisition', 'obtencao_metodo', 'metodo') ?? 'reading',
      starter: false,
      series: 'rarities-v1',
      ...(book ? { book } : {}),
    };
    it.unlock = toUnlock(pick(r, 'unlock', 'regra', 'regra_obtencao', 'obtencao', 'desbloqueio'), rarity, book);
    const where = `item ${i + 1}${it.id ? ` (${it.id})` : ''}`;
    for (const k of ['id', 'name', 'description', 'rarity', 'slot', 'scriptureRef']) if (!it[k]) errors.push(`${where}: campo "${k}" ausente ou inválido`);
    if (!it.unlock) errors.push(`${where}: regra de obtenção ausente ou não reconhecida`);
    else if (it.unlock.type === 'manual_review') errors.push(`${where}: regra "${it.unlock.label}" precisa de revisão manual`);
    if (it.rarity === 'legendary' && !it.book) errors.push(`${where}: lendário sem livro associado`);
    return it;
  });
  const counts = Object.fromEntries(Object.keys(EXPECTED).map((k) => [k, items.filter((i) => i.rarity === k).length]));
  for (const [k, n] of Object.entries(EXPECTED)) if (counts[k] !== n) errors.push(`raridade ${k}: ${counts[k]} itens (esperado ${n})`);
  const ids = items.map((i) => i.id).filter(Boolean);
  ids.filter((id, i) => ids.indexOf(id) !== i).forEach((id) => errors.push(`ID duplicado: ${id}`));
  const legBooks = items.filter((i) => i.rarity === 'legendary').map((i) => i.book);
  bible.filter((b) => !legBooks.includes(b.code)).forEach((b) => errors.push(`livro sem lendário: ${b.name}`));
  return { items, counts, errors };
}

export function merge(catalog, imported) {
  const keepOld = catalog.items.filter((i) => i.series !== 'rarities-v1');
  const newIds = new Set(imported.map((i) => i.id));
  // IDs antigos da série que o arquivo não trouxe são mantidos (podem estar em inventários)
  const orphans = catalog.items.filter((i) => i.series === 'rarities-v1' && !newIds.has(i.id)).map((i) => ({ ...i, series: 'legacy' }));
  return { ...catalog, items: [...keepOld, ...imported, ...orphans], draft: undefined };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const file = process.argv[2];
  if (!file) {
    console.error('Uso: node scripts/import-rarities-catalog.mjs caminho/catalogo.json [--write]');
    process.exit(2);
  }
  const { items, counts, errors } = convert(JSON.parse(readFileSync(resolve(file), 'utf8')));
  console.log(`Itens lidos: ${items.length}`, counts);
  errors.forEach((e) => console.error(`erro: ${e}`));
  if (errors.length) process.exit(1);
  if (process.argv.includes('--write')) {
    const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
    writeFileSync(catalogPath, JSON.stringify(merge(catalog, items), null, 2) + '\n');
    console.log('catalog.json atualizado. Agora aumente "version", defina o prefixo em scripts/generate-catalog-sql.mjs e rode npm run catalog:sql.');
  } else {
    console.log('Válido. Rode novamente com --write para gravar.');
  }
}
