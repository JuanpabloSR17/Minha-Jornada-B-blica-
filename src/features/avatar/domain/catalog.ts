import raw from '../catalog/catalog.json';
import { hasArt } from '../art/manifest';
import type {
  AppearanceCategory,
  AppearanceKey,
  AppearanceOption,
  AvatarAppearance,
  CosmeticItem,
  Equipment,
  EquipmentSlot,
  LayerSlot,
  Rarity,
} from './avatar.types';

type RawItem = {
  id: string;
  name: string;
  slot: string;
  category: string;
  description: string;
  rarity?: string;
  scriptureRef?: string;
  hides?: string[];
  starter?: boolean;
  premium?: boolean;
  unlock?: { type: string; label?: string };
};

export const CATALOG_VERSION: number = raw.version;

export const APPEARANCE_OPTIONS = raw.appearance as Record<AppearanceCategory, AppearanceOption[]>;

export const EQUIPMENT_SLOTS = raw.slots as EquipmentSlot[];

export const COSMETIC_ITEMS: CosmeticItem[] = (raw.items as RawItem[]).map((it) => ({
  id: it.id,
  name: it.name,
  slot: it.slot as EquipmentSlot,
  category: it.category,
  description: it.description,
  rarity: (it.rarity ?? 'common') as Rarity,
  scriptureRef: it.scriptureRef,
  hides: it.hides as LayerSlot[] | undefined,
  starter: it.starter !== false,
  premium: it.premium === true,
  unlockLabel: it.unlock?.label,
}));

const ITEMS_BY_ID = new Map(COSMETIC_ITEMS.map((i) => [i.id, i]));

export const DEFAULT_APPEARANCE = raw.defaults.appearance as AvatarAppearance;
export const DEFAULT_EQUIPMENT = raw.defaults.equipment as Equipment;
export const REQUIRED_SLOTS = raw.requiredSlots as EquipmentSlot[];

/** Mapeia cada campo da aparência para sua categoria no catálogo. */
export const APPEARANCE_KEY_CATEGORY: Record<AppearanceKey, AppearanceCategory> = {
  bodyId: 'body',
  skinToneId: 'skin_tone',
  eyesId: 'eyes',
  browsId: 'brows',
  expressionId: 'expression',
  beardId: 'beard',
  hairStyleId: 'hair_style',
  hairColorId: 'hair_color',
};

export function getItem(id: string | undefined | null): CosmeticItem | undefined {
  return id ? ITEMS_BY_ID.get(id) : undefined;
}

export function getOption(category: AppearanceCategory, id: string): AppearanceOption | undefined {
  return APPEARANCE_OPTIONS[category].find((o) => o.id === id);
}

export function itemsForSlot(slot: EquipmentSlot, filter: (i: CosmeticItem) => boolean = () => true) {
  return COSMETIC_ITEMS.filter((i) => i.slot === slot && filter(i));
}

/** Itens gratuitos iniciais (disponíveis na criação do personagem). */
export const isStarterFree = (i: CosmeticItem) => i.starter && !i.premium;

const APPEARANCE_ART_PREFIX: Partial<Record<AppearanceCategory, string>> = {
  body: 'body',
  eyes: 'eyes',
  brows: 'brows',
  expression: 'expression',
  beard: 'beard',
  hair_style: 'hair',
};

/** A opção de aparência tem arte na versão atual (cores sempre têm). */
export function appearanceHasArt(category: AppearanceCategory, id: string): boolean {
  const prefix = APPEARANCE_ART_PREFIX[category];
  return prefix ? hasArt(`${prefix}/${id}`) : true;
}

export const itemHasArt = (i: CosmeticItem) => hasArt(`${i.slot}/${i.id}`);

export type LookPreset = { id: string; name: string; look: { appearance: AvatarAppearance; equipment: Equipment } };
export const LOOK_PRESETS = (raw as { presets?: LookPreset[] }).presets ?? [];
