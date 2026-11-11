import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@/features/auth/AuthProvider';
import { errorCode, errorMessage } from '@/lib/errors';
import { missionStorage } from './storage';
import { completeMission, type MissionResult } from './mission.service';
import { freezeForFinish, markPending, type MissionSession } from './session';

/**
 * Sessão de missão do usuário logado, sempre persistida no aparelho antes de mudar na tela.
 * Recarrega ao voltar ao primeiro plano (o tempo é recalculado pelas marcas de tempo).
 */
export function useMissionSession() {
  const { userId } = useAuth();
  const [session, setSession] = useState<MissionSession | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(Date.now());
  const busy = useRef(false);

  const reload = useCallback(async () => {
    if (!userId) return;
    setSession(await missionStorage.load(userId));
    setNow(Date.now());
    setLoaded(true);
  }, [userId]);

  useEffect(() => {
    void reload();
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') void reload();
    });
    return () => sub.remove();
  }, [reload]);

  // relógio da tela (o valor real vem das marcas de tempo, não deste intervalo)
  useEffect(() => {
    if (session?.status !== 'running') return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [session?.status]);

  /** Persiste antes de mostrar: se o app fechar logo depois, a sessão volta igual. */
  const commit = useCallback(async (next: MissionSession | null) => {
    if (!userId) return;
    if (next) await missionStorage.save(next);
    else await missionStorage.clear(userId);
    setSession(next);
    setNow(Date.now());
  }, [userId]);

  /** Finaliza no servidor. Em falha a sessão fica pendente, com o mesmo ID, para nova tentativa. */
  const finish = useCallback(async (s: MissionSession): Promise<{ ok: true; result: MissionResult } | { ok: false; error: string; code: string }> => {
    if (busy.current) return { ok: false, error: '', code: 'busy' };
    busy.current = true;
    const frozen = freezeForFinish(s);
    try {
      await commit(frozen);
      const result = await completeMission(frozen);
      await missionStorage.saveResult(frozen.userId, result);
      await commit(null);
      return { ok: true, result };
    } catch (e) {
      const code = errorCode(e);
      const msg = code === 'offline' ? '' : errorMessage(e);
      await commit(markPending(frozen, msg)).catch(() => setSession(markPending(frozen, msg)));
      return { ok: false, error: msg, code };
    } finally {
      busy.current = false;
    }
  }, [commit]);

  return { userId, session, loaded, now, commit, finish, reload };
}
