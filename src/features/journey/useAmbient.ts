import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export const nativeDriver = Platform.OS !== 'web';

/**
 * Movimento ambiente em laço (fogo, respiração do personagem). Com "reduzir movimento"
 * o valor fica parado no meio do ciclo: a cena aparece igual, só que estática.
 */
export function useAmbient(period = 1600, delay = 0) {
  const { reduceMotion } = useTheme();
  const v = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    if (reduceMotion) {
      v.setValue(0.5);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, { toValue: 1, duration: period * 0.45, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }),
        Animated.timing(v, { toValue: 0.15, duration: period * 0.3, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }),
        Animated.timing(v, { toValue: 0.5, duration: period * 0.25, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, reduceMotion, period, delay]);
  return v;
}
