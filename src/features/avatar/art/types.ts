import type { ReactElement } from 'react';
import type { ImageSourcePropType } from 'react-native';
import type { BodyGeometry } from './geometry';

export type ArtContext = {
  g: BodyGeometry;
  bodyId: string;
  skin: string;
  hair: string;
  params: Record<string, string | number | boolean>;
  /** prefixo único por instância, para ids de gradientes não colidirem */
  uid: string;
};

export type VectorArt = (ctx: ArtContext) => ReactElement | null;

/** Arte final em PNG/WebP transparente alinhada ao canvas 720×1080. */
export type ImageArt = {
  kind: 'image';
  source: ImageSourcePropType | Partial<Record<string, ImageSourcePropType>>;
  perBody?: boolean;
};

export type ArtDefinition = VectorArt | ImageArt;

export const p = (ctx: ArtContext, key: string, fallback: string) => {
  const v = ctx.params[key];
  return typeof v === 'string' ? v : fallback;
};
