import { APPEARANCE_OPTIONS, COSMETIC_ITEMS, appearanceHasArt, getItem } from './catalog';
import { artStatus, type ArtStatus } from '../art/manifest';
import { looksEqual, setEquipped } from './avatar.rules';
import type { AvatarAppearance, AvatarLook, CosmeticItem, Equipment, EquipmentSlot, Rarity } from './avatar.types';
import type { WardrobeState } from '../services/wardrobe.service';

export type InventoryCategory = {
  id: string;
  label: string;
  /** slot de equipamento (ou 'hair' para estilos de cabelo da aparência) */
  slot: EquipmentSlot | 'hair' | 'special';
};

/** Categorias do inventário (spec Marco 2). */
export const INVENTORY_CATEGORIES: InventoryCategory[] = [
  { id: 'outfit', label: 'Túnicas', slot: 'outfit' },
  { id: 'back', label: 'Mantos', slot: 'back' },
  { id: 'feet', label: 'Calçados', slot: 'feet' },
  { id: 'hair', label: 'Cabelos', slot: 'hair' },
  { id: 'head', label: 'Cabeça e pescoço', slot: 'head' },
  { id: 'hands', label: 'Itens de mão', slot: 'hands' },
  { id: 'waist', label: 'Cintura', slot: 'waist' },
  { id: 'special', label: 'Especiais', slot: 'special' },
  { id: 'background', label: 'Fundos', slot: 'background' },
  { id: 'frame', label: 'Molduras', slot: 'frame' },
];

export type ItemFilter = 'all' | 'owned' | 'equipped';

const RARITY_ORDER: Record<Rarity, number> = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };

/** Item especial: ligado a uma passagem bíblica ou conquistado (não inicial). */
export const isSpecial = (i: CosmeticItem) => !i.starter || !!i.scriptureRef;

export type ItemView = {
  item: CosmeticItem;
  owned: boolean;
  equipped: boolean;
  locked: boolean;
  art: ArtStatus;
};

export function itemView(item: CosmeticItem, owned: ReadonlySet<string>, equipment: Equipment, bodyId?: string): ItemView {
  const has = owned.has(item.id) || (item.starter && !item.premium);
  return {
    item,
    owned: has,
    equipped: equipment[item.slot] === item.id,
    locked: !has,
    art: artStatus(`${item.slot}/${item.id}`, bodyId),
  };
}

/** Lista filtrada e ordenada (obtidos primeiro, depois raridade e nome). Escala para centenas de itens. */
export function listItems(
  categoryId: string,
  opts: { owned: ReadonlySet<string>; equipment: Equipment; filter?: ItemFilter; search?: string; bodyId?: string },
): ItemView[] {
  const cat = INVENTORY_CATEGORIES.find((c) => c.id === categoryId);
  if (!cat || cat.slot === 'hair') return [];
  const q = (opts.search ?? '').trim().toLocaleLowerCase('pt-BR');
  const matches = (i: CosmeticItem) => (cat.slot === 'special' ? isSpecial(i) : cat.slot === 'head' ? i.slot === 'head' || i.slot === 'neck' : i.slot === cat.slot);
  return COSMETIC_ITEMS.filter((i) => matches(i) && !i.premium)
    .map((i) => itemView(i, opts.owned, opts.equipment, opts.bodyId))
    .filter((v) => (opts.filter === 'owned' ? v.owned : opts.filter === 'equipped' ? v.equipped : true))
    .filter((v) => !q || v.item.name.toLocaleLowerCase('pt-BR').includes(q) || (v.item.scriptureRef ?? '').toLocaleLowerCase('pt-BR').includes(q))
    .sort((a, b) => Number(b.owned) - Number(a.owned) || RARITY_ORDER[a.item.rarity] - RARITY_ORDER[b.item.rarity] || a.item.name.localeCompare(b.item.name, 'pt-BR'));
}

export const hairOptions = () => APPEARANCE_OPTIONS.hair_style.filter((o) => appearanceHasArt('hair_style', o.id));

