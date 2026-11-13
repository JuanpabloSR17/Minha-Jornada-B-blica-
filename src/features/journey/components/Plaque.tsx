import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { AppText } from '@/ui';
import { fonts } from '@/theme/tokens';

/** Placa de título em moldura dourada (títulos serifados das telas da jornada). */
export function Plaque({ title, subtitle, size = 'lg', style }: { title: string; subtitle?: string; size?: 'lg' | 'md'; style?: StyleProp<ViewStyle> }) {
  const big = size === 'lg';
  return (
    <View style={[styles.wrap, style]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 300 80" preserveAspectRatio="none" pointerEvents="none">
        <Defs>
          <LinearGradient id="plaqueFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#2A2030" stopOpacity={0.94} />
            <Stop offset="1" stopColor="#120D18" stopOpacity={0.94} />
          </LinearGradient>
          <LinearGradient id="plaqueGold" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFE3A0" />
            <Stop offset="0.5" stopColor="#D9A441" />
            <Stop offset="1" stopColor="#8A5A16" />
          </LinearGradient>
        </Defs>
        <Path d="M14 2 H286 L298 14 V66 L286 78 H14 L2 66 V14 Z" fill="url(#plaqueFill)" stroke="url(#plaqueGold)" strokeWidth={2.4} />
        <Path d="M18 7 H282 L292 17 V63 L282 73 H18 L8 63 V17 Z" fill="none" stroke="#D9A441" strokeOpacity={0.45} strokeWidth={1} />
      </Svg>
      <AppText variant="title" accessibilityRole="header" numberOfLines={2}
        style={[styles.title, { fontFamily: fonts.display, fontSize: big ? 26 : 20, lineHeight: big ? 32 : 26 }]} color="#F7D98A">
        {title}
      </AppText>
      {subtitle ? <AppText variant="label" style={styles.sub} color="#E9DCC0">{subtitle}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'center', paddingHorizontal: 22, paddingVertical: 8, minWidth: 220, maxWidth: '100%', alignItems: 'center' },
  title: { textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 2 } },
  sub: { textAlign: 'center' },
});
