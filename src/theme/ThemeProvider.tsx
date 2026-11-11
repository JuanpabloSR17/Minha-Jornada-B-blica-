import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';
import { darkColors, lightColors, type ThemeColors } from './tokens';

type Theme = { colors: ThemeColors; dark: boolean; reduceMotion: boolean };

const ThemeContext = createContext<Theme>({ colors: lightColors, dark: false, reduceMotion: false });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.().then(setReduceMotion).catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduceMotion);
    return () => sub?.remove();
  }, []);
  const value = useMemo(
    () => ({ colors: scheme === 'dark' ? darkColors : lightColors, dark: scheme === 'dark', reduceMotion }),
    [scheme, reduceMotion],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
