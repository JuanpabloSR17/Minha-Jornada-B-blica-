import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { CinemaTheme, useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText, Button, Card, Notice, Screen } from '@/ui';
import { fmt, strings } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { useAuth } from '@/features/auth/AuthProvider';
import { StepHeader } from '@/features/avatar/components/StepHeader';
import { ItemIcon } from '@/features/avatar/components/ItemIcon';
import { RARITY_COLOR } from '@/features/avatar/components/RarityBadge';
import { displayName, getCatalogMission, isEquippable } from '@/features/avatar/domain/catalog';
import { equipItem, getWardrobe } from '@/features/avatar/services/wardrobe.service';
import { ChapterResultBanner } from '@/features/journey/components/ChapterResultBanner';
import { GlassPanel, glassTones } from '@/features/journey/components/GlassPanel';
import { ProgressMeter } from '@/features/journey/components/ProgressMeter';
import { missionStorage } from '../mission/storage';
import { useMilestones } from '../useMilestones';
import { getNextReading, type MissionResult, type NextReading } from '../mission/mission.service';
import { formatClock } from '../mission/session';
import { readingRewards } from '../mission/rewards';
import { GoalChoice } from '../components/GoalChoice';
import { RewardPouch } from '../components/RewardPouch';
import { RelatedTrailReflection } from '../trails/TrailReflection';
import { bookName, refLabel } from '../refs';

/** Recompensa pós-leitura (B02): confirmação do servidor, progresso e itens concedidos de fato. */
export function MissionCompletedScreen() {
  return (
    <CinemaTheme>
      <MissionCompleted />
    </CinemaTheme>
  );
}

