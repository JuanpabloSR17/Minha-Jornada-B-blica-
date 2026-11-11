import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';

/** Divisor decorativo em estilo de pergaminho. */
export function Ornament({ width = 180 }: { width?: number }) {
  const { colors } = useTheme();
  return (
    <Svg width={width} height={14} viewBox="0 0 180 14" accessibilityElementsHidden importantForAccessibility="no">
      <Path d="M4 7 H70 M110 7 H176" stroke={colors.borderStrong} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M90 1 L97 7 L90 13 L83 7 Z" fill={colors.accent} />
      <Circle cx={76} cy={7} r={2} fill={colors.accent} />
      <Circle cx={104} cy={7} r={2} fill={colors.accent} />
    </Svg>
  );
}
