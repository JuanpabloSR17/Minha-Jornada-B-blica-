import { resolveLayers, zIndexOf } from '../domain/avatar.layering';
import { defaultLook } from '../domain/avatar.rules';
import { APPEARANCE_KEY_CATEGORY, APPEARANCE_OPTIONS, COSMETIC_ITEMS } from '../domain/catalog';
import { ART_MANIFEST, LAYER_ORDER, VECTOR_MANIFEST } from '../art/manifest';
import { ART_REGISTRY } from '../art/registry';
import { GROUND_Y, HEAD, HEAD_SCALE, HEAD_TOP_Y, anchors, geometryFor } from '../art/geometry';

const prefix: Record<string, string> = { body: 'body', eyes: 'eyes', brows: 'brows', expression: 'expression', beard: 'beard', hair_style: 'hair' };

describe('manifest de arte', () => {
  it('toda entrada do manifest corresponde a uma opção ou item do catálogo', () => {
    const optionKeys = new Set(Object.entries(prefix).flatMap(([cat, p]) => APPEARANCE_OPTIONS[cat as keyof typeof APPEARANCE_OPTIONS].map((o) => `${p}/${o.id}`)));
    const itemKeys = new Set(COSMETIC_ITEMS.map((it) => `${it.slot}/${it.id}`));
    for (const key of Object.keys(ART_MANIFEST)) expect(optionKeys.has(key) || itemKeys.has(key)).toBe(true);
  });
  it('toda arte referenciada existe no registro', () => {
    for (const entry of Object.values(ART_MANIFEST)) {
      for (const key of Object.values(entry.layers)) expect(ART_REGISTRY[key!]).toBeDefined();
    }
  });
  it('mantos ilustrados têm camada traseira e dianteira; cabelos têm traseira e frontal', () => {
    for (const it of COSMETIC_ITEMS.filter((i) => i.slot === 'back' && ART_MANIFEST[`back/${i.id}`])) {
      // frente sobre o braço (cloak_front) ou drapeado que passa atrás do braço (chest)
      const layers = Object.keys(ART_MANIFEST[`back/${it.id}`]!.layers).sort();
      expect([['cloak_back', 'cloak_front'], ['chest', 'cloak_back']]).toContainEqual(layers);
    }
    for (const [key, entry] of Object.entries(ART_MANIFEST).filter(([k]) => k.startsWith('hair/'))) {
      expect(Object.keys(entry.layers).sort()).toEqual(['back_hair', 'front_hair']);
      expect(key).toBeTruthy();
    }
  });
  it('mãos ficam acima do manto dianteiro (aparecem para fora do manto)', () => {
    expect(LAYER_ORDER.indexOf('hands')).toBeGreaterThan(LAYER_ORDER.indexOf('cloak_front'));
    expect(LAYER_ORDER.indexOf('arms')).toBeLessThan(LAYER_ORDER.indexOf('sleeves'));
  });
});