/** Variantes evolutivas de um item (base + aparências derivadas). */
export function variantFamily(itemId: string): CosmeticItem[] {
  const item = getItem(itemId);
  if (!item) return [];
  const baseId = item.variantOf ?? item.id;
  const base = getItem(baseId);
  return [base, ...COSMETIC_ITEMS.filter((i) => i.variantOf === baseId)].filter((i): i is CosmeticItem => !!i);
}

// ---------------------------------------------------------------- estado de edição

export type WardrobeDraftState = {
  saved: WardrobeState | null;
  loadoutId: string | null;
  draft: AvatarLook | null;
  status: 'idle' | 'saving' | 'saved' | 'error';
  error: string | null;
};

export type WardrobeAction =
  | { type: 'hydrate'; state: WardrobeState; loadoutId?: string | null }
  | { type: 'selectLoadout'; loadoutId: string }
  | { type: 'equip'; slot: EquipmentSlot; itemId: string | null }
  | { type: 'setHair'; hairStyleId: string }
  | { type: 'discard' }
  | { type: 'saveStart' }
  | { type: 'saveSuccess'; state: WardrobeState }
  | { type: 'saveError'; error: string };

export const initialWardrobe: WardrobeDraftState = { saved: null, loadoutId: null, draft: null, status: 'idle', error: null };

export function lookOf(state: WardrobeState, loadoutId: string | null): AvatarLook | null {
  const l = state.loadouts.find((x) => x.id === loadoutId) ?? state.loadouts.find((x) => x.isActive);
  return l ? { appearance: state.appearance, equipment: l.equipment } : null;
}

export function wardrobeReducer(s: WardrobeDraftState, a: WardrobeAction): WardrobeDraftState {
  switch (a.type) {
    case 'hydrate': {
      const wanted = a.loadoutId ?? s.loadoutId;
      const loadoutId = a.state.loadouts.some((l) => l.id === wanted) ? wanted : a.state.activeLoadoutId;
      return { saved: a.state, loadoutId, draft: lookOf(a.state, loadoutId), status: 'idle', error: null };
    }
    case 'selectLoadout':
      return s.saved ? { ...s, loadoutId: a.loadoutId, draft: lookOf(s.saved, a.loadoutId), status: 'idle', error: null } : s;
    case 'equip':
      return s.draft ? { ...s, draft: { ...s.draft, equipment: setEquipped(s.draft.equipment, a.slot, a.itemId) }, error: null } : s;
    case 'setHair':
      return s.draft ? { ...s, draft: { ...s.draft, appearance: { ...s.draft.appearance, hairStyleId: a.hairStyleId } }, error: null } : s;
    case 'discard':
      return s.saved ? { ...s, draft: lookOf(s.saved, s.loadoutId), status: 'idle', error: null } : s;
    case 'saveStart':
      return { ...s, status: 'saving', error: null };
    case 'saveSuccess':
      return { saved: a.state, loadoutId: s.loadoutId, draft: lookOf(a.state, s.loadoutId), status: 'saved', error: null };
    case 'saveError':
      return { ...s, status: 'error', error: a.error };
    default:
      return s;
  }
}

export function wardrobeDirty(s: WardrobeDraftState): boolean {
  if (!s.saved || !s.draft) return false;
  const saved = lookOf(s.saved, s.loadoutId);
  return !!saved && !looksEqual(saved, s.draft);
}

export function appearanceChanged(s: WardrobeDraftState): Partial<AvatarAppearance> | null {
  if (!s.saved || !s.draft) return null;
  return s.draft.appearance.hairStyleId !== s.saved.appearance.hairStyleId ? { hairStyleId: s.draft.appearance.hairStyleId } : null;
}

/** Itens equipados no rascunho que o usuário ainda não possui (prévia de bloqueados). */
export function lockedInDraft(s: WardrobeDraftState): string[] {
  if (!s.draft || !s.saved) return [];
  const owned = new Set(s.saved.owned.map((o) => o.itemId));
  return Object.values(s.draft.equipment).filter((id): id is string => {
    if (!id) return false;
    const it = getItem(id);
    return !!it && !owned.has(id) && !(it.starter && !it.premium);
  });
}
