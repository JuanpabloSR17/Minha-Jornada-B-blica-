import { memo, useEffect, useRef, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText, Icon } from '@/ui';
import { strings } from '@/i18n';
import { AvatarRenderer } from './AvatarRenderer';
import { RarityBadge, RARITY_COLOR } from './RarityBadge';
import type { AvatarCrop } from '../art/geometry';
import type { AvatarLook, Rarity } from '../domain/avatar.types';

export type CarouselOption = {
  id: string | null;
  label: string;
  /** visual desenhado no cartão */
  look?: AvatarLook;
  /** desenha só estas origens (peça isolada, como ícone de inventário) */
  onlySources?: string[];
  crop?: AvatarCrop;
  color?: string;
  rarity?: Rarity;
  locked?: boolean;
  hint?: string;
};

const CARD = { w: 96, h: 96 };
const CARD_COMPACT = { w: 78, h: 70 };

const Card = memo(function Card({ option, selected, onSelect, compact }: { option: CarouselOption; selected: boolean; onSelect: (o: CarouselOption) => void; compact?: boolean }) {
  const { colors } = useTheme();
  const dim = compact ? CARD_COMPACT : CARD;
  const ring = selected ? colors.selection : option.rarity && option.rarity !== 'common' ? RARITY_COLOR[option.rarity] : colors.border;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      aria-checked={selected}
      accessibilityLabel={option.label}
      accessibilityHint={option.locked ? option.hint : undefined}
      onPress={() => onSelect(option)}
      style={({ pressed }) => [styles.card, { width: dim.w, borderColor: ring, borderWidth: selected ? 3 : 1.5, backgroundColor: colors.surfaceRaised, transform: [{ scale: pressed ? 0.96 : 1 }] }, selected && { shadowColor: colors.selection, shadowOpacity: 0.55, shadowRadius: 8 }]}
    >
      <View style={[styles.art, { width: dim.w - 6, height: dim.h, backgroundColor: colors.stage }]}>
        {option.look ? (
          <AvatarRenderer
            appearance={option.look.appearance}
            equippedItems={option.look.equipment}
            size={dim.h}
            crop={option.crop ?? 'bust'}
            fillWidth={dim.w - 6}
            showBackground={false}
            onlySources={option.onlySources}
            accessibilityLabel={option.label}
          />
        ) : (
          <Icon name="none" size={30} color={colors.textMuted} />
        )}
        {option.rarity ? <RarityBadge rarity={option.rarity} /> : null}
        {option.locked ? (
          <View style={[styles.lock, { backgroundColor: colors.overlay }]}>
            <Icon name="lock" size={16} color="#FFFFFF" />
          </View>
        ) : null}
        {selected ? (
          <View style={[styles.check, { backgroundColor: colors.selection }]}>
            <Icon name="check" size={13} color={colors.onPrimary} />
          </View>
        ) : null}
      </View>
      <AppText variant="caption" numberOfLines={2} style={[styles.label, compact && styles.labelCompact]} color={selected ? colors.text : colors.textMuted}>
        {option.label}
      </AppText>
    </Pressable>
  );
});

/** Carrossel horizontal de peças/opções em cartões grandes (não uma grade de bonecos). */
export function OptionCarousel({ options, value, onSelect, label, compact }: { options: CarouselOption[]; value: string | null; onSelect: (o: CarouselOption) => void; label: string; compact?: boolean }) {
  const ref = useRef<ComponentRef<typeof ScrollView>>(null);
  const index = options.findIndex((o) => o.id === value);
  useEffect(() => {
    if (index > 1) ref.current?.scrollTo({ x: (index - 1) * ((compact ? CARD_COMPACT.w : CARD.w) + spacing.md), animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);
  return (
    <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((o) => (
        <Card key={o.id ?? 'none'} option={o} selected={o.id === value} onSelect={onSelect} compact={compact} />
      ))}
    </ScrollView>
  );
}

/** Amostras de cor grandes, em linha. */
export function ColorSwatches({ options, value, onSelect, label }: { options: { id: string; label: string; color?: string }[]; value: string; onSelect: (id: string) => void; label: string }) {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.swatchRow} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((o) => {
        const selected = o.id === value;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            aria-checked={selected}
            accessibilityLabel={o.label}
            onPress={() => onSelect(o.id)}
            style={styles.swatchItem}
          >
            <View style={[styles.swatchRing, { borderColor: selected ? colors.selection : 'transparent' }]}>
              <View style={[styles.swatch, { backgroundColor: o.color ?? colors.border, borderColor: colors.border }]} />
            </View>
            <AppText variant="caption" muted={!selected} numberOfLines={1} style={styles.swatchLabel}>{o.label}</AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export const noneOptionLabel = strings.creator.none;

const styles = StyleSheet.create({
  row: { gap: spacing.md, paddingVertical: 4, paddingRight: spacing.lg },
  card: { borderRadius: radius.lg, padding: 3, gap: 4, alignItems: 'center' },
  art: { borderRadius: radius.md, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  label: { textAlign: 'center', minHeight: 32, paddingHorizontal: 2 },
  labelCompact: { fontSize: 11, lineHeight: 13, minHeight: 26 },
  lock: { position: 'absolute', bottom: 4, right: 4, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  check: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  swatchRow: { gap: spacing.md, paddingVertical: 6, paddingRight: spacing.lg },
  swatchItem: { alignItems: 'center', gap: 4, width: 64 },
  swatchRing: { width: 60, height: 60, borderRadius: 30, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  swatch: { width: 48, height: 48, borderRadius: 24, borderWidth: 1 },
  swatchLabel: { fontSize: 11 },
});