describe('resolveLayers', () => {
  it('ordena pela ordem de desenho', () => {
    const look = { ...defaultLook(), equipment: { ...defaultLook().equipment, back: 'cloak-wool' } };
    const layers = resolveLayers(look.appearance, look.equipment);
    const z = layers.map((l) => l.zIndex);
    expect([...z].sort((a, b) => a - b)).toEqual(z);
    const slots = layers.map((l) => l.slot);
    expect(slots[0]).toBe('background');
    expect(slots.indexOf('cloak_back')).toBeLessThan(slots.indexOf('body'));
    expect(slots.indexOf('cloak_front')).toBeGreaterThan(slots.indexOf('upper_outfit'));
    expect(slots.indexOf('front_hair')).toBeGreaterThan(slots.indexOf('face'));
    expect(slots.indexOf('hands')).toBeGreaterThan(slots.indexOf('cloak_front'));
  });

  it('cabelo traseiro e frontal vêm da mesma escolha', () => {
    const look = defaultLook();
    look.appearance.hairStyleId = 'hair-long-wavy';
    const layers = resolveLayers(look.appearance, look.equipment).filter((l) => l.source === 'hair/hair-long-wavy');
    expect(layers.map((l) => l.slot).sort()).toEqual(['back_hair', 'front_hair']);
  });

  it('turbante esconde a franja; lenço esconde franja e cabelo de trás (quando ilustrados)', () => {
    const look = defaultLook();
    look.appearance.hairStyleId = 'hair-long-wavy';
    const manifest = { ...ART_MANIFEST, 'head/headwrap-sand': { layers: { headwear: 'shadow' } }, 'head/headscarf-ochre': { layers: { headwear: 'shadow' } } };
    const wrap = resolveLayers(look.appearance, { ...look.equipment, head: 'headwrap-sand' }, { manifest }).map((l) => l.slot);
    expect(wrap).not.toContain('front_hair');
    expect(wrap).toContain('back_hair');
    const scarf = resolveLayers(look.appearance, { ...look.equipment, head: 'headscarf-ochre' }, { manifest }).map((l) => l.slot);
    expect(scarf).not.toContain('front_hair');
    expect(scarf).not.toContain('back_hair');
  });

  it('acessório sem arte publicada não esconde o cabelo', () => {
    const look = defaultLook();
    const slots = resolveLayers(look.appearance, { ...look.equipment, head: 'rare_turbante_do_sacerdote' }).map((l) => l.slot);
    expect(slots).toContain('front_hair');
  });

  it('cobertura de cabeça com arte esconde o cabelo original e desenha o cabelo ajustado por baixo', () => {
    const look = defaultLook();
    const layers = resolveLayers(look.appearance, { ...look.equipment, head: 'headwrap-sand' });
    const slots = layers.map((l) => l.slot);
    expect(slots).not.toContain('front_hair');
    expect(slots).not.toContain('back_hair');
    expect(layers.find((l) => l.assetKey === 'gear.underhair')?.slot).toBe('back_item');
    expect(slots.indexOf('back_item')).toBeLessThan(slots.indexOf('body'));
    expect(slots.indexOf('headwear')).toBeGreaterThan(slots.indexOf('face'));
  });

  it('proporção adulta: cabeça reduzida em torno do queixo, cerca de 7 cabeças de altura', () => {
    const head = (HEAD.chin - HEAD.top) * HEAD_SCALE;
    const heads = (GROUND_Y - HEAD_TOP_Y) / head;
    expect(heads).toBeGreaterThan(6.8);
    expect(heads).toBeLessThan(7.6);
  });

  it('o cajado dobra só o braço direito: mão à altura do peito, à frente do ombro', () => {
    for (const body of ['body-a', 'body-b', 'body-c']) {
      const g = geometryFor(body);
      const rest = anchors(g, 1);
      const staff = anchors(g, 1, 'staff');
      expect(staff.wrist.y).toBeLessThan(rest.elbow.y);
      expect(staff.elbow.y).toBeGreaterThan(staff.wrist.y);
      expect(staff.shoulder).toEqual(rest.shoulder);
      expect(anchors(g, -1, 'staff')).toEqual(anchors(g, -1));
    }
  });

  it('encaixes das peças de viagem: alça, bolsa, cajado na mão e manto atrás do braço', () => {
    const look = defaultLook();
    const eq = { ...look.equipment, back: 'cloak-night', waist: 'common_bolsa_do_viajante', hands: 'staff-shepherd' };
    // ordem das camadas no manifesto vetorial (a arte pintada usa as mesmas camadas, testado abaixo)
    const keys = resolveLayers(look.appearance, eq, { manifest: VECTOR_MANIFEST }).map((l) => l.assetKey);
    const at = (k: string) => keys.indexOf(k);
    // alça cruza a túnica e o manto drapeado; a bolsa repousa no quadril, sob o braço
    expect(at('gear.satchel.strap')).toBeGreaterThan(at('tunic.linen.body'));
    expect(at('gear.satchel.strap')).toBeGreaterThan(at('gear.drape'));
    expect(at('gear.satchel.bag')).toBeLessThan(at('body.arms'));
    // o manto drapeado passa atrás do braço
    expect(at('gear.drape')).toBeLessThan(at('body.arms'));
    // a mão envolve o cajado: haste abaixo da mão, dedos fechados acima da haste
    expect(at('gear.staff.crook')).toBeLessThan(at('body.hands'));
    expect(at('gear.grip')).toBeGreaterThan(at('gear.staff.crook'));
    expect(at('gear.grip')).toBeGreaterThan(at('body.hands'));
  });

  it('opção de aparência sem arte (avatar antigo) usa a arte padrão da categoria', () => {
    const look = defaultLook();
    look.appearance.hairStyleId = 'hair-locs';
    const hair = resolveLayers(look.appearance, look.equipment).filter((l) => l.source === 'hair/hair-locs');
    expect(hair.map((l) => l.assetKey).sort()).toEqual(Object.values(ART_MANIFEST['hair/hair-short']!.layers).sort());
  });

  it('lote 1 pintado: as camadas pintadas ocupam as mesmas posições de encaixe da arte vetorial', () => {
    const look = defaultLook();
    const appearance = { ...look.appearance, bodyId: 'body-b', hairStyleId: 'hair-short' };
    const eq = { outfit: 'tunic-linen', back: 'cloak-night', waist: 'common_bolsa_do_viajante', hands: 'staff-shepherd', feet: 'sandals-leather' };
    const painted = resolveLayers(appearance, eq).map((l) => `${l.source}#${l.slot}`);
    const vector = resolveLayers(appearance, eq, { manifest: VECTOR_MANIFEST }).map((l) => `${l.source}#${l.slot}`);
    expect(painted).toEqual(vector);
    const keys = resolveLayers(appearance, eq).map((l) => l.assetKey);
    for (const k of ['img:outfit/tunic-linen#upper_outfit', 'img:back/cloak-night#chest', 'img:waist/common_bolsa_do_viajante#chest', 'img:waist/common_bolsa_do_viajante#waist', 'img:hands/staff-shepherd#cloak_front', 'img:hands/staff-shepherd#hand_item', 'img:body/body-b#arms']) {
      expect(keys).toContain(k);
    }
  });

  it('ignora item colocado em slot que não é o dele', () => {
    const look = defaultLook();
    const layers = resolveLayers(look.appearance, { ...look.equipment, feet: 'cloak-wool' });
    expect(layers.some((l) => l.source.includes('cloak-wool'))).toBe(false);
  });

  it('usa arte substituta quando o asset do item não foi publicado', () => {
    const look = defaultLook();
    const manifest = { ...ART_MANIFEST };
    delete manifest['outfit/tunic-linen'];
    const layers = resolveLayers(look.appearance, look.equipment, { manifest });
    const outfit = layers.filter((l) => l.source === 'outfit/tunic-linen');
    expect(outfit.length).toBe(2);
    expect(outfit.every((l) => l.isFallback)).toBe(true);
  });

  it('usa arte substituta quando o item é incompatível com o corpo', () => {
    const look = defaultLook();
    const manifest = { ...ART_MANIFEST, 'outfit/tunic-linen': { ...ART_MANIFEST['outfit/tunic-linen']!, bodyCompatibility: ['body-a'] } };
    const layers = resolveLayers({ ...look.appearance, bodyId: 'body-c' }, look.equipment, { manifest });
    expect(layers.filter((l) => l.source === 'outfit/tunic-linen').every((l) => l.isFallback)).toBe(true);
  });

  it('pode omitir o fundo', () => {
    const look = defaultLook();
    expect(resolveLayers(look.appearance, look.equipment, { showBackground: false }).some((l) => l.slot === 'background')).toBe(false);
  });

  it('sem barba não gera camada de barba', () => {
    const look = defaultLook();
    expect(resolveLayers(look.appearance, look.equipment).some((l) => l.slot === 'beard')).toBe(false);
  });

  it('zIndex segue LAYER_ORDER', () => {
    LAYER_ORDER.forEach((slot, i) => expect(zIndexOf(slot)).toBe(i * 10));
    expect(Object.keys(APPEARANCE_KEY_CATEGORY)).toHaveLength(8);
  });
});

