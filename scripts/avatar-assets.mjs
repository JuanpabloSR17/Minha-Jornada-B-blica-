// Pipeline de assets ilustrados do avatar.
// Varre assets/avatars/, valida cada arquivo e gera src/features/avatar/art/imageAssets.generated.ts.
//
// Convenção:  {categoria}/{assetId}/{corpo|all}/{camada}[.staff][.mask|.shade][@2x].{webp|png}
//   - categoria body usa assetId "base" e a pasta do corpo:  body/base/body-b/body.mask.webp
//   - ".mask"  = forma em cor chapada, tingida com a cor da pele (body) ou do cabelo (hair/brows/beard)
//   - ".shade" = sombras/luzes translúcidas desenhadas por cima da máscara
//   - "@2x"    = versão 2048×3072 (opcional); a versão base 1024×1536 é obrigatória
//   - ".staff" = variante de pose (braço direito dobrado segurando o cajado) para arms, hands, sleeves
//               e cloak_front; sem ela, o app usa a arte vetorial dessa camada quando o cajado está equipado
//
// Uso: node scripts/avatar-assets.mjs [--dir assets/avatars] [--out arquivo.ts] [--check] [--json]
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const arg = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};
const DIR = resolve(root, arg('--dir', 'assets/avatars'));
const OUT = resolve(root, arg('--out', 'src/features/avatar/art/imageAssets.generated.ts'));

export const CANVAS = { width: 1024, height: 1536 };
export const BODIES = ['body-a', 'body-b', 'body-c'];
export const LAYERS = [
  'background', 'shadow', 'cloak_back', 'back_item', 'back_hair', 'body', 'face', 'lower_outfit', 'feet', 'upper_outfit',
  'chest', 'waist', 'arms', 'sleeves', 'cloak_front', 'hands', 'neck', 'beard', 'mouth', 'front_hair', 'headwear',
  'face_accessory', 'hand_item', 'emblem', 'special_fx', 'frame',
];
/** Camadas que mudam com a pose do braço (variante `.staff`). */
export const POSE_LAYERS = ['arms', 'hands', 'sleeves', 'cloak_front'];
const APPEARANCE_CATS = { body: 'body', eyes: 'eyes', brows: 'brows', expression: 'expression', beard: 'beard', hair: 'hair_style' };
const ITEM_CATS = ['outfit', 'back', 'feet', 'waist', 'neck', 'head', 'hands', 'background', 'frame'];
/** Categorias cujas peças precisam de uma versão por corpo (ou "all" se servir aos três). */
const PER_BODY = ['body', 'outfit', 'back', 'feet', 'waist', 'hands'];
const TINT = { body: 'skin', hair: 'hair', brows: 'hair', beard: 'hair' };
/** Camadas de peças que mostram pele do personagem (ex.: a mão fechada no cajado): máscara de pele. */
const SKIN_LAYERS = ['hand_item'];

// ---------------------------------------------------------------- leitura de cabeçalhos

/** Dimensões e canal alfa de PNG e WebP sem dependências externas. */
export function imageInfo(buf) {
  if (buf.length > 26 && buf.readUInt32BE(0) === 0x89504e47) {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    const colorType = buf[25];
    let alpha = colorType === 4 || colorType === 6;
    if (!alpha) {
      // tRNS também conta como transparência
      let o = 8;
      while (o + 8 < buf.length) {
        const len = buf.readUInt32BE(o);
        const type = buf.toString('ascii', o + 4, o + 8);
        if (type === 'tRNS') alpha = true;
        if (type === 'IDAT' || type === 'IEND') break;
        o += 12 + len;
      }
    }
    return { format: 'png', width, height, alpha };
  }
  if (buf.length > 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = buf.toString('ascii', 12, 16);
    if (chunk === 'VP8X') {
      const alpha = (buf[20] & 0x10) !== 0;
      const width = 1 + buf.readUIntLE(24, 3);
      const height = 1 + buf.readUIntLE(27, 3);
      return { format: 'webp', width, height, alpha };
    }
    if (chunk === 'VP8L') {
      const b = buf.readUInt32LE(21);
      return { format: 'webp', width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1, alpha: ((b >> 28) & 1) === 1 };
    }
    if (chunk === 'VP8 ') {
      return { format: 'webp', width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff, alpha: false };
    }
  }
  return null;
}

// ---------------------------------------------------------------- catálogo (IDs válidos)

function knownSources() {
  const catalog = JSON.parse(readFileSync(join(root, 'src/features/avatar/catalog/catalog.json'), 'utf8'));
  const set = new Set();
  for (const [prefix, cat] of Object.entries(APPEARANCE_CATS)) {
    for (const o of catalog.appearance[cat] ?? []) set.add(`${prefix}/${o.id}`);
  }
  for (const it of catalog.items) set.add(`${it.slot}/${it.id}`);
  return set;
}

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const FILE_RE = /^([a-z_]+)(?:\.(staff))?(?:\.(mask|shade))?(@2x)?\.(webp|png)$/;

