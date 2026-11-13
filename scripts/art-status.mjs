// Estado de um lote de arte pintada (docs/arte-lotes/lote-N.json): para cada camada esperada, se o arquivo
// é a pintura entregue, ainda a camada de teste (procedural, registrada em assets/avatars/ORIGEM.json) ou
// se falta. Gera docs/arte-lotes/lote-N/ESTADO.md.
//
// Uso: node scripts/art-status.mjs [docs/arte-lotes/lote-1.json] [--init]
//   --init  registra os arquivos atuais como "teste-procedural" (só para o lote de teste inicial)
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const specFile = args.find((a) => a.endsWith('.json')) ?? 'docs/arte-lotes/lote-1.json';
const spec = JSON.parse(readFileSync(join(root, specFile), 'utf8'));
const ORIGIN = join(root, 'assets/avatars/ORIGEM.json');
const APPEARANCE = new Set(['eyes', 'brows', 'expression', 'beard', 'hair']);
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

/** Arquivos esperados para cada camada do lote (base e @2x, máscara/sombreamento conforme o tipo). */
function expected(c) {
  const [cat, id] = c.source.split('/');
  const dir = cat === 'body' ? `body/base/${id}` : `${cat}/${id}/${APPEARANCE.has(cat) ? 'all' : spec.corpo}`;
  const name = `${c.layer}${c.pose ? `.${c.pose}` : ''}`;
  const parts = c.type === 'base' ? [''] : c.type === 'mixed' ? ['', '.shade'] : ['.mask', '.shade'];
  return parts.flatMap((p) => [`${dir}/${name}${p}.webp`, `${dir}/${name}${p}@2x.webp`]);
}

const origin = existsSync(ORIGIN) ? JSON.parse(readFileSync(ORIGIN, 'utf8')) : {};
if (args.includes('--init')) {
  for (const c of spec.camadas) for (const rel of expected(c)) {
    const p = join(root, 'assets/avatars', rel);
    if (existsSync(p)) origin[rel] = { origem: 'teste-procedural', sha256: sha(p) };
  }
  writeFileSync(ORIGIN, JSON.stringify(Object.fromEntries(Object.entries(origin).sort()), null, 2) + '\n');
}

const rows = [];
let painted = 0, test = 0, missing = 0, optional = 0;
for (const c of spec.camadas) {
  for (const rel of expected(c)) {
    const p = join(root, 'assets/avatars', rel);
    let state;
    if (!existsSync(p)) {
      // a parte colorida de "mixed" é opcional (ex.: boca só com sombreamento)
      if (c.type === 'mixed' && !rel.includes('.shade')) { optional++; continue; }
      state = 'falta'; missing++;
    } else if (origin[rel]?.origem === 'teste-procedural' && origin[rel].sha256 === sha(p)) {
      state = 'teste procedural'; test++;
    } else {
      state = 'pintura entregue'; painted++;
    }
    rows.push(`| ${c.source} | ${c.layer}${c.pose ? `.${c.pose}` : ''} | \`${rel}\` | ${state} |`);
  }
}
const lote = spec.lote;
const md = [
  `# Lote ${lote} — estado das camadas`,
  '',
  `Gerado por \`node scripts/art-status.mjs ${specFile}\`. Pintura entregue: **${painted}**, ainda teste procedural: **${test}**, faltando: **${missing}**.`,
  '',
  '| Peça | Camada | Arquivo | Estado |',
  '|---|---|---|---|',
  ...rows,
  '',
].join('\n');
writeFileSync(join(root, `docs/arte-lotes/lote-${lote}/ESTADO.md`), md);
console.log(`Lote ${lote}: pintura entregue ${painted}, teste procedural ${test}, faltando ${missing}${optional ? `, partes opcionais ausentes ${optional}` : ''}`);
