import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { AvatarRenderer } from '@/features/avatar/components/AvatarRenderer';
import { anchors, geometryFor, GROUND_Y, HEAD } from '@/features/avatar/art/geometry';
import { artStatus } from '@/features/avatar/art/manifest';
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

/**
 * Modos de exportação (canvas inteiro, fundo transparente), usados para gerar moldes de
 * alinhamento para ilustradores e camadas de encaixe do pipeline de PNG/WebP:
 *   ?template=body-b            corpo base neutro + guias de ancoragem
 *   ?export=outfit/tunic-linen&body=body-b&layer=sleeves&pose=staff&scale=2
 *       uma camada isolada de uma peça ou aparência, no corpo e na pose pedidos (scale=2 → 2048×3072)
 */
const APPEARANCE_SOURCE: Record<string, keyof AvatarLook['appearance']> = {
  body: 'bodyId', eyes: 'eyesId', brows: 'browsId', expression: 'expressionId', beard: 'beardId', hair: 'hairStyleId',
};
function ExportView({ template, source, body, layer, pose, scale, skin, hair }: { template?: string; source?: string; body?: string; layer?: string; pose?: string; scale?: string; skin?: string; hair?: string }) {
  const bodyId = template ?? body ?? 'body-b';
  const k = scale === '2' ? 2 : 1;
  const [cat, id] = (source ?? `body/${bodyId}`).split('/') as [string, string];
  const appearance = { ...defaultLook().appearance, bodyId, skinToneId: skin ?? 'skin-2', hairColorId: hair ?? defaultLook().appearance.hairColorId, hairStyleId: 'hair-short', beardId: 'beard-none' };
  const equipment: Record<string, string> = {};
  const appKey = APPEARANCE_SOURCE[cat];
  if (appKey && cat !== 'body') (appearance as Record<string, string>)[appKey] = id;
  else if (!appKey) equipment[cat] = id;
  // pose do cajado: o cajado entra no equipamento só para definir a pose (não é desenhado)
  if (pose === 'staff' && cat !== 'hands') equipment.hands = 'staff-shepherd';
  const look: AvatarLook = { appearance, equipment };
  return (
    <View testID="export" style={{ width: 1024 * k, height: 1536 * k }}>
      <AvatarRenderer
        appearance={look.appearance}
        equippedItems={look.equipment}
        size={1536 * k}
        showBackground={false}
        onlySources={source ? [source] : [`body/${bodyId}`]}
        onlyLayers={layer ? [layer] : template ? ['shadow', 'body', 'face', 'arms', 'hands'] : undefined}
        vectorOnly
      />
      {template ? <Guides look={look} h={1536 * k} /> : null}
    </View>
  );
}

export default function AvatarLab() {
  const [guides, setGuides] = useState(false);
  const q = useLocalSearchParams<{ template?: string; export?: string; body?: string; layer?: string; compare?: string; fit?: string; pose?: string; scale?: string; skin?: string; hair?: string }>();
  if (!ENABLED) return <Text style={{ padding: 24 }}>Ferramenta interna indisponível.</Text>;
  if (q.template || q.export) return <ExportView template={q.template} source={q.export} body={q.body} layer={q.layer} pose={q.pose} scale={q.scale} skin={q.skin} hair={q.hair} />;
  if (q.fit) {
    // encaixe das peças de viagem: três corpos × três cabelos, com e sem cobertura de cabeça
    const kit = { outfit: 'tunic-linen', back: 'cloak-night', waist: 'common_bolsa_do_viajante', hands: 'staff-shepherd', feet: 'sandals-leather' };
    const heads = [undefined, 'headwrap-sand', 'headscarf-ochre'];
    const hairs = ['hair-short', 'hair-curly', 'hair-long-wavy'];
    return (
      <View testID="fit" style={{ flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#fff', padding: 4, gap: 4 }}>
        {['body-a', 'body-b', 'body-c'].flatMap((b, bi) => hairs.map((h, hi) => (
          <View key={`${b}${h}`} style={{ alignItems: 'center' }}>
            <AvatarRenderer appearance={{ ...defaultLook().appearance, bodyId: b, hairStyleId: h, skinToneId: `skin-${1 + ((bi * 3 + hi) % 6)}` }}
              equippedItems={{ ...kit, ...(heads[hi] ? { head: heads[hi] } : {}), ...(bi === 1 ? { waist: 'belt-pouch', hands: 'common_cajado_de_caminhada', back: 'common_manto_de_viagem' } : {}) }}
              size={Number(q.fit) > 1 ? Number(q.fit) : 300} showBackground={false} />
            <Text style={{ fontSize: 10 }}>{b} · {h} · {heads[hi] ?? 'sem cobertura'}</Text>
          </View>
        )))}
      </View>
    );
  }
  if (q.compare) {
    // mesma peça nos três corpos: mostra qual usa ilustração final e qual usa a provisória
    const [slot, id] = q.compare.split('/') as ['outfit', string];
    return (
      <View testID="compare" style={{ flexDirection: 'row', backgroundColor: '#fff', padding: 8, gap: 8 }}>
        {['body-a', 'body-b', 'body-c'].map((b) => (
          <View key={b} style={{ alignItems: 'center' }}>
            <AvatarRenderer appearance={{ ...defaultLook().appearance, bodyId: b }} equippedItems={{ ...defaultLook().equipment, [slot]: id }} size={480} showBackground={false} />
            <Text>{b} · {artStatus(q.compare!, b) === 'final' ? 'ilustração final' : 'arte provisória'}</Text>
          </View>
        ))}
      </View>
    );
  }
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
