import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { AppText } from '@/ui';
import { fonts } from '@/theme/tokens';
import { strings } from '@/i18n';
import { ItemIcon } from '../components/ItemIcon';
import { RARITY_COLOR } from '../components/RarityBadge';
import { getItem } from '../domain/catalog';
import type { Rarity } from '../domain/avatar.types';
import { mix } from './draw';
import { wearFrom } from './archetypes';
import { FirelightPortrait } from './cinematic';

const RANK: Record<Rarity, number> = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4, holy: 5 };
const SLOTS = ['head', 'back', 'outfit', 'neck', 'chest', 'hands'];

/** A maior raridade entre os itens equipados decide a moldura e a gema da carta. */
export function topRarity(equipment: Record<string, string | undefined>): Rarity {
  return SLOTS.map((s) => getItem(equipment[s])?.rarity).filter((r): r is Rarity => !!r)
    .reduce<Rarity>((best, r) => (RANK[r] > RANK[best] ? r : best), 'common');
}

/**
 * Carta do Viajante: o retrato à luz da fogueira numa carta colecionável. A moldura e a gema seguem
 * a maior raridade equipada (comum → santo); embaixo, o progresso da leitura e os itens equipados
 * com os ícones do próprio jogo.
 */
export function HeroCard({
  name, look, equipment, width, level, stats,
}: {
  name: string;
  look: { bodyId: string; skin: string; hair: string; hairStyle: string };
  equipment: Record<string, string | undefined>;
  width: number;
  level: number;
  stats: { label: string; value: number }[];
}) {
  const rarity = topRarity(equipment);
  const c = RARITY_COLOR[rarity];
  const holy = rarity === 'holy';
  const pad = Math.round(width * 0.045);
  const artW = width - pad * 2;
  const items = SLOTS.map((s) => getItem(equipment[s])).filter((i): i is NonNullable<typeof i> => !!i);
  return (
    <View style={[styles.card, { width, padding: pad, borderRadius: pad * 1.6 }]} testID="hero-card">
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 10 14">
        <Defs>
          <LinearGradient id={`hcFrame${rarity}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={mix(c, '#FFFFFF', holy ? 0.65 : 0.45)} />
            <Stop offset="0.4" stopColor={c} />
            <Stop offset="0.75" stopColor={mix(c, '#000000', 0.45)} />
            <Stop offset="1" stopColor={mix(c, '#FFFFFF', 0.3)} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={10} height={14} fill={`url(#hcFrame${rarity})`} />
        <Rect x={0.3} y={0.3} width={9.4} height={13.4} fill="#120E1C" />
      </Svg>
      <View style={styles.head}>
        <View style={[styles.level, { borderColor: c }]}><AppText style={styles.levelNum} color="#F6ECD6">{level}</AppText></View>
        <AppText style={styles.name} color="#F6ECD6" numberOfLines={1}>{name}</AppText>
        <Svg width={20} height={24} viewBox="0 0 20 24" accessibilityElementsHidden importantForAccessibility="no">
          <Path d="M10 1 L19 9 L10 23 L1 9 Z" fill={c} stroke={mix(c, '#FFFFFF', 0.6)} strokeWidth={1.2} />
          <Path d="M10 1 L13 9 L10 23 L7 9 Z" fill="#FFFFFF" opacity={0.25} />
        </Svg>
      </View>
      <View style={[styles.art, { borderColor: c }]}>
        <FirelightPortrait look={look} wear={wearFrom(equipment)} width={artW - 4} />
        <View style={[styles.ribbon, { backgroundColor: c }]}>
          <AppText style={styles.ribbonText} color="#120E1C">{strings.rarity[rarity]}</AppText>
        </View>
      </View>
      <View style={styles.stats}>
        {stats.map((s) => (
          <View key={s.label} style={[styles.stat, { borderColor: mix(c, '#120E1C', 0.4) }]}>
            <AppText style={styles.statNum} color="#F6ECD6">{s.value}</AppText>
            <AppText variant="caption" color="#C9BBA0" style={styles.statLabel} numberOfLines={1}>{s.label}</AppText>
          </View>
        ))}
      </View>
      <View style={styles.items}>
        {items.map((it) => <ItemIcon key={it.id} item={it} size={Math.round((artW - 5 * 6) / 6)} />)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 8, overflow: 'hidden' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  level: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1B1631' },
  levelNum: { fontFamily: fonts.display, fontSize: 15, lineHeight: 19 },
  name: { flex: 1, fontFamily: fonts.display, fontSize: 18, lineHeight: 24 },
  art: { borderWidth: 2, borderRadius: 8, overflow: 'hidden' },
  ribbon: { position: 'absolute', bottom: 8, alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 2, borderRadius: 10 },
  ribbonText: { fontFamily: fonts.display, fontSize: 12, lineHeight: 16 },
  stats: { flexDirection: 'row', gap: 6 },
  stat: { flex: 1, alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingVertical: 4, backgroundColor: '#1B1631' },
  statNum: { fontFamily: fonts.display, fontSize: 16, lineHeight: 20 },
  statLabel: { fontSize: 11, lineHeight: 14 },
  items: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
});
