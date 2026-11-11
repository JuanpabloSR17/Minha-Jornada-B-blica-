import type { LayerSlot } from '../domain/avatar.types';

/**
 * Manifest de arte do avatar — versionado e desacoplado do estado do usuário.
 *
 * Cada "chave de origem" (parte da aparência ou asset_manifest_key de um item)
 * declara em quais camadas desenha e qual arte usa em cada uma. As artes atuais
 * são PLACEHOLDERS VETORIAIS próprios (ver art/registry.tsx); para trocar por
 * ilustrações finais basta registrar a arte como imagem — o renderizador não muda.
 */
export const ART_MANIFEST_VERSION = 1;

/** Ordem de desenho. zIndex = posição × 10. */
export const LAYER_ORDER: readonly LayerSlot[] = [
  'background',
  'shadow',
  'cloak_back',
  'back_hair',
  'body',
  'face',
  'lower_outfit',
  'feet',
  'upper_outfit',
  'waist',
  'arms',
  'sleeves',
  'cloak_front',
  'neck',
  'beard',
  'mouth',
  'front_hair',
  'headwear',
  'face_accessory',
  'hand_item',
  'special_fx',
  'frame',
] as const;

export type ManifestEntry = {
  layers: Partial<Record<LayerSlot, string>>;
  params?: Record<string, string | number | boolean>;
  /** IDs de corpo suportados; ausente = todos. */
  bodyCompatibility?: string[];
};

const tunic = (base: string, trim: string, pattern: string): ManifestEntry => ({
  layers: { upper_outfit: 'tunic.body', sleeves: 'tunic.sleeves' },
  params: { base, trim, pattern },
});
const cloak = (base: string, trim: string, pattern = 'plain'): ManifestEntry => ({
  layers: { cloak_back: 'cloak.back', cloak_front: 'cloak.front' },
  params: { base, trim, pattern },
});
const feet = (style: string, base: string, accent = '#00000000'): ManifestEntry => ({
  layers: { feet: 'feet.' + style },
  params: { base, accent },
});
const belt = (style: string, base: string, accent: string): ManifestEntry => ({
  layers: { waist: 'belt.' + style },
  params: { base, accent },
});

