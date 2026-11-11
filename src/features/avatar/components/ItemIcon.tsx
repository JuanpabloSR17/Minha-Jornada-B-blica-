import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { Icon } from '@/ui';
import { RARITY_COLOR } from './RarityBadge';
import { AvatarRenderer } from './AvatarRenderer';
import type { AvatarCrop } from '../art/geometry';
import { hasArt } from '../art/manifest';
import { defaultLook } from '../domain/avatar.rules';
import type { AvatarAppearance, CosmeticItem, ItemSlot } from '../domain/avatar.types';

const CROP_BY_SLOT: Record<ItemSlot, AvatarCrop> = {
  relic: 'full',
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
  const source = `${item.slot}/${item.id}`;
  if (!hasArt(source)) {
    // sem arte e sem substituto visual: ícone genérico (item continua utilizável e visível)
    // sem arte e sem substituto visual: emblema da raridade (provisório, sinalizado na interface)
    const color = RARITY_COLOR[item.rarity];
    return (
      <View style={[styles.placeholder, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id={`glow-${item.id}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={color} stopOpacity={item.rarity === 'holy' ? 0.55 : 0.35} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={50} cy={50} r={46} fill={`url(#glow-${item.id})`} />
          <Circle cx={50} cy={50} r={30} fill="none" stroke={color} strokeWidth={2.5} strokeDasharray={item.slot === 'relic' ? '0' : '5 4'} />
          {item.rarity === 'holy' ? <Path d="M50 8 L54 20 L50 17 L46 20 Z M50 92 L54 80 L50 83 L46 80 Z M8 50 L20 46 L17 50 L20 54 Z M92 50 L80 46 L83 50 L80 54 Z" fill={color} /> : null}
        </Svg>
        <Icon name="sparkle" size={size * 0.34} color={color} />
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
