import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { AppText, Icon } from '@/ui';
import { strings } from '@/i18n';
import { ItemIcon } from './ItemIcon';
import { RarityBadge, RARITY_COLOR } from './RarityBadge';
import type { ItemView } from '../domain/wardrobe';
import { displayName } from '../domain/catalog';

/** Cartão de inventário: ícone da peça, raridade, bloqueio, equipado e situação da arte. */
export const ItemCard = memo(function ItemCard({ view, selected, onPress, width }: { view: ItemView; selected: boolean; onPress: (v: ItemView) => void; width: number }) {
  const { colors } = useTheme();
  const { item } = view;
  const ring = selected ? colors.selection : item.rarity !== 'common' ? RARITY_COLOR[item.rarity] : colors.border;
  const status = view.equipped ? strings.wardrobe.equipped : view.locked ? strings.wardrobe.locked : strings.wardrobe.owned;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      aria-checked={selected}
      accessibilityLabel={`${item.name}, ${strings.rarity[item.rarity]}, ${status}`}
      accessibilityHint={view.locked ? item.unlockLabel : undefined}
      onPress={() => onPress(view)}
      style={({ pressed }) => [styles.card, { width, borderColor: ring, borderWidth: selected ? 3 : 1.5, backgroundColor: colors.surfaceRaised, opacity: pressed ? 0.85 : 1 }, selected && { shadowColor: colors.selection, shadowOpacity: 0.55, shadowRadius: 8 }]}
    >
      <View style={[styles.art, { height: width - 8, backgroundColor: colors.stage, opacity: view.locked ? 0.7 : 1 }]}>
        <ItemIcon item={item} size={width - 8} />
        <RarityBadge rarity={item.rarity} />
        {view.locked ? (
          <View style={[styles.corner, styles.br, { backgroundColor: colors.overlay }]}>
            <Icon name="lock" size={14} color="#FFFFFF" />
          </View>
        ) : null}
        {view.equipped ? (
          <View style={[styles.corner, styles.tr, { backgroundColor: colors.selection }]}>
            <Icon name="check" size={13} color={colors.onPrimary} />
          </View>
        ) : null}
        {view.art !== 'final' ? (
          <View style={[styles.artTag, { backgroundColor: colors.surfaceRaised }]}>
            <AppText variant="caption" style={styles.artTagText} muted>
              {view.art === 'missing' ? strings.wardrobe.artMissing : strings.wardrobe.artProvisional}
            </AppText>
          </View>
        ) : null}
      </View>
      <AppText variant="caption" numberOfLines={2} style={styles.label} color={selected ? colors.text : colors.textMuted}>
        {displayName(item)}
      </AppText>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: 3, gap: 3 },
  art: { borderRadius: radius.md, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  br: { bottom: 4, right: 4 },
  tr: { top: 4, right: 4 },
  artTag: { position: 'absolute', bottom: 3, left: 3, paddingHorizontal: 4, borderRadius: 4, opacity: 0.9 },
  artTagText: { fontSize: 9, lineHeight: 12 },
  label: { textAlign: 'center', minHeight: 30, fontSize: 12, lineHeight: 15 },
});
