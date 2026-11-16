import { useEffect, useId, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, spacing } from '@/theme/tokens';
import { AppText, Card, Icon } from '@/ui';
import { readingLevel } from '../progression';

export function ReadingRank({ xpTotal }: { xpTotal: number }) {
  const { colors, reduceMotion } = useTheme();
  const rank = readingLevel(xpTotal);
  const gradientId = `rank${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const fraction = rank.currentXp / rank.xpForLevel;
  const animated = useRef(new Animated.Value(reduceMotion ? fraction : 0)).current;
  useEffect(() => {
    if (reduceMotion) {
      animated.setValue(fraction);
      return;
    }
    const enter = Animated.timing(animated, {
      toValue: fraction, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    });
    enter.start();
    return () => enter.stop();
  }, [animated, fraction, reduceMotion]);

  return (
    <Card style={[styles.card, { borderColor: colors.borderStrong }]} testID="reading-rank">
      <View pointerEvents="none" aria-hidden style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={colors.surfaceRaised} />
              <Stop offset="100%" stopColor={colors.backgroundAlt} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
        </Svg>
      </View>
      <View style={styles.row}>
        <View aria-hidden style={styles.emblem}>
          <Svg width="100%" height="100%" viewBox="0 0 60 64" style={StyleSheet.absoluteFill}>
            <Path d="M30 2 56 9v23c0 13-10 23-26 30C14 55 4 45 4 32V9Z" fill={colors.background}
              stroke={colors.primary} strokeWidth={1.5} />
            <Path d="M30 7 51 13v19c0 10-7 20-21 25-14-5-21-15-21-25V13Z" fill={colors.stage}
              stroke={colors.borderStrong} strokeWidth={1} />
            <Path d="M25 47h10M27 51h6" stroke={colors.primary} strokeWidth={1} />
          </Svg>
          <View style={styles.rankIcon}><Icon name={rank.rankIcon} size={26} color={colors.primary} /></View>
        </View>
        <View style={styles.main}>
          <AppText variant="caption" color={colors.primary}>Nível {rank.level}</AppText>
          <AppText variant="heading" accessibilityRole="header" style={styles.title}>{rank.title}</AppText>
          <AppText variant="caption" muted>XP acumulado · {rank.xpTotal.toLocaleString('pt-BR')}</AppText>
        </View>
      </View>
      <View style={styles.xp}>
        <View style={styles.row}>
          <AppText variant="caption" style={styles.main}>Nível {rank.level + 1}</AppText>
          <AppText variant="caption" color={colors.primary}>{rank.currentXp} / {rank.xpForLevel} XP</AppText>
        </View>
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={`Experiência para o nível ${rank.level + 1}`}
          accessibilityValue={{ min: 0, max: rank.xpForLevel, now: rank.currentXp }}
          style={[styles.track, { borderColor: colors.border, backgroundColor: colors.background }]}
        >
          <Animated.View aria-hidden style={[
            styles.fill,
            { backgroundColor: colors.primary, width: animated.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
          ]} />
        </View>
        <AppText variant="caption" muted>{rank.remainingXp === 1 ? 'Falta 1 XP' : `Faltam ${rank.remainingXp} XP`}</AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', borderWidth: 1.5 },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  emblem: { width: 60, height: 64, alignItems: 'center', justifyContent: 'center', paddingBottom: 7 },
  rankIcon: { zIndex: 1 },
  title: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28 },
  main: { flex: 1, minWidth: 100 },
  xp: { gap: spacing.xs },
  track: { height: 10, borderRadius: radius.pill, overflow: 'hidden', borderWidth: 1 },
  fill: { height: '100%', borderRadius: radius.pill },
});
