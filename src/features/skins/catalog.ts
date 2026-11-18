import season1 from './season1.json';
import { APPEARANCE_OPTIONS, COSMETIC_ITEMS } from '@/features/avatar/domain/catalog';

export type SkinRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'glorious';
export type SkinOrigin = 'inicio' | 'leitura' | 'missao' | 'temporada-gratis' | 'temporada-premium' | 'loja' | 'siclos';
export type SkinStyle = { skinTone: string; hairColor: string; hairStyle: string };
export type Skin = {
  id: string;
  name: string;
  rarity: SkinRarity;
  scriptureRef: string;
  origin: SkinOrigin;
  inShop: boolean;
  styles: SkinStyle[];
  /** prévia provisória (peças do catálogo) até a pintura da skin chegar */
  preview: Partial<Record<'outfit' | 'back' | 'head' | 'neck' | 'chest' | 'hands', string>>;
};

const BY_NAME = new Map(COSMETIC_ITEMS.map((i) => [i.name, i.id]));

/** Temporada 1 (Êxodo). O servidor tem a mesma lista: id, nome, raridade e se vai para a loja. */
export const SKINS: Skin[] = (season1.skins as unknown as (Omit<Skin, "preview"> & { preview: Record<string, string> })[]).map((s) => ({
  ...s,
  preview: Object.fromEntries(Object.entries(s.preview).map(([slot, name]) => [slot, BY_NAME.get(name) ?? name])),
}));
const BY_ID = new Map(SKINS.map((s) => [s.id, s]));
export const getSkin = (id: string | null | undefined) => (id ? BY_ID.get(id) : undefined);

const color = (cat: 'skin_tone' | 'hair_color', id: string) => APPEARANCE_OPTIONS[cat].find((o) => o.id === id)?.color ?? '#888888';

/** Visual de um estilo para os desenhos (cores de pele e de cabelo resolvidas). */
export function styleLook(style: SkinStyle) {
  return { bodyId: 'body-b', skin: color('skin_tone', style.skinTone), hair: color('hair_color', style.hairColor), hairStyle: style.hairStyle };
}
export const skinToneColor = (style: SkinStyle) => color('skin_tone', style.skinTone);
