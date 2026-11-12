import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText, Button, Card, Notice, Screen } from '@/ui';
import { fmt, strings } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { useAuth } from '@/features/auth/AuthProvider';
import { StepHeader } from '@/features/avatar/components/StepHeader';
import { ItemIcon } from '@/features/avatar/components/ItemIcon';
import { RARITY_COLOR } from '@/features/avatar/components/RarityBadge';
import { displayName, displayNameOf, getItem, isEquippable } from '@/features/avatar/domain/catalog';
import { equipItem, getWardrobe } from '@/features/avatar/services/wardrobe.service';
import bible from '../bible-books.json';
import { missionStorage } from '../mission/storage';
import type { MissionResult } from '../mission/mission.service';
import { formatClock, nextChapter } from '../mission/session';
import { GoalChoice } from '../components/GoalChoice';
import { GoalCelebration } from '../components/GoalCelebration';
import { bookName, refLabel } from './MissionHomeScreen';

/** Recompensa pós-leitura (B02): confirmação do servidor, progresso e itens concedidos de fato. */
export function MissionCompletedScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { userId } = useAuth();
  const [result, setResult] = useState<MissionResult | null | undefined>(undefined);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (userId) void missionStorage.loadResult(userId).then(setResult);
  }, [userId]);

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
  const next = nextChapter(bible as { code: string; chapters: number }[], result.book.code, result.chapter);

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
    <Screen>
      <StepHeader title={result.alreadyCompleted ? strings.mission.rereadTitle : strings.mission.completedTitle} />
      <AppText variant="display" style={styles.ref}>{ref}</AppText>
      {result.alreadyCompleted ? <Notice tone="info">{strings.mission.rereadBody}</Notice> : null}
      {result.duplicate ? <Notice tone="info">{strings.mission.duplicateNote}</Notice> : null}
      {result.bookJustCompleted ? <Notice tone="success">{fmt(strings.mission.bookCompleted, { book: result.book.name })}</Notice> : null}
      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      <Card>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <AppText variant="caption" muted>{strings.mission.time}</AppText>
            <AppText variant="heading">{formatClock(result.activeSeconds * 1000)}</AppText>
          </View>
          <View style={styles.stat}>
            <AppText variant="caption" muted>{strings.mission.xp}</AppText>
            <AppText variant="heading" accessibilityLabel={`${result.xpAwarded} XP, total ${result.xpTotal}`}>+{result.xpAwarded} · {result.xpTotal}</AppText>
          </View>
        </View>
        <AppText>{fmt(strings.mission.bookLine, { book: result.book.name, done: result.book.completed, total: result.book.total })}</AppText>
        <View style={[styles.bar, { backgroundColor: colors.backgroundAlt }]}>
          <View style={[styles.barFill, { backgroundColor: colors.primary, width: `${Math.min(100, (result.book.completed / result.book.total) * 100)}%` }]} />
        </View>
        <AppText muted>{fmt(strings.mission.bibleLine, { done: result.chaptersCompleted, total: result.totalChapters, percent: result.percent })}</AppText>
        <AppText variant="caption" muted>{strings.mission.xpNote}</AppText>
      </Card>

      {result.dailyGoal ? (() => {
        const dg = result.dailyGoal;
        const goal = dg.goal;
        return (
          <Card style={{ borderColor: dg.achievedNow ? colors.primary : colors.border }}>
            <AppText variant="heading">{strings.mission.goalTitle}</AppText>
            {dg.achievedNow ? (
              <GoalCelebration title={strings.mission.goalCelebrate}
                subtitle={fmt(strings.mission.goalAchieved, { siclos: dg.siclosAwarded, xp: dg.xpBonus ?? 0 })} />
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
              ) : goal.chosenItem ? (
                <Notice tone="success">{fmt(strings.mission.goalChosen, { item: displayNameOf(goal.chosenItem) })}</Notice>
              ) : (
                <GoalChoice goal={goal} onChange={(g) => {
                  const next = { ...result, dailyGoal: { ...dg, goal: g } };
                  if (userId) void missionStorage.saveResult(userId, next);
                }} />
              )
            ) : null}
            <AppText variant="caption" muted>{fmt(strings.mission.goalRule, { tz: goal?.timeZone ?? '—' })}</AppText>
          </Card>
        );
      })() : null}

      {result.missions.map((m) => (
        <Notice key={m.id} tone="success">{fmt(m.kind === 'milestone' ? strings.mission.milestoneDone : strings.mission.missionDone, { name: m.name })}</Notice>
      ))}

      <Card>
        <AppText variant="heading">{strings.mission.rewards}</AppText>
        {result.granted.length === 0 ? <AppText muted>{strings.mission.noRewards}</AppText> : null}
        {result.granted.map((id) => {
          const item = getItem(id);
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
        {result.granted.length ? <Button variant="secondary" title={strings.mission.seeInventory} onPress={() => router.push('/avatar/wardrobe')} /> : null}
        {result.granted.some((id) => getItem(id)?.rarity === 'holy') ? <Button variant="secondary" title={strings.mission.seeSanctuary} onPress={() => router.push('/avatar/sanctuary')} /> : null}
      </Card>

      {next ? (
        <Button title={`${strings.mission.nextChapter}: ${bookName(next.book)} ${next.chapter}`}
          onPress={() => router.replace({ pathname: '/(tabs)/read', params: { book: next.book, chapter: String(next.chapter) } })} />
      ) : null}
      <Button variant="secondary" title={strings.mission.backToMissions} onPress={() => router.replace('/(tabs)/read')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  ref: { fontSize: 28 },
  stats: { flexDirection: 'row', gap: spacing.lg },
  stat: { flex: 1 },
  bar: { height: 8, borderRadius: radius.pill, overflow: 'hidden' },
  barFill: { height: 8 },
  reward: { flexDirection: 'row', gap: spacing.md, borderWidth: 1, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center' },
  icon: { width: 76, height: 76, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
