import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui';
import { AvatarRenderer } from './AvatarRenderer';
import type { AvatarLook } from '../domain/avatar.types';

/**
 * Tamanhos padronizados do avatar (o mesmo visual salvo em todas as telas):
 *  - AvatarBadge  (pequeno): rankings e listas de amigos — retrato em círculo
 *  - AvatarCard   (médio):   cartões, desafios e visuais salvos — corpo inteiro com nome
 *  - AvatarStage  (grande):  perfil e personalização (components/AvatarStage)
 */
export function AvatarBadge({ look, size = 48, label }: { look: AvatarLook; size?: number; label?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2, borderColor: colors.borderStrong, backgroundColor: colors.stage }]}>
      <AvatarRenderer appearance={look.appearance} equippedItems={look.equipment} size={size} fillWidth={size} crop="bust" showBackground={false} accessibilityLabel={label} />
    </View>
  );
}

export function AvatarCard({ look, title, subtitle, height = 220, width = 150 }: { look: AvatarLook; title?: string; subtitle?: string; height?: number; width?: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { width, backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
      <View style={[styles.cardArt, { height, backgroundColor: colors.stage }]}>
        <AvatarRenderer appearance={look.appearance} equippedItems={look.equipment} size={height} fillWidth={width - 8} accessibilityLabel={title} />
      </View>
      {title ? <AppText variant="label" numberOfLines={1}>{title}</AppText> : null}
      {subtitle ? <AppText variant="caption" muted numberOfLines={1}>{subtitle}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { overflow: 'hidden', borderWidth: 2 },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: 4, gap: 2, paddingBottom: spacing.sm },
  cardArt: { borderRadius: radius.md, overflow: 'hidden', alignItems: 'center' },
});
