import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { errorMessage } from '@/lib/errors';
import { resolveItemId } from '@/features/avatar/domain/catalog';
import { getWardrobe } from '@/features/avatar/services/wardrobe.service';
import { getMissionOverview } from './mission/mission.service';
import { milestoneRows, type MilestoneRow } from './milestones';

/** Marcos do catálogo + registro de conclusão (servidor) + posse do jogador; recarrega ao focar a tela. */
export function useMilestones() {
  const [rows, setRows] = useState<MilestoneRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    Promise.all([getMissionOverview(), getWardrobe()]).then(([o, w]) => {
      const done = new Set(o.missions.filter((m) => m.kind === 'milestone' && m.completed).map((m) => m.id));
      setRows(milestoneRows(done, new Set(w.owned.map((x) => resolveItemId(x.itemId)))));
      setError(null);
    }, (e) => setError(errorMessage(e)));
  }, []);
  useFocusEffect(load);
  return { rows, error, reload: load };
}
