import { useId } from 'react';
import { Platform, StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

export const glassTones = {
  xp: { light: '#E0C9FF', mid: '#AB7CFF', deep: '#6539C0' },
  reading: { light: '#BAF2FF', mid: '#59CEEC', deep: '#2873B5' },
  gold: { light: '#FFE0A1', mid: '#FFC565', deep: '#A96328' },
  complete: { light: '#C5F2C5', mid: '#7CDDB4', deep: '#267B65' },
} as const;

export type GlassTone = keyof typeof glassTones;

// Blur is an enhancement for glass placed over illustrated scenery on the web.
const backdropStyle = Platform.OS === 'web'
  ? ({ backdropFilter: 'blur(16px) saturate(135%)' } as ViewStyle)
  : undefined;

export function GlassPanel({ tone = 'gold', overArt = false, style, children, ...props }: ViewProps & {
  tone?: GlassTone;
  overArt?: boolean;
}) {
  const { colors, dark } = useTheme();
  const tint = glassTones[tone];
  const id = `glass${useId().replace(/[^a-z0-9]/gi, '')}`;
  return (
    <View {...props} style={[
      styles.panel,
      { backgroundColor: dark ? (overArt ? 'rgba(13, 16, 36, 0.83)' : '#161926') : colors.surface,
        borderColor: dark ? `${tint.mid}65` : colors.border },
      overArt && dark && backdropStyle,
      style,
    ]}>
      {dark ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none" aria-hidden importantForAccessibility="no-hide-descendants">
          <Svg width="100%" height="100%">
            <Defs>
              <RadialGradient id={`${id}halo`} cx="9%" cy="0%" rx="100%" ry="105%">
                <Stop offset="0%" stopColor={tint.mid} stopOpacity={0.22} />
                <Stop offset="100%" stopColor={tint.deep} stopOpacity={0} />
              </RadialGradient>
              <LinearGradient id={`${id}rim`} x1="0%" x2="100%" y1="0%" y2="0%">
                <Stop offset="0%" stopColor={tint.light} stopOpacity={0} />
                <Stop offset="42%" stopColor={tint.light} stopOpacity={0.8} />
                <Stop offset="100%" stopColor={tint.light} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill={`url(#${id}halo)`} />
            <Rect x="8%" width="84%" height={1} fill={`url(#${id}rim)`} />
          </Svg>
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { padding: spacing.lg, gap: spacing.md, borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
});
