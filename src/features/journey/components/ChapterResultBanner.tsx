import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText, IconBadge } from '@/ui';
import { nativeDriver } from '../useAmbient';
import { readingLevel } from '../progression';
import type { MissionResult } from '@/features/reading/mission/mission.service';

export function ChapterResultBanner({ result }: { result: MissionResult }) {
  const { reduceMotion } = useTheme();
  const effect = useRef(new Animated.Value(1)).current;
  const fresh = !result.alreadyCompleted && !result.duplicate;
  const xp = result.xpAwarded + (result.dailyGoal?.achievedNow ? result.dailyGoal.xpBonus ?? 0 : 0);
  const level = readingLevel(result.xpTotal);
  const levelUp = fresh && level.level > readingLevel(result.xpTotal - xp).level;

  useEffect(() => {
    if (!fresh || reduceMotion) {
      effect.setValue(1);
      return;
    }
    effect.setValue(0);
    const animation = Animated.timing(effect, {
      toValue: 1, duration: 580, easing: Easing.out(Easing.cubic), useNativeDriver: nativeDriver,
    });
    animation.start();
    return () => animation.stop();
  }, [effect, fresh, reduceMotion, result.sessionId]);

  return (
    <View style={styles.shell} testID="chapter-result-banner">
      <Animated.View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden pointerEvents="none"
        style={[styles.light, { opacity: effect.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0.05, 0.72, 0.18] }) }]} />
      <Animated.View style={[styles.symbol, { transform: [{ scale: effect.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0.84, 1.07, 1] }) }] }]}>
        <IconBadge name={levelUp || result.bookJustCompleted ? 'medal' : result.alreadyCompleted ? 'book' : 'flag'} color="#F9CB75" size={53} />
      </Animated.View>
      <View style={styles.text}>
        <AppText variant="caption" color="#E4CBF7">{levelUp ? `Nível ${level.level} alcançado` : result.alreadyCompleted ? 'Releitura registrada' : result.bookJustCompleted ? 'Livro concluído' : 'Progresso registrado'}</AppText>
        <AppText variant="heading" color="#FFF0D0">{levelUp ? level.title : result.book.name}</AppText>
        <AppText variant="label" color="#FFF0D0">{fresh ? `${result.book.completed - 1} → ${result.book.completed} de ${result.book.total} capítulos lidos` : `${result.book.completed} de ${result.book.total} capítulos lidos`}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { borderWidth: 1.5, borderColor: '#BC87E6', borderRadius: radius.lg, backgroundColor: '#211533', padding: spacing.md, gap: spacing.md, alignItems: 'center', flexDirection: 'row', overflow: 'hidden' },
  symbol: { alignItems: 'center', justifyContent: 'center' },
  light: { position: 'absolute', width: 170, height: 160, borderRadius: 92, top: -115, left: -22, backgroundColor: '#9E64D5' },
  text: { flex: 1, minWidth: 0, gap: 2 },
});
