import { useState, type ReactNode } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { fmt, strings } from '@/i18n';
import { AvatarRenderer } from '@/features/avatar/components/AvatarRenderer';
import { describeLook } from '@/features/avatar/domain/describe';
import type { AvatarLook } from '@/features/avatar/domain/avatar.types';
import { CampBackdrop, CampFireGlow, CampFlames } from '../art/scenes';
import { useAmbient } from '../useAmbient';

/**
 * Acampamento noturno em camadas: cenário estático → chamas (animadas) → personagem real do
 * jogador (mesma aparência e equipamento do guarda-roupa) → luz da fogueira sobre tudo (animada)
 * → vinheta para a leitura do painel. Com "reduzir movimento", tudo fica estático.
 */
export function CampHero({ look, height, top, bottom }: { look: AvatarLook | null; height: number; top?: ReactNode; bottom?: ReactNode }) {
  const [width, setWidth] = useState(0);
  const fire = useAmbient(1400);
  const breath = useAmbient(4200, 300);
  const size = { width, height };
  // personagem ocupa ~60% da largura (enquadramento próximo), sem cobrir a fogueira à direita
  const avatarH = Math.min(height * 0.8, width * 1.18, 560);
  return (
    <View style={[styles.hero, { height }]} onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))} testID="camp-hero">
      {width ? (
        <>
          <View style={StyleSheet.absoluteFill} pointerEvents="none"><CampBackdrop {...size} /></View>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: fire.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] }), transform: [{ scaleY: fire.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.03] }) }] }]} pointerEvents="none">
            <CampFlames {...size} />
          </Animated.View>
          {look ? (
            <Animated.View
              pointerEvents="none"
              style={[styles.avatar, { bottom: Math.max(8, Math.min(140, height - 100 - avatarH)), transform: [{ translateY: breath.interpolate({ inputRange: [0, 1], outputRange: [1.5, -1.5] }) }] }]}
              testID="camp-avatar"
            >
              <AvatarRenderer
                appearance={look.appearance}
                equippedItems={look.equipment}
                size={avatarH}
                crop="camp"
                showBackground={false}
                accessibilityLabel={fmt(strings.journey.campAvatarLabel, { summary: describeLook(look) })}
              />
            </Animated.View>
          ) : null}
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: fire.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.85] }) }]} pointerEvents="none">
            <CampFireGlow {...size} />
          </Animated.View>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg width={width} height={height}>
              <Defs>
                <LinearGradient id="campVignette" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#05070F" stopOpacity={0.55} />
                  <Stop offset="0.22" stopColor="#05070F" stopOpacity={0} />
                  <Stop offset="0.62" stopColor="#05070F" stopOpacity={0} />
                  <Stop offset="1" stopColor="#05070F" stopOpacity={0.85} />
                </LinearGradient>
              </Defs>
              <Rect x={0} y={0} width={width} height={height} fill="url(#campVignette)" />
            </Svg>
          </View>
        </>
      ) : null}
      <View style={styles.top}>{top}</View>
      <View style={styles.bottom}>{bottom}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', overflow: 'hidden', backgroundColor: '#0C1124', justifyContent: 'space-between' },
  avatar: { position: 'absolute', left: -6 },
  top: { paddingTop: 12, paddingHorizontal: 16, gap: 6, alignItems: 'center' },
  bottom: { padding: 12, paddingBottom: 14 },
});
