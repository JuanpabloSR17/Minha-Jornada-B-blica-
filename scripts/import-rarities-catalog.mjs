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

const FIELDS = ['name', 'rarity', 'slot', 'category', 'scriptureRef', 'book'];
const ruleKey = (u) => (u ? `${u.type}:${JSON.stringify(u.payload ?? {})}` : '');

/**
 * Reconciliação NÃO destrutiva entre o catálogo oficial e o existente.
 * Ordem de correspondência: mesmo ID → mesmo nome → (lendário) mesmo livro.
 * Quando o ID oficial difere de um ID existente, o ID existente é mantido (pode ter
 * histórico de posse) e o oficial vira um alias em `idAliases`.
 */
export function reconcile(catalog, imported) {
  const existing = catalog.items;
  const byId = new Map(existing.map((i) => [i.id, i]));
  const byName = new Map(existing.map((i) => [norm(i.name), i]));
  const byBook = new Map(existing.filter((i) => i.rarity === 'legendary' && i.book).map((i) => [i.book, i]));
  const used = new Set();
  const aliases = { ...(catalog.idAliases ?? {}) };
  const rows = [];
  const conflicts = [];
  const merged = imported.map((off) => {
    let match = byId.get(off.id);
    let how = match ? 'id' : null;
    if (!match && byName.has(norm(off.name))) [match, how] = [byName.get(norm(off.name)), 'nome'];
    if (!match && off.rarity === 'legendary' && byBook.has(off.book)) [match, how] = [byBook.get(off.book), 'livro'];
    if (match && used.has(match.id)) {
      conflicts.push(`${off.id}: corresponde a ${match.id}, que já foi usado por outro item oficial`);
      match = undefined;
      how = null;
    }
    if (match && match.series === 'starter') conflicts.push(`${off.id}: corresponde à peça inicial ${match.id} (gratuita para todos) — revisar`);
    if (match) used.add(match.id);
    const id = match ? match.id : off.id;
    if (match && off.id !== match.id) aliases[off.id] = match.id;
    const diffs = match
      ? [...FIELDS.filter((f) => (match[f] ?? '') !== (off[f] ?? '')).map((f) => `${f}: "${match[f] ?? ''}" → "${off[f] ?? ''}"`),
         ...(ruleKey(match.unlock) !== ruleKey(off.unlock) ? [`regra: ${ruleKey(match.unlock)} → ${ruleKey(off.unlock)}`] : [])]
      : [];
    rows.push({ official: off.id, id, how: how ?? 'novo', diffs });
    return { ...(match ?? {}), ...off, id, starter: match?.series === 'starter' ? match.starter : false, series: 'rarities-v1' };
  });
  // itens existentes da série que o oficial não trouxe: mantidos (podem estar em inventários)
  const legacy = existing.filter((i) => i.series === 'rarities-v1' && !used.has(i.id)).map((i) => ({ ...i, series: 'legacy' }));
  const keep = existing.filter((i) => i.series !== 'rarities-v1' && !used.has(i.id));
  return {
    catalog: { ...catalog, items: [...keep, ...merged, ...legacy], idAliases: aliases, draft: undefined },
    rows,
    legacy: legacy.map((i) => i.id),
    conflicts,
  };
}

/** Mantido por compatibilidade com testes antigos. */
export const merge = (catalog, imported) => reconcile(catalog, imported).catalog;

export function reportMarkdown({ rows, legacy, conflicts }, counts) {
  const by = (h) => rows.filter((r) => r.how === h).length;
  const lines = [
    '# Reconciliação: catálogo oficial × catálogo existente',
    '',
    `- Itens oficiais: ${rows.length} (${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(', ')})`,
    `- Correspondência por ID: ${by('id')} · por nome: ${by('nome')} · por livro: ${by('livro')} · novos: ${by('novo')}`,
    `- Itens existentes mantidos como legado (não estão no oficial): ${legacy.length}${legacy.length ? ` — ${legacy.join(', ')}` : ''}`,
    `- Conflitos: ${conflicts.length}`,
    ...conflicts.map((c) => `  - ${c}`),
    '',
    '| Oficial | ID final | Correspondência | Diferenças |',
    '|---|---|---|---|',
    ...rows.map((r) => `| ${r.official} | ${r.id} | ${r.how} | ${r.diffs.join('; ').replace(/\|/g, '/') || '—'} |`),
    '',
  ];
  return lines.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const file = process.argv[2];
  if (!file) {
    console.error('Uso: node scripts/import-rarities-catalog.mjs caminho/catalogo.json [--report relatorio.md] [--write]');
    process.exit(2);
  }
  const { items, counts, errors } = convert(JSON.parse(readFileSync(resolve(file), 'utf8')));
  console.log(`Itens lidos: ${items.length}`, counts);
  errors.forEach((e) => console.error(`erro: ${e}`));
  if (errors.length) process.exit(1);
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const result = reconcile(catalog, items);
  const ri = process.argv.indexOf('--report');
  if (ri > 0) {
    writeFileSync(resolve(process.argv[ri + 1]), reportMarkdown(result, counts));
    console.log(`Relatório: ${process.argv[ri + 1]}`);
  }
  result.conflicts.forEach((c) => console.warn(`conflito: ${c}`));
  if (process.argv.includes('--write')) {
    writeFileSync(catalogPath, JSON.stringify(result.catalog, null, 2) + '\n');
    console.log('catalog.json atualizado (não destrutivo). Agora aumente "version", defina o prefixo em scripts/generate-catalog-sql.mjs e rode npm run catalog:sql.');
  } else {
    console.log('Válido. Use --report para ver as diferenças e --write para gravar.');
  }
}
