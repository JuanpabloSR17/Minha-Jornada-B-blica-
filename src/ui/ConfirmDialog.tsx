import { Modal, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { strings } from '@/i18n';
import { AppText } from './AppText';
import { Button } from './Button';

/** Diálogo de confirmação com o mesmo visual em Android, iOS e web. */
export function ConfirmDialog({
  visible,
  title,
  body,
  confirmLabel = strings.common.confirm,
  onConfirm,
  onCancel,
  destructive,
}: {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}) {
  const { colors } = useTheme();
  // rótulos longos (ex.: "Pagar 180 Siclos") não cabem lado a lado em telas estreitas: empilha
  const stack = confirmLabel.length > 12;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <View accessibilityViewIsModal style={[styles.box, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
          <AppText variant="title">{title}</AppText>
          <AppText muted>{body}</AppText>
          <View style={stack ? styles.stack : styles.row}>
            <Button title={strings.common.cancel} variant="secondary" onPress={onCancel} style={stack ? undefined : styles.flex} />
            <Button title={confirmLabel} variant={destructive ? 'danger' : 'primary'} onPress={onConfirm} style={stack ? undefined : styles.flex} />
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
  stack: { flexDirection: 'column-reverse', gap: spacing.sm, marginTop: spacing.sm },
  flex: { flex: 1 },
});
