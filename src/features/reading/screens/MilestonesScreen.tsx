import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText, Card, Icon, Notice, Screen } from '@/ui';
import { fmt, strings } from '@/i18n';
import { StepHeader } from '@/features/avatar/components/StepHeader';
import { RARITY_COLOR } from '@/features/avatar/components/RarityBadge';
import { filterMilestones, milestoneSummary, type MilestoneFilter } from '../milestones';
import { useMilestones } from '../useMilestones';
import { ActiveSessionCard } from '../components/ActiveSessionCard';
import { refLabel } from '../refs';

const m = strings.mission;
const FILTERS: MilestoneFilter[] = ['all', 'todo', 'done'];

/** Lista completa dos marcos dos Santos, com filtros por estado (registro de conclusão do servidor). */
export function MilestonesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { rows, error } = useMilestones();
  const [filter, setFilter] = useState<MilestoneFilter>('all');
  const shown = rows ? filterMilestones(rows, filter) : [];
  const sum = rows ? milestoneSummary(rows) : null;

  return (
    <Screen>
      <StepHeader title={m.milestones} onBack={() => router.back()} />
      <ActiveSessionCard />
      {error ? <Notice tone="error">{error}</Notice> : null}
      {!rows && !error ? <ActivityIndicator color={colors.primary} /> : null}
      {sum ? (
        <View style={styles.summary}>
          <AppText variant="label">{fmt(m.milestonesDone, { done: sum.milestonesDone, total: sum.milestonesTotal })}</AppText>
          <AppText variant="caption" muted>{fmt(m.saintsOwned, { owned: sum.saintsOwned, total: sum.saintsTotal })}</AppText>
        </View>
      ) : null}
      <View style={styles.filters} accessibilityRole="radiogroup" accessibilityLabel={m.filtersLabel}>
        {FILTERS.map((f) => {
          const sel = f === filter;
          const n = rows ? filterMilestones(rows, f).length : 0;
          return (
            <Pressable key={f} accessibilityRole="radio" accessibilityState={{ checked: sel }} accessibilityLabel={`${m.filters[f]} (${n})`} onPress={() => setFilter(f)}
              style={[styles.filter, { borderColor: sel ? colors.primary : colors.border, backgroundColor: sel ? colors.primary : colors.surface }]}>
              <AppText variant="label" color={sel ? colors.onPrimary : colors.text}>{m.filters[f]} · {n}</AppText>
            </Pressable>
          );
        })}
      </View>
      {rows && shown.length === 0 ? <Notice tone="info">{m.milestoneEmpty}</Notice> : null}
      {shown.length ? (
        <Card>
          {shown.map((r, i) => (
            <Pressable key={r.id} accessibilityRole="link"
              accessibilityLabel={`${r.name}, ${refLabel(r.book, r.chapter)}, ${r.completed ? m.milestoneStateDone : m.milestoneStateTodo}, ${fmt(m.milestoneItemsOwned, { owned: r.ownedCount, total: r.items.length })}`}
              onPress={() => router.push({ pathname: '/reading/milestone/[id]', params: { id: r.id } })}
              style={[styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <Icon name={r.completed ? 'check' : 'sparkle'} size={18} color={r.completed ? colors.success : RARITY_COLOR.holy} />
              <View style={styles.flex}>
                <AppText variant="label">{r.name}</AppText>
                <AppText variant="caption" muted>{refLabel(r.book, r.chapter)} · {fmt(m.milestoneItemsOwned, { owned: r.ownedCount, total: r.items.length })}</AppText>
              </View>
              <AppText variant="caption" color={r.completed ? colors.success : colors.textMuted} style={styles.state}>
                {r.completed ? m.milestoneStateDone : m.milestoneStateTodo}
              </AppText>
            </Pressable>
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  summary: { gap: 2 },
  filters: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  filter: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  state: { fontWeight: '600' },
});
