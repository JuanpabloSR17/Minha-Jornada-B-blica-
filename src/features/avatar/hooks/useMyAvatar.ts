import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { errorMessage } from '@/lib/errors';
import { getMySkins } from '@/features/skins/skins.service';
import { skinLook, type SkinSelection } from '@/features/skins/catalog';
import { getMyAvatar } from '../services/avatar.service';
import type { AvatarState } from '../domain/avatar.types';

/**
 * Carrega o viajante sempre que a tela ganha foco: o avatar da conta vestido com a skin escolhida
 * no Vestiário (rosto da conta; pele, cabelo e traje do estilo da skin).
 */
export function useMyAvatar() {
  const [avatar, setAvatar] = useState<AvatarState | null>(null);
  const [selection, setSelection] = useState<SkinSelection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [base, skins] = await Promise.all([getMyAvatar(), getMySkins().catch(() => null)]);
      setSelection(skins?.selected ?? null);
      setAvatar(base ? { ...base, ...skinLook(base, skins?.selected) } : null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return { avatar, selection, loading, error, reload: load };
}
