import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText, Icon, type IconName } from '@/ui';

/** Barra de categorias com ícone (Corpo, Rosto, Cabelo, Visual). */
export function CategoryBar<T extends string>({
  items,
  value,
  onChange,
  doneUpTo,
  compact,
}: {
  items: { id: T; label: string; icon: IconName }[];
  value: T;
  onChange: (id: T) => void;
  /** índice da última etapa já visitada (as seguintes ficam esmaecidas no onboarding) */
  doneUpTo?: number;
  compact?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.bar, { backgroundColor: colors.backgroundAlt }]} accessibilityRole="tablist">
      {items.map((it, i) => {
        const active = it.id === value;
        const dim = doneUpTo !== undefined && i > doneUpTo;
        return (
          <Pressable
            key={it.id}
            accessibilityRole="tab"
            accessibilityLabel={it.label}
            accessibilityState={{ selected: active, disabled: dim }}
            aria-selected={active}
            disabled={dim}
            onPress={() => onChange(it.id)}
            style={[styles.tab, compact && styles.tabCompact, active && { backgroundColor: colors.surfaceRaised, borderColor: colors.borderStrong }, dim && { opacity: 0.45 }]}
          >
            <Icon name={it.icon} size={20} color={active ? colors.selection : colors.textMuted} />
            {!compact || active ? (
              <AppText variant="caption" color={active ? colors.text : colors.textMuted} style={styles.label} numberOfLines={1}>
                {it.label}
              </AppText>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderRadius: radius.lg, padding: 4, gap: 4 },
  tab: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, borderWidth: 1.5, borderColor: 'transparent', gap: 1 },
  tabCompact: { minHeight: 40 },
  label: { fontSize: 12, fontWeight: '600' },
});
