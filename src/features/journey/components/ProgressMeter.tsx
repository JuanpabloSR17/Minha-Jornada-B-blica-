import { useEffect, useId, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { radius } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { glassTones, type GlassTone } from './GlassPanel';

export function ProgressMeter({ value, total, label, tone = 'reading', height = 9, from, style }: {
  value: number;
  total: number;
  label?: string;
  tone?: GlassTone;
  height?: number;
  from?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { dark, colors, reduceMotion } = useTheme();
  const max = Math.max(1, total);
  const now = Math.max(0, Math.min(value, total));
  const fraction = now / max;
  const initial = reduceMotion || from === undefined ? fraction : Math.max(0, Math.min(1, from / max));
  const fill = useRef(new Animated.Value(initial)).current;
  const tint = glassTones[tone];
  const id = `meter${useId().replace(/[^a-z0-9]/gi, '')}`;

  useEffect(() => {
    if (reduceMotion) {
      fill.setValue(fraction);
      return;
    }
    const animation = Animated.timing(fill, {
      toValue: fraction, duration: 440, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [fill, fraction, reduceMotion]);

  return (
    <View style={[
      styles.track,
      { height, backgroundColor: colors.background, borderColor: dark ? `${tint.mid}44` : colors.border },
      style,
    ]} accessible={!!label} accessibilityRole={label ? 'progressbar' : undefined} aria-hidden={!label}
      accessibilityLabel={label} aria-valuemin={label ? 0 : undefined}
      aria-valuemax={label ? max : undefined} aria-valuenow={label ? now : undefined}>
      <Animated.View style={[
        styles.fill,
        { backgroundColor: tint.mid, width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
      ]}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={id} x1="0%" x2="100%" y1="0%" y2="100%">
              <Stop offset="0%" stopColor={tint.deep} />
              <Stop offset="78%" stopColor={tint.mid} />
              <Stop offset="100%" stopColor={tint.light} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#${id})`} />
        </Svg>
        <View style={styles.glint} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: radius.pill, borderWidth: 1, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill, overflow: 'hidden' },
  glint: { position: 'absolute', top: 1, left: 3, right: 3, height: 1, backgroundColor: 'rgba(255,255,255,0.55)' },
});
