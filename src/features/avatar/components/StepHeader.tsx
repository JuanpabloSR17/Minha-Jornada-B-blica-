import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { AppText, Icon } from '@/ui';
import { strings } from '@/i18n';

export function StepHeader({
  title,
  right,
  onBack,
  progress,
}: {
  title: string;
  right?: string;
  onBack?: () => void;
  progress?: { current: number; total: number };
}) {
  const { colors } = useTheme();
  const narrow = useWindowDimensions().width < 370;
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable accessibilityRole="button" accessibilityLabel={strings.common.back} onPress={onBack} hitSlop={10} style={styles.back}>
            <Icon name="back" color={colors.text} size={24} />
          </Pressable>
        ) : null}
        <AppText variant="title" style={[styles.title, narrow && styles.titleNarrow]} numberOfLines={2}>{title}</AppText>
        {right ? <AppText variant="label" muted>{right}</AppText> : null}
      </View>
      {progress ? (
        <View style={styles.bar} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: progress.total, now: progress.current }}>
          {Array.from({ length: progress.total }, (_, i) => (
            <View key={i} style={[styles.segment, { backgroundColor: i < progress.current ? colors.accent : colors.border }]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -10 },
  title: { flex: 1 },
  titleNarrow: { fontSize: 18, lineHeight: 24 },
  bar: { flexDirection: 'row', gap: 6 },
  segment: { flex: 1, height: 5, borderRadius: 3 },
});
