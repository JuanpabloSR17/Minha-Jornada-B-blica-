import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText, Button, Card, Notice, Screen } from '@/ui';
import { fmt, strings } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { StepHeader } from '@/features/avatar/components/StepHeader';
import { ItemIcon } from '@/features/avatar/components/ItemIcon';
import { RARITY_COLOR } from '@/features/avatar/components/RarityBadge';
import { displayName, getItem } from '@/features/avatar/domain/catalog';
import { startMission } from '../mission/session';
import { useMissionSession } from '../mission/useMissionSession';
import { useMilestones } from '../useMilestones';
import { ActiveSessionCard } from '../components/ActiveSessionCard';
import { refLabel } from '../refs';

const m = strings.mission;

/** Marco dos Santos: passagem, itens (com a posse do jogador) e início da sessão vinculada. */
export function MilestoneDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { rows, error } = useMilestones();
  const { userId, session, loaded, commit } = useMissionSession();
  const [startError, setStartError] = useState<string | null>(null);
  const row = rows?.find((r) => r.id === id);

  if (!rows) {
    return (
      <Screen>
        <StepHeader title={m.milestones} onBack={() => router.back()} />
        {error ? <Notice tone="error">{error}</Notice> : <ActivityIndicator color={colors.primary} />}
      </Screen>
    );
  }
  if (!row) {
    return (
      <Screen>
        <StepHeader title={m.milestones} onBack={() => router.back()} />
        <Notice tone="info">{m.milestoneEmpty}</Notice>
      </Screen>
    );
  }

  const ref = refLabel(row.book, row.chapter);
  const start = async () => {
    if (!userId || session) return;
    try {
      await commit(startMission({ userId, book: row.book, chapter: row.chapter, mode: 'physical', milestone: row.id }));
      router.push('/reading/mission');
    } catch (e) {
      setStartError(errorMessage(e));
    }
  };

  return (
    <Screen>
      <StepHeader title={row.name} onBack={() => router.back()} />
      <AppText variant="label" color={row.completed ? colors.success : RARITY_COLOR.holy}>
        {row.completed ? m.milestoneStateDone : m.milestoneStateTodo}
      </AppText>
      <Card>
        <AppText variant="caption" muted>{m.milestonePassage}</AppText>
        <AppText variant="heading">{ref}</AppText>
        <AppText muted>{row.description}</AppText>
      </Card>
      <Card>
        <AppText variant="heading">{m.milestoneItems}</AppText>
        <AppText variant="caption" muted>{fmt(m.milestoneItemsOwned, { owned: row.ownedCount, total: row.items.length })}</AppText>
        {row.items.map(({ id: itemId, owned }) => {
          const it = getItem(itemId);
          if (!it) return null;
          return (
            <View key={itemId} style={[styles.item, { borderColor: owned ? colors.border : RARITY_COLOR.holy }]} testID={`marco-item-${itemId}`}
              accessible accessibilityLabel={`${displayName(it)}, ${owned ? m.itemOwned : row.completed ? m.milestoneStateDone : m.itemGrantable}`}>
              <View style={[styles.icon, { backgroundColor: colors.stage, opacity: owned ? 1 : 0.85 }]}><ItemIcon item={it} size={52} /></View>
              <View style={styles.flex}>
                <AppText variant="label">{displayName(it)}</AppText>
                <AppText variant="caption" color={RARITY_COLOR.holy}>{strings.rarity.holy} · {(m.usage as Record<string, string>)[it.slot] ?? it.slot}</AppText>
                <AppText variant="caption" color={owned ? colors.success : colors.text} testID={`marco-item-state-${itemId}`}>
                  {owned ? m.itemOwned : m.itemGrantable}
                </AppText>
              </View>
            </View>
          );
        })}
        {!row.completed && row.grantable.length === 0 ? <Notice tone="info">{m.milestoneAllOwned}</Notice> : null}
        {!row.completed && row.grantable.length > 0 ? <AppText variant="caption" muted>{m.milestoneOwnedNote}</AppText> : null}
      </Card>
      {startError ? <Notice tone="error">{startError}</Notice> : null}
      {row.completed ? (
        <Notice tone="success">{m.milestoneAlreadyDone}</Notice>
      ) : loaded && session ? (
        <>
          <Notice tone="info">{fmt(m.milestoneBusy, { ref: refLabel(session.book, session.chapter) })}</Notice>
          <ActiveSessionCard />
        </>
      ) : (
        <Button title={fmt(m.milestoneStart, { ref })} onPress={() => void start()} disabled={!loaded} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0, gap: 2 },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderRadius: radius.md, padding: spacing.sm },
  icon: { width: 56, height: 56, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
});
