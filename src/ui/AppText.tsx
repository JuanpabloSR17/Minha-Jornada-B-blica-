import { Text, type TextProps, type TextStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption';

const variantStyle: Record<Variant, TextStyle> = {
  display: { fontFamily: fonts.display, fontSize: 30, lineHeight: 38, letterSpacing: 0.5 },
  title: { fontFamily: fonts.display, fontSize: 22, lineHeight: 30, letterSpacing: 0.3 },
  heading: { fontFamily: fonts.displayRegular, fontSize: 17, lineHeight: 24 },
  body: { fontSize: 16, lineHeight: 23 },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18 },
};

export function AppText({
  variant = 'body',
  muted,
  color,
  style,
  ...rest
}: TextProps & { variant?: Variant; muted?: boolean; color?: string }) {
  const { colors } = useTheme();
  return (
    <Text
      maxFontSizeMultiplier={1.6}
      accessibilityRole={variant === 'display' || variant === 'title' ? 'header' : undefined}
      style={[variantStyle[variant], { color: color ?? (muted ? colors.textMuted : colors.text) }, style]}
      {...rest}
    />
  );
}
