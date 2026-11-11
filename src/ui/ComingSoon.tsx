import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { strings } from '@/i18n';
import { AppText } from './AppText';
import { Card } from './Card';

/** Bloco explicitamente sinalizado como ainda não implementado. */
export function ComingSoon({ title, body }: { title: string; body: string }) {
  const { colors } = useTheme();
  return (
    <Card style={{ borderStyle: 'dashed', borderColor: colors.borderStrong }}>
      <View style={styles.row}>
        <AppText variant="heading" style={styles.flex}>{title}</AppText>
        <View style={[styles.tag, { backgroundColor: colors.warningSurface }]}>
          <AppText variant="caption" color={colors.warning}>{strings.common.comingSoon}</AppText>
        </View>
      </View>
      <AppText variant="caption" muted>{body}</AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  tag: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
});