function MissionCompleted() {
  const { colors } = useTheme();
  const router = useRouter();
  const { userId } = useAuth();
  const [result, setResult] = useState<MissionResult | null | undefined>(undefined);
  const [reading, setReading] = useState<NextReading | null>(null);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [reopenPouch, setReopenPouch] = useState(false);
  const { rows: milestones } = useMilestones();

  useFocusEffect(useCallback(() => {
    let active = true;
    if (userId) void missionStorage.loadResult(userId).then((stored) => { if (active) setResult(stored); });
    return () => { active = false; };
  }, [userId]));

  const sessionId = result?.sessionId;
  useEffect(() => {
    if (!sessionId) return;
    let active = true;
    setReading(null);
    void getNextReading().then((next) => { if (active) setReading(next); }, () => undefined);
    return () => { active = false; };
  }, [sessionId]);

  if (result === undefined) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }
  if (!result) {
    return (
      <Screen>
        <StepHeader title={strings.mission.title} onBack={() => router.replace('/(tabs)/read')} />
        <Notice tone="info">{strings.mission.noResult}</Notice>
      </Screen>
    );
  }

  const ref = refLabel(result.book.code, result.chapter);
  const rewards = readingRewards(result);
  const xp = rewards.find((r) => r.kind === 'xp')?.amount ?? 0;
  const items = rewards.filter((r) => r.kind === 'item');
  const hasHoly = items.some(({ item }) => item?.rarity === 'holy');
  const alreadyOwned = hasHoly
    ? getCatalogMission(result.milestone)?.rewardItems.filter((id) => !items.some((entry) => entry.id === id))
    : undefined;
  const showReveal = rewards.length > 0 && (reopenPouch || !result.revealed);
  const closePouch = (then?: () => void) => {
    setReopenPouch(false);
    setResult({ ...result, revealed: true });
    if (userId) void missionStorage.markRevealed(userId, result.sessionId);
    then?.();
  };
  const pendingMarcos = (milestones ?? []).filter((r) => !r.completed && r.book === result.book.code && r.chapter === result.chapter);
  const next = reading?.next;

  const equip = async (itemId: string) => {
    setBusy(itemId);
    setNotice(null);
    try {
      const w = await getWardrobe();
      await equipItem(w.activeLoadoutId!, itemId);
      setNotice({ tone: 'success', text: strings.mission.equipped });
    } catch (e) {
      setNotice({ tone: 'error', text: errorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.root}>
    <Screen>
      <StepHeader title={result.alreadyCompleted ? strings.mission.rereadTitle : strings.mission.completedTitle} />
      <AppText variant="display" style={styles.ref}>{ref}</AppText>
      {result.alreadyCompleted ? <Notice tone="info">{strings.mission.rereadBody}</Notice> : null}
      {result.duplicate ? <Notice tone="info">{strings.mission.duplicateNote}</Notice> : null}
      {result.bookJustCompleted ? <Notice tone="success">{fmt(strings.mission.bookCompleted, { book: result.book.name })}</Notice> : null}
      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}
      <ChapterResultBanner result={result} />

      <GlassPanel tone="reading">
        <View style={styles.stats}>
          <View style={styles.stat}>
            <AppText variant="caption" muted>{strings.mission.time}</AppText>
            <AppText variant="heading" style={styles.numeric}>{formatClock(result.activeSeconds * 1000)}</AppText>
          </View>
          <View style={styles.stat}>
            <AppText variant="caption" muted>{strings.mission.xp}</AppText>
            <AppText variant="heading" color={glassTones.xp.light} style={styles.numeric}
              accessibilityLabel={`${xp} XP, total ${result.xpTotal}`}>+{xp} XP</AppText>
            <AppText variant="caption" muted>{result.xpTotal.toLocaleString('pt-BR')} XP no total</AppText>
          </View>
        </View>
        <AppText>{fmt(strings.mission.bookLine, { book: result.book.name, done: result.book.completed, total: result.book.total })}</AppText>
        <ProgressMeter value={result.book.completed} total={result.book.total} label={`Capítulos lidos de ${result.book.name}`}
          from={result.alreadyCompleted || result.duplicate || result.revealed ? undefined : result.book.completed - 1}
          height={12} />
        <AppText muted>{fmt(strings.mission.bibleLine, { done: result.chaptersCompleted, total: result.totalChapters, percent: result.percent })}</AppText>
        <AppText variant="caption" muted>{strings.mission.xpNote}</AppText>
      </GlassPanel>

      {result.dailyGoal ? (() => {
        const dg = result.dailyGoal;
        const goal = dg.goal;
        return (
          <Card style={{ borderColor: dg.achievedNow ? colors.primary : colors.border }}>
            <AppText variant="heading">{strings.mission.goalTitle}</AppText>
            {dg.achievedNow ? (
              <Notice tone="success" title={strings.mission.goalCelebrate}>
                {fmt(strings.mission.goalAchieved, { siclos: dg.siclosAwarded, xp: dg.xpBonus ?? 0 })}
              </Notice>
            ) : dg.achievedToday ? (
              <AppText muted>{fmt(strings.mission.goalAlready, { n: dg.newChaptersToday })}</AppText>
            ) : dg.target == null ? (
              <AppText muted>{strings.mission.goalNoTarget}</AppText>
            ) : (
              <AppText muted>{fmt(strings.mission.goalProgress, { done: dg.newChaptersToday, target: dg.target, remaining: dg.remaining ?? 0 })}</AppText>
            )}
            {result.alreadyCompleted ? <AppText variant="caption" muted>{strings.mission.goalRereadNote}</AppText> : null}
            <AppText variant="label">{fmt(strings.mission.goalBalance, { balance: dg.siclosBalance })}</AppText>
            {dg.achievedNow && goal ? (
              goal.options.length === 0 ? (
                <AppText muted>{strings.mission.goalAllOwned}</AppText>
              ) : (
                <GoalChoice goal={goal} onChange={(g) => setResult((current) =>
                  current?.sessionId === result.sessionId ? { ...current, dailyGoal: { ...dg, goal: g } } : current,
                )} />
              )
            ) : null}
            <AppText variant="caption" muted>{fmt(strings.mission.goalRule, { tz: goal?.timeZone ?? '—' })}</AppText>
          </Card>
        );
      })() : null}

      {/* leitura comum num capítulo que tem marco a cumprir: explica como receber os Santos */}
      {!result.milestone ? pendingMarcos.map((mk) => (
        <Card key={mk.id} style={{ borderColor: RARITY_COLOR.holy }} testID="ordinary-milestone-hint">
          <AppText variant="label">{fmt(strings.mission.ordinaryHasMilestone, { name: mk.name })}</AppText>
          <AppText variant="caption" muted>{strings.mission.ordinaryHasMilestoneBody}</AppText>
          <Button compact variant="secondary" title={strings.mission.openMilestone} onPress={() => router.push({ pathname: '/reading/milestone/[id]', params: { id: mk.id } })} />
        </Card>
      )) : null}

      {result.missions.map((m) => (
        <Notice key={m.id} tone="success">{fmt(m.kind === 'milestone' ? strings.mission.milestoneDone : strings.mission.missionDone, { name: m.name })}</Notice>
      ))}

      <Card>
        <AppText variant="heading">{strings.mission.rewards}</AppText>
        {rewards.length > 0 ? <Button variant="secondary" icon="bag" title="Rever recompensas" onPress={() => setReopenPouch(true)} /> : null}
        {items.length === 0 ? <AppText muted>{strings.mission.noRewards}</AppText> : null}
        {items.map(({ id, item }) => {
          if (!item) return null;
          return (
            <View key={id} style={[styles.reward, { borderColor: RARITY_COLOR[item.rarity] }]}>
              <View style={[styles.icon, { backgroundColor: colors.stage }]}>
                <ItemIcon item={item} size={72} />
              </View>
              <View style={styles.flex}>
                <AppText variant="label">{displayName(item)}</AppText>
                <AppText variant="caption" color={RARITY_COLOR[item.rarity]}>{strings.rarity[item.rarity]}</AppText>
                {item.scriptureRef ? <AppText variant="caption" muted>{item.scriptureRef}</AppText> : null}
                {item.meaning ? <AppText variant="caption" muted>{item.meaning}</AppText> : null}
                {isEquippable(item) ? (
                  <Button compact title={strings.mission.equipNow} loading={busy === id} onPress={() => void equip(item.id)} />
                ) : (
                  <AppText variant="caption" muted>{strings.mission.inSanctuary}</AppText>
                )}
              </View>
            </View>
          );
        })}
        {items.some(({ item }) => item && isEquippable(item)) ? <Button variant="secondary" title={strings.mission.seeInventory} onPress={() => router.push('/avatar/wardrobe')} /> : null}
        {hasHoly ? <Button variant="secondary" title={strings.mission.seeSanctuary} onPress={() => router.push('/avatar/sanctuary')} /> : null}
      </Card>

      <RelatedTrailReflection result={result} />

      {next ? (
        <Button title={`${strings.mission.nextChapter}: ${bookName(next.book)} ${next.chapter}`}
          onPress={() => router.replace({ pathname: '/(tabs)/read', params: { book: next.book, chapter: String(next.chapter) } })} />
      ) : null}
      {reading?.allDone ? <Button icon="medal" variant="gold" title="Ver conquistas da Jornada" onPress={() => router.replace('/(tabs)/profile')} /> : null}
      <Button variant="secondary" title={strings.mission.backToMissions} onPress={() => router.replace('/(tabs)/read')} />
    </Screen>
    {showReveal ? (
      <RewardPouch
        key={result.sessionId}
        rewards={rewards}
        reference={ref}
        alreadyOwned={alreadyOwned}
        onSanctuary={hasHoly ? () => closePouch(() => router.push('/avatar/sanctuary')) : undefined}
        onClose={() => closePouch()}
      />
    ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1, gap: 2 },
  ref: { fontSize: 28 },
  stats: { flexDirection: 'row', gap: spacing.lg },
  stat: { flex: 1 },
  numeric: { fontVariant: ['tabular-nums'] },
  reward: { flexDirection: 'row', gap: spacing.md, borderWidth: 1, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center' },
  icon: { width: 76, height: 76, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
