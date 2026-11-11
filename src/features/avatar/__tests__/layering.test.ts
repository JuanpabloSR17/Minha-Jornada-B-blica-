import { resolveLayers, zIndexOf } from '../domain/avatar.layering';
import { defaultLook } from '../domain/avatar.rules';
import { APPEARANCE_KEY_CATEGORY, APPEARANCE_OPTIONS, COSMETIC_ITEMS } from '../domain/catalog';
import { ART_MANIFEST, LAYER_ORDER } from '../art/manifest';
import { ART_REGISTRY } from '../art/registry';

const prefix: Record<string, string> = { body: 'body', eyes: 'eyes', brows: 'brows', expression: 'expression', beard: 'beard', hair_style: 'hair' };

describe('manifest de arte', () => {
  it('toda opção de aparência desenhável tem entrada no manifest', () => {
    for (const [cat, p] of Object.entries(prefix)) {
      for (const o of APPEARANCE_OPTIONS[cat as keyof typeof APPEARANCE_OPTIONS]) {
        expect(ART_MANIFEST[`${p}/${o.id}`]).toBeDefined();
      }
    }
  });
  it('todo item do catálogo tem entrada no manifest', () => {
    for (const it of COSMETIC_ITEMS) expect(ART_MANIFEST[`${it.slot}/${it.id}`]).toBeDefined();
  });
  it('toda arte referenciada existe no registro', () => {
    for (const entry of Object.values(ART_MANIFEST)) {
      for (const key of Object.values(entry.layers)) expect(ART_REGISTRY[key!]).toBeDefined();
    }
  });
  it('mantos têm camada traseira e dianteira', () => {
    for (const it of COSMETIC_ITEMS.filter((i) => i.slot === 'back')) {
      expect(Object.keys(ART_MANIFEST[`back/${it.id}`]!.layers).sort()).toEqual(['cloak_back', 'cloak_front']);
    }
  });
});

describe('resolveLayers', () => {
  it('ordena pela ordem de desenho', () => {
    const look = { ...defaultLook(), equipment: { ...defaultLook().equipment, back: 'cloak-wool', hands: 'staff-shepherd' } };
    const layers = resolveLayers(look.appearance, look.equipment);
    const z = layers.map((l) => l.zIndex);
    expect([...z].sort((a, b) => a - b)).toEqual(z);
    const slots = layers.map((l) => l.slot);
    expect(slots[0]).toBe('background');
    expect(slots.indexOf('cloak_back')).toBeLessThan(slots.indexOf('body'));
    expect(slots.indexOf('cloak_front')).toBeGreaterThan(slots.indexOf('upper_outfit'));
    expect(slots.indexOf('front_hair')).toBeGreaterThan(slots.indexOf('face'));
    expect(slots.indexOf('hand_item')).toBeGreaterThan(slots.indexOf('arms'));
  });

  it('cabelo traseiro e frontal vêm da mesma escolha', () => {
    const look = defaultLook();
    look.appearance.hairStyleId = 'hair-long';
    const layers = resolveLayers(look.appearance, look.equipment).filter((l) => l.source === 'hair/hair-long');
    expect(layers.map((l) => l.slot).sort()).toEqual(['back_hair', 'front_hair']);
  });

  it('turbante esconde a franja; lenço esconde franja e cabelo de trás', () => {
    const look = defaultLook();
    look.appearance.hairStyleId = 'hair-long';
    const wrap = resolveLayers(look.appearance, { ...look.equipment, head: 'headwrap-sand' }).map((l) => l.slot);
    expect(wrap).not.toContain('front_hair');
    expect(wrap).toContain('back_hair');
    const scarf = resolveLayers(look.appearance, { ...look.equipment, head: 'headscarf-ochre' }).map((l) => l.slot);
    expect(scarf).not.toContain('front_hair');
    expect(scarf).not.toContain('back_hair');
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
