import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireSupabase } from '@/lib/supabase/client';
import { throwIfError } from '@/lib/errors';
import { DEFAULT_SELECTION, type SkinSelection } from './catalog';

export type ReadingRule = { skinId: string; label: string; done: number; total: number };
export type MySkins = {
  selected: SkinSelection;
  owned: { skinId: string; acquiredAt: string | null; source?: string }[];
  /** skins conquistadas lendo: regra do servidor e progresso da conta */
  reading: ReadingRule[];
};

const rpc = async (fn: string, args?: Record<string, unknown>) => throwIfError(await requireSupabase().rpc(fn, args));

/** Skins do jogador (as iniciais contam) e a vestida, conferidas no servidor. */
export async function getMySkins(): Promise<MySkins> {
  const raw = (await rpc('get_my_skins')) as Partial<MySkins> | null;
  return { selected: raw?.selected ?? DEFAULT_SELECTION, owned: raw?.owned ?? [], reading: raw?.reading ?? [] };
}

/** Veste uma skin que o jogador tem, num dos 3 estilos. */
export async function equipSkin(skinId: string, style: number, variant: 'padrao' | 'feminino' = 'padrao'): Promise<SkinSelection> {
  return (await rpc('equip_skin', { p_skin: skinId, p_style: style, p_variant: variant })) as SkinSelection;
}

/** Skins conquistadas lendo que ainda não foram comemoradas neste aparelho. */
export const seenReadingSkins = {
  key: (uid: string) => `jb.skins.seen.${uid}`,
  async get(uid: string): Promise<Set<string>> {
    try {
      const raw = await AsyncStorage.getItem(this.key(uid));
      return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      return new Set();
    }
  },
  async add(uid: string, ids: string[]) {
    try {
      const seen = await this.get(uid);
      ids.forEach((id) => seen.add(id));
      await AsyncStorage.setItem(this.key(uid), JSON.stringify([...seen]));
    } catch {
      /* sem armazenamento local: a comemoração pode aparecer de novo, sem prejuízo */
    }
  },
};
