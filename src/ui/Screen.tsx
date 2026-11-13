import { useEffect, useRef, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

/** Contêiner de tela: área segura, rolagem opcional e largura máxima na web/tablet. */
export function Screen({
  children,
  scroll = true,
  footer,
  edges = ['top', 'bottom', 'left', 'right'],
  contentStyle,
  scrollToTopKey,
}: {
  children: ReactNode;
  scroll?: boolean;
  footer?: ReactNode;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  /** quando muda, a rolagem volta ao topo (ex.: um capítulo escolhido em outra tela) */
  scrollToTopKey?: string | number | null;
}) {
  const { colors } = useTheme();
  const ref = useRef<{ scrollTo: (o: { y: number; animated: boolean }) => void } | null>(null);
  useEffect(() => {
    if (scrollToTopKey != null) ref.current?.scrollTo({ y: 0, animated: false });
  }, [scrollToTopKey]);
  const body = scroll ? (
    <ScrollView ref={ref as never} contentContainerStyle={[styles.content, contentStyle]} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.fill, contentStyle]}>{children}</View>
  );
  return (
    <SafeAreaView edges={edges} style={[styles.fill, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fill}>
        <View style={[styles.fill, styles.column]}>
          {body}
          {footer ? <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  column: { width: '100%', maxWidth: 560, alignSelf: 'center' },
  content: { padding: spacing.lg, gap: spacing.lg, flexGrow: 1 },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md, borderTopWidth: 1, gap: spacing.sm },
});
