import { arms, bodyBase, faceBase, shadow } from './parts/body';
import { beards, brows, eyes, mouths } from './parts/face';
import { hair } from './parts/hair';
import { belt, cloak, fallback, feet, tunic } from './parts/clothing';
import { background, hand, head, neck } from './parts/accessories';
import type { ArtDefinition } from './types';

const prefixed = (prefix: string, defs: Record<string, ArtDefinition>) =>
  Object.fromEntries(Object.entries(defs).map(([k, v]) => [`${prefix}.${k}`, v]));

/**
 * Registro de artes por chave. Hoje: placeholders vetoriais desenhados em código.
 * Para publicar a ilustração final de uma peça, registre-a como ImageArt
 * ({ kind: 'image', source: require('...png') }) com a mesma chave.
 */
export const ART_REGISTRY: Record<string, ArtDefinition> = {
  shadow,
  'body.base': bodyBase,
  'body.arms': arms,
  'face.base': faceBase,
  ...prefixed('eyes', eyes),
  ...prefixed('brows', brows),
  ...prefixed('mouth', mouths),
  ...prefixed('beard', beards),
  ...prefixed('hair', hair),
  ...prefixed('tunic', tunic),
  ...prefixed('cloak', cloak),
  ...prefixed('feet', feet),
  ...prefixed('belt', belt),
  ...prefixed('head', head),
  ...prefixed('neck', neck),
  ...prefixed('hand', hand),
  ...prefixed('bg', background),
  ...prefixed('fallback', fallback),
};
