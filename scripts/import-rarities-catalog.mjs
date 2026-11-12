// Importa o catálogo oficial de raridades (catalogo_raridades_144_itens_v2.json) para
// src/features/avatar/catalog/catalog.json, de forma NÃO destrutiva.
//
// Uso:
//   node scripts/import-rarities-catalog.mjs caminho/catalogo.json --report relatorio.md   # valida e relata
//   node scripts/import-rarities-catalog.mjs caminho/catalogo.json --write                 # grava catalog.json
// Depois de gravar: npm run catalog:sql (gera a migração da nova versão do catálogo).
//
// Política de IDs (ver docs/RARIDADES.md):
//  1. IDs com histórico — peças iniciais e itens que já existiam nas migrações anteriores ao
//     rascunho (catálogos v1–v3) — são PRESERVADOS; o ID oficial vira alias.
//  2. Itens do rascunho (v4, sem histórico) dão lugar ao ID oficial; o ID do rascunho vira alias.
//  3. Nada é apagado: itens fora do oficial ficam como "complementares" (com histórico) ou são
//     desativados no banco (rascunho), e a posse/equipamento migra pelos aliases.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = join(root, 'src/features/avatar/catalog/catalog.json');
const bible = JSON.parse(readFileSync(join(root, 'src/features/reading/bible-books.json'), 'utf8'));

const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const RARITY = { comum: 'common', common: 'common', raro: 'rare', rara: 'rare', rare: 'rare', epico: 'epic', epica: 'epic', epic: 'epic', lendario: 'legendary', lendaria: 'legendary', legendary: 'legendary', santo: 'holy', santa: 'holy', sagrado: 'holy', holy: 'holy' };
const SLOT = {
  outfit: 'outfit', tunica: 'outfit', roupa: 'outfit', vestimenta: 'outfit',
  cloak: 'back', manto: 'back', capa: 'back',
  back: 'back_item', costas: 'back_item',
  feet: 'feet', pes: 'feet', calcado: 'feet',
  waist: 'waist', cintura: 'waist', cinto: 'waist',
  neck: 'neck', pescoco: 'neck',
  head: 'head', cabeca: 'head',
  hand: 'hands', hands: 'hands', mao: 'hands', maos: 'hands',
  chest: 'chest', peito: 'chest', peitoral: 'chest',
  special: 'special', especial: 'special', insignia: 'special',
  effect: 'effect', efeito: 'effect',
  background: 'background', fundo: 'background',
  frame: 'frame', moldura: 'frame',
  sanctuary: 'relic', relic: 'relic', reliquia: 'relic', santuario: 'relic', nenhum: 'relic',
};
const EXPECTED = { common: 22, rare: 18, epic: 16, legendary: 66, holy: 22 };
const REPRESENTATION = { literal: 'literal', inspired: 'inspired', metaphorical: 'metaphorical', simbolica: 'symbolic', symbolic: 'symbolic' };
// associações não literais sempre dizem "inspirado em" (decisão editorial)
const REP_PREFIX = { literal: 'Descrito em', inspired: 'Inspirado em', metaphorical: 'Associação metafórica, inspirada em', symbolic: 'Representação simbólica, inspirada em' };
const ACQUISITION = { common: 'mission', rare: 'mission', epic: 'reading', legendary: 'reading', holy: 'milestone' };

const bookName = (code) => bible.find((b) => b.code === code)?.name ?? code;
function bookCode(v) {
  if (!v) return undefined;
  const n = norm(v);
  return bible.find((x) => norm(x.code) === n || norm(x.name) === n)?.code;
}
const pick = (o, ...keys) => keys.map((k) => o[k]).find((v) => v !== undefined && v !== null && v !== '');

/** "Gênesis 24:15-20" → { book: 'GEN', chapter: 24, verse: 15 } */
export function parseRef(ref) {
  const m = /^(.+?)\s+(\d+)(?::(\d+))?/.exec(String(ref ?? '').trim());
  if (!m) return null;
  const book = bookCode(m[1]);
  if (!book) return null;
  const chapter = Number(m[2]);
  const max = bible.find((b) => b.code === book).chapters;
  return chapter >= 1 && chapter <= max ? { book, chapter, verse: m[3] ? Number(m[3]) : undefined } : null;
}

