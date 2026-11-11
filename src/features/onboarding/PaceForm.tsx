import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText, Button } from '@/ui';
import { fmt, strings } from '@/i18n';
import type { ReadingPreferences } from '@/features/profile/profile.service';

export type PaceValue = { mode: 'daily_goal' | 'free'; target: number | null };
type Choice = '1' | '2' | '3' | '5' | 'custom' | 'free';

const PRESETS = [1, 2, 3, 5];

export function paceFromPrefs(p: ReadingPreferences | null): PaceValue {
  if (!p) return { mode: 'daily_goal', target: 1 };
  return { mode: p.plan_mode, target: p.target_chapters_per_day };
}

/** Seletor de meta flexível: 1/2/3/5/personalizada/sem meta. */
export function PaceForm({ value, onChange }: { value: PaceValue; onChange: (v: PaceValue) => void }) {
  const { colors } = useTheme();
  const initialChoice: Choice =
    value.mode === 'free' ? 'free' : PRESETS.includes(value.target ?? 0) ? (String(value.target) as Choice) : 'custom';
  const [choice, setChoice] = useState<Choice>(initialChoice);
  const [custom, setCustom] = useState(value.mode === 'daily_goal' && !PRESETS.includes(value.target ?? 0) ? value.target ?? 4 : 4);

  const select = (c: Choice) => {
    setChoice(c);
    if (c === 'free') onChange({ mode: 'free', target: null });
    else if (c === 'custom') onChange({ mode: 'daily_goal', target: custom });
    else onChange({ mode: 'daily_goal', target: Number(c) });
  };
  const bump = (d: number) => {
    const n = Math.max(1, Math.min(50, custom + d));
    setCustom(n);
    onChange({ mode: 'daily_goal', target: n });
  };

  const option = (c: Choice, label: string, hint?: string, half = false) => {
    const active = choice === c;
    return (
      <Pressable
        key={c}
        accessibilityRole="radio"
        accessibilityState={{ checked: active }}
        aria-checked={active}
        onPress={() => select(c)}
        style={[styles.option, half && styles.half, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.surfaceRaised : colors.surface, borderWidth: active ? 2.5 : 1.5 }]}
      >
        <AppText variant="label" style={styles.optionLabel}>{label}</AppText>
        {hint ? <AppText variant="caption" muted>{hint}</AppText> : null}
      </Pressable>
    );
  };

  return (
    <View accessibilityRole="radiogroup" style={styles.list}>
      <View style={styles.grid}>
        {PRESETS.map((n) => option(String(n) as Choice, n === 1 ? strings.onboarding.paceOptionOne : fmt(strings.onboarding.paceOption, { n }), undefined, true))}
      </View>
      {option('custom', strings.onboarding.paceCustom)}
      {choice === 'custom' ? (
        <View style={styles.stepper}>
          <Button title="−" variant="secondary" compact onPress={() => bump(-1)} disabled={custom <= 1} style={styles.stepBtn} />
          <View style={styles.stepValue} accessibilityLiveRegion="polite">
            <AppText variant="title">{custom}</AppText>
            <AppText variant="caption" muted>{strings.onboarding.paceCustomLabel}</AppText>
          </View>
          <Button title="+" variant="secondary" compact onPress={() => bump(1)} disabled={custom >= 50} style={styles.stepBtn} />
        </View>
      ) : null}
      {option('free', strings.onboarding.paceFree, strings.onboarding.paceFreeHint)}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  half: { flexGrow: 1, flexBasis: '45%' },
  optionLabel: { fontSize: 16 },
  option: { minHeight: 60, borderRadius: radius.lg, padding: spacing.md, justifyContent: 'center', gap: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  stepBtn: { width: 56 },
  stepValue: { alignItems: 'center', minWidth: 120 },
});
