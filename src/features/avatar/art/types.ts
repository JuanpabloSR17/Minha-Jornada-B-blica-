import type { ReactElement } from 'react';
import type { ImageSourcePropType } from 'react-native';
import type { ArmPose, BodyGeometry } from './geometry';

export type ArtContext = {
  g: BodyGeometry;
  bodyId: string;
  skin: string;
  hair: string;
  /** estilo de cabelo do jogador (coberturas de cabeça ajustam o cabelo visível) */
  hairStyle?: string;
  /** pose dos braços (o cajado dobra o braço direito) */
  armPose?: ArmPose;
  params: Record<string, string | number | boolean>;
  /** prefixo único por instância, para ids de gradientes não colidirem */
  uid: string;
};

export type VectorArt = (ctx: ArtContext) => ReactElement | null;

/** Uma imagem de uma camada: mapa por corpo ('body-a' | 'body-b' | 'body-c' | 'all'). */
export type ImagePart = {
  sources: Partial<Record<string, ImageSourcePropType>>;
  /** máscara colorizável: a imagem é tingida com a cor da pele ou do cabelo */
  tint?: 'skin' | 'hair';
  /** variante de pose (ex.: braço direito segurando o cajado); ausente = pose de repouso */
  pose?: ArmPose;
};

/** Arte final em PNG/WebP transparente, alinhada ao canvas 1024×1536. */
export type ImageArt = {
  kind: 'image';
  /** desenhadas em ordem: máscara → base → sombreamento */
  parts: ImagePart[];
  /** arte vetorial provisória da mesma camada, usada se faltar a versão do corpo */
  fallback?: string;
};

/** Registro gerado por scripts/avatar-assets.mjs: origem → camada → partes. */
export type ImageLayerMap = Record<string, Partial<Record<string, ImagePart[]>>>;

export type ArtDefinition = VectorArt | ImageArt;

export const p = (ctx: ArtContext, key: string, fallback: string) => {
  const v = ctx.params[key];
  return typeof v === 'string' ? v : fallback;
};
