import fs from 'node:fs';
import path from 'node:path';
import { COSMETIC_ITEMS } from '@/features/avatar/domain/catalog';
import { SKINS } from '../catalog';

const sql = fs.readFileSync(path.join(__dirname, '../../../../supabase/migrations/20261124000100_skin_market.sql'), 'utf8');
const seeded = [...sql.matchAll(/^ {2}\('([a-z0-9_]+)', '((?:[^']|'')*)', '([a-z]+)', '([a-z-]+)', '((?:[^']|'')*)', '([a-z0-9-]+)', (true|false), \d+\)/gm)]
  .map((m) => ({ id: m[1], name: m[2]!.replace(/''/g, "'"), rarity: m[3], origin: m[4], inShop: m[7] === 'true' }));

describe('catálogo de skins', () => {
  it('é a mesma lista do servidor (id, nome, raridade, origem e loja)', () => {
    expect(seeded).toHaveLength(SKINS.length);
    expect(seeded).toEqual(SKINS.map((s) => ({ id: s.id, name: s.name, rarity: s.rarity, origin: s.origin, inShop: s.inShop })));
  });
  it('cada skin tem 3 estilos com tons de pele diferentes', () => {
    for (const s of SKINS) {
      expect(s.styles).toHaveLength(3);
      expect(new Set(s.styles.map((x) => x.skinTone)).size).toBe(3);
    }
  });
  it('a prévia usa peças que existem no catálogo', () => {
    const ids = new Set(COSMETIC_ITEMS.map((i) => i.id));
    for (const s of SKINS) for (const id of Object.values(s.preview)) expect(ids.has(id!)).toBe(true);
  });
  it('a loja só tem Comuns, Raras e Épicas', () => {
    expect(SKINS.filter((s) => s.inShop).every((s) => ['common', 'rare', 'epic'].includes(s.rarity))).toBe(true);
  });
});
