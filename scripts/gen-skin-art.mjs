// Gera src/features/skins/art.generated.ts a partir das pinturas entregues em assets/skins.
// Uso: node scripts/gen-skin-art.mjs  (rode de novo a cada entrega de skins)
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = 'assets/skins';
const out = 'src/features/skins/art.generated.ts';
const rel = (p) => `../../../${p}`;
const lines = [];
for (const id of readdirSync(root).sort()) {
  const variants = [];
  for (const [variant, dir] of [['padrao', join(root, id)], ['feminino', join(root, id, 'feminino')]]) {
    const bodies = [1, 2, 3].map((n) => join(dir, `estilo-${n}`, 'corpo.webp'));
    if (!bodies.every(existsSync) || !existsSync(join(dir, 'icone.webp'))) continue;
    const ficha = existsSync(join(dir, 'ficha.json')) ? JSON.parse(readFileSync(join(dir, 'ficha.json'), 'utf8')) : {};
    const name = ficha.nomeExibicao ? `name: ${JSON.stringify(ficha.nomeExibicao)}, ` : '';
    variants.push(`    ${variant}: { ${name}icon: require('${rel(join(dir, 'icone.webp'))}'), styles: [\n${bodies.map((b) => `      require('${rel(b)}'),`).join('\n')}\n    ] },`);
  }
  if (variants.length) lines.push(`  ${id}: {\n${variants.join('\n')}\n  },`);
}
writeFileSync(out, `/* eslint-disable */
// GERADO por scripts/gen-skin-art.mjs a partir de assets/skins. Não editar à mão.
export type SkinVariant = 'padrao' | 'feminino';
export type SkinArt = { name?: string; icon: number; styles: number[] };
export const SKIN_ART: Record<string, Partial<Record<SkinVariant, SkinArt>>> = {
${lines.join('\n')}
};
`);
console.log(`${lines.length} skins com pintura → ${out}`);
