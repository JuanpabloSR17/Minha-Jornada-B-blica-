import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from './AppText';

type Props = TextInputProps & { label: string; hint?: string; error?: string | null; status?: { text: string; tone: 'ok' | 'bad' | 'muted' } | null };

export function TextField({ label, hint, error, status, secureTextEntry, style, ...rest }: Props) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [reveal, setReveal] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.focus : colors.border;
  return (
    <View style={styles.wrap}>
      <AppText variant="label">{label}</AppText>
      <View style={[styles.inputRow, { borderColor, backgroundColor: colors.surfaceRaised }]}>
        <TextInput
          accessibilityLabel={label}
          accessibilityHint={hint}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry && !reveal}
          onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
          style={[styles.input, { color: colors.text }, style]}
          maxFontSizeMultiplier={1.5}
          {...rest}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={reveal ? 'Ocultar senha' : 'Mostrar senha'}
            onPress={() => setReveal((v) => !v)}
            style={styles.reveal}
            hitSlop={8}
          >
            <AppText variant="caption" muted>{reveal ? 'Ocultar' : 'Mostrar'}</AppText>
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText variant="caption" color={colors.danger} accessibilityLiveRegion="polite">{error}</AppText>
      ) : status ? (
        <AppText variant="caption" color={status.tone === 'ok' ? colors.success : status.tone === 'bad' ? colors.danger : colors.textMuted} accessibilityLiveRegion="polite">
          {status.text}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" muted>{hint}</AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: radius.md },
  input: { flex: 1, minHeight: 50, paddingHorizontal: spacing.md, fontSize: 16 },
  reveal: { paddingHorizontal: spacing.md, minHeight: 44, justifyContent: 'center' },
});