export const ART_MANIFEST: Record<string, ManifestEntry> = {
  // ---- Aparência ---------------------------------------------------------
  'body/body-a': { layers: { shadow: 'shadow', body: 'body.base', face: 'face.base', arms: 'body.arms' } },
  'body/body-b': { layers: { shadow: 'shadow', body: 'body.base', face: 'face.base', arms: 'body.arms' } },
  'body/body-c': { layers: { shadow: 'shadow', body: 'body.base', face: 'face.base', arms: 'body.arms' } },

  'eyes/eyes-round': { layers: { face: 'eyes.round' } },
  'eyes/eyes-almond': { layers: { face: 'eyes.almond' } },
  'eyes/eyes-soft': { layers: { face: 'eyes.soft' } },
  'eyes/eyes-wide': { layers: { face: 'eyes.wide' } },
  'eyes/eyes-narrow': { layers: { face: 'eyes.narrow' } },
  'eyes/eyes-joy': { layers: { face: 'eyes.joy' } },

  'brows/brows-soft': { layers: { face: 'brows.soft' } },
  'brows/brows-straight': { layers: { face: 'brows.straight' } },
  'brows/brows-arched': { layers: { face: 'brows.arched' } },
  'brows/brows-thick': { layers: { face: 'brows.thick' } },

  'expression/expr-smile': { layers: { mouth: 'mouth.smile' } },
  'expression/expr-joy': { layers: { mouth: 'mouth.joy' } },
  'expression/expr-calm': { layers: { mouth: 'mouth.calm' } },
  'expression/expr-determined': { layers: { mouth: 'mouth.determined' } },
  'expression/expr-wonder': { layers: { mouth: 'mouth.wonder' } },

  'beard/beard-none': { layers: {} },
  'beard/beard-stubble': { layers: { beard: 'beard.stubble' } },
  'beard/beard-mustache': { layers: { beard: 'beard.mustache' } },
  'beard/beard-goatee': { layers: { beard: 'beard.goatee' } },
  'beard/beard-short': { layers: { beard: 'beard.short' } },
  'beard/beard-full': { layers: { beard: 'beard.full' } },
  'beard/beard-long': { layers: { beard: 'beard.long' } },

  'hair/hair-shaved': { layers: { front_hair: 'hair.shaved.front' } },
  'hair/hair-short': { layers: { back_hair: 'hair.short.back', front_hair: 'hair.short.front' } },
  'hair/hair-side-part': { layers: { back_hair: 'hair.short.back', front_hair: 'hair.sidepart.front' } },
  'hair/hair-curly': { layers: { back_hair: 'hair.curly.back', front_hair: 'hair.curly.front' } },
  'hair/hair-afro': { layers: { back_hair: 'hair.afro.back', front_hair: 'hair.afro.front' } },
  'hair/hair-wavy': { layers: { back_hair: 'hair.wavy.back', front_hair: 'hair.wavy.front' } },
  'hair/hair-long': { layers: { back_hair: 'hair.long.back', front_hair: 'hair.long.front' } },
  'hair/hair-long-wavy': { layers: { back_hair: 'hair.longwavy.back', front_hair: 'hair.long.front' } },
  'hair/hair-braids': { layers: { back_hair: 'hair.short.back', front_hair: 'hair.braids.front' } },
  'hair/hair-bun': { layers: { back_hair: 'hair.bun.back', front_hair: 'hair.slick.front' } },
  'hair/hair-ponytail': { layers: { back_hair: 'hair.ponytail.back', front_hair: 'hair.slick.front' } },
  'hair/hair-locs': { layers: { back_hair: 'hair.locs.back', front_hair: 'hair.locs.front' } },

  // ---- Túnicas -----------------------------------------------------------
  'outfit/tunic-linen': tunic('#E9DDC3', '#B48C55', 'hem'),
  'outfit/tunic-olive': tunic('#6F7C46', '#D8C38A', 'plain'),
  'outfit/tunic-terracotta': tunic('#B4603C', '#F0D29A', 'embroidered'),
  'outfit/tunic-indigo': tunic('#3E4F7C', '#E2C27A', 'clavi'),
  'outfit/tunic-ochre': tunic('#C99B3C', '#7A4E22', 'hem'),
  'outfit/tunic-sky': tunic('#78A6C8', '#F4ECD8', 'vneck'),
  'outfit/tunic-pomegranate': tunic('#9C3B4C', '#E8C37C', 'collar'),
  'outfit/tunic-stone': tunic('#706963', '#C9BFAE', 'clavi'),

  // ---- Mantos ------------------------------------------------------------
  'back/cloak-wool': cloak('#8C6B4A', '#5E4630'),
  'back/cloak-desert': cloak('#D2B585', '#A88958'),
  'back/cloak-shepherd': cloak('#6A7553', '#E4D6B2', 'stripes'),
  'back/cloak-night': cloak('#2F3753', '#C9A75A'),
  'back/cloak-crimson': cloak('#7F2B2B', '#D9AE52'),

  // ---- Calçados ----------------------------------------------------------
  'feet/sandals-leather': feet('sandals', '#7A4E2C'),
  'feet/sandals-woven': feet('woven', '#C8A15E', '#9A773C'),
  'feet/sandals-laced': feet('laced', '#6B4428'),
  'feet/boots-travel': feet('boots', '#5C3E28', '#3F2A1B'),
  'feet/shoes-cloth': feet('cloth', '#8E8778', '#6F695C'),
  'feet/sandals-red': feet('sandals', '#9B3A2E'),

  // ---- Cintos ------------------------------------------------------------
  'waist/belt-rope': belt('rope', '#C2A26A', '#8F7244'),
  'waist/belt-leather': belt('leather', '#6E4527', '#C99A45'),
  'waist/sash-blue': belt('sash', '#3F6A9A', '#2C4C70'),
  'waist/sash-scarlet': belt('sash', '#A3333A', '#76232A'),
  'waist/belt-woven': belt('woven', '#7C5A3A', '#E3C47E'),
  'waist/belt-pouch': belt('pouch', '#6A4630', '#9A6D46'),

  // ---- Acessórios --------------------------------------------------------
  'head/headband-linen': { layers: { headwear: 'head.band' }, params: { base: '#EFE3C8', accent: '#B48C55' } },
  'head/headwrap-sand': { layers: { headwear: 'head.wrap' }, params: { base: '#D9C39A', accent: '#B39A6C' } },
  'head/headscarf-ochre': { layers: { headwear: 'head.scarf' }, params: { base: '#C99B3C', accent: '#A47A28' } },
  'neck/necklace-cord': { layers: { neck: 'neck.cord' }, params: { base: '#6B4A2E', accent: '#7D8B4A' } },
  'neck/necklace-beads': { layers: { neck: 'neck.beads' }, params: { base: '#B4603C', accent: '#E2C27A' } },
  'neck/scarf-neck': { layers: { neck: 'neck.scarf' }, params: { base: '#5E7FA3', accent: '#43607F' } },
  'hands/staff-shepherd': { layers: { hand_item: 'hand.staff' }, params: { base: '#8A6038' } },
  'hands/scroll-simple': { layers: { hand_item: 'hand.scroll' }, params: { base: '#EFE2C0' } },
  'hands/oil-lamp': { layers: { hand_item: 'hand.lamp' }, params: { base: '#B66B3F' } },

  // ---- Fundos ------------------------------------------------------------
  'background/bg-parchment': { layers: { background: 'bg.parchment' } },
};

/** Arte usada quando um item não tem asset publicado (ou é incompatível com o corpo). */
export const FALLBACK_ART: Partial<Record<LayerSlot, string>> = {
  upper_outfit: 'fallback.tunic',
  sleeves: 'fallback.sleeves',
};
