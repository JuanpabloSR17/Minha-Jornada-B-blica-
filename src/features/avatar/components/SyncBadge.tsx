import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText, Icon, type IconName } from '@/ui';

export type SyncState = 'guest' | 'local' | 'unsaved' | 'saving' | 'saved' | 'error';

const ICON: Record<SyncState, IconName> = {
  guest: 'device',
  local: 'device',
  unsaved: 'device',
  saving: 'cloud',
  saved: 'cloud',
  error: 'cloudOff',
};

/** Indica com honestidade onde o personagem está salvo. */
export function SyncBadge({ state, label, compact }: { state: SyncState; label: string; compact?: boolean }) {
  const { colors } = useTheme();
  const tone = state === 'error' ? colors.danger : state === 'saved' ? colors.success : colors.textMuted;
  return (
    <View accessibilityLiveRegion="polite" accessibilityLabel={label} style={[styles.badge, compact && styles.compact, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
      <Icon name={ICON[state]} size={16} color={tone} />
      <AppText variant="caption" color={tone} style={compact ? styles.compactText : undefined} numberOfLines={2}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  compact: { alignSelf: 'flex-start', maxWidth: 190, opacity: 0.94, paddingHorizontal: 10 },
  compactText: { fontSize: 11, lineHeight: 14, flexShrink: 1 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: radius.pill, borderWidth: 1, alignSelf: 'center' },
});
