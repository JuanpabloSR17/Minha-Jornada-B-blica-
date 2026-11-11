import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText, Button, ConfirmDialog, Notice } from '@/ui';
import { fmt, strings } from '@/i18n';
import { errorCode, errorMessage } from '@/lib/errors';
import { ItemIcon } from '@/features/avatar/components/ItemIcon';
import { RARITY_COLOR } from '@/features/avatar/components/RarityBadge';
import { getItem } from '@/features/avatar/domain/catalog';
import { claimDailyGoalItem, type DailyGoalState } from '../mission/mission.service';

/**
 * Escolha gratuita de um Comum da meta diária. As opções vêm do servidor; a escolha só vale depois
 * da confirmação. Repetir a confirmação (ex.: após queda de conexão) não concede de novo.
 */
export function GoalChoice({ goal, onChange }: { goal: DailyGoalState; onChange?: (g: DailyGoalState) => void }) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(goal.chosenItem);

  if (done) {
    return <Notice tone="success">{fmt(strings.mission.goalClaimed, { item: getItem(done)?.name ?? done })}</Notice>;
  }
  if (!goal.choicePending) return null;

  const claim = async () => {
    if (!selected) return;
    setConfirming(false);
    setBusy(true);
    setError(null);
    try {
      const r = await claimDailyGoalItem(goal.day, selected);
      setDone(r.itemId);
      onChange?.(r.goal);
    } catch (e) {
      // a escolha continua na tela: basta tentar de novo (o servidor não concede duas vezes)
      setError(errorCode(e) === 'goal_choice_already_made' ? strings.errors.goal_choice_already_made : errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const selectedName = selected ? getItem(selected)?.name ?? selected : '';
  return (
    <View style={styles.wrap}>
      <AppText variant="heading">{strings.mission.goalChooseTitle}</AppText>
      <AppText variant="caption" muted>{strings.mission.goalChooseBody}</AppText>
      <View style={styles.row} accessibilityRole="radiogroup">
        {goal.available.map((id) => {
          const item = getItem(id);
          if (!item) return null;
          const sel = id === selected;
          return (
            <Pressable key={id} accessibilityRole="radio" accessibilityState={{ checked: sel }} accessibilityLabel={`${item.name}, ${strings.rarity[item.rarity]}`}
              onPress={() => setSelected(id)}
              style={[styles.option, { borderColor: sel ? colors.primary : RARITY_COLOR[item.rarity], backgroundColor: sel ? colors.surfaceRaised : colors.surface, borderWidth: sel ? 2 : 1 }]}>
              <View style={[styles.icon, { backgroundColor: colors.stage }]}>
                <ItemIcon item={item} size={64} />
              </View>
              <AppText variant="caption" style={styles.name} numberOfLines={2}>{item.name}</AppText>
              {item.scriptureRef ? <AppText variant="caption" muted style={styles.ref} numberOfLines={1}>{item.scriptureRef}</AppText> : null}
            </Pressable>
          );
        })}
      </View>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Button title={selected ? fmt(strings.mission.goalConfirm, { item: selectedName }) : strings.mission.goalChooseTitle} disabled={!selected} loading={busy} onPress={() => setConfirming(true)} />
      <ConfirmDialog
        visible={confirming}
        title={strings.mission.goalConfirmTitle}
        body={fmt(strings.mission.goalConfirmBody, { item: selectedName })}
        confirmLabel={strings.common.confirm}
        onConfirm={() => void claim()}
        onCancel={() => setConfirming(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  option: { flexGrow: 1, flexBasis: 96, maxWidth: 140, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center', gap: 2 },
  icon: { width: 68, height: 68, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  name: { textAlign: 'center', fontSize: 12, lineHeight: 15 },
  ref: { textAlign: 'center', fontSize: 10, lineHeight: 13 },
});
