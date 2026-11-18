import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CinemaTheme } from '@/theme/ThemeProvider';
import { fonts, radius, spacing } from '@/theme/tokens';
import { AppText, Button, Icon, Notice, Screen } from '@/ui';
import { fmt, strings } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { useAuth } from '@/features/auth/AuthProvider';
import { StepHeader } from '@/features/avatar/components/StepHeader';
import { AvatarStage } from '@/features/avatar/components/AvatarStage';
import { defaultLook } from '@/features/avatar/domain/avatar.rules';
import { getMyAvatar, saveAvatar } from '@/features/avatar/services/avatar.service';
import { SKINS, skinDisplayName, variantButtonLabel, skinLook, skinToneColor, variantsOf, type SkinSelection, type SkinVariant } from './catalog';
import { SkinThumb } from './SkinThumb';
import { equipSkin } from './skins.service';

const p = strings.skinPicker;
const STARTERS = SKINS.filter((s) => s.origin === 'inicio');

/**
 * Primeira escolha do viajante: uma das skins iniciais, num dos 3 estilos (pele, rosto e cabelo).
 * No cadastro, salva o avatar da conta e veste a skin; como visitante, só mostra a prévia.
 */
export function SkinPickerScreen({ mode, onFinished, onExit }: { mode: 'onboarding' | 'guest'; onFinished?: () => void; onExit?: () => void }) {
  return <CinemaTheme><Picker mode={mode} onFinished={onFinished} onExit={onExit} /></CinemaTheme>;
}

function Picker({ mode, onFinished, onExit }: { mode: 'onboarding' | 'guest'; onFinished?: () => void; onExit?: () => void }) {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [sel, setSel] = useState<SkinSelection>({ skinId: STARTERS[STARTERS.length - 1]!.id, style: 1, variant: 'padrao' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const look = useMemo(() => skinLook(defaultLook(), sel), [sel]);
  const skin = STARTERS.find((s) => s.id === sel.skinId)!;
  const variants = variantsOf(skin.id);
  const variant: SkinVariant = sel.variant && variants.includes(sel.variant) ? sel.variant : 'padrao';

  const confirm = async () => {
    if (mode === 'guest') return router.push('/auth');
    setBusy(true);
    setError(null);
    try {
      const current = await getMyAvatar();
      const base = defaultLook();
      // o avatar da conta guarda rosto, pele e cabelo do estilo escolhido; as peças iniciais ficam como estavam
      await saveAvatar({ appearance: { ...base.appearance, ...look.appearance }, equipment: current?.equipment ?? base.equipment }, current?.version ?? null);
      await equipSkin(sel.skinId, sel.style, variant);
      await refreshProfile();
      onFinished?.();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}
      footer={<Button variant="gold" icon={mode === 'guest' ? 'profile' : 'play'} title={mode === 'guest' ? p.guestCta : p.confirm} loading={busy} onPress={() => void confirm()} />}>
      <StepHeader title={p.title} onBack={onExit} progress={mode === 'onboarding' ? { current: 2, total: 3 } : undefined} />
      <AppText color="#C9BBA0">{p.intro}</AppText>
      <View style={styles.stage}>
        <AvatarStage look={look} height={300} />
      </View>
      <AppText style={styles.name} color="#F6ECD6" testID="picker-name">{skinDisplayName(skin, variant)}</AppText>

      <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={p.skinsLabel}>
        {STARTERS.map((s) => {
          const on = s.id === sel.skinId;
          return (
            <Pressable key={s.id} accessibilityRole="radio" aria-checked={on} accessibilityState={{ checked: on }} accessibilityLabel={s.name}
              onPress={() => setSel({ skinId: s.id, style: sel.style, variant: 'padrao' })} style={[styles.card, on && styles.cardOn]}>
              <View style={styles.cardArt}><SkinThumb skin={s} style={sel.style} size={104} /></View>
              <AppText style={styles.cardName} color={on ? '#FFE7A3' : '#F6ECD6'} numberOfLines={2}>{s.name}</AppText>
              {on ? <View style={styles.check}><Icon name="check" color="#120E1C" size={14} /></View> : null}
            </Pressable>
          );
        })}
      </View>

      {variants.length > 1 ? (
        <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={strings.vestiario.variants}>
          {variants.map((vr) => {
            const on = vr === variant;
            return (
              <Pressable key={vr} accessibilityRole="radio" aria-checked={on} accessibilityState={{ checked: on }}
                accessibilityLabel={fmt(strings.vestiario.variantLabel, { name: variantButtonLabel(skin, vr) })}
                onPress={() => setSel({ ...sel, variant: vr })} style={[styles.swatch, on && styles.swatchOn]}>
                <AppText style={styles.swatchText} color={on ? '#FFE7A3' : '#C9BBA0'} numberOfLines={1}>{variantButtonLabel(skin, vr)}</AppText>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      <AppText variant="label" color="#F6ECD6">{p.styleTitle}</AppText>
      <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={p.stylesLabel}>
        {skin.styles.map((st, i) => {
          const on = sel.style === i + 1;
          return (
            <Pressable key={i} accessibilityRole="radio" aria-checked={on} accessibilityState={{ checked: on }}
              accessibilityLabel={fmt(strings.vestiario.styleLabel, { n: i + 1, skin: skin.name })}
              onPress={() => setSel({ ...sel, style: i + 1 })} style={[styles.swatch, on && styles.swatchOn]}>
              <View style={[styles.dot, { backgroundColor: skinToneColor(st) }]} />
              <AppText style={styles.swatchText} color={on ? '#FFE7A3' : '#C9BBA0'}>{fmt(strings.vestiario.styleShort, { n: i + 1 })}</AppText>
            </Pressable>
          );
        })}
      </View>
      <AppText variant="caption" color="#8F84A8">{p.note}</AppText>
      {error ? <Notice tone="error">{error}</Notice> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: { height: 300, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#1B1631', borderWidth: 1, borderColor: 'rgba(233,186,91,0.35)' },
  name: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28, textAlign: 'center' },
  row: { flexDirection: 'row', gap: spacing.sm },
  card: { flex: 1, borderRadius: radius.md, borderWidth: 2, borderColor: 'rgba(246,236,214,0.2)', backgroundColor: '#120E1C', overflow: 'hidden', paddingBottom: 8 },
  cardOn: { borderColor: '#E9BA5B' },
  cardArt: { height: 104, overflow: 'hidden', alignItems: 'center' },
  cardName: { fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 18, textAlign: 'center', paddingHorizontal: 6, marginTop: 4 },
  check: { position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: '#E9BA5B', alignItems: 'center', justifyContent: 'center' },
  swatch: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 46, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(246,236,214,0.25)', backgroundColor: '#1B1631' },
  swatchOn: { borderColor: '#E9BA5B', backgroundColor: '#2A2140' },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)' },
  swatchText: { fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 18 },
});
