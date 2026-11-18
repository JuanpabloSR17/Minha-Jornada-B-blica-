import { useCallback, useState } from 'react';
import { ITEMS_VISIBLE } from '@/config/features';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText, Button, IconBadge, Notice } from '@/ui';
import { GlassPanel, glassTones } from '@/features/journey/components/GlassPanel';
import { ProgressMeter } from '@/features/journey/components/ProgressMeter';
import { fmt, strings } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import {
  getDailyGoalStatus,
  setDailyMissionTarget,
  setTimeZone,
  syncTimeZone,
  type DailyGoalStatus,
  type TimeZoneSync,
} from '../mission/mission.service';
import type { MissionSession } from '../mission/session';
import { dayLabel } from './dayLabel';

const PRESETS = [1, 2, 3, 5];
const h = strings.home;

/**
 * Meta diária (calculada no servidor): meta do dia, capítulos de hoje, barra de progresso,
 * recompensa prevista, quanto falta e o botão de leitura. No ritmo livre, escolhe a missão do dia.
 */
export function DailyGoalCard({ session, onStart, hideStart }: { session: MissionSession | null; onStart?: () => void; hideStart?: boolean }) {
  const { colors, dark } = useTheme();
  const router = useRouter();
  const [status, setStatus] = useState<DailyGoalStatus | null>(null);
  const [tz, setTz] = useState<TimeZoneSync | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [free, setFree] = useState(1);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    // o fuso do aparelho só é adotado se o usuário nunca escolheu um; senão vira sugestão
    syncTimeZone().then(setTz, () => setTz(null)).finally(() => {
      getDailyGoalStatus().then((s) => { setStatus(s); setError(null); }, (e) => setError(errorMessage(e)));
    });
  }, []);
  useFocusEffect(load);

  const act = async (fn: () => Promise<DailyGoalStatus>) => {
    setBusy(true);
    setError(null);
    try {
      setStatus(await fn());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (!status) return error ? <Notice tone="error">{error}</Notice> : null;

  const s = status;
  const target = s.target;
  const tone = s.achievedToday ? 'complete' : 'reading';
  const title = s.planMode === 'free'
    ? target ? fmt(h.dailyTitleFreeMission, { n: target }) : h.dailyTitleFree
    : target === 1 ? h.dailyTitleGoalOne : fmt(h.dailyTitleGoal, { n: target ?? 0 });
  const reward = s.reward.commonChoices > 0
    ? fmt(h.dailyReward, { siclos: s.reward.siclos, xp: s.reward.xpBonus })
    : fmt(h.dailyRewardNoCommon, { siclos: s.reward.siclos, xp: s.reward.xpBonus });
  const startLabel = session || s.newChaptersToday > 0 ? h.dailyContinue : h.dailyStart;
  const start = onStart ?? (() => router.push(session ? '/reading/mission' : '/(tabs)/read'));

  return (
    <GlassPanel tone={tone} testID="daily-goal-panel">
      <View style={styles.heading}>
        <IconBadge name={s.achievedToday ? 'check' : 'flag'} color={s.achievedToday ? colors.success : colors.primary} />
        <AppText variant="heading" style={styles.title}>{title}</AppText>
      </View>

      {s.needsFreeChoice ? (
        s.canChooseFreeTarget ? (
          <View style={styles.gap}>
            <AppText variant="label">{h.freeChooseTitle}</AppText>
            <AppText variant="caption" muted>{h.freeChooseBody}</AppText>
            <View style={styles.row} accessibilityRole="radiogroup">
              {PRESETS.map((n) => (
                <Pressable key={n} accessibilityRole="radio" accessibilityState={{ checked: free === n }} accessibilityLabel={`${n} capítulo${n > 1 ? 's' : ''}`}
                  onPress={() => setFree(n)}
                  style={[styles.chip, { borderColor: free === n ? colors.primary : colors.border, backgroundColor: free === n ? colors.surfaceRaised : colors.surface }]}>
                  <AppText variant="label">{n}</AppText>
                </Pressable>
              ))}
              <Pressable accessibilityRole="button" accessibilityLabel="Mais um capítulo" onPress={() => setFree((n) => Math.min(50, n + 1))}
                style={[styles.chip, { borderColor: colors.border }]}>
                <AppText variant="label">+</AppText>
              </Pressable>
            </View>
            <Button title={free === 1 ? h.freeChooseConfirmOne : fmt(h.freeChooseConfirm, { n: free })} loading={busy}
              onPress={() => void act(() => setDailyMissionTarget(free))} />
          </View>
        ) : (
          <AppText muted>{h.freeTooLate}</AppText>
        )
      ) : (
        <>
          <AppText variant="label" style={styles.numeric} color={dark ? glassTones[tone].light : undefined}>
            {fmt(h.dailyToday, { done: Math.min(s.newChaptersToday, target ?? 0), target: target ?? 0 })}
          </AppText>
          <ProgressMeter value={s.newChaptersToday} total={target ?? 0} tone={tone} label="Capítulos lidos para a meta diária" height={12} />
          {s.achievedToday ? (
            <AppText variant="label" color={colors.success}>{h.dailyAchieved}</AppText>
          ) : (
            <AppText>{s.remaining === 1 ? h.dailyRemainingOne : fmt(h.dailyRemaining, { n: s.remaining ?? 0 })}</AppText>
          )}
        </>
      )}
      {s.planMode === 'free' && s.newChaptersToday > 0 && !target ? <AppText variant="caption" muted>{fmt(h.dailyTodayFree, { done: s.newChaptersToday })}</AppText> : null}
      {!s.achievedToday ? <AppText variant="caption" muted>{reward}</AppText> : null}
      <AppText variant="caption" muted>{fmt(h.dailyXpNote, { xp: s.reward.xpPerChapter })}</AppText>
      {s.pendingChange ? (
        <AppText variant="caption" muted>
          {fmt(h.dailyPendingChange, {
            day: dayLabel(s.pendingChange.effectiveDay),
            goal: s.pendingChange.planMode === 'free' ? h.dailyPendingFree : fmt(h.dailyPendingGoal, { n: s.pendingChange.target ?? 0 }),
          })}
        </AppText>
      ) : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      {tz?.suggestion ? (
        <View style={styles.gap}>
          <Notice tone="info">{fmt(h.tzSuggestion, { device: tz.suggestion, current: tz.timeZone })}</Notice>
          <Button compact variant="secondary" title={fmt(h.tzUse, { device: tz.suggestion })} loading={busy}
            onPress={() => void act(async () => { const r = await setTimeZone(tz.suggestion!); setTz({ ...tz, timeZone: tz.suggestion!, suggestion: null }); return r; })} />
        </View>
      ) : null}
      {hideStart ? null : <Button title={startLabel} onPress={start} />}
      {ITEMS_VISIBLE && s.pending.length ? (
        <View style={styles.gap}>
          <AppText variant="label">{strings.mission.goalPendingCard}</AppText>
          <Button variant="secondary" icon="chest" title={strings.mission.goalPendingOpen} onPress={() => router.push('/reading/goal')} />
        </View>
      ) : null}
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, minWidth: 0 },
  gap: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  chip: { minWidth: 44, height: 44, borderWidth: 1, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  numeric: { fontVariant: ['tabular-nums'] },
});
