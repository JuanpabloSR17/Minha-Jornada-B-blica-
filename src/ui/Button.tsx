import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { useTheme } from '@/theme/ThemeProvider';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { fonts, radius, spacing } from '@/theme/tokens';
import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  style,
  accessibilityLabel,
  accessibilityHint,
  compact,
}: {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  compact?: boolean;
}) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;
  const palette = {
    primary: { bg: colors.primary, pressed: colors.primaryPressed, fg: colors.onPrimary, border: colors.primary },
    secondary: { bg: colors.surfaceRaised, pressed: colors.backgroundAlt, fg: colors.text, border: colors.borderStrong },
    ghost: { bg: 'transparent', pressed: colors.backgroundAlt, fg: colors.text, border: 'transparent' },
    danger: { bg: 'transparent', pressed: colors.dangerSurface, fg: colors.danger, border: colors.danger },
    gold: { bg: '#D9A441', pressed: '#B9862E', fg: '#2A1606', border: '#7A5418' },
  }[variant];
  const gold = variant === 'gold';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        { backgroundColor: pressed ? palette.pressed : palette.bg, borderColor: palette.border, opacity: isDisabled ? 0.55 : 1 },
        gold && styles.gold,
        style,
      ]}
    >
      {({ pressed }) => (
      <>
      {gold ? <GoldBevel pressed={pressed} /> : null}
      <View style={styles.row}>
        {loading ? <ActivityIndicator color={palette.fg} /> : icon}
        <AppText variant="label" color={palette.fg} style={[styles.label, gold ? { fontFamily: fonts.display, fontSize: compact ? 15 : 17, fontWeight: "700" } : { fontSize: compact ? 14 : 16 }]} numberOfLines={2}>
          {title}
        </AppText>
      </View>
      </>
      )}
    </Pressable>
  );
}

/** Fundo dourado em relevo (botão principal das telas da jornada). */
function GoldBevel({ pressed }: { pressed: boolean }) {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 40" pointerEvents="none">
      <Defs>
        <LinearGradient id={pressed ? 'goldBtnP' : 'goldBtn'} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={pressed ? '#E2B04E' : '#FFE7A3'} />
          <Stop offset="0.45" stopColor={pressed ? '#C9922E' : '#EFC160'} />
          <Stop offset="1" stopColor={pressed ? '#8A5A16' : '#B47A22'} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={100} height={40} fill={`url(#${pressed ? 'goldBtnP' : 'goldBtn'})`} />
      <Rect x={1.2} y={1.5} width={97.6} height={37} fill="none" stroke="#FFF3CC" strokeOpacity={0.55} strokeWidth={0.6} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  gold: { overflow: 'hidden', borderWidth: 2, minHeight: 54 },
  base: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  compact: { minHeight: 44, paddingHorizontal: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: 4 },
  /** rótulos longos quebram em duas linhas em vez de serem cortados (320 px) */
  label: { textAlign: 'center', flexShrink: 1 },
});
