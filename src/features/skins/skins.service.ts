import { requireSupabase } from '@/lib/supabase/client';
import { throwIfError } from '@/lib/errors';
import { DEFAULT_SELECTION, type SkinSelection } from './catalog';

export type MySkins = { selected: SkinSelection; owned: { skinId: string; acquiredAt: string | null }[] };

const rpc = async (fn: string, args?: Record<string, unknown>) => throwIfError(await requireSupabase().rpc(fn, args));

/** Skins do jogador (as iniciais contam) e a vestida, conferidas no servidor. */
export async function getMySkins(): Promise<MySkins> {
  const raw = (await rpc('get_my_skins')) as Partial<MySkins> | null;
  return { selected: raw?.selected ?? DEFAULT_SELECTION, owned: raw?.owned ?? [] };
}

/** Veste uma skin que o jogador tem, num dos 3 estilos. */
export async function equipSkin(skinId: string, style: number): Promise<SkinSelection> {
  return (await rpc('equip_skin', { p_skin: skinId, p_style: style })) as SkinSelection;
}
