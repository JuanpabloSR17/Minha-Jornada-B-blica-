import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { AppText, Button } from '@/ui';
import { fmt, strings } from '@/i18n';
import { RARITY_COLOR } from '@/features/avatar/components/RarityBadge';
import { ItemIcon } from '@/features/avatar/components/ItemIcon';
import { displayName, displayNameOf, getItem } from '@/features/avatar/domain/catalog';
import { ArtifactArt, ARTIFACT_RATIO, isArtifact } from '../art/artifacts';
import { GoldRays } from '../art/scenes';
import { nativeDriver } from '../useAmbient';
import { Plaque } from './Plaque';

const j = strings.journey;
const STEP = 1100;

/**
 * Revelação dos Santos recebidos (só depois da confirmação do servidor, e só os concedidos de fato).
 * Sequência: fundo escurece → placa "Marco cumprido" → cada artefato surge sob raios dourados com o
 * nome e a raridade. "Pular animação" leva direto ao estado final. Com "reduzir movimento", o estado
 * final aparece de uma vez, estático, com o mesmo conteúdo.
 */
export function RevealOverlay({
  granted,
  alreadyOwned,
  reference,
  onSanctuary,
  onClose,
}: {
  granted: string[];
  alreadyOwned: string[];
  reference: string;
  onSanctuary: () => void;
  onClose: () => void;
}) {
  const { reduceMotion } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const n = Math.max(1, granted.length);
  const backdrop = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const items = useMemo(() => granted.map(() => new Animated.Value(reduceMotion ? 1 : 0)), [granted, reduceMotion]);
  const spin = useRef(new Animated.Value(0)).current;
  const [done, setDone] = useState(reduceMotion);
  const anim = useRef<Animated.CompositeAnimation | null>(null);

  const finish = useCallback(() => {
    anim.current?.stop();
    backdrop.setValue(1);
    items.forEach((v) => v.setValue(1));
    setDone(true);
  }, [backdrop, items]);

  useEffect(() => {
    const names = granted.map(displayNameOf).join(', ');
    AccessibilityInfo.announceForAccessibility?.(`${j.revealTitle}: ${reference}. ${names}`);
    if (reduceMotion) return;
    const seq = Animated.sequence([
      Animated.timing(backdrop, { toValue: 1, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: nativeDriver }),
      Animated.stagger(STEP, items.map((v) => Animated.timing(v, { toValue: 1, duration: 900, easing: Easing.out(Easing.back(1.4)), useNativeDriver: nativeDriver }))),
    ]);
    anim.current = seq;
    seq.start(({ finished }) => finished && setDone(true));
    const rot = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 24000, easing: Easing.linear, useNativeDriver: nativeDriver }));
    rot.start();
    return () => {
      seq.stop();
      rot.stop();
    };
  }, [backdrop, items, spin, reduceMotion, granted, reference]);

  // tamanho de cada artefato: cabe na tela sem rolagem para 1 a 3 itens
  const avail = height - insets.top - insets.bottom - (width < 360 ? 330 : 300);
  const artH = Math.max(110, Math.min(230, avail / n - 44));
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={[styles.overlay, { opacity: backdrop }]} testID="reveal-overlay" accessibilityViewIsModal>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16, minHeight: height }]}>
        <View style={styles.header}>
          <Plaque title={j.revealTitle} subtitle={reference} size={width < 360 ? 'md' : 'lg'} />
        </View>
        {granted.map((id, i) => {
          const it = getItem(id);
          const v = items[i]!;
          const art = isArtifact(id);
          const artW = art ? Math.min(width * 0.72, artH * ARTIFACT_RATIO[id]) : artH;
          return (
            <Animated.View key={id} style={[styles.item, { opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }, { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }]}
              accessible accessibilityLabel={fmt(j.revealLabel, { name: it ? displayName(it) : id })} testID={`reveal-item-${id}`}>
              <View style={[styles.artBox, { height: artH }]}>
                <Animated.View style={[styles.rays, { transform: [{ rotate: reduceMotion ? '0deg' : rotate }] }]} pointerEvents="none">
                  <GoldRays size={artH * 1.9} opacity={0.85} />
                </Animated.View>
                {art ? <ArtifactArt id={id} width={artW} glow /> : it ? <ItemIcon item={it} size={artH} /> : null}
              </View>
              <View style={styles.ribbon}>
                <AppText style={styles.name} color="#F7D98A" numberOfLines={2}>{it ? displayName(it) : id}</AppText>
              </View>
              <AppText variant="caption" color={RARITY_COLOR.holy} style={styles.rarity}>{strings.rarity.holy}</AppText>
            </Animated.View>
          );
        })}
        {alreadyOwned.length ? (
          <AppText variant="caption" style={styles.center} color="#C9BBA0">{fmt(j.revealAlreadyOwned, { items: alreadyOwned.map(displayNameOf).join(', ') })}</AppText>
        ) : null}
        <View style={styles.actions}>
          {done ? (
            <>
              <Button variant="gold" title={j.revealSeeSanctuary} onPress={onSanctuary} />
              <Button variant="secondary" title={j.revealContinue} onPress={onClose} />
            </>
          ) : (
            <Button variant="secondary" title={j.revealSkip} onPress={finish} />
          )}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#07060C', zIndex: 50 },
  content: { alignItems: 'center', paddingHorizontal: 16, gap: 10, justifyContent: 'center', width: '100%', maxWidth: 560, alignSelf: 'center' },
  header: { width: '100%', alignItems: 'center' },
  item: { alignItems: 'center', gap: 2, width: '100%' },
  artBox: { alignItems: 'center', justifyContent: 'center', width: '100%', overflow: 'visible' },
  rays: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ribbon: { backgroundColor: 'rgba(20, 14, 30, 0.92)', borderColor: '#C9A24A', borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 4, maxWidth: '92%' },
  name: { fontFamily: fonts.display, fontSize: 17, lineHeight: 22, textAlign: 'center' },
  rarity: { fontWeight: '700' },
  center: { textAlign: 'center' },
  actions: { width: '100%', gap: 10, marginTop: 6 },
});
