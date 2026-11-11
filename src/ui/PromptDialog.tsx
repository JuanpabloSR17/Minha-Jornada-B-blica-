import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { strings } from '@/i18n';
import { AppText } from './AppText';
import { Button } from './Button';
import { TextField } from './TextField';

/** Diálogo com um campo de texto (ex.: nomear um visual). */
export function PromptDialog({
  visible,
  title,
  label,
  initial = '',
  confirmLabel = strings.common.save,
  maxLength = 30,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  label: string;
  initial?: string;
  confirmLabel?: string;
  maxLength?: number;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}) {
  const { colors } = useTheme();
  const [value, setValue] = useState(initial);
  // Redefine o texto só no momento em que o diálogo abre, ainda no render (sem mostrar o texto
  // anterior). Mudanças em `initial` com o diálogo aberto não apagam o que a pessoa digitou.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setValue(initial);
  }
  const ok = value.trim().length > 0;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <View accessibilityViewIsModal style={[styles.box, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
          <AppText variant="title">{title}</AppText>
          <TextField label={label} value={value} onChangeText={setValue} maxLength={maxLength} autoFocus onSubmitEditing={() => ok && onConfirm(value.trim())} />
          <View style={styles.row}>
            <Button title={strings.common.cancel} variant="secondary" onPress={onCancel} style={styles.flex} />
            <Button title={confirmLabel} onPress={() => onConfirm(value.trim())} disabled={!ok} style={styles.flex} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  box: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.xl, gap: spacing.md, width: '100%', maxWidth: 420, alignSelf: 'center' },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  flex: { flex: 1 },
});
