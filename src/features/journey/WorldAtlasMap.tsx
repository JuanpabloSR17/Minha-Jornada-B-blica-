import { useEffect, useRef } from 'react';
import { Animated, Easing, ImageBackground, Platform, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { fmt, strings } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText, Icon } from '@/ui';
import { worldStatus, type AtlasWorld } from './atlasRoute';
import { worldIcons } from './worldIcons';

const atlas = require('../../../assets/journey/worlds.webp');

export const worldColors: Record<AtlasWorld['id'], string> = {
  origens: '#E6BB70',
  reinos: '#D9A3FF',
  sabedoria: '#92D6AC',
  profetas: '#F3A991',
  evangelhos: '#E8C681',
  igreja: '#9DC6FF',
  'nova-criacao': '#F2AACE',
};

const stops = [
  { x: 12, y: 78 }, { x: 19, y: 28 }, { x: 40, y: 48 }, { x: 46, y: 82 },
  { x: 65, y: 53 }, { x: 70, y: 20 }, { x: 88, y: 75 },
] as const;
const trail = 'M12 78 Q29 55 19 28 Q27 23 40 48 L46 82 Q53 77 65 53 Q64 27 70 20 Q92 25 88 75';

const t = strings.journey;
export const statusLabel = { complete: t.worldCompleted, started: t.worldStarted, unexplored: t.worldNotStarted };

function MapPin({ world, index, done, selected, onSelect }: {
  world: AtlasWorld;
  index: number;
  done: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const { colors, reduceMotion } = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!selected || reduceMotion) {
      pulse.setValue(0);
      return;
    }
    const motion = Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(pulse, { toValue: 0, duration: 280, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
    ]);
    motion.start();
    return () => motion.stop();
  }, [pulse, reduceMotion, selected]);

  const { x, y } = stops[index]!;
  const status = worldStatus(world, done);
  const accent = done ? colors.success : worldColors[world.id];
  const preview = selected || status !== 'unexplored';
  return (
    <Pressable
      testID={`journey-pin-${world.id}`}
      accessibilityRole="button"
      accessibilityLabel={fmt(t.mapStop, { position: index + 1, world: world.name })}
      accessibilityHint={statusLabel[status]}
      accessibilityState={{ selected }}
      onPress={onSelect}
      style={({ pressed }) => [
        styles.pin,
        {
          left: `${x}%`,
          top: `${y}%`,
          borderColor: accent,
          backgroundColor: selected ? accent : '#151126',
          opacity: pressed ? 0.8 : 1,
        },
        preview && { shadowColor: accent, shadowOpacity: 0.5, shadowRadius: 10, elevation: 3 },
        selected && styles.pinSelected,
      ]}
    >
      {selected ? (
        <Animated.View aria-hidden importantForAccessibility="no" pointerEvents="none" style={[
          styles.halo, { borderColor: accent, transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.23] }) }] },
        ]} />
      ) : null}
      <Icon name={done ? 'medal' : worldIcons[world.id]} color={selected ? '#1D1226' : accent} size={20} />
      {status === 'started' && !selected ? <View aria-hidden style={[styles.beacon, { backgroundColor: accent }]} /> : null}
    </Pressable>
  );
}

export function WorldAtlasMap({ worlds, completed, selected, booksCompleted, onSelect }: {
  worlds: AtlasWorld[];
  completed: ReadonlySet<string>;
  selected: string | null;
  booksCompleted?: number;
  onSelect: (world: AtlasWorld['id']) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.hero} testID="journey-atlas">
      <ImageBackground source={atlas} resizeMode="cover" style={styles.backdrop} pointerEvents="none" />
      <View style={styles.titleStrip}>
        <Icon name="compass" color={colors.primary} size={23} />
        <AppText variant="display" style={styles.title}>{strings.tabs.journey}</AppText>
      </View>
      <View style={styles.map}>
        {worlds.length > 0 ? (
          <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={StyleSheet.absoluteFill} pointerEvents="none" aria-hidden>
            <Path d={trail} fill="none" stroke="#0B081C" strokeOpacity={0.75} strokeWidth="2.5" />
            <Path d={trail} fill="none" stroke="#FBE0A8" strokeOpacity={0.8} strokeWidth="1" strokeDasharray="2 1.7" />
          </Svg>
        ) : null}
        {worlds.map((world, i) => (
          <MapPin key={world.id} world={world} index={i} done={completed.has(world.id)} selected={selected === world.id} onSelect={() => onSelect(world.id)} />
        ))}
      </View>
      {booksCompleted != null ? (
        <View style={styles.summary}>
          <AppText variant="label">{fmt(t.worldSummary, { books: booksCompleted, worlds: completed.size, total: worlds.length })}</AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: '#171128', borderRadius: radius.xl, borderColor: '#8C6B3D', borderWidth: 1, overflow: 'hidden' },
  backdrop: { ...StyleSheet.absoluteFill, opacity: 0.77 },
  titleStrip: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: 'rgba(13, 10, 28, .85)' },
  title: { flex: 1, fontSize: 24, lineHeight: 31 },
  map: { height: 199 },
  pin: { position: 'absolute', width: 44, height: 44, marginLeft: -22, marginTop: -22, borderWidth: 1.5, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  pinSelected: { borderWidth: 2, zIndex: 1 },
  halo: { position: 'absolute', width: 51, height: 51, borderWidth: 1, borderRadius: radius.pill, opacity: 0.85 },
  beacon: { position: 'absolute', width: 7, height: 7, bottom: -3, right: 2, borderRadius: radius.pill },
  summary: { alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: '#866B5599', backgroundColor: 'rgba(13, 10, 28, .91)' },
});
