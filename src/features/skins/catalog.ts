import season1 from './season1.json';
import { APPEARANCE_OPTIONS, COSMETIC_ITEMS, getItem } from '@/features/avatar/domain/catalog';
import { defaultLook } from '@/features/avatar/domain/avatar.rules';
import type { AvatarLook, Equipment, EquipmentSlot } from '@/features/avatar/domain/avatar.types';
import { SKIN_ART, type SkinVariant } from './art.generated';
export type { SkinVariant } from './art.generated';

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

export type SkinSelection = { skinId: string; style: number; variant?: SkinVariant };
export const DEFAULT_SELECTION: SkinSelection = { skinId: 'comum_peregrino_exodo', style: 1, variant: 'padrao' };

/** Apresentações pintadas da skin (a padrão sempre existe; a feminina, quando entregue). */
export const variantsOf = (id: string): SkinVariant[] => {
  const art = SKIN_ART[id];
  return art?.feminino ? ['padrao', 'feminino'] : ['padrao'];
};
/** Nome da skin na apresentação escolhida (ex.: "Peregrina do Êxodo"). */
export const skinDisplayName = (skin: Skin, variant?: SkinVariant) => (variant && SKIN_ART[skin.id]?.[variant]?.name) || skin.name;
/** Pintura do corpo inteiro (1024×1536) do estilo, se já entregue. */
export const paintedBody = (id: string, style: number, variant: SkinVariant = 'padrao') =>
  (SKIN_ART[id]?.[variant] ?? SKIN_ART[id]?.padrao)?.styles[Math.min(Math.max(style - 1, 0), 2)];
/** Miniatura pintada (256×256) da apresentação, se já entregue. */
export const paintedIcon = (id: string, variant: SkinVariant = 'padrao') => (SKIN_ART[id]?.[variant] ?? SKIN_ART[id]?.padrao)?.icon;

/**
 * Viajante vestido com a skin: o estilo escolhido decide pele e cabelo, e a prévia da skin decide
 * o traje (até a pintura própria da skin chegar). Rosto e expressão continuam os da conta.
 */
export function skinLook(base: AvatarLook | null | undefined, sel: SkinSelection | null | undefined): AvatarLook {
  const look = base ?? defaultLook();
  const skin = getSkin(sel?.skinId) ?? getSkin(DEFAULT_SELECTION.skinId)!;
  const style = skin.styles[Math.min(Math.max((sel?.style ?? 1) - 1, 0), skin.styles.length - 1)]!;
  const equipment: Equipment = {};
  for (const [slot, id] of Object.entries(skin.preview)) if (id && getItem(id)) equipment[slot as EquipmentSlot] = id;
  const n = Math.min(Math.max(sel?.style ?? 1, 1), 3);
  const variant = sel?.variant && variantsOf(skin.id).includes(sel.variant) ? sel.variant : 'padrao';
  const painted = paintedBody(skin.id, n, variant);
  return {
    appearance: { ...look.appearance, bodyId: 'body-b', skinToneId: style.skinTone, hairColorId: style.hairColor, hairStyleId: style.hairStyle },
    equipment,
    ...(painted ? { painted } : {}),
    label: `${skinDisplayName(skin, variant)}, estilo ${n}`,
  };
}

export const RARITY_ORDER: SkinRarity[] = ['glorious', 'legendary', 'epic', 'rare', 'common'];

export const SKIN_RARITY_COLOR: Record<SkinRarity, string> = {
  common: '#B9B2A4', rare: '#5FA8FF', epic: '#B48CFF', legendary: '#F2A93B', glorious: '#FFE7A3',
};
export const SKIN_RARITY_LABEL: Record<SkinRarity, string> = {
  common: 'Comum', rare: 'Rara', epic: 'Épica', legendary: 'Lendária', glorious: 'Gloriosa',
};
const ORIGIN_LABEL: Record<SkinOrigin, string> = {
  inicio: 'Skin inicial de todo viajante',
  leitura: 'Conquistada lendo',
  missao: 'Conquistada numa missão especial',
  'temporada-gratis': 'Temporada de Êxodo, faixa grátis',
  'temporada-premium': 'Temporada de Êxodo, faixa Jornada+ (lendo)',
  loja: 'Aparece no Mercado dos Viajantes',
  siclos: 'Aparece no Mercado dos Viajantes',
};
/** Como conseguir a skin, em uma frase para o jogador. */
export const howToGet = (skin: Skin) => (skin.inShop ? ORIGIN_LABEL.loja : ORIGIN_LABEL[skin.origin]);
