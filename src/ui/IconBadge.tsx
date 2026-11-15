import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';

/** Insígnia para indicar a função de um atalho ou o estado de uma etapa. */
export function IconBadge({ name, color, size = 38 }: { name: IconName; color?: string; size?: number }) {
  const { colors } = useTheme();
  return (
    <View
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.badge, { width: size, height: size, borderColor: colors.border, backgroundColor: colors.stage }]}
    >
      <Icon name={name} color={color ?? colors.primary} size={size * 0.53} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexShrink: 0, borderWidth: 1, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