function categoryFor(slot, name) {
  const n = norm(name);
  if (slot === 'hands') {
    if (/harpa|flauta|trombeta|instrumento|lira|shofar/.test(n)) return 'instrument';
    if (/rolo|pergaminho|livro|tabua/.test(n)) return 'scroll';
    if (/cesto|cesta|pote|jarro|ampola|vaso|lamparina|lanterna|lampada|calice|cantil|tocha/.test(n)) return 'container';
    if (/escudo/.test(n)) return 'emblem';
    return 'tool';
  }
  if (slot === 'waist') return /bolsa|cantil/.test(n) ? 'container' : 'belt';
  return { outfit: 'tunic', back: 'cloak', back_item: 'carried', feet: 'footwear', head: 'headwear', neck: 'jewelry', chest: 'ceremonial', special: 'insignia', effect: 'effect', background: 'background', frame: 'frame', relic: 'relic' }[slot] ?? 'item';
}

/** Converte a regra de obtenção para o formato interno. */
function toUnlock(raw, rarity, book, id, ref) {
  if (rarity === 'legendary' && book) return { type: 'book_completed', payload: { book }, label: `Conclua todos os capítulos de ${bookName(book)}` };
  if (!raw) return null;
  if (typeof raw === 'object') {
    const t = norm(pick(raw, 'tipo', 'type'));
    if (t === 'capitulo_concluido' || t === 'capitulo' || t === 'chapter' || t === 'chapter_completed') {
      const r = parseRef(pick(raw, 'referencia') ?? ref);
      const b = r?.book ?? bookCode(pick(raw, 'livro', 'book'));
      const ch = r?.chapter ?? Number(pick(raw, 'capitulo', 'chapter'));
      return b && ch ? { type: 'chapter_completed', payload: { book: b, chapter: ch }, label: `Conclua a leitura de ${bookName(b)} ${ch}` } : null;
    }
    if (t === 'livro_concluido' || t === 'livro' || t === 'book_completed') {
      const b = bookCode(pick(raw, 'book_id', 'livro', 'book'));
      return b ? { type: 'book_completed', payload: { book: b }, label: `Conclua todos os capítulos de ${bookName(b)}` } : null;
    }
    if (t === 'missao_ou_loja') return { type: 'mission_pool', payload: { pool: 'common' }, label: 'Recompensa de missão (Modo Missão, em breve)' };
    if (t === 'missao_especial_ou_loja') return { type: 'mission_pool', payload: { pool: 'rare' }, label: 'Recompensa de missão especial (Modo Missão, em breve)' };
    if (t === 'marco_biblico_especial') return { type: 'milestone_reached', payload: { milestone: id, reference: pick(raw, 'referencia') ?? ref }, label: `Marco bíblico especial: ${pick(raw, 'referencia') ?? ref} (missão curada, validada pelo servidor)` };
    const map = { missao: 'mission_completed', mission: 'mission_completed', mission_completed: 'mission_completed', marco: 'milestone_reached', milestone_reached: 'milestone_reached', colecao: 'collection_completed', collection_completed: 'collection_completed', capitulos: 'chapters_count', chapters_count: 'chapters_count' };
    if (!map[t]) return null;
    const payload = { ...(raw.payload ?? {}) };
    for (const [k, alias] of [['mission', 'missao'], ['milestone', 'marco'], ['collection', 'colecao'], ['count', 'quantidade'], ['book', 'livro']]) {
      const v = pick(raw, k, alias) ?? payload[k];
      if (v !== undefined) payload[k] = k === 'count' ? Number(v) : k === 'book' ? bookCode(v) : v;
    }
    return { type: map[t], payload, label: pick(raw, 'label', 'descricao') };
  }
  return { type: 'manual_review', payload: {}, label: String(raw) };
}

