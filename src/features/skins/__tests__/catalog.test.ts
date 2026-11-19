import fs from 'node:fs';
import path from 'node:path';
import { COSMETIC_ITEMS } from '@/features/avatar/domain/catalog';
import { SKINS } from '../catalog';
import season1 from '../season1.json';

const sql = fs.readFileSync(path.join(__dirname, '../../../../supabase/migrations/20261124000100_skin_market.sql'), 'utf8');
const seeded = [...sql.matchAll(/^ {2}\('([a-z0-9_]+)', '((?:[^']|'')*)', '([a-z]+)', '([a-z-]+)', '((?:[^']|'')*)', '([a-z0-9-]+)', (true|false), \d+\)/gm)]
  .map((m) => ({ id: m[1], name: m[2]!.replace(/''/g, "'"), rarity: m[3], origin: m[4], inShop: m[7] === 'true' }));

describe('catálogo de skins', () => {
  it('a Temporada 1 é a mesma lista do servidor (id, nome, raridade, origem e loja)', () => {
    const t1 = SKINS.filter((s) => (season1.skins as { id: string }[]).some((x) => x.id === s.id));
    expect(seeded).toHaveLength(t1.length);
    expect(seeded).toEqual(t1.map((s) => ({ id: s.id, name: s.name, rarity: s.rarity, origin: s.origin, inShop: s.inShop })));
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
      'comum_carpinteiro', 'raro_sacerdote', 'raro_bordador', 'raro_ourives', 'raro_gravador', 'raro_perfumista',
      'epico_sumo_sacerdote', 'raro_joquebede', 'raro_filha_de_farao', 'raro_parteiras']) expect(SKIN_ART[id]?.padrao).toBeTruthy();
    expect(skinDisplayName(getSkin('comum_carpinteiro'), 'feminino')).toBe('Carpinteira de acácia');
    expect(variantsOf('raro_sacerdote')).toEqual(['padrao']);
    const { variantButtonLabel } = require('../catalog');
    expect(variantButtonLabel(getSkin('comum_peregrino_exodo'), 'feminino')).toBe('Peregrina do Êxodo');
    expect(variantButtonLabel(getSkin('raro_ourives'), 'padrao')).toBe('Padrão');
    expect(variantButtonLabel(getSkin('raro_ourives'), 'feminino')).toBe('Feminina');
    expect(skinDisplayName(getSkin('comum_pastor'), 'feminino')).toBe('Pastora de ovelhas');
    for (const s of require('../season1.json').skins) expect(SKIN_ART[s.id]?.padrao).toBeTruthy();
    expect(variantsOf('comum_peregrino_exodo')).toEqual(['padrao', 'feminino']);
    expect(variantsOf('raro_hur')).toEqual(['padrao']);
    // personagens principais: só a apresentação do sexo do personagem
    expect(variantsOf('lendario_moises')).toEqual(['padrao']);
    expect(variantsOf('glorioso_moises_rosto_resplandecente')).toEqual(['padrao']);
    expect(SKIN_ART.lendario_moises.feminino).toBeUndefined();
    // personagens secundários também: Bezalel e Aoliabe só masculinos; figuras genéricas mantêm a feminina
    expect(variantsOf('epico_bezalel')).toEqual(['padrao']);
    expect(variantsOf('raro_aoliabe')).toEqual(['padrao']);
    expect(variantsOf('raro_shofar')).toEqual(['padrao', 'feminino']);
    expect(variantsOf('comum_pastor')).toEqual(['padrao', 'feminino']);
    const chars = require('../season1.json').skins.filter((x: { character?: string }) => x.character).map((x: { id: string }) => x.id);
    expect(chars).toHaveLength(13);
    for (const id of chars) expect(variantsOf(id)).toEqual(['padrao']);
    expect(skinLook(null, { skinId: 'lendario_moises', style: 3, variant: 'feminino' }).painted).toBe(SKIN_ART.lendario_moises.padrao.styles[2]);
    expect(skinDisplayName(getSkin('comum_peregrino_exodo'), 'feminino')).toBe('Peregrina do Êxodo');
  });
  it('skinLook usa a pintura do estilo e da apresentação, e cai na apresentação padrão quando a pedida não existe', () => {
    const f2 = skinLook(null, { skinId: 'comum_peregrino_exodo', style: 2, variant: 'feminino' });
    expect(f2.painted).toBe(SKIN_ART.comum_peregrino_exodo.feminino.styles[1]);
    expect(f2.label).toBe('Peregrina do Êxodo, estilo 2');
    // sem apresentação feminina pintada, vale a padrão
    expect(skinLook(null, { skinId: 'raro_hur', style: 1, variant: 'feminino' }).painted).toBe(SKIN_ART.raro_hur.padrao.styles[0]);
  });
});

describe('skins da enciclopédia (lotes aplicados)', () => {
  const principais = require('../principais.json').skins as { id: string; rarity: string; character?: string; inShop: boolean }[];
  const { SKIN_ART } = require('../art.generated');
  const { variantsOf } = require('../catalog');
  const fs = require('node:fs');
  const migrations = fs.readdirSync('supabase/migrations').map((f: string) => fs.readFileSync(`supabase/migrations/${f}`, 'utf8')).join('\n');
  it('cada skin do catálogo tem pintura, está numa migração e respeita o sexo do personagem', () => {
    const ids = new Set<string>();
    for (const s of principais) {
      expect(ids.has(s.id)).toBe(false);
      ids.add(s.id);
      expect(SKIN_ART[s.id]?.padrao?.styles).toHaveLength(3);
      expect(migrations).toContain(`('${s.id}', `);
      if (s.character || ['legendary', 'glorious'].includes(s.rarity)) expect(variantsOf(s.id)).toEqual(['padrao']);
    }
  });
  it('Sansão mantém as sete tranças nos três estilos (decisão do usuário), com as cores do plano', () => {
    const sansao = principais.find((s) => s.id === 'lendario_sansao') as unknown as { styles: { hairStyle: string; hairColor: string }[] };
    expect(sansao.styles.map((st) => st.hairStyle)).toEqual(['hair-braids', 'hair-braids', 'hair-braids']);
    expect(sansao.styles.map((st) => st.hairColor)).toEqual(['haircolor-honey', 'haircolor-darkbrown', 'haircolor-auburn']);
  });
});