export function scan(dir = DIR) {
  const sources = knownSources();
  const errors = [];
  const warnings = [];
  /** source -> layer -> part -> body -> arquivo */
  const entries = {};
  for (const file of walk(dir)) {
    const rel = relative(dir, file).split(sep).join('/');
    if (rel.endsWith('.md') || rel.endsWith('.json') || rel.startsWith('.')) continue;
    const parts = rel.split('/');
    if (parts.length !== 4) {
      errors.push(`${rel}: caminho fora do padrão {categoria}/{assetId}/{corpo|all}/{camada}.webp`);
      continue;
    }
    const [category, assetId, body, fileName] = parts;
    const m = FILE_RE.exec(fileName);
    if (!m) {
      errors.push(`${rel}: nome de arquivo inválido (use camada[.staff][.mask|.shade][@2x].webp|png)`);
      continue;
    }
    const [, layer, pose, kind, hi] = m;
    if (pose && !POSE_LAYERS.includes(layer)) errors.push(`${rel}: variante de pose ".${pose}" só vale para ${POSE_LAYERS.join(', ')}`);
    if (!LAYERS.includes(layer)) errors.push(`${rel}: camada desconhecida "${layer}"`);
    if (body !== 'all' && !BODIES.includes(body)) errors.push(`${rel}: corpo desconhecido "${body}"`);
    let source;
    if (category === 'body') {
      if (assetId !== 'base') errors.push(`${rel}: para corpo use body/base/{corpo}/...`);
      if (body === 'all') errors.push(`${rel}: corpo base precisa de pasta por corpo`);
      source = `body/${body}`;
    } else if (APPEARANCE_CATS[category] || ITEM_CATS.includes(category)) {
      source = `${category}/${assetId}`;
      if (!sources.has(source)) errors.push(`${rel}: "${source}" não existe no catálogo`);
    } else {
      errors.push(`${rel}: categoria desconhecida "${category}"`);
      continue;
    }
    const tint = TINT[category] ?? (SKIN_LAYERS.includes(layer) ? 'skin' : undefined);
    if (kind === 'mask' && !tint) errors.push(`${rel}: ".mask" só vale para pele/cabelo (body, hair, brows, beard) e para a pele em ${SKIN_LAYERS.join(', ')}`);

    const info = imageInfo(readFileSync(file));
    const expected = hi ? { w: CANVAS.width * 2, h: CANVAS.height * 2 } : { w: CANVAS.width, h: CANVAS.height };
    if (!info) errors.push(`${rel}: não é PNG/WebP válido`);
    else {
      if (info.width !== expected.w || info.height !== expected.h) errors.push(`${rel}: ${info.width}×${info.height}, esperado ${expected.w}×${expected.h}`);
      if (!info.alpha && layer !== 'background') errors.push(`${rel}: sem transparência (canal alfa obrigatório)`);
    }
    if (hi) continue; // o @2x é escolhido automaticamente pelo empacotador a partir do arquivo base
    const partKey = `${pose ? `${pose}:` : ''}${kind ?? 'base'}`;
    entries[source] ??= {};
    entries[source][layer] ??= {};
    entries[source][layer][partKey] ??= {};
    entries[source][layer][partKey][body] = { rel, tint: kind === 'mask' ? tint : undefined };
  }

  // política de variantes por corpo
  const coverage = {};
  for (const [source, layers] of Object.entries(entries)) {
    const category = source.split('/')[0];
    const covered = new Set();
    for (const partMap of Object.values(layers)) for (const bodies of Object.values(partMap)) Object.keys(bodies).forEach((b) => covered.add(b));
    const bodies = category === 'body' ? [source.split('/')[1]] : PER_BODY.includes(category) && !covered.has('all') ? BODIES.filter((b) => covered.has(b)) : BODIES;
    const missing = category === 'body' ? [] : BODIES.filter((b) => !bodies.includes(b));
    coverage[source] = { bodies, missing };
    if (missing.length) warnings.push(`${source}: sem versão para ${missing.join(', ')} — esses corpos usam a arte provisória`);
  }
  return { entries, coverage, errors, warnings };
}

export function generate({ entries }, outFile = OUT) {
  const relTo = (rel) => {
    const p = relative(dirname(outFile), join(DIR, rel)).split(sep).join('/');
    return p.startsWith('.') ? p : `./${p}`;
  };
  const lines = [
    '// ARQUIVO GERADO por scripts/avatar-assets.mjs — não edite à mão.',
    '// Ilustrações finais encontradas em assets/avatars/. Vazio = só arte provisória (vetorial).',
    "import type { ImageLayerMap } from './types';",
    '',
    'export const IMAGE_LAYERS: ImageLayerMap = {',
  ];
  for (const source of Object.keys(entries).sort()) {
    lines.push(`  '${source}': {`);
    for (const layer of Object.keys(entries[source]).sort()) {
      lines.push(`    ${layer}: [`);
      const partMap = entries[source][layer];
      for (const pose of ['', 'staff']) {
        for (const kind of ['mask', 'base', 'shade']) {
          const partKey = `${pose ? `${pose}:` : ''}${kind}`;
          const bodies = partMap[partKey];
          if (!bodies) continue;
          const tint = Object.values(bodies)[0]?.tint;
          const srcs = Object.keys(bodies).sort().map((b) => `'${b}': require('${relTo(bodies[b].rel)}')`).join(', ');
          lines.push(`      { sources: { ${srcs} }${tint ? `, tint: '${tint}'` : ''}${pose ? `, pose: '${pose}'` : ''} },`);
        }
      }
      lines.push('    ],');
    }
    lines.push('  },');
  }
  lines.push('};', '');
  return lines.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const result = scan();
  const code = generate(result);
  if (args.includes('--json')) {
    process.stdout.write(JSON.stringify({ ...result, code }, null, 2));
    process.exit(0);
  }
  for (const w of result.warnings) console.warn(`aviso: ${w}`);
  for (const e of result.errors) console.error(`erro: ${e}`);
  if (result.errors.length) process.exit(1);
  if (args.includes('--check')) {
    const current = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
    if (current !== code) {
      console.error('Registro de assets desatualizado. Rode: npm run assets');
      process.exit(1);
    }
    console.log(`Assets em dia (${Object.keys(result.entries).length} peças ilustradas).`);
  } else {
    writeFileSync(OUT, code);
    console.log(`Gerado: ${relative(root, OUT)} (${Object.keys(result.entries).length} peças ilustradas)`);
  }
}
