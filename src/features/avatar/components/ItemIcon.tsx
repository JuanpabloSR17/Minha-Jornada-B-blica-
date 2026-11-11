import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon } from '@/ui';
import { AvatarRenderer } from './AvatarRenderer';
import type { AvatarCrop } from '../art/geometry';
import { hasArt } from '../art/manifest';
import { defaultLook } from '../domain/avatar.rules';
import type { AvatarAppearance, CosmeticItem, EquipmentSlot } from '../domain/avatar.types';

const CROP_BY_SLOT: Record<EquipmentSlot, AvatarCrop> = {
  outfit: 'outfit',
  back: 'back',
  feet: 'feet',
  waist: 'outfit',
  neck: 'bust',
  head: 'head',
  hands: 'hand',
  background: 'full',
  frame: 'full',
};

/** Peça isolada, como ícone de inventário (renderizada do mesmo manifest do avatar). */
export const ItemIcon = memo(function ItemIcon({ item, size, appearance }: { item: CosmeticItem; size: number; appearance?: AvatarAppearance }) {
  const { colors } = useTheme();
  const source = `${item.slot}/${item.id}`;
  if (!hasArt(source) && item.slot !== 'outfit' && item.slot !== 'back' && item.slot !== 'feet') {
    // sem arte e sem substituto visual: ícone genérico (item continua utilizável e visível)
    return (
      <View style={[styles.placeholder, { width: size, height: size }]}>
        <Icon name="sparkle" size={size * 0.4} color={colors.textMuted} />
      </View>
    );
  }
  return (
    <AvatarRenderer
      appearance={appearance ?? defaultLook().appearance}
      equippedItems={{ [item.slot]: item.id }}
      size={size}
      fillWidth={size}
      crop={CROP_BY_SLOT[item.slot]}
      showBackground={item.slot === 'background'}
      onlySources={[source]}
      accessibilityLabel={item.name}
    />
  );
});

const styles = StyleSheet.create({ placeholder: { alignItems: 'center', justifyContent: 'center' } });
