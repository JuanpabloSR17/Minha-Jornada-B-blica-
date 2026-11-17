import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { AppText } from '@/ui';
import { fonts } from '@/theme/tokens';
import { AvatarRenderer } from './AvatarRenderer';
import { ItemIcon } from './ItemIcon';
import { getItem, itemHasArt } from '../domain/catalog';
import type { AvatarAppearance } from '../domain/avatar.types';

/** Espaços que aparecem pintados no retrato (busto); os demais aparecem só como emblema/ícone. */
export const PORTRAIT_SLOTS = ['head', 'neck', 'back', 'outfit', 'chest'] as const;
export const SLOT_ORDER: { slot: string; label: string }[] = [
  { slot: 'head', label: 'Cabeça' },
  { slot: 'neck', label: 'Pescoço' },
  { slot: 'back', label: 'Manto' },
  { slot: 'outfit', label: 'Túnica' },
  { slot: 'hands', label: 'Mão' },
  { slot: 'waist', label: 'Cintura' },
  { slot: 'feet', label: 'Pés' },
];

/** O item aparece desenhado no retrato (e não só no espaço ao lado)? */
export function inPortrait(slot: string, id?: string | null) {
  const it = getItem(id);
  return !!it && (PORTRAIT_SLOTS as readonly string[]).includes(slot) && itemHasArt(it);
}

/**
 * Quadro do Viajante: o personagem do peito para cima numa moldura fixa (4:5), sem nada fora do
 * recorte. O item de mão aparece como emblema no canto do quadro, sem pose nem encaixe.
 */
export function TravelerPortrait({
  appearance,
  equipment,
  width,
  name,
  lighting = 'neutral',
}: {
  appearance: AvatarAppearance;
  equipment: Record<string, string | undefined>;
  width: number;
  name?: string;
  lighting?: 'neutral' | 'camp';
}) {
  const frame = Math.max(8, Math.round(width * 0.035));
  const innerW = width - frame * 2;
  const innerH = Math.round(innerW * 1.25);
  const hand = getItem(equipment.hands);
  const emblem = Math.round(width * 0.27);
  const night = lighting === 'camp';
  return (
    <View style={{ width, alignItems: 'center' }} testID="traveler-portrait">
      <View style={[styles.frame, { padding: frame, borderRadius: frame * 1.6 }]}>
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 10 10" pointerEvents="none">
          <Defs>
            <LinearGradient id="pfFrame" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#F2D58A" />
              <Stop offset="0.35" stopColor="#B4892F" />
              <Stop offset="0.7" stopColor="#7A5418" />
              <Stop offset="1" stopColor="#D9B25A" />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={10} height={10} fill="url(#pfFrame)" />
        </Svg>
        <View style={[styles.inner, { width: innerW, height: innerH, borderRadius: frame }]}>
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 10 10" pointerEvents="none">
            <Defs>
              <RadialGradient id={night ? 'pfNight' : 'pfDay'} cx="0.5" cy="0.35" r="0.75">
                <Stop offset="0" stopColor={night ? '#3A2F52' : '#F4E7C8'} />
                <Stop offset="1" stopColor={night ? '#0E1022' : '#CDB487'} />
              </RadialGradient>
            </Defs>
            <Rect x={0} y={0} width={10} height={10} fill={`url(#${night ? 'pfNight' : 'pfDay'})`} />
          </Svg>
          <View style={styles.figure} pointerEvents="none">
            <AvatarRenderer
              appearance={appearance}
              equippedItems={equipment}
              size={innerH}
              crop="portrait"
              lighting={lighting}
              showBackground={false}
              accessibilityLabel={name ? `Retrato de ${name}` : 'Retrato do personagem'}
            />
          </View>
        </View>
        {hand ? (
          <View style={[styles.emblem, { width: emblem, height: emblem, right: -emblem * 0.18, bottom: -emblem * 0.18, borderRadius: emblem / 2 }]} testID="portrait-emblem">
            <ItemIcon item={hand} size={Math.round(emblem * 0.78)} />
          </View>
        ) : null}
      </View>
      {name ? <AppText style={styles.name} color="#F6ECD6">{name}</AppText> : null}
    </View>
  );
}

/** Espaços de equipamento ao redor do quadro: ícone do item, nome curto e se ele aparece no retrato. */
export function EquipmentSlots({
  equipment,
  onPressSlot,
  columns = 4,
  width,
}: {
  equipment: Record<string, string | undefined>;
  onPressSlot?: (slot: string) => void;
  columns?: number;
  width: number;
}) {
  const gap = 8;
  const cell = Math.floor((width - gap * (columns - 1)) / columns);
  const icon = Math.min(64, cell - 14);
  return (
    <View style={[styles.slots, { width, gap }]} testID="equipment-slots">
      {SLOT_ORDER.map(({ slot, label }) => {
        const it = getItem(equipment[slot]);
        const painted = inPortrait(slot, equipment[slot]);
        return (
          <Pressable
            key={slot}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${it?.name ?? 'vazio'}${it ? (painted ? ', aparece no retrato' : ', aparece como emblema') : ''}. Trocar`}
            onPress={() => onPressSlot?.(slot)}
            style={({ pressed }) => [styles.slot, { width: cell }, pressed && { opacity: 0.8 }]}
            testID={`slot-${slot}`}
          >
            <View style={[styles.slotBox, { width: icon + 10, height: icon + 10 }]}>
              {it ? <ItemIcon item={it} size={icon} /> : <AppText variant="caption" color="#6E6385">vazio</AppText>}
              {it ? <View style={[styles.dot, { backgroundColor: painted ? '#A9D693' : '#B48CFF' }]} /> : null}
            </View>
            <AppText variant="caption" color="#C9BBA0" style={styles.slotLabel} numberOfLines={1}>{label}</AppText>
            <AppText variant="caption" color="#F6ECD6" style={styles.slotName} numberOfLines={2}>{it?.name ?? '—'}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'visible', shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  inner: { overflow: 'hidden', borderWidth: 1.5, borderColor: '#FFE7A3', alignItems: 'center' },
  figure: { position: 'absolute', top: 0, alignItems: 'center' },
  emblem: { position: 'absolute', backgroundColor: '#15112A', borderWidth: 3, borderColor: '#C9A24A', alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.display, fontSize: 18, lineHeight: 24, marginTop: 10 },
  slots: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  slot: { alignItems: 'center', gap: 2, minHeight: 44 },
  slotBox: { borderRadius: 12, borderWidth: 1.5, borderColor: '#4A3E5E', backgroundColor: '#15112A', alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: 4, right: 4, width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: '#0C1124' },
  slotLabel: { fontSize: 12, lineHeight: 15 },
  slotName: { fontSize: 12, lineHeight: 15, textAlign: 'center' },
});
