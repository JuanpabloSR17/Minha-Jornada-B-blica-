import { arms, bodyBase, faceBase, hands, shadow } from './parts/body';
import { beards, brows, eyes, mouths } from './parts/face';
import { hair } from './parts/hair';
import { cloak, fallback, feet, tunic } from './parts/clothing';
import { background } from './parts/accessories';
import { gear } from './parts/gear';
import { IMAGE_LAYERS } from './imageAssets.generated';
import { VECTOR_MANIFEST, imageArtKey } from './manifest';
import { G } from 'react-native-svg';
import { HEAD_T } from './geometry';
import type { ArtDefinition, ImageArt, VectorArt } from './types';

/** Camadas desenhadas no espaço da cabeça: reduzidas em torno do queixo (proporção adulta). */
const inHead = (fn: VectorArt): VectorArt => (ctx) => <G transform={HEAD_T}>{fn(ctx)}</G>;
const headDefs = (defs: Record<string, VectorArt>) => Object.fromEntries(Object.entries(defs).map(([k, fn]) => [k, inHead(fn)]));

const prefixed = (prefix: string, defs: Record<string, ArtDefinition>) =>
  Object.fromEntries(Object.entries(defs).map(([k, v]) => [`${prefix}.${k}`, v]));

/**
 * Registro de artes por chave. Hoje: artes vetoriais (protótipo da direção v2).
 * Ilustrações finais NÃO são registradas à mão: coloque os arquivos em assets/avatars/
 * e rode `npm run assets` (ver docs/ARTE.md). Elas têm prioridade sobre o vetor.
 */
export const ART_REGISTRY: Record<string, ArtDefinition> = {
  shadow,
  'body.base': bodyBase,
  'body.arms': arms,
  'body.hands': hands,
  'face.base': inHead(faceBase),
  ...prefixed('eyes', headDefs(eyes)),
  ...prefixed('brows', headDefs(brows)),
  ...prefixed('mouth', headDefs(mouths)),
  ...prefixed('beard', headDefs(beards)),
  ...prefixed('hair', headDefs(hair)),
  ...prefixed('tunic', tunic),
  ...prefixed('cloak', cloak),
  ...prefixed('feet', feet),
  ...prefixed('bg', background),
  ...prefixed('gear', gear),
  ...prefixed('fallback', fallback),
  // ilustrações finais (geradas a partir de assets/avatars/)
  ...Object.fromEntries(
    Object.entries(IMAGE_LAYERS).flatMap(([source, layers]) =>
      Object.entries(layers).map(([layer, parts]): [string, ImageArt] => [
        imageArtKey(source, layer),
        { kind: 'image', parts: parts ?? [], fallback: VECTOR_MANIFEST[source]?.layers[layer as keyof (typeof VECTOR_MANIFEST)[string]['layers']] },
      ]),
    ),
  ),
};
