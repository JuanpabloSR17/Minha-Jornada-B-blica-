import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  style,
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
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        { backgroundColor: pressed ? palette.pressed : palette.bg, borderColor: palette.border, opacity: isDisabled ? 0.55 : 1 },
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? <ActivityIndicator color={palette.fg} /> : icon}
        <AppText variant="label" color={palette.fg} style={{ fontSize: compact ? 14 : 16 }} numberOfLines={1}>
          {title}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  compact: { minHeight: 44, paddingHorizontal: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
});
