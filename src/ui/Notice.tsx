import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from './AppText';

export function Notice({ tone = 'info', title, children }: { tone?: 'info' | 'warning' | 'error' | 'success'; title?: string; children: string }) {
  const { colors } = useTheme();
  const map = {
    info: { bg: colors.infoSurface, fg: colors.text, bar: colors.borderStrong },
    warning: { bg: colors.warningSurface, fg: colors.text, bar: colors.warning },
    error: { bg: colors.dangerSurface, fg: colors.text, bar: colors.danger },
    success: { bg: colors.successSurface, fg: colors.text, bar: colors.success },
  }[tone];
  return (
    <View
      accessibilityRole={tone === 'error' ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
      style={[styles.box, { backgroundColor: map.bg, borderLeftColor: map.bar }]}
    >
      {title ? <AppText variant="label">{title}</AppText> : null}
      <AppText variant="caption" color={map.fg}>{children}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.sm, borderLeftWidth: 4, padding: spacing.md, gap: 2 },
});
