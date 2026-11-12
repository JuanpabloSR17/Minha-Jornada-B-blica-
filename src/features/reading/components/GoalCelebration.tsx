import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText, Icon } from '@/ui';

/** Animação de meta cumprida (selo que cresce com brilho). Respeita "reduzir movimento". */
export function GoalCelebration({ title, subtitle }: { title: string; subtitle: string }) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(0.4)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const [reduce, setReduce] = useState(false);
  const native = Platform.OS !== 'web';

  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((r) => {
      if (!alive) return;
      setReduce(r);
      if (r) {
        scale.setValue(1);
        glow.setValue(1);
        return;
      }
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 4, tension: 80, useNativeDriver: native }),
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: native }),
          Animated.timing(glow, { toValue: 0.55, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: native }),
        ]),
      ]).start();
    }).catch(() => undefined);
    AccessibilityInfo.announceForAccessibility?.(`${title}. ${subtitle}`);
    return () => { alive = false; };
  }, [scale, glow, native, title, subtitle]);

  return (
    <View style={styles.wrap} accessible accessibilityLabel={`${title}. ${subtitle}`} testID="goal-celebration">
      <Animated.View style={[styles.halo, { backgroundColor: colors.primary, opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0, reduce ? 0.18 : 0.28] }), transform: [{ scale }] }]} />
      <Animated.View style={[styles.seal, { borderColor: colors.primary, backgroundColor: colors.surfaceRaised, transform: [{ scale }] }]}>
        <Icon name="check" size={44} color={colors.primary} />
      </Animated.View>
      <AppText variant="title" style={styles.center}>{title}</AppText>
      <AppText variant="label" color={colors.primary} style={styles.center}>{subtitle}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  halo: { position: 'absolute', top: spacing.md - 18, width: 132, height: 132, borderRadius: 66 },
  seal: { width: 96, height: 96, borderRadius: radius.pill, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
});
