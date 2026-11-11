import { useCallback, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText, Button, Card, Notice, Screen } from '@/ui';
import { fmt, strings } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { StepHeader } from '@/features/avatar/components/StepHeader';
import { GoalChoice } from '../components/GoalChoice';
import { getDailyGoalStatus, type DailyGoalStatus } from '../mission/mission.service';
import { refLabel } from './MissionHomeScreen';

const dayLabel = (iso: string) => iso.split('-').reverse().join('/');

/** Escolhas pendentes da meta diária (ficam no servidor: voltam ao reabrir o app ou em outro aparelho). */
export function GoalChoiceScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [status, setStatus] = useState<DailyGoalStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    getDailyGoalStatus().then((s) => { setStatus(s); setError(null); }, (e) => setError(errorMessage(e)));
  }, []);
  useFocusEffect(load);

  return (
    <Screen>
      <StepHeader title={strings.mission.goalTitle} onBack={() => router.back()} />
      {error ? <Notice tone="error">{error}</Notice> : null}
      {error ? <Button title={strings.common.retry} onPress={load} /> : null}
      {!status && !error ? <ActivityIndicator color={colors.primary} /> : null}
      {status ? <AppText variant="label">{fmt(strings.mission.goalBalance, { balance: status.siclosBalance })}</AppText> : null}
      {status && status.pending.length === 0 ? <Notice tone="info">{strings.mission.goalNone}</Notice> : null}
      {status?.pending.map((g) => (
        <Card key={g.day}>
          <AppText variant="caption" muted>{fmt(strings.mission.goalPendingDay, { day: dayLabel(g.day) })} · {refLabel(g.book, g.chapter)}</AppText>
          <GoalChoice goal={g} />
        </Card>
      ))}
      <Button variant="secondary" title={strings.mission.backToMissions} onPress={() => router.replace('/(tabs)/read')} />
    </Screen>
  );
}
