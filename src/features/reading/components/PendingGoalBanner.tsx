import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText, Button, Card } from '@/ui';
import { fmt, strings } from '@/i18n';
import { getDailyGoalStatus, type DailyGoalStatus } from '../mission/mission.service';

/** Aviso de recompensa da meta esperando escolha + situação da recompensa diária de hoje. */
export function PendingGoalBanner({ showToday = false }: { showToday?: boolean }) {
  const { colors } = useTheme();
  const router = useRouter();
  const [status, setStatus] = useState<DailyGoalStatus | null>(null);
  useFocusEffect(
    useCallback(() => {
      getDailyGoalStatus().then(setStatus, () => setStatus(null));
    }, []),
  );
  if (!status) return null;
  return (
    <>
      {status.pending.length ? (
        <Card style={{ borderColor: colors.primary }}>
          <AppText variant="heading">{strings.mission.goalPendingCard}</AppText>
          <Button title={strings.mission.goalPendingOpen} onPress={() => router.push('/reading/goal')} />
        </Card>
      ) : null}
      {showToday ? (
        <AppText variant="caption" muted>
          {status.achievedToday ? strings.home.dailyDone : fmt(strings.home.dailyTodo, { siclos: status.siclosPerGoal })} · {fmt(strings.mission.goalBalance, { balance: status.siclosBalance })}
        </AppText>
      ) : null}
    </>
  );
}
