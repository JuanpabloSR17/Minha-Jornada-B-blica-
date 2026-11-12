import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText, Button, Card, ConfirmDialog, Notice, Screen } from '@/ui';
import { fmt, strings } from '@/i18n';
import { StepHeader } from '@/features/avatar/components/StepHeader';
import { activeMs, formatClock, pauseMission, resumeMission } from '../mission/session';
import { useMissionSession } from '../mission/useMissionSession';
import { refLabel } from './MissionHomeScreen';
import { RARITY_COLOR } from '@/features/avatar/components/RarityBadge';
import { getCatalogMission } from '@/features/avatar/domain/catalog';

/** Missão em andamento: capítulo, cronômetro (só tempo ativo), pausar/retomar e finalizar. */
export function ActiveMissionScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { session, loaded, now, commit, finish } = useMissionSession();
  const [confirm, setConfirm] = useState<'finish' | 'abandon' | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loaded) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }
  if (!session) {
    return (
      <Screen>
        <StepHeader title={strings.mission.title} onBack={() => router.replace('/(tabs)/read')} />
        <Notice tone="info">{strings.mission.noResult}</Notice>
        <Button title={strings.mission.backToMissions} onPress={() => router.replace('/(tabs)/read')} />
      </Screen>
    );
  }

  const ref = refLabel(session.book, session.chapter);
  const clock = formatClock(activeMs(session, now));
  const pending = session.status === 'pending';
  const finishing = sending || session.status === 'finishing';

  const doFinish = async () => {
    setConfirm(null);
    setSending(true);
    setError(null);
    const r = await finish(session);
    setSending(false);
    if (r.ok) router.replace('/reading/completed');
    // sem conexão: o aviso de finalização pendente já explica o que fazer
    else if (r.code !== 'busy' && r.code !== 'offline') setError(r.error);
  };

  const statusLabel = finishing ? strings.mission.finishing : pending ? strings.mission.pendingTitle : session.status === 'paused' ? strings.mission.paused : strings.mission.running;

  return (
    <Screen>
      <StepHeader title={ref} onBack={() => router.replace('/(tabs)/read')} />
      <AppText variant="caption" muted>{session.mode === 'physical' ? strings.mission.physical : strings.mission.digital}</AppText>
      {session.milestone ? (
        <AppText variant="label" color={RARITY_COLOR.holy} testID="session-milestone">
          {fmt(strings.mission.milestoneBanner, { name: getCatalogMission(session.milestone)?.name ?? session.milestone })}
        </AppText>
      ) : null}
      {session.mode === 'physical' ? (
        <Card>
          <AppText variant="heading">{strings.mission.readNow}</AppText>
          <AppText variant="display" style={styles.ref}>{ref}</AppText>
          <AppText muted>{fmt(strings.mission.physicalInstructions, { ref })}</AppText>
        </Card>
      ) : null}

      <View style={[styles.timer, { borderColor: pending ? colors.danger : colors.primary, backgroundColor: colors.surface }]}
        accessible accessibilityRole="timer" accessibilityLabel={`${strings.mission.time}: ${clock}, ${statusLabel}`}>
        <AppText style={[styles.clock, { color: colors.text }]}>{clock}</AppText>
        <AppText variant="label" color={pending ? colors.danger : session.status === 'running' ? colors.primary : colors.textMuted}>{statusLabel}</AppText>
      </View>

      {error || (pending && !finishing && session.lastError) ? <Notice tone="error">{error ?? session.lastError ?? ""}</Notice> : null}
      {pending ? <Notice tone="info">{strings.mission.pendingBody}</Notice> : null}

      {pending || finishing ? (
        <Button title={strings.mission.retry} loading={finishing} onPress={() => void doFinish()} />
      ) : (
        <>
          {session.status === 'running' ? (
            <Button variant="secondary" title={strings.mission.pause} onPress={() => void commit(pauseMission(session))} />
          ) : (
            <Button variant="secondary" title={strings.mission.resumeTimer} onPress={() => void commit(resumeMission(session))} />
          )}
          <Button title={strings.mission.finish} onPress={() => setConfirm('finish')} />
        </>
      )}
      <AppText variant="caption" muted>{strings.mission.noTime}</AppText>
      {!finishing ? <Button variant="danger" title={strings.mission.abandon} onPress={() => setConfirm('abandon')} /> : null}

      <ConfirmDialog
        visible={confirm === 'finish'}
        title={strings.mission.finishTitle}
        body={fmt(strings.mission.finishBody, { ref, time: clock })}
        confirmLabel={strings.mission.finishConfirm}
        onConfirm={() => void doFinish()}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        visible={confirm === 'abandon'}
        title={strings.mission.abandonTitle}
        body={strings.mission.abandonBody}
        confirmLabel={strings.mission.abandon}
        destructive
        onConfirm={() => { setConfirm(null); void commit(null).then(() => router.replace('/(tabs)/read')); }}
        onCancel={() => setConfirm(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  ref: { fontSize: 28 },
  timer: { borderWidth: 2, borderRadius: radius.lg, paddingVertical: spacing.xl, alignItems: 'center', gap: spacing.xs },
  clock: { fontSize: 56, lineHeight: 68, fontWeight: '700', fontVariant: ['tabular-nums'], letterSpacing: 1 },
});