export function convert(input) {
  const list = Array.isArray(input) ? input : input.items ?? input.itens ?? input.catalogo ?? [];
  const errors = [];
  const items = list.map((r, i) => {
    const officialId = pick(r, 'id', 'codigo', 'slug');
    const rarity = RARITY[norm(pick(r, 'raridade', 'rarity'))];
    const slot = SLOT[norm(pick(r, 'slot', 'encaixe', 'slot_equipamento'))] ?? (rarity === 'holy' ? 'relic' : undefined);
    const book = bookCode(pick(r, 'book_id', 'book', 'livro'));
    const name = pick(r, 'nome', 'name');
    const ref = pick(r, 'referencia', 'scriptureRef', 'referencia_biblica', 'reference');
    const representation = REPRESENTATION[norm(pick(r, 'representacao', 'representation'))] ?? 'inspired';
    const meaning = pick(r, 'significado', 'meaning');
    const generic = !meaning || /^motivo marcante/i.test(meaning);
    const description = pick(r, 'descricao', 'description') ?? `${generic ? '' : `${meaning}. `}${REP_PREFIX[representation]} ${ref}.${rarity === 'holy' ? ' Representação simbólica para o Santuário; o objeto não é divino e não confere poder.' : ' Item cosmético e simbólico.'}`;
    const it = {
      id: officialId ? String(officialId).toLowerCase().replace(/[^a-z0-9_-]+/g, '-') : undefined,
      officialId,
      name,
      description,
      rarity,
      category: pick(r, 'categoria', 'category') ?? categoryFor(slot, name),
      slot,
      scriptureRef: ref,
      representation,
      ...(generic ? {} : { meaning }),
      ...(r.referente ? { referent: r.referente } : {}),
      ...(r.subtipo ? { holySubtype: r.subtipo } : {}),
      acquisition: pick(r, 'acquisition') ?? ACQUISITION[rarity] ?? 'reading',
      shopEligible: rarity !== 'holy' && r.loja === true,
      ...(r.preco_siclos_sugerido ? { shopPriceSuggested: r.preco_siclos_sugerido } : {}),
      starter: false,
      ...(book && rarity === 'legendary' ? { book } : {}),
    };
    it.unlock = toUnlock(pick(r, 'desbloqueio', 'regra', 'regra_obtencao', 'obtencao', 'unlock'), rarity, book, it.id, ref);
    // rótulo das rotas que existem hoje (Comuns: escolha gratuita da meta; Raros: missão especial)
    if (it.unlock?.type === 'mission_pool') {
      it.unlock.label = it.unlock.payload.pool === 'common'
        ? (it.shopEligible ? 'Escolha gratuita da meta diária ou Mercado dos Viajantes' : 'Escolha gratuita da meta diária')
        : (it.shopEligible ? 'Mercado dos Viajantes (missão especial em revisão editorial)' : 'Missão especial em revisão editorial');
    }
    const where = `item ${i + 1}${it.id ? ` (${it.id})` : ''}`;
    for (const k of ['id', 'name', 'description', 'rarity', 'slot', 'scriptureRef']) if (!it[k]) errors.push(`${where}: campo "${k}" ausente ou inválido`);
    if (it.scriptureRef && !parseRef(it.scriptureRef)) errors.push(`${where}: referência "${it.scriptureRef}" não aponta para livro/capítulo existente`);
    if (!it.unlock) errors.push(`${where}: regra de obtenção ausente ou não reconhecida`);
    else if (it.unlock.type === 'manual_review') errors.push(`${where}: regra "${it.unlock.label}" precisa de revisão manual`);
    if (it.rarity === 'legendary' && !it.book) errors.push(`${where}: lendário sem livro associado`);
    if (r.comercializavel === true) errors.push(`${where}: itens não podem ser comercializáveis`);
    if (it.rarity === 'holy' && r.loja === true) errors.push(`${where}: item Santo não pode ir para a loja`);
    return it;
  });
  const counts = Object.fromEntries(Object.keys(EXPECTED).map((k) => [k, items.filter((i) => i.rarity === k).length]));
  for (const [k, n] of Object.entries(EXPECTED)) if (counts[k] !== n) errors.push(`raridade ${k}: ${counts[k]} itens (esperado ${n})`);
  const ids = items.map((i) => i.id).filter(Boolean);
  ids.filter((id, i) => ids.indexOf(id) !== i).forEach((id) => errors.push(`ID duplicado: ${id}`));
  const legBooks = items.filter((i) => i.rarity === 'legendary').map((i) => i.book);
  bible.filter((b) => !legBooks.includes(b.code)).forEach((b) => errors.push(`livro sem lendário: ${b.name}`));
  legBooks.filter((b, i) => legBooks.indexOf(b) !== i).forEach((b) => errors.push(`livro com mais de um lendário: ${bookName(b)}`));
  return { items, counts, errors };
}

