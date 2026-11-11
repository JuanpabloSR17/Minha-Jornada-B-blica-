import type { LayerSlot } from '../domain/avatar.types';
import { IMAGE_LAYERS } from './imageAssets.generated';

/**
 * Manifest de arte do avatar — versionado e desacoplado do estado do usuário.
 *
 * ART_MANIFEST_VERSION 2: direção artística "RPG 2D ilustrado" (canvas 1024×1536,
 * ~5,6 cabeças). Conjunto de VALIDAÇÃO: só as peças listadas abaixo têm arte nesta
 * versão; as demais opções do catálogo ficam ocultas no criador até serem ilustradas
 * (o banco continua aceitando-as e a posse é preservada).
 *
 * As artes atuais são vetoriais (protótipo de encaixe e direção). Para usar a
 * ilustração final, registre a mesma chave em art/registry.tsx como ImageArt.
 */
export const ART_MANIFEST_VERSION = 2;

/** Ordem de desenho. zIndex = posição × 10. */
export const LAYER_ORDER: readonly LayerSlot[] = [
  'background',
  'shadow',
  'cloak_back',
  'back_item',
  'back_hair',
  'body',
  'face',
  'lower_outfit',
  'feet',
  'upper_outfit',
  'chest',
  'waist',
  'arms',
  'sleeves',
  'cloak_front',
  'hands',
  'neck',
  'beard',
  'mouth',
  'front_hair',
  'headwear',
  'face_accessory',
  'hand_item',
  'emblem',
  'special_fx',
  'frame',
] as const;

export type ManifestEntry = {
  layers: Partial<Record<LayerSlot, string>>;
  params?: Record<string, string | number | boolean>;
  /** IDs de corpo suportados; ausente = todos. */
  bodyCompatibility?: string[];
};

const BODY: ManifestEntry = { layers: { shadow: 'shadow', body: 'body.base', face: 'face.base', arms: 'body.arms', hands: 'body.hands' } };
const tunic = (art: string, base: string, trim: string, extra: Record<string, string> = {}): ManifestEntry => ({
  layers: { upper_outfit: `tunic.${art}.body`, sleeves: `tunic.${art}.sleeves` },
  params: { base, trim, ...extra },
});
const cloak = (art: string, base: string, trim: string): ManifestEntry => ({
  layers: { cloak_back: `cloak.${art}.back`, cloak_front: `cloak.${art}.front` },
  params: { base, trim },
});

/** Arte provisória (vetorial). Ilustrações finais sobrepõem estas entradas por camada. */
export const VECTOR_MANIFEST: Record<string, ManifestEntry> = {
  // ---- Corpo -------------------------------------------------------------
  'body/body-a': BODY,
  'body/body-b': BODY,
  'body/body-c': BODY,

  // ---- Rosto -------------------------------------------------------------
  'eyes/eyes-almond': { layers: { face: 'eyes.almond' } },
  'eyes/eyes-round': { layers: { face: 'eyes.round' } },
  'eyes/eyes-soft': { layers: { face: 'eyes.soft' } },

  'brows/brows-soft': { layers: { face: 'brows.soft' } },
  'brows/brows-straight': { layers: { face: 'brows.straight' } },
  'brows/brows-thick': { layers: { face: 'brows.thick' } },

  'expression/expr-smile': { layers: { mouth: 'mouth.smile' } },
  'expression/expr-calm': { layers: { mouth: 'mouth.calm' } },
  'expression/expr-joy': { layers: { mouth: 'mouth.joy' } },

  'beard/beard-none': { layers: {} },
  'beard/beard-stubble': { layers: { beard: 'beard.stubble' } },
  'beard/beard-short': { layers: { beard: 'beard.short' } },

  // ---- Cabelo ------------------------------------------------------------
  'hair/hair-curly': { layers: { back_hair: 'hair.curly.back', front_hair: 'hair.curly.front' } },
  'hair/hair-short': { layers: { back_hair: 'hair.short.back', front_hair: 'hair.short.front' } },
  'hair/hair-long-wavy': { layers: { back_hair: 'hair.longwavy.back', front_hair: 'hair.longwavy.front' } },

  // ---- Túnicas -----------------------------------------------------------
  'outfit/tunic-linen': tunic('linen', '#E2BE84', '#3C8C98'),
  'outfit/tunic-indigo': tunic('indigo', '#33466E', '#D9B45A'),
  'outfit/tunic-terracotta': tunic('terracotta', '#A9533A', '#E8C98E', { sash: '#41604B' }),
  'outfit/tunic-joseph': tunic('joseph', '#8E2B2F', '#E2B857'),

  // ---- Mantos ------------------------------------------------------------
  'back/cloak-wool': cloak('wool', '#6E5038', '#C9B48A'),
  'back/cloak-desert': cloak('desert', '#D9A75E', '#3C8C98'),

  // ---- Calçados ----------------------------------------------------------
  'feet/sandals-leather': { layers: { feet: 'feet.sandals' }, params: { base: '#7A4E2C' } },
  'feet/boots-travel': { layers: { feet: 'feet.boots' }, params: { base: '#5C3E28', accent: '#C9B48A' } },

  // ---- Fundos ------------------------------------------------------------
  'background/bg-parchment': { layers: { background: 'bg.parchment' } },
};

export const imageArtKey = (source: string, layer: string) => `img:${source}#${layer}`;

/** Manifest efetivo: vetor provisório + camadas com ilustração final (que têm prioridade). */
export const ART_MANIFEST: Record<string, ManifestEntry> = (() => {
  const out: Record<string, ManifestEntry> = { ...VECTOR_MANIFEST };
  for (const [source, layers] of Object.entries(IMAGE_LAYERS)) {
    const base = out[source] ?? { layers: {} };
    const merged = { ...base.layers };
    for (const layer of Object.keys(layers)) merged[layer as LayerSlot] = imageArtKey(source, layer);
    out[source] = { ...base, layers: merged };
  }
  return out;
})();

/**
 * Arte substituta genérica por camada, para peças ainda sem nenhuma arte
 * (ex.: itens bíblicos aguardando ilustração). Mostrada como "arte em produção".
 */
export const FALLBACK_ART: Partial<Record<LayerSlot, string>> = {
  upper_outfit: 'fallback.tunic',
  sleeves: 'fallback.sleeves',
  cloak_back: 'fallback.cloakBack',
  cloak_front: 'fallback.cloakFront',
  feet: 'fallback.feet',
  background: 'bg.parchment',
};

/** Camadas substitutas usadas por slot de equipamento sem arte. */
export const SLOT_FALLBACK_LAYERS: Partial<Record<string, LayerSlot[]>> = {
  outfit: ['upper_outfit', 'sleeves'],
  back: ['cloak_back', 'cloak_front'],
  feet: ['feet'],
  background: ['background'],
};

/** A peça/opção tem arte própria (final ou provisória) nesta versão do manifest? */
export function hasArt(sourceKey: string): boolean {
  return sourceKey in ART_MANIFEST;
}

export type ArtStatus = 'final' | 'provisional' | 'missing';

/** Situação da arte de uma peça para um corpo (exibida na interface, nunca escondida). */
export function artStatus(sourceKey: string, bodyId?: string): ArtStatus {
  const img = IMAGE_LAYERS[sourceKey];
  if (img) {
    const parts = Object.values(img).flat();
    const ok = parts.length > 0 && parts.every((pt) => pt && (pt.sources.all || (bodyId ? pt.sources[bodyId] : Object.keys(pt.sources).length)));
    if (ok) return 'final';
  }
  return sourceKey in VECTOR_MANIFEST ? 'provisional' : 'missing';
}