describe('arte pintada por pose (resolveArt)', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { resolveArt } = require('../components/AvatarRenderer') as typeof import('../components/AvatarRenderer');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { IMAGE_LAYERS } = require('../art/imageAssets.generated') as typeof import('../art/imageAssets.generated');
  const parts = (source: string, layer: string, pose?: string) =>
    (IMAGE_LAYERS[source]?.[layer] ?? []).filter((p) => (p.pose ?? undefined) === pose).map((p) => p.sources['body-b'] ?? p.sources.all);

  it('com o cajado, braços, mãos e mangas usam a variante .staff; em repouso, a de repouso', () => {
    for (const [source, layer] of [['body/body-b', 'arms'], ['body/body-b', 'hands'], ['outfit/tunic-linen', 'sleeves']] as const) {
      const staff = resolveArt(`img:${source}#${layer}`, 'body-b', 'staff');
      const rest = resolveArt(`img:${source}#${layer}`, 'body-b', 'rest');
      expect(staff?.type).toBe('image');
      expect(rest?.type).toBe('image');
      if (staff?.type === 'image' && rest?.type === 'image') {
        expect(staff.parts.map((p) => p.source)).toEqual(parts(source, layer, 'staff'));
        expect(rest.parts.map((p) => p.source)).toEqual(parts(source, layer));
      }
    }
  });

  it('corpo sem a pintura cai na arte vetorial da mesma camada (que segue a pose)', () => {
    expect(resolveArt('img:outfit/tunic-linen#sleeves', 'body-a', 'staff')?.type).toBe('vector');
    expect(resolveArt('img:hands/staff-shepherd#cloak_front', 'body-c', 'staff')?.type).toBe('vector');
  });
});
