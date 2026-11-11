import { requireSupabase, AppError } from '@/lib/supabase/client';
import { throwIfError } from '@/lib/errors';
import { normalizeLook, sanitizeEquipment, validateLook } from '../domain/avatar.rules';
import type { AvatarLook, AvatarState } from '../domain/avatar.types';

type RawState = {
  appearance: AvatarState['appearance'] | null;
  equipment: Record<string, string> | null;
  version: number | null;
  loadoutId: string | null;
  updatedAt: string | null;
};

function toState(raw: RawState): AvatarState | null {
  if (!raw?.appearance) return null;
  const look = normalizeLook({ appearance: raw.appearance, equipment: raw.equipment ?? {} });
  return { ...look, version: raw.version ?? 1, loadoutId: raw.loadoutId, updatedAt: raw.updatedAt };
}

/** Avatar salvo na conta (null se ainda não criado). */
export async function getMyAvatar(): Promise<AvatarState | null> {
  const res = await requireSupabase().rpc('get_my_avatar');
  return toState(throwIfError(res) as RawState);
}

/** IDs dos itens que o usuário possui (lidos via RLS: só os próprios). */
export async function getMyInventoryIds(): Promise<Set<string>> {
  const res = await requireSupabase().from('user_items').select('item_id');
  const rows = throwIfError(res) as { item_id: string }[];
  return new Set(rows.map((r) => r.item_id));
}

/**
 * Salva aparência + equipamento. O servidor valida opções, posse e slots
 * e concede os itens iniciais. expectedVersion protege contra edição simultânea.
 */
export async function saveAvatar(look: AvatarLook, expectedVersion: number | null): Promise<AvatarState> {
  const equipment = sanitizeEquipment(look.equipment);
  const issues = validateLook({ appearance: look.appearance, equipment });
  if (issues.length) throw new AppError(issues[0]!.kind === 'missing_required' ? 'outfit_required' : 'invalid_appearance');
  const res = await requireSupabase().rpc('save_avatar', {
    p_appearance: look.appearance,
    p_equipment: equipment,
    p_expected_version: expectedVersion,
  });
  const state = toState(throwIfError(res) as RawState);
  if (!state) throw new AppError('generic');
  return state;
}
