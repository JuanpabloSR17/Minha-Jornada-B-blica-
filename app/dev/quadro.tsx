import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { CinemaTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { AppText } from '@/ui';
import { APPEARANCE_OPTIONS, COSMETIC_ITEMS, appearanceHasArt } from '@/features/avatar/domain/catalog';
import { defaultLook } from '@/features/avatar/domain/avatar.rules';
import type { AvatarAppearance } from '@/features/avatar/domain/avatar.types';
import { EquipmentSlots, SLOT_ORDER, TravelerPortrait, inPortrait } from '@/features/avatar/components/TravelerPortrait';

const ENABLED = __DEV__ || process.env.EXPO_PUBLIC_AVATAR_LAB === '1';
const BODIES = [{ id: 'body-a', label: 'Esguio' }, { id: 'body-b', label: 'Atlético' }, { id: 'body-c', label: 'Robusto' }];
const SKINS = APPEARANCE_OPTIONS.skin_tone.map((o, i) => ({ id: o.id, label: `Tom ${i + 1}` }));
const HAIRS = APPEARANCE_OPTIONS.hair_style.filter((o) => appearanceHasArt('hair_style', o.id)).map((o) => ({ id: o.id, label: o.name ?? o.id }));
const HAIR_COLORS = APPEARANCE_OPTIONS.hair_color.map((o) => ({ id: o.id, label: o.name ?? o.id }));
const OPTIONAL = new Set(['head', 'neck', 'back', 'hands', 'waist']);
const BY_SLOT: Record<string, (string | undefined)[]> = Object.fromEntries(
  SLOT_ORDER.map(({ slot }) => [slot, [...(OPTIONAL.has(slot) ? [undefined] : []), ...COSMETIC_ITEMS.filter((i) => i.slot === slot).map((i) => i.id)]]),
);

/** Combinações de exemplo (?look=0..2) para as capturas. */
const LOOKS: { name: string; a: Partial<AvatarAppearance>; eq: Record<string, string | undefined> }[] = [
  { name: 'José', a: { bodyId: 'body-b', skinToneId: 'skin-4', hairStyleId: 'hair-short', hairColorId: 'haircolor-black' }, eq: { outfit: 'tunic-linen', back: 'cloak-night', hands: 'harp-psalmist', head: undefined, waist: 'common_bolsa_do_viajante', feet: 'sandals-leather' } },
  { name: 'Rute', a: { bodyId: 'body-a', skinToneId: 'skin-2', hairStyleId: 'hair-long-wavy', hairColorId: 'haircolor-auburn' }, eq: { outfit: 'tunic-linen', back: 'cloak-wool', hands: 'book_ezr', head: 'headscarf-ochre', waist: 'belt-pouch', feet: 'sandals-leather' } },
  { name: 'Boaz', a: { bodyId: 'body-c', skinToneId: 'skin-6', hairStyleId: 'hair-curly', hairColorId: 'haircolor-gray' }, eq: { outfit: 'tunic-linen', back: 'cloak-desert', hands: 'book_eph', head: 'headwrap-sand', waist: 'belt-pouch', feet: 'sandals-leather' } },
];

function Chips<T extends { id: string; label: string }>({ title, options, value, onChange }: { title: string; options: T[]; value: string; onChange: (id: string) => void }) {
  return (
    <View style={styles.group}>
      <AppText variant="label" color="#C9BBA0">{title}</AppText>
      <View style={styles.chips}>
        {options.map((o) => (
          <Pressable key={o.id} accessibilityRole="radio" accessibilityState={{ selected: o.id === value }} accessibilityLabel={`${title}: ${o.label}`}
            onPress={() => onChange(o.id)} style={[styles.chip, o.id === value && styles.chipOn]}>
            <AppText variant="caption" color={o.id === value ? '#241606' : '#F6ECD6'} style={styles.chipText}>{o.label}</AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/** Teste do "Quadro do Viajante": retrato em moldura fixa + espaços de equipamento (ferramenta interna). */
export default function QuadroTeste() {
  const q = useLocalSearchParams<{ look?: string; luz?: string }>();
  const { width: winW } = useWindowDimensions();
  const start = LOOKS[Number(q.look ?? 0)] ?? LOOKS[0]!;
  const [name] = useState(start.name);
  const [a, setA] = useState<AvatarAppearance>({ ...defaultLook().appearance, ...start.a });
  const [eq, setEq] = useState<Record<string, string | undefined>>(start.eq);
  const [light, setLight] = useState<'neutral' | 'camp'>(q.luz === 'acampamento' ? 'camp' : 'neutral');
  if (!ENABLED) return <AppText style={{ padding: 24 }}>Ferramenta interna indisponível.</AppText>;
  const w = Math.min(420, winW) - 32;
  const portraitW = Math.min(300, Math.round(w * 0.82));
  const cycle = (slot: string) => {
    const list = BY_SLOT[slot] ?? [];
    const i = list.indexOf(eq[slot]);
    setEq({ ...eq, [slot]: list[(i + 1) % list.length] });
  };
  const painted = SLOT_ORDER.filter(({ slot }) => eq[slot] && inPortrait(slot, eq[slot])).length;
  const equipped = SLOT_ORDER.filter(({ slot }) => eq[slot]).length;
  return (
    <CinemaTheme>
      <ScrollView style={{ backgroundColor: '#0C1124' }} contentContainerStyle={styles.page} testID="quadro-teste">
        <AppText style={styles.title} color="#F6ECD6">Quadro do Viajante · teste</AppText>
        <TravelerPortrait appearance={a} equipment={eq} width={portraitW} name={name} lighting={light} />
        <View style={styles.legend}>
          <View style={[styles.dot, { backgroundColor: '#A9D693' }]} /><AppText variant="caption" color="#C9BBA0">no retrato</AppText>
          <View style={[styles.dot, { backgroundColor: '#B48CFF' }]} /><AppText variant="caption" color="#C9BBA0">emblema (sem pintura no busto)</AppText>
        </View>
        <AppText variant="caption" color="#C9BBA0" testID="quadro-resumo">{equipped} itens equipados · {painted} desenhados no retrato · toque num espaço para trocar</AppText>
        <EquipmentSlots equipment={eq} onPressSlot={cycle} width={w} />
        <Chips title="Luz" options={[{ id: 'neutral', label: 'Guarda-roupa' }, { id: 'camp', label: 'Acampamento' }]} value={light} onChange={(v) => setLight(v as 'neutral' | 'camp')} />
        <Chips title="Corpo" options={BODIES} value={a.bodyId} onChange={(v) => setA({ ...a, bodyId: v })} />
        <Chips title="Tom de pele" options={SKINS} value={a.skinToneId} onChange={(v) => setA({ ...a, skinToneId: v })} />
        <Chips title="Cabelo" options={HAIRS} value={a.hairStyleId} onChange={(v) => setA({ ...a, hairStyleId: v })} />
        <Chips title="Cor do cabelo" options={HAIR_COLORS} value={a.hairColorId} onChange={(v) => setA({ ...a, hairColorId: v })} />
      </ScrollView>
    </CinemaTheme>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 16, alignItems: 'center', paddingBottom: 40 },
  title: { fontFamily: fonts.display, fontSize: 20, lineHeight: 26 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  group: { alignSelf: 'stretch', gap: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { minHeight: 36, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1.5, borderColor: '#4A3E5E', backgroundColor: '#15112A', justifyContent: 'center' },
  chipOn: { backgroundColor: '#E9BA5B', borderColor: '#E9BA5B' },
  chipText: { fontSize: 13 },
});
