import raw from '../catalog/catalog.json';
import { hasArt } from '../art/manifest';
import type {
  AppearanceCategory,
  AppearanceKey,
  AppearanceOption,
  AvatarAppearance,
  CosmeticItem,
  Acquisition,
  Equipment,
  EquipmentSlot,
  ItemSlot,
  LayerSlot,
  Rarity,
  Representation,
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
  variantOf?: string;
  variantLabel?: string;
  acquisition?: string;
  series?: string;
  book?: string;
  representation?: string;
  meaning?: string;
  referent?: string;
  holySubtype?: string;
};

export const CATALOG_VERSION: number = raw.version;

export const APPEARANCE_OPTIONS = raw.appearance as Record<AppearanceCategory, AppearanceOption[]>;

export const EQUIPMENT_SLOTS = raw.slots as EquipmentSlot[];

export const COSMETIC_ITEMS: CosmeticItem[] = (raw.items as RawItem[]).map((it) => ({
  id: it.id,
  name: it.name,
  slot: it.slot as ItemSlot,
  category: it.category,
  description: it.description,
  rarity: (it.rarity ?? 'common') as Rarity,
  scriptureRef: it.scriptureRef,
  hides: it.hides as LayerSlot[] | undefined,
  starter: it.starter !== false,
  premium: it.premium === true,
  unlockLabel: it.unlock?.label,
  variantOf: it.variantOf,
  variantLabel: it.variantLabel,
  acquisition: (it.acquisition ?? (it.starter === false ? 'reading' : 'starter')) as Acquisition,
  series: it.series ?? 'starter',
  book: it.book,
  representation: (it.representation ?? 'inspired') as Representation,
  meaning: it.meaning,
  referent: it.referent,
  holySubtype: it.holySubtype,
}));

export type RarityDef = { id: Rarity; name: string; order: number; color: string; description: string };
export const RARITIES = ((raw as { rarities?: RarityDef[] }).rarities ?? []).slice().sort((a, b) => a.order - b.order);
export const getRarity = (id: Rarity) => RARITIES.find((r) => r.id === id);

/** Item pode ser equipado no avatar (relíquias do Santuário não). */
export const isEquippable = (i: CosmeticItem): i is CosmeticItem & { slot: EquipmentSlot } => i.slot !== 'relic';
export const RELICS = COSMETIC_ITEMS.filter((i) => i.slot === 'relic');

export type CollectionDef = { id: string; name: string; description: string; items: string[]; reward: string };
export const COLLECTIONS = ((raw as { collections?: CollectionDef[] }).collections ?? []);
export const collectionsOf = (itemId: string) => COLLECTIONS.filter((c) => c.items.includes(itemId) || c.reward === itemId);

const ITEMS_BY_ID = new Map(COSMETIC_ITEMS.map((i) => [i.id, i]));

/** Aliases de compatibilidade: ID oficial ou do rascunho → ID canônico (o mesmo do banco). */
export const ID_ALIASES: Readonly<Record<string, string>> = (raw as { idAliases?: Record<string, string> }).idAliases ?? {};
export const resolveItemId = (id: string) => (ITEMS_BY_ID.has(id) ? id : ID_ALIASES[id] ?? id);
/** Equipamento com IDs canônicos (visuais antigos continuam desenhando corretamente). */
export function resolveEquipmentIds(equipment: Equipment): Equipment {
  const out: Equipment = {};
  for (const [slot, id] of Object.entries(equipment) as [EquipmentSlot, string | undefined][]) {
    if (!id) continue;
    const canonical = getItem(id);
    // só IDs antigos (aliases) mudam de slot: o item vai para o slot oficial (sem sobrescrever).
    // Um ID canônico no slot errado continua onde está e é recusado pela validação.
    const moved = canonical && canonical.id !== id && canonical.slot !== 'relic';
    const target = moved ? (canonical.slot as EquipmentSlot) : slot;
    if (!out[target] || target === slot) out[target] = canonical?.id ?? id;
  }
  return out;
}

/** Itens santos (Santuário): relíquias de exposição e obras/sinais simbólicos. */
export const HOLY_ITEMS = COSMETIC_ITEMS.filter((i) => i.rarity === 'holy');

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
  return id ? ITEMS_BY_ID.get(id) ?? ITEMS_BY_ID.get(ID_ALIASES[id] ?? '') : undefined;
}

export function getOption(category: AppearanceCategory, id: string): AppearanceOption | undefined {
  return APPEARANCE_OPTIONS[category].find((o) => o.id === id);
}

export function itemsForSlot(slot: ItemSlot, filter: (i: CosmeticItem) => boolean = () => true) {
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
