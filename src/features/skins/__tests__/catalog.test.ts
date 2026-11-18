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

describe('pinturas entregues (art.generated)', () => {
  const { SKIN_ART } = require('../art.generated');
  const { skinLook, variantsOf, skinDisplayName, getSkin } = require('../catalog');
  it('toda pintura pertence a uma skin do catálogo e traz os 3 estilos e o ícone', () => {
    for (const [id, variants] of Object.entries(SKIN_ART) as [string, Record<string, { styles: unknown[]; icon: unknown }>][]) {
      expect(getSkin(id)).toBeTruthy();
      for (const art of Object.values(variants)) {
        expect(art.styles).toHaveLength(3);
        expect(art.icon).toBeTruthy();
      }
    }
  });
  it('o Lote A, Tecelã e Parteira estão pintados; as femininas têm nome próprio', () => {
    for (const id of ['comum_peregrino_exodo', 'raro_levita', 'lendario_moises', 'comum_tecela', 'comum_parteira',
      'comum_carpinteiro', 'raro_sacerdote', 'raro_bordador', 'raro_ourives', 'raro_gravador', 'raro_perfumista']) expect(SKIN_ART[id]?.padrao).toBeTruthy();
    expect(skinDisplayName(getSkin('comum_carpinteiro'), 'feminino')).toBe('Carpinteira de acácia');
    expect(variantsOf('raro_sacerdote')).toEqual(['padrao']);
    expect(variantsOf('comum_peregrino_exodo')).toEqual(['padrao', 'feminino']);
    expect(variantsOf('comum_pastor')).toEqual(['padrao']);
    expect(skinDisplayName(getSkin('comum_peregrino_exodo'), 'feminino')).toBe('Peregrina do Êxodo');
  });
  it('skinLook usa a pintura do estilo e da apresentação, e cai no desenho provisório sem pintura', () => {
    const f2 = skinLook(null, { skinId: 'comum_peregrino_exodo', style: 2, variant: 'feminino' });
    expect(f2.painted).toBe(SKIN_ART.comum_peregrino_exodo.feminino.styles[1]);
    expect(f2.label).toBe('Peregrina do Êxodo, estilo 2');
    expect(skinLook(null, { skinId: 'comum_pastor', style: 1, variant: 'feminino' }).painted).toBeUndefined();
  });
});
