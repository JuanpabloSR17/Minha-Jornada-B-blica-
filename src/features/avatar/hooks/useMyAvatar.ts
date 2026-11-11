import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { errorMessage } from '@/lib/errors';
import { getMyAvatar } from '../services/avatar.service';
import type { AvatarState } from '../domain/avatar.types';

/** Carrega o avatar salvo sempre que a tela ganha foco (reflete edições recentes). */
export function useMyAvatar() {
  const [avatar, setAvatar] = useState<AvatarState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setAvatar(await getMyAvatar());
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

  return { avatar, loading, error, reload: load };
}
