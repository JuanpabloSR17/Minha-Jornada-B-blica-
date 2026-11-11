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
export function SyncBadge({ state, label }: { state: SyncState; label: string }) {
  const { colors } = useTheme();
  const tone = state === 'error' ? colors.danger : state === 'saved' ? colors.success : colors.textMuted;
  return (
    <View accessibilityLiveRegion="polite" accessibilityLabel={label} style={[styles.badge, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
      <Icon name={ICON[state]} size={16} color={tone} />
      <AppText variant="caption" color={tone}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: radius.pill, borderWidth: 1, alignSelf: 'center' },
});
