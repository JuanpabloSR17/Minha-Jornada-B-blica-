import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { AppText, Icon } from '@/ui';
import { fonts } from '@/theme/tokens';
import { fmt, strings } from '@/i18n';
import { AvatarRenderer } from '@/features/avatar/components/AvatarRenderer';
import type { AvatarLook } from '@/features/avatar/domain/avatar.types';
import { levelFromXp } from './level';

const l = strings.lobby;
export const HUD = { gold: '#E9BA5B', bronze: '#C9A24A', ink: '#F6ECD6', muted: '#C9BBA0', plate: 'rgba(12, 10, 24, 0.82)', violet: '#B48CFF' };

/** Escudo do nível (gravado em bronze, número em Cinzel). */
function LevelShield({ n }: { n: number }) {
  return (
    <View style={styles.shield} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={30} height={34} viewBox="0 0 30 34" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="lvShield" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFE7A3" />
            <Stop offset="0.5" stopColor="#D9A441" />
            <Stop offset="1" stopColor="#8A5A16" />
          </LinearGradient>
        </Defs>
        <Path d="M15 1 28 6v10c0 8.5-6 14-13 17C8 30 2 24.5 2 16V6z" fill="url(#lvShield)" stroke="#5A3A0E" strokeWidth={1.4} />
      </Svg>
      <AppText style={styles.shieldNum} color="#2A1606">{n}</AppText>
    </View>
  );
}

/**
 * HUD do lobby: quem eu sou (retrato, nome, nível e XP) à esquerda e o que eu tenho (Siclos,
 * capítulos) à direita. O retrato abre o Perfil; os Siclos abrem o Mercado.
 */
export function LobbyHud({
  name,
  look,
  xp,
  siclos,
  chapters,
  onProfile,
  onMarket,
}: {
  name: string;
  look: AvatarLook | null;
  xp: number | null;
  siclos: number | null;
  chapters: number | null;
  onProfile: () => void;
  onMarket: () => void;
}) {
  const lv = levelFromXp(xp ?? 0);
  return (
    <View style={styles.hud} testID="lobby-hud">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={fmt(l.playerLabel, { name, n: lv.level, into: lv.into, span: lv.span })}
        onPress={onProfile}
        style={({ pressed }) => [styles.player, pressed && styles.pressed]}
      >
        <View style={styles.portraitRing}>
          <View style={styles.portrait}>
            {look ? <AvatarRenderer appearance={look.appearance} equippedItems={look.equipment} size={46} crop="head" showBackground={false} accessibilityLabel="" /> : null}
          </View>
          <LevelShield n={lv.level} />
        </View>
        <View style={styles.who}>
          <AppText style={styles.name} color={HUD.ink} numberOfLines={1}>{name}</AppText>
          <View style={styles.xpTrack} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <View style={[styles.xpFill, { width: `${Math.max(4, lv.progress * 100)}%` }]} />
          </View>
          <AppText variant="caption" color={HUD.muted} numberOfLines={1} style={styles.small}>
            {fmt(l.level, { n: lv.level })}
          </AppText>
        </View>
      </Pressable>
      <View style={styles.wallet}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={fmt(l.siclosLabel, { n: siclos ?? 0 })}
          onPress={onMarket}
          style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
          testID="lobby-siclos"
        >
          <Icon name="coin" color={HUD.gold} size={18} />
          <AppText style={styles.chipNum} color={HUD.ink}>{siclos ?? '–'}</AppText>
        </Pressable>
        <View style={styles.chip} accessible accessibilityLabel={fmt(l.chapters, { n: chapters ?? 0 })}>
          <Icon name="book" color={HUD.violet} size={18} />
          <AppText style={styles.chipNum} color={HUD.ink}>{chapters ?? '–'}</AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hud: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%' },
  pressed: { opacity: 0.8 },
  player: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1, minWidth: 0, backgroundColor: HUD.plate, borderColor: 'rgba(201,162,74,0.55)', borderWidth: 1, borderRadius: 30, paddingLeft: 3, paddingRight: 12, paddingVertical: 3, minHeight: 56 },
  portraitRing: { width: 52, height: 52 },
  portrait: { width: 50, height: 50, borderRadius: 25, overflow: 'hidden', borderWidth: 2, borderColor: HUD.bronze, backgroundColor: '#2A2045', alignItems: 'center', justifyContent: 'center' },
  shield: { position: 'absolute', right: -8, bottom: -6, width: 30, height: 34, alignItems: 'center', justifyContent: 'center' },
  shieldNum: { fontFamily: fonts.display, fontSize: 14, lineHeight: 18, marginTop: -2 },
  who: { flexShrink: 1, minWidth: 0, gap: 3, paddingLeft: 4 },
  name: { fontFamily: fonts.display, fontSize: 15, lineHeight: 19 },
  xpTrack: { height: 7, width: 96, maxWidth: '100%', borderRadius: 4, backgroundColor: '#2A2336', borderWidth: 1, borderColor: '#5A4A2A', overflow: 'hidden' },
  xpFill: { height: '100%', backgroundColor: HUD.violet },
  small: { fontSize: 11, lineHeight: 14 },
  wallet: { flexDirection: 'row', gap: 6, flexShrink: 0 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: HUD.plate, borderColor: 'rgba(201,162,74,0.55)', borderWidth: 1, borderRadius: 18, paddingHorizontal: 9, minHeight: 36, minWidth: 44, justifyContent: 'center' },
  chipNum: { fontFamily: fonts.display, fontSize: 14, lineHeight: 18 },
});
