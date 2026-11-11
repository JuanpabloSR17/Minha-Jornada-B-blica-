import { arms, bodyBase, faceBase, hands, shadow } from './parts/body';
import { beards, brows, eyes, mouths } from './parts/face';
import { hair } from './parts/hair';
import { cloak, fallback, feet, tunic } from './parts/clothing';
import { background } from './parts/accessories';
import type { ArtDefinition } from './types';

const prefixed = (prefix: string, defs: Record<string, ArtDefinition>) =>
  Object.fromEntries(Object.entries(defs).map(([k, v]) => [`${prefix}.${k}`, v]));

/**
 * Registro de artes por chave. Hoje: artes vetoriais (protótipo da direção v2).
 * Para publicar a ilustração final de uma peça, registre a mesma chave como ImageArt:
 *   'tunic.joseph.body': { kind: 'image', source: { 'body-a': require(...), 'body-b': require(...) }, perBody: true }
 * Camadas de pele/cabelo podem usar `tint: 'skin' | 'hair'` (máscara colorizável).
 */
export const ART_REGISTRY: Record<string, ArtDefinition> = {
  shadow,
  'body.base': bodyBase,
  'body.arms': arms,
  'body.hands': hands,
  'face.base': faceBase,
  ...prefixed('eyes', eyes),
  ...prefixed('brows', brows),
  ...prefixed('mouth', mouths),
  ...prefixed('beard', beards),
  ...prefixed('hair', hair),
  ...prefixed('tunic', tunic),
  ...prefixed('cloak', cloak),
  ...prefixed('feet', feet),
  ...prefixed('bg', background),
  ...prefixed('fallback', fallback),
};
