import { requireSupabase } from '@/lib/supabase/client';
import { throwIfError } from '@/lib/errors';
import { normalizeLook, sanitizeEquipment } from '../domain/avatar.rules';
import type { AvatarAppearance, Equipment } from '../domain/avatar.types';

export type LoadoutInfo = {
  id: string;
  name: string;
  isActive: boolean;
  version: number;
  position: number;
  /** além do limite do plano: só leitura (nunca apagado) */
  locked: boolean;
  updatedAt: string | null;
  equipment: Equipment;
};

export type Plan = { tier: 'free' | 'premium'; loadoutLimit: number; status: string };

export type WardrobeState = {
  appearance: AvatarAppearance;
  appearanceVersion: number;
  activeLoadoutId: string;
  plan: Plan;
  loadouts: LoadoutInfo[];
  owned: { itemId: string; unlockedAt: string; source: string }[];
};

type Raw = Omit<WardrobeState, 'appearance' | 'loadouts'> & {
  appearance: AvatarAppearance | null;
  loadouts: (Omit<LoadoutInfo, 'equipment'> & { equipment: Record<string, string> })[];
};

export function parseWardrobe(raw: Raw): WardrobeState {
  const appearance = normalizeLook({ appearance: raw.appearance ?? undefined, equipment: {} }).appearance;
  return {
    ...raw,
    appearance,
    appearanceVersion: raw.appearanceVersion ?? 1,
    loadouts: raw.loadouts.map((l) => ({ ...l, equipment: sanitizeEquipment(l.equipment as Equipment) })),
    owned: raw.owned ?? [],
  };
}

const rpc = async (fn: string, args?: Record<string, unknown>) => throwIfError(await requireSupabase().rpc(fn, args));
const wardrobe = async (fn: string, args?: Record<string, unknown>) => parseWardrobe((await rpc(fn, args)) as Raw);

export const getWardrobe = () => wardrobe('get_wardrobe');

/** Salva o visual (e o cabelo/aparência, se mudou) numa única operação no servidor. */
export const saveWardrobe = (input: {
  loadoutId: string;
  equipment: Equipment;
  expectedVersion: number;
  appearance?: Partial<AvatarAppearance> | null;
  expectedAppearanceVersion?: number | null;
}) =>
  wardrobe('save_wardrobe', {
    p_loadout_id: input.loadoutId,
    p_equipment: sanitizeEquipment(input.equipment),
    p_expected_loadout_version: input.expectedVersion,
    p_appearance: input.appearance ?? null,
    p_expected_appearance_version: input.expectedAppearanceVersion ?? null,
  });

export const equipItem = (loadoutId: string, itemId: string, expectedVersion?: number) =>
  wardrobe('equip_item', { p_loadout_id: loadoutId, p_item_id: itemId, p_expected_version: expectedVersion ?? null });
export const unequipSlot = (loadoutId: string, slot: string, expectedVersion?: number) =>
  wardrobe('unequip_slot', { p_loadout_id: loadoutId, p_slot: slot, p_expected_version: expectedVersion ?? null });
export const createLoadout = (name: string, copyFrom?: string) => wardrobe('create_loadout', { p_name: name, p_copy_from: copyFrom ?? null });
export const renameLoadout = (id: string, name: string) => wardrobe('rename_loadout', { p_loadout_id: id, p_name: name });
export const activateLoadout = (id: string) => wardrobe('activate_loadout', { p_loadout_id: id });
export const deleteLoadout = (id: string) => wardrobe('delete_loadout', { p_loadout_id: id });

export type CollectionProgress = {
  id: string;
  name: string;
  description: string | null;
  items: { itemId: string; owned: boolean }[];
  rewardItemId: string | null;
  rewardOwned: boolean;
  completed: boolean;
};
export const getCollections = async () => (await rpc('get_collections')) as CollectionProgress[];

export type PublicAvatar =
  | null
  | { username: string; visible: false }
  | { username: string; visible: true; displayName: string; isSelf: boolean; appearance: AvatarAppearance; equipment: Equipment };

export async function getPublicAvatar(username: string): Promise<PublicAvatar> {
  const raw = (await rpc('get_public_avatar', { p_username: username })) as PublicAvatar;
  if (raw && raw.visible) {
    const look = normalizeLook({ appearance: raw.appearance, equipment: raw.equipment });
    return { ...raw, ...look };
  }
  return raw;
}

export const setPrivacyMode = (mode: 'private' | 'friends' | 'public') => rpc('set_privacy_mode', { p_mode: mode });
