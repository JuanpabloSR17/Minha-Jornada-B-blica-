import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui';

export function GroupTabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.row} accessibilityRole="tablist">
      {items.map((it) => {
        const active = it.id === value;
        return (
          <Pressable
            key={it.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            aria-selected={active}
            onPress={() => onChange(it.id)}
            style={[styles.tab, { backgroundColor: active ? colors.surfaceRaised : colors.surface, borderColor: active ? colors.selection : colors.border, borderWidth: active ? 2 : 1 }]}
          >
            <AppText variant="label" color={colors.text}>{it.label}</AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0, flexShrink: 0 },
  row: { gap: spacing.sm, paddingVertical: 2, alignItems: 'center' },
  tab: { minHeight: 40, paddingHorizontal: spacing.lg, borderRadius: radius.pill, borderWidth: 1.5, justifyContent: 'center' },
});
