import { useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { AppText } from '@/ui';
import { strings } from '@/i18n';
import { displayNameOf } from '@/features/avatar/domain/catalog';
import { ArtifactArt, ARTIFACT_RATIO, isArtifact, type ArtifactId } from '../art/artifacts';
import { TabernacleBackdrop } from '../art/scenes';
import { useAmbient } from '../useAmbient';

const j = strings.journey;

/** Posição de cada artefato na cena (frações da largura/altura do palco). */
const PLACE: Record<ArtifactId, { cx: number; bottom: number; w: number; z: number }> = {
  holy_arca_da_alianca_representacao: { cx: 0.5, bottom: 0.36, w: 0.4, z: 1 },
  holy_mesa_dos_paes_da_presenca: { cx: 0.22, bottom: 0.13, w: 0.34, z: 2 },
  holy_candelabro_do_tabernaculo: { cx: 0.79, bottom: 0.13, w: 0.25, z: 2 },
};

/**
 * Cena do Tabernáculo com os artefatos do marco. Mostra o que o jogador já possui (ouro pleno)
 * e o que pode receber ao cumprir o marco (silhueta com contorno dourado e brilho suave).
 */
export function TabernacleStage({ items, completed }: { items: { id: string; owned: boolean }[]; completed: boolean }) {
  const [w, setW] = useState(0);
  const pulse = useAmbient(2600);
  const h = Math.round(w * 0.86);
  const list = items.filter((i): i is { id: ArtifactId; owned: boolean } => isArtifact(i.id));
  return (
    <View style={[styles.stage, { height: h || 260 }]} onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))}
      accessible accessibilityRole="image" accessibilityLabel={j.tabernacleLabel} testID="tabernacle-stage">
      {w ? <View style={StyleSheet.absoluteFill}><TabernacleBackdrop width={w} height={h} /></View> : null}
      {w ? list.map(({ id, owned }) => {
        const p = PLACE[id];
        const aw = w * p.w;
        const ah = aw / ARTIFACT_RATIO[id];
        const state = owned ? 'owned' : completed ? 'locked' : 'grantable';
        return (
          <View key={id} style={[styles.slot, { left: w * p.cx - aw / 2, bottom: h * p.bottom, width: aw, zIndex: p.z }]} testID={`tab-artifact-${id}`}>
            {owned ? null : (
              <Animated.View pointerEvents="none" style={[styles.aura, { width: aw * 1.3, height: ah * 1.2, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }) }]}>
                <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <Defs>
                    <RadialGradient id="grantAura" cx="50%" cy="50%" r="50%">
                      <Stop offset="0" stopColor="#FFC85A" stopOpacity={0.5} />
                      <Stop offset="1" stopColor="#FFC85A" stopOpacity={0} />
                    </RadialGradient>
                  </Defs>
                  <Ellipse cx={50} cy={50} rx={50} ry={50} fill="url(#grantAura)" />
                </Svg>
              </Animated.View>
            )}
            <ArtifactArt id={id} width={aw} state={state} glow={owned} />
            <View style={[styles.chip, owned ? styles.chipOwned : styles.chipGrant]}>
              <AppText variant="caption" numberOfLines={1} style={styles.chipText} color={owned ? '#2A1606' : '#F7D98A'}>
                {owned ? j.stateOwned : j.stateGrantable}
              </AppText>
            </View>
            <AppText variant="caption" numberOfLines={2} style={styles.name} color="#F6ECD6">{displayNameOf(id)}</AppText>
          </View>
        );
      }) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { width: '100%', borderRadius: 16, overflow: 'hidden', borderWidth: 1.5, borderColor: '#C9A24A', backgroundColor: '#1A1230' },
  slot: { position: 'absolute', alignItems: 'center' },
  aura: { position: 'absolute', top: '-10%' },
  chip: { marginTop: 2, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8, borderWidth: 1 },
  chipOwned: { backgroundColor: '#E9BA5B', borderColor: '#7A5418' },
  chipGrant: { backgroundColor: 'rgba(20, 12, 30, 0.85)', borderColor: '#E9BA5B' },
  chipText: { fontSize: 10, lineHeight: 13, fontWeight: '700' },
  name: { fontSize: 10, lineHeight: 12, textAlign: 'center', textShadowColor: '#000', textShadowRadius: 4 },
});
