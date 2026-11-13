import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ImageBackground, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { CinemaTheme, useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText, Button, Card, Notice, Screen } from '@/ui';
import { fmt, strings } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { StepHeader } from '@/features/avatar/components/StepHeader';
import { describeLook } from '@/features/avatar/domain/describe';
import { displayNameOf } from '@/features/avatar/domain/catalog';
import type { AvatarLook } from '@/features/avatar/domain/avatar.types';
import { getWardrobe, saveWardrobe, type WardrobeState } from '@/features/avatar/services/wardrobe.service';
import { look3d } from './look3d';
import { Stage3D, type Lighting3D } from './Stage3D';

const t = strings.avatar3d;
const camp = require('../../../assets/journey/camp-night.webp');
const VIEWS = [
  { id: 'front', label: t.viewFront, angle: 0 },
  { id: 'side', label: t.viewSide, angle: Math.PI / 2 },
  { id: 'back', label: t.viewBack, angle: Math.PI },
] as const;

/** Escolha em pílulas (rádio acessível). */
function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.choice}>
      <AppText variant="caption" muted>{label}</AppText>
      <View style={styles.pills} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map((o) => {
          const on = o.id === value;
          return (
            <Pressable key={o.id} accessibilityRole="radio" accessibilityState={{ checked: on }} aria-checked={on} accessibilityLabel={`${label}: ${o.label}`}
              onPress={() => onChange(o.id)}
              style={[styles.pill, { borderColor: on ? colors.focus : colors.border, backgroundColor: on ? colors.surfaceRaised : colors.surface }]}>
              <AppText variant="label" color={on ? colors.text : colors.textMuted}>{o.label}</AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Avatar3D() {
  const router = useRouter();
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const [state, setState] = useState<WardrobeState | null>(null);
  const [draft, setDraft] = useState<AvatarLook | null>(null);
  const [angle, setAngle] = useState(0);
  const [lighting, setLighting] = useState<Lighting3D>('neutral');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const w = await getWardrobe();
      const active = w.loadouts.find((l) => l.id === w.activeLoadoutId)!;
      setState(w);
      setDraft({ appearance: w.appearance, equipment: { ...active.equipment } });
    } catch (e) {
      setMsg({ tone: 'error', text: errorMessage(e) });
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const l3 = useMemo(() => (draft ? look3d(draft) : null), [draft]);
  if (!state || !draft || !l3) {
    return (
      <Screen>
        <StepHeader title={t.title} onBack={() => router.back()} />
        {msg ? <Notice tone="error">{msg.text}</Notice> : <ActivityIndicator color={colors.primary} />}
      </Screen>
    );
  }

  const active = state.loadouts.find((l) => l.id === state.activeLoadoutId)!;
  const dirty = JSON.stringify(draft.equipment) !== JSON.stringify(active.equipment) || JSON.stringify(draft.appearance) !== JSON.stringify(state.appearance);
  const setApp = (k: 'skinToneId' | 'hairStyleId', v: string) => setDraft({ ...draft, appearance: { ...draft.appearance, [k]: v } });
  const setEq = (slot: 'back' | 'hands', id: string | null) => {
    const equipment = { ...draft.equipment };
    if (id) equipment[slot] = id; else delete equipment[slot];
    setDraft({ ...draft, equipment });
  };
  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const w = await saveWardrobe({
        loadoutId: active.id,
        equipment: { ...draft.equipment, outfit: draft.equipment.outfit ?? 'tunic-linen' },
        expectedVersion: active.version,
        appearance: draft.appearance,
        expectedAppearanceVersion: state.appearanceVersion,
      });
      setState(w);
      setMsg({ tone: 'success', text: strings.wardrobe.saved });
    } catch (e) {
      setMsg({ tone: 'error', text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  const stageH = Math.round(Math.min(height * 0.56, width * 1.25, 560));
  const stage = (
    <Stage3D look={l3} angle={angle} onAngle={setAngle} lighting={lighting} height={stageH}
      background={lighting === 'neutral' ? '#2A2436' : undefined}
      accessibilityLabel={fmt(t.stageLabel, { summary: describeLook(draft) })} />
  );

  return (
    <Screen>
      <StepHeader title={t.title} onBack={() => router.back()} />
      {lighting === 'camp' ? (
        <ImageBackground source={camp} resizeMode="cover" style={[styles.campBg, { height: stageH }]} imageStyle={styles.campImg}>{stage}</ImageBackground>
      ) : stage}
      <View style={styles.views}>
        {VIEWS.map((v) => (
          <Button key={v.id} compact variant={Math.abs(Math.atan2(Math.sin(angle - v.angle), Math.cos(angle - v.angle))) < 0.2 ? 'primary' : 'secondary'}
            title={v.label} onPress={() => setAngle(v.angle)} style={styles.flex} />
        ))}
      </View>
      <AppText variant="caption" muted>{t.dragHint}</AppText>
      <Card>
        <Choice label={t.light} value={lighting} onChange={setLighting} options={[{ id: 'neutral', label: t.lightWardrobe }, { id: 'camp', label: t.lightCamp }]} />
        <Choice label={t.skin} value={draft.appearance.skinToneId === 'skin-5' ? 'skin-5' : draft.appearance.skinToneId === 'skin-2' ? 'skin-2' : (draft.appearance.skinToneId as 'skin-2')}
          onChange={(v) => setApp('skinToneId', v)} options={[{ id: 'skin-2', label: 'Tom 2' }, { id: 'skin-5', label: 'Tom 5' }]} />
        <Choice label={t.hair} value={l3.hair === 'long' ? 'hair-long-wavy' : 'hair-short'}
          onChange={(v) => setApp('hairStyleId', v)} options={[{ id: 'hair-short', label: 'Curto' }, { id: 'hair-long-wavy', label: 'Longo ondulado' }]} />
        <Choice label={displayNameOf('cloak-night')} value={l3.meshes.cloak ? 'on' : 'off'}
          onChange={(v) => setEq('back', v === 'on' ? 'cloak-night' : null)} options={[{ id: 'on', label: t.wear }, { id: 'off', label: t.remove }]} />
        <Choice label={displayNameOf('staff-shepherd')} value={l3.meshes.staff ? 'on' : 'off'}
          onChange={(v) => setEq('hands', v === 'on' ? 'staff-shepherd' : null)} options={[{ id: 'on', label: t.hold }, { id: 'off', label: t.remove }]} />
        {l3.missing.length ? <AppText variant="caption" muted testID="missing-3d">{fmt(t.missing, { items: l3.missing.map(displayNameOf).join(', ') })}</AppText> : null}
        {msg ? <Notice tone={msg.tone}>{msg.text}</Notice> : null}
        <Button variant="gold" title={strings.common.save} loading={busy} disabled={!dirty} onPress={() => void save()} />
      </Card>
      <AppText variant="caption" muted>{t.note}</AppText>
    </Screen>
  );
}

/** Prova jogável do personagem 3D (GLB + esqueleto + luz em tempo real) com os dados da conta. */
export function Avatar3DScreen() {
  return <CinemaTheme><Avatar3D /></CinemaTheme>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  views: { flexDirection: 'row', gap: spacing.sm },
  choice: { gap: spacing.xs },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  pill: { minHeight: 44, paddingHorizontal: spacing.md, borderWidth: 1.5, borderRadius: radius.pill, justifyContent: 'center' },
  campBg: { width: '100%', borderRadius: 16, overflow: 'hidden' },
  campImg: { borderRadius: 16 },
});
