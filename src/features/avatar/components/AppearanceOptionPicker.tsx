import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText, Icon } from '@/ui';
import { strings } from '@/i18n';
import { AvatarRenderer } from './AvatarRenderer';
import type { AvatarCrop } from '../art/geometry';
import type { AvatarLook } from '../domain/avatar.types';

export type PickerOption = {
  id: string | null;
  label: string;
  /** visual a desenhar na miniatura (prévia do resultado da escolha) */
  look?: AvatarLook;
  color?: string;
};

const THUMB_H: Record<AvatarCrop, number> = { full: 104, bust: 74, lower: 74 };

const OptionTile = memo(function OptionTile({
  option,
  selected,
  onSelect,
  display,
  crop,
}: {
  option: PickerOption;
  selected: boolean;
  onSelect: (id: string | null) => void;
  display: 'swatch' | 'thumb';
  crop: AvatarCrop;
}) {
  const { colors } = useTheme();
  const ring = selected ? colors.primary : colors.border;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      aria-checked={selected}
      accessibilityLabel={option.label}
      onPress={() => onSelect(option.id)}
      style={({ pressed }) => [styles.tile, display === 'swatch' && styles.swatchTile, { opacity: pressed ? 0.75 : 1 }]}
    >
      {display === 'swatch' ? (
        <View style={[styles.swatchRing, { borderColor: ring }]}>
          <View style={[styles.swatch, { backgroundColor: option.color ?? colors.border }]} />
        </View>
      ) : (
        <View style={[styles.thumb, { borderColor: ring, backgroundColor: colors.stage, borderWidth: selected ? 3 : 1.5 }]}>
          {option.look ? (
            <AvatarRenderer appearance={option.look.appearance} equippedItems={option.look.equipment} size={THUMB_H[crop]} crop={crop} showBackground={false} accessibilityLabel={option.label} />
          ) : (
            <View style={{ height: THUMB_H[crop], justifyContent: 'center' }}>
              <AppText variant="caption" muted>{strings.creator.none}</AppText>
            </View>
          )}
        </View>
      )}
      {selected ? (
        <View style={[styles.check, { backgroundColor: colors.primary }]}>
          <Icon name="check" size={14} color={colors.onPrimary} />
        </View>
      ) : null}
      <AppText variant="caption" numberOfLines={2} style={styles.label} color={selected ? colors.text : colors.textMuted}>
        {option.label}
      </AppText>
    </Pressable>
  );
});

/** Grade de opções com miniatura ao vivo ou amostra de cor. */
export function AppearanceOptionPicker({
  options,
  value,
  onSelect,
  display,
  crop,
  label,
}: {
  options: PickerOption[];
  value: string | null;
  onSelect: (id: string | null) => void;
  display: 'swatch' | 'thumb';
  crop: AvatarCrop;
  label: string;
}) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.grid}>
      {options.map((o) => (
        <OptionTile key={o.id ?? 'none'} option={o} selected={o.id === value} onSelect={onSelect} display={display} crop={crop} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-start' },
  tile: { width: 76, alignItems: 'center', gap: 4 },
  swatchTile: { width: 64 },
  thumb: { width: 76, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingVertical: 2 },
  swatchRing: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  swatch: { width: 44, height: 44, borderRadius: 22 },
  check: { position: 'absolute', top: -4, right: -2, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  label: { textAlign: 'center' },
});
