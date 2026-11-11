import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { AvatarRenderer } from '@/features/avatar/components/AvatarRenderer';
import { anchors, geometryFor, GROUND_Y, HEAD } from '@/features/avatar/art/geometry';
import { APPEARANCE_OPTIONS, COSMETIC_ITEMS, LOOK_PRESETS, appearanceHasArt, itemHasArt } from '@/features/avatar/domain/catalog';
import { defaultLook } from '@/features/avatar/domain/avatar.rules';
import type { AvatarLook } from '@/features/avatar/domain/avatar.types';

/**
 * FERRAMENTA INTERNA (não faz parte da experiência do usuário).
 * Grade de variações e guias de ancoragem para validar arte e encaixe.
 * Disponível em desenvolvimento ou com EXPO_PUBLIC_AVATAR_LAB=1.
 */
const ENABLED = __DEV__ || process.env.EXPO_PUBLIC_AVATAR_LAB === '1';

function Guides({ look, h }: { look: AvatarLook; h: number }) {
  const g = geometryFor(look.appearance.bodyId);
  const pts = ([-1, 1] as const).flatMap((s) => Object.values(anchors(g, s)));
  const w = (h * 1024) / 1536;
  return (
    <Svg width={w} height={h} viewBox="0 0 1024 1536" style={StyleSheet.absoluteFill} pointerEvents="none">
      {[HEAD.top, HEAD.chin, GROUND_Y].map((y) => <Line key={y} x1={0} x2={1024} y1={y} y2={y} stroke="#E0457B" strokeWidth={2} strokeDasharray="8 8" />)}
      {[1, 2, 3, 4, 5].map((i) => <Line key={i} x1={0} x2={60} y1={HEAD.top + i * (HEAD.chin - HEAD.top)} y2={HEAD.top + i * (HEAD.chin - HEAD.top)} stroke="#2F7BD8" strokeWidth={3} />)}
      {pts.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={7} fill="#2F7BD8" />)}
    </Svg>
  );
}

export default function AvatarLab() {
  const [guides, setGuides] = useState(false);
  if (!ENABLED) return <Text style={{ padding: 24 }}>Ferramenta interna indisponível.</Text>;
  const base = LOOK_PRESETS[0]?.look ?? defaultLook();
  const looks: { label: string; look: AvatarLook }[] = LOOK_PRESETS.map((p) => ({ label: p.name, look: p.look }));
  APPEARANCE_OPTIONS.body.forEach((b, i) => looks.push({ label: b.id, look: { ...base, appearance: { ...base.appearance, bodyId: b.id, skinToneId: APPEARANCE_OPTIONS.skin_tone[i * 2]!.id } } }));
  APPEARANCE_OPTIONS.hair_style.filter((o) => appearanceHasArt('hair_style', o.id)).forEach((o, i) =>
    looks.push({ label: o.id, look: { ...base, appearance: { ...base.appearance, hairStyleId: o.id, hairColorId: APPEARANCE_OPTIONS.hair_color[i * 3]!.id } } }));
  COSMETIC_ITEMS.filter((it) => itemHasArt(it) && it.slot !== 'background').forEach((it, i) =>
    looks.push({ label: it.id, look: { ...base, appearance: { ...base.appearance, bodyId: ['body-a', 'body-b', 'body-c'][i % 3]! }, equipment: { ...base.equipment, [it.slot]: it.id } } }));
  return (
    <ScrollView contentContainerStyle={{ padding: 8, backgroundColor: '#fff' }}>
      <Pressable onPress={() => setGuides((v) => !v)} style={{ padding: 8 }}>
        <Text>{guides ? 'Ocultar' : 'Mostrar'} guias de ancoragem</Text>
      </Pressable>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {looks.map((l) => (
          <View key={l.label} style={{ alignItems: 'center' }}>
            <View>
              <AvatarRenderer appearance={l.look.appearance} equippedItems={l.look.equipment} size={360} showBackground={false} />
              {guides ? <Guides look={l.look} h={360} /> : null}
            </View>
            <Text style={{ fontSize: 11 }}>{l.label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