/** IDs com histórico: presentes nas migrações de catálogo anteriores ao rascunho (v1–v3). */
export function historyIds() {
  const dir = join(root, 'supabase/migrations');
  const ids = new Set();
  for (const f of readdirSync(dir).filter((x) => /_avatar_catalog_v[123]\.sql$/.test(x))) {
    const sql = readFileSync(join(dir, f), 'utf8');
    const block = sql.split('insert into public.cosmetic_items')[1]?.split('on conflict')[0] ?? '';
    for (const m of block.matchAll(/^\s+\('([a-z0-9_-]+)',/gm)) ids.add(m[1]);
  }
  return ids;
}

const FIELDS = ['name', 'rarity', 'slot', 'category', 'scriptureRef', 'book'];
const ruleKey = (u) => (u ? `${u.type}:${JSON.stringify(u.payload ?? {})}` : '');
const sameRef = (a, b) => {
  const x = parseRef(a);
  const y = parseRef(b);
  return !!x && !!y && x.book === y.book && x.chapter === y.chapter && x.verse === y.verse;
};

/** Reconciliação NÃO destrutiva entre o catálogo oficial e o existente. */
const isStarterItem = (i) => !!i && (i.series === 'starter' || i.starter === true);
/** Itens de uma missão (`rewardItems`; `rewardItem` mantido por compatibilidade). */
export const missionItems = (m) => m.rewardItems ?? (m.rewardItem ? [m.rewardItem] : []);

export function reconcile(catalog, imported, history = historyIds()) {
  const existing = catalog.items;
  const byId = new Map(existing.map((i) => [i.id, i]));
  const hasHistory = (i) => i.series === 'starter' || history.has(i.id);
  const used = new Set();
  const aliases = { ...(catalog.idAliases ?? {}) };
  const rows = [];
  const conflicts = [];
  const candidates = (pred) => existing.filter((e) => !used.has(e.id) && pred(e));

  const merged = imported.map((off) => {
    let match;
    let how = 'novo';
    const aliasTarget = aliases[off.id];
    if (byId.has(off.id)) [match, how] = [byId.get(off.id), 'id'];
    else if (aliasTarget && byId.has(aliasTarget)) [match, how] = [byId.get(aliasTarget), 'alias'];
    if (!match) {
      const m = candidates((e) => hasHistory(e) && norm(e.name) === norm(off.name))[0];
      if (m) [match, how] = [m, 'nome (histórico)'];
    }
    if (!match) {
      const m = candidates((e) => hasHistory(e) && e.series !== 'starter' && e.rarity === off.rarity && e.slot === off.slot && sameRef(e.scriptureRef, off.scriptureRef))[0];
      if (m) [match, how] = [m, 'referência (histórico, interpretativo)'];
    }
    let draft;
    if (!match) {
      draft = off.rarity === 'legendary'
        ? candidates((e) => !hasHistory(e) && e.rarity === 'legendary' && e.book === off.book)[0]
        : candidates((e) => !hasHistory(e) && norm(e.name) === norm(off.name))[0];
      if (draft) how = off.rarity === 'legendary' ? 'livro (rascunho)' : 'nome (rascunho)';
    }
    const base = match ?? draft;
    if (base) used.add(base.id);
    const keepId = match ? match.id : off.id;
    if (match && match.id !== off.id) aliases[off.id] = match.id;
    if (draft && draft.id !== off.id) aliases[draft.id] = off.id;
    if (isStarterItem(match)) conflicts.push(`${off.id} → peça inicial ${match.id}: já é gratuita para todos desde o início (fica fora do conjunto de recompensas de missão)`);
    const diffs = base
      ? [...FIELDS.filter((f) => (base[f] ?? '') !== (off[f] ?? '')).map((f) => `${f}: "${base[f] ?? ''}" → "${off[f] ?? ''}"`),
         ...(ruleKey(base.unlock) !== ruleKey(off.unlock) ? [`regra: ${ruleKey(base.unlock) || '(inicial)'} → ${ruleKey(off.unlock)}`] : [])]
      : [];
    rows.push({ official: off.id, id: keepId, how, previous: base?.id, diffs, off });
    const out = { ...off, id: keepId, series: 'oficial-v2' };
    // inicial vence: gratuita para todos, fora das recompensas de missão e da loja
    if (isStarterItem(match)) { out.starter = true; out.acquisition = 'starter'; out.shopEligible = false; delete out.shopPriceSuggested; delete out.unlock; }
    if (match?.variantOf) out.variantOf = match.variantOf;
    // ajustes editoriais aprovados (catalog.editorialOverrides), aplicados a cada reimportação
    const override = catalog.editorialOverrides?.[keepId] ?? catalog.editorialOverrides?.[off.id];
    if (override?.representation && override.representation !== out.representation) {
      out.description = out.description.replace(REP_PREFIX[out.representation], REP_PREFIX[override.representation]);
      out.representation = override.representation;
    }
    // missão curada do Modo Missão (catalog.missions); uma missão pode conceder vários itens
    const mission = (catalog.missions ?? []).find((m) => missionItems(m).includes(keepId) || missionItems(m).includes(off.id));
    if (mission && !out.starter) {
      out.unlock = { type: 'mission_completed', payload: { mission: mission.id }, label: `Conclua a missão especial de ${bookName(mission.book)} ${mission.chapter} no Modo Missão` };
    }
    return out;
  });

  // com histórico e fora do oficial: continuam ativos como complementares (nunca apagados)
  const legBooks = new Set(merged.filter((i) => i.rarity === 'legendary').map((i) => i.book));
  const complementary = existing
    .filter((e) => !used.has(e.id) && e.series !== 'starter' && hasHistory(e))
    .map((e) => {
      const c = { ...e, series: 'complementar' };
      if (c.rarity === 'legendary' && legBooks.has(c.book)) {
        conflicts.push(`${c.id}: era lendário de ${bookName(c.book)}, mas o lendário oficial é outro — passa a raro complementar (mesma regra)`);
        c.rarity = 'rare';
        delete c.book;
      }
      return c;
    });
  // variantes cuja base deixou de existir não são permitidas
  const allIds = new Set([...merged, ...complementary].map((i) => i.id));
  for (const c of complementary) if (c.variantOf && !allIds.has(c.variantOf)) conflicts.push(`${c.id}: variante de ${c.variantOf}, que não existe mais`);
  const starters = existing.filter((e) => e.series === 'starter' && !used.has(e.id));
  // sem histórico e fora do oficial: saem do catálogo do app e são desativados no banco
  const retiredDraft = existing.filter((e) => !used.has(e.id) && !hasHistory(e)).map((e) => e.id);

  const resolveId = (id) => aliases[id] ?? id;
  const items = [...starters, ...merged, ...complementary];
  const holyGroups = [
    ['works-father', 'Obras do Pai', 'Sinais, alianças e provisão de Deus na história do seu povo.', 'Pai'],
    ['works-son', 'Obras de Jesus Cristo', 'Sinais do ministério de Jesus e a ressurreição.', 'Filho'],
    ['works-spirit', 'Obras do Espírito Santo', 'O batismo de Jesus, Pentecostes e o selo da promessa.', 'Espírito Santo'],
    ['works-triune', 'Obras do Deus Triúno', 'A promessa de todas as coisas novas.', 'Deus Triúno'],
  ];
  const keptCollections = (catalog.collections ?? [])
    .filter((c) => !c.id.startsWith('works-') && c.id !== 'legendary-library')
    .map((c) => ({ ...c, items: c.items.map(resolveId).filter((id) => items.some((i) => i.id === id)), reward: c.reward ? resolveId(c.reward) : null }));
  const collections = [
    ...keptCollections,
    ...holyGroups.map(([id, name, description, ref]) => ({ id, name, description, items: merged.filter((i) => i.rarity === 'holy' && i.referent === ref).map((i) => i.id), reward: null })),
    { id: 'legendary-library', name: 'Biblioteca Lendária', description: 'Um lendário para cada um dos 66 livros da Bíblia.', items: bible.map((b) => merged.find((i) => i.rarity === 'legendary' && i.book === b.code).id), reward: null },
  ];
  const slots = [...new Set([...(catalog.slots ?? []), 'chest', 'special', 'effect', 'back_item'])];

  // cada missão precisa apontar para itens existentes num capítulo real
  for (const m of catalog.missions ?? []) {
    const b = bible.find((x) => x.code === m.book);
    if (!b || !(m.chapter >= 1 && m.chapter <= b.chapters)) throw new Error(`missão ${m.id}: capítulo inválido ${m.book} ${m.chapter}`);
    for (const id of missionItems(m)) if (!items.some((i) => i.id === id)) throw new Error(`missão ${m.id}: item inexistente ${id}`);
  }
  return {
    catalog: { ...catalog, items, idAliases: aliases, collections, slots, draft: undefined },
    rows,
    complementary: complementary.map((i) => i.id),
    retiredDraft,
    conflicts,
  };
}

/** Mantido por compatibilidade. */
export const merge = (catalog, imported) => reconcile(catalog, imported).catalog;

/** Notas editoriais objetivas (detectadas automaticamente). */
export function editorialNotes(items) {
  const notes = [];
  const byName = new Map();
  items.forEach((i) => byName.set(norm(i.name), [...(byName.get(norm(i.name)) ?? []), i.id]));
  for (const ids of byName.values()) if (ids.length > 1) notes.push(`Nome repetido: "${items.find((i) => i.id === ids[0]).name}" (${ids.join(', ')})`);
  const byRef = new Map();
  items.forEach((i) => {
    const r = parseRef(i.scriptureRef);
    const k = r ? `${r.book} ${r.chapter}` : i.scriptureRef;
    byRef.set(k, [...(byRef.get(k) ?? []), i]);
  });
  for (const [k, list] of byRef) if (list.length > 1) notes.push(`Mesma passagem (${k}) em ${list.length} itens: ${list.map((i) => `${i.name} [${i.rarity}]`).join('; ')}`);
  return notes;
}

export function reportMarkdown({ rows, complementary, retiredDraft, conflicts }, counts) {
  const by = (h) => rows.filter((r) => r.how.startsWith(h)).length;
  const repl = (s) => String(s ?? '').replace(/\|/g, '/');
  const lines = [
    '# Reconciliação: catálogo oficial × catálogo do projeto',
    '',
    `- Itens oficiais: ${rows.length} (${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(', ')})`,
    `- Mesmo ID: ${by('id')} · alias já conhecido: ${by('alias')} · nome com histórico: ${by('nome (histórico)')} · referência com histórico: ${by('referência')} · substituíram rascunho: ${by('livro (rascunho)') + by('nome (rascunho)')} · novos: ${by('novo')}`,
    `- Complementares (com histórico, fora do oficial, continuam ativos): ${complementary.length}${complementary.length ? ` — ${complementary.join(', ')}` : ''}`,
    `- Itens do rascunho retirados do app (desativados no banco, nunca apagados): ${retiredDraft.length}`,
    `- Conflitos e decisões: ${conflicts.length}`,
    ...conflicts.map((c) => `  - ${c}`),
    '',
    '## Notas editoriais',
    '',
    ...editorialNotes(rows.map((r) => r.off)).map((n) => `- ${n}`),
    '',
    '## Itens',
    '',
    '| Oficial | ID final | Correspondência | Raridade | Slot | Referência | Representação | Diferenças |',
    '|---|---|---|---|---|---|---|---|',
    ...rows.map((r) => `| ${r.official} | ${r.id} | ${r.how}${r.previous && r.previous !== r.id ? ` (antes: ${r.previous})` : ''} | ${r.off.rarity} | ${r.off.slot} | ${repl(r.off.scriptureRef)} | ${r.off.representation} | ${repl(r.diffs.join('; ')) || '—'} |`),
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
  result.conflicts.forEach((c) => console.warn(`decisão: ${c}`));
  if (process.argv.includes('--write')) {
    const out = { ...result.catalog, version: (catalog.version ?? 0) + 1 };
    writeFileSync(catalogPath, JSON.stringify(out, null, 2) + '\n');
    console.log(`catalog.json atualizado para a versão ${out.version} (não destrutivo). Defina o prefixo da migração em scripts/generate-catalog-sql.mjs e rode npm run catalog:sql.`);
  } else {
    console.log('Válido. Use --report para ver as diferenças e --write para gravar.');
  }
}
