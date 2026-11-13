import { useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { AppText, Button } from '@/ui';
import { fonts } from '@/theme/tokens';
import { fmt, strings } from '@/i18n';
import { RARITY_COLOR } from '@/features/avatar/components/RarityBadge';
import { ItemIcon } from '@/features/avatar/components/ItemIcon';
import { displayName, getItem, HOLY_ITEMS } from '@/features/avatar/domain/catalog';
import { ArtifactArt, ARTIFACT_IDS, ARTIFACT_RATIO, type ArtifactId } from '../art/artifacts';
import { Pedestal, SanctuaryHall } from '../art/scenes';
import { useAmbient } from '../useAmbient';

const j = strings.journey;

/** Lugar de cada artefato na sala (frações do palco). */
const SPOT: Record<ArtifactId, { cx: number; bottom: number; w: number }> = {
  holy_arca_da_alianca_representacao: { cx: 0.5, bottom: 0.4, w: 0.46 },
  holy_mesa_dos_paes_da_presenca: { cx: 0.24, bottom: 0.08, w: 0.38 },
  holy_candelabro_do_tabernaculo: { cx: 0.78, bottom: 0.08, w: 0.28 },
};

/**
 * Sala de exposição do Santuário: os artefatos do Tabernáculo em suportes iluminados (com a mesma
 * arte do marco e da revelação) e os demais Santos obtidos numa prateleira. Tocar numa peça mostra a
 * passagem e o significado. Os contadores (marcos cumpridos e Santos obtidos) ficam no alto da sala.
 */
export function ExhibitionHall({
  owned,
  counters,
  onOpenItem,
}: {
  owned: ReadonlySet<string>;
  counters: { milestones: string; saints: string } | null;
  onOpenItem: (id: string) => void;
}) {
  const [w, setW] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const light = useAmbient(3200);
  const h = Math.round(w * (w < 340 ? 1.18 : 1.05));
  const others = HOLY_ITEMS.filter((i) => owned.has(i.id) && !(ARTIFACT_IDS as string[]).includes(i.id));
  const sel = selected ? getItem(selected) : undefined;

  return (
    <View style={styles.wrap}>
      <View style={[styles.hall, { height: h || 320 }]} onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))} testID="exhibition-hall">
        {w ? <View style={StyleSheet.absoluteFill} pointerEvents="none"><SanctuaryHall width={w} height={h} /></View> : null}
        {w ? (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: light.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.9] }) }]} pointerEvents="none">
            <Svg width={w} height={h}>
              <Defs>
                <RadialGradient id="hallGlow" cx="50%" cy="55%" r="50%">
                  <Stop offset="0" stopColor="#FFC870" stopOpacity={0.28} />
                  <Stop offset="1" stopColor="#FFC870" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Ellipse cx={w / 2} cy={h * 0.58} rx={w * 0.55} ry={h * 0.45} fill="url(#hallGlow)" />
            </Svg>
          </Animated.View>
        ) : null}
        {counters ? (
          <View style={[styles.counters, w && w < 340 ? styles.countersNarrow : null]}>
            <View style={[styles.badge, w && w < 340 ? null : styles.badgeRow]}><AppText variant="caption" style={styles.badgeText} color="#F6ECD6" testID="counter-milestones">{counters.milestones}</AppText></View>
            <View style={[styles.badge, w && w < 340 ? null : styles.badgeRow]}><AppText variant="caption" style={styles.badgeText} color="#F6ECD6" testID="counter-saints">{counters.saints}</AppText></View>
          </View>
        ) : null}
        {w ? ARTIFACT_IDS.map((id) => {
          const s = SPOT[id];
          const aw = w * s.w;
          const has = owned.has(id);
          const it = getItem(id);
          return (
            <Pressable key={id} onPress={() => setSelected(id)} accessibilityRole="button"
              accessibilityLabel={`${it ? displayName(it) : id}, ${has ? strings.wardrobe.owned : strings.wardrobe.locked}`}
              testID={`exhibit-${id}`}
              style={[styles.exhibit, { left: w * s.cx - aw / 2, bottom: h * s.bottom, width: aw }, selected === id && styles.selected]}>
              <ArtifactArt id={id} width={aw * (id === 'holy_candelabro_do_tabernaculo' ? 0.9 : 0.86)} state={has ? 'owned' : 'locked'} glow={has} />
              <View style={{ marginTop: -aw * 0.04 }}><Pedestal width={aw} lit={has} /></View>
              {!has ? <AppText variant="caption" style={styles.lockHint} color="#C9BBA0" numberOfLines={1}>{it?.scriptureRef}</AppText> : null}
            </Pressable>
          );
        }) : null}
      </View>
      <AppText variant="caption" muted>{j.sanctuaryTapHint}</AppText>

      {others.length ? (
        <View style={styles.shelf}>
          {others.map((it) => (
            <Pressable key={it.id} onPress={() => setSelected(it.id)} accessibilityRole="button" accessibilityLabel={`${displayName(it)}, ${strings.wardrobe.owned}`} style={styles.shelfItem}>
              <View style={styles.shelfIcon}><ItemIcon item={it} size={56} /></View>
              <AppText variant="caption" numberOfLines={2} style={styles.shelfLabel}>{displayName(it)}</AppText>
            </Pressable>
          ))}
        </View>
      ) : null}

      {sel ? (
        <View style={styles.detail} testID="exhibit-detail" accessibilityLiveRegion="polite">
          <View style={styles.detailHead}>
            <View style={styles.detailArt}><ItemIcon item={sel} size={72} /></View>
            <View style={styles.flex}>
              <AppText style={styles.detailName} color="#F7D98A">{displayName(sel)}</AppText>
              <AppText variant="caption" color={RARITY_COLOR.holy}>{strings.rarity.holy}{owned.has(sel.id) ? ` · ${strings.wardrobe.owned}` : ''}</AppText>
            </View>
          </View>
          <AppText variant="caption" muted>{j.sanctuaryPassage}</AppText>
          <AppText variant="label" testID="exhibit-passage">{sel.scriptureRef ?? '—'}</AppText>
          <AppText variant="caption" muted>{j.sanctuaryMeaning}</AppText>
          <AppText testID="exhibit-meaning">{sel.meaning ?? sel.description}</AppText>
          {sel.meaning && sel.description ? <AppText variant="caption" muted>{sel.description}</AppText> : null}
          <View style={styles.row}>
            <Button compact variant="secondary" title={j.sanctuaryOpenItem} onPress={() => onOpenItem(sel.id)} style={styles.flex} />
            <Button compact variant="ghost" title={j.sanctuaryClose} onPress={() => setSelected(null)} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

export const counterText = (done: number, total: number, owned: number, saints: number) => ({
  milestones: fmt(strings.mission.milestonesDone, { done, total }),
  saints: fmt(strings.mission.saintsOwned, { owned, total: saints }),
});

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  hall: { width: '100%', borderRadius: 16, overflow: 'hidden', borderWidth: 1.5, borderColor: '#C9A24A', backgroundColor: '#2A1F1A' },
  counters: { flexDirection: 'row', gap: 8, padding: 10, justifyContent: 'center' },
  badgeRow: { flex: 1 },
  countersNarrow: { flexDirection: 'column', gap: 4, paddingBottom: 4 },
  badge: { backgroundColor: 'rgba(16, 12, 24, 0.88)', borderColor: '#C9A24A', borderWidth: 1.2, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 8 },
  badgeText: { textAlign: 'center', fontWeight: '700', fontSize: 12, lineHeight: 16 },
  exhibit: { position: 'absolute', alignItems: 'center', borderRadius: 12 },
  selected: { backgroundColor: 'rgba(255, 215, 119, 0.12)' },
  lockHint: { fontSize: 10, lineHeight: 12 },
  shelf: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  shelfItem: { width: 78, alignItems: 'center', gap: 2 },
  shelfIcon: { width: 64, height: 64, borderRadius: 32, borderWidth: 1.5, borderColor: RARITY_COLOR.holy, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E1934' },
  shelfLabel: { textAlign: 'center', fontSize: 11, lineHeight: 14 },
  detail: { backgroundColor: '#1B1631', borderColor: '#C9A24A', borderWidth: 1.5, borderRadius: 14, padding: 12, gap: 4 },
  detailHead: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  detailArt: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center' },
  detailName: { fontFamily: fonts.display, fontSize: 18, lineHeight: 24 },
  flex: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row', gap: 8, marginTop: 6, alignItems: 'center' },
});
