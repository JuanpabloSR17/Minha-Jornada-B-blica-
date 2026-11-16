import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { bodyFamily, fonts } from '@/theme/tokens';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption';

const variantStyle: Record<Variant, TextStyle> = {
  display: { fontFamily: fonts.display, fontSize: 30, lineHeight: 38, letterSpacing: 0.5 },
  title: { fontFamily: fonts.display, fontSize: 22, lineHeight: 30, letterSpacing: 0.3 },
  // títulos de seção em Atkinson Bold (legíveis em qualquer tamanho); Cinzel fica nos títulos curtos
  heading: { fontSize: 18, lineHeight: 25, fontWeight: '700' },
  body: { fontSize: 17, lineHeight: 26 },
  label: { fontSize: 15, lineHeight: 21, fontWeight: '700' },
  caption: { fontSize: 14, lineHeight: 20 },
};

export function AppText({
  variant = 'body',
  muted,
  color,
  style,
  ...rest
}: TextProps & { variant?: Variant; muted?: boolean; color?: string }) {
  const { colors } = useTheme();
  const flat = StyleSheet.flatten([variantStyle[variant], style]) ?? {};
  // sem família própria (Cinzel), o peso escolhe o arquivo da Atkinson
  const family = flat.fontFamily ? null : { fontFamily: bodyFamily(flat.fontWeight), fontWeight: 'normal' as const };
  return (
    <Text
      maxFontSizeMultiplier={1.6}
      accessibilityRole={variant === 'display' || variant === 'title' ? 'header' : undefined}
      style={[variantStyle[variant], { color: color ?? (muted ? colors.textMuted : colors.text) }, style, family]}
      {...rest}
    />
  );
}
