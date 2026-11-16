import { ImageBackground, Pressable, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { AppText, Icon, type IconName } from '@/ui';
import { fonts } from '@/theme/tokens';
import { HUD } from './LobbyHud';

/**
 * Cartão de modo de jogo: arte do próprio jogo ao fundo, nome gravado, uma frase e o progresso
 * da conta. O cartão inteiro é o botão.
 */
export function ModeCard({
  title,
  body,
  meta,
  icon,
  art,
  tint,
  onPress,
  testID,
}: {
  title: string;
  body: string;
  meta?: string | null;
  icon: IconName;
  art?: ImageSourcePropType;
  tint: string;
  onPress: () => void;
  testID?: string;
}) {
  const label = [title, body, meta].filter(Boolean).join('. ');
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.card, { borderColor: tint }, pressed && styles.pressed]} testID={testID}>
      {art ? <ImageBackground source={art} resizeMode="cover" style={StyleSheet.absoluteFill} imageStyle={styles.art} /> : null}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 10 10" pointerEvents="none">
        <Defs>
          <LinearGradient id={`mode-${testID ?? title}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0C1124" stopOpacity={art ? 0.15 : 0.6} />
            <Stop offset="0.55" stopColor="#0C1124" stopOpacity={0.7} />
            <Stop offset="1" stopColor="#0C1124" stopOpacity={0.96} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={10} height={10} fill={`url(#mode-${testID ?? title})`} />
      </Svg>
      <View style={[styles.icon, { borderColor: tint }]}>
        <Icon name={icon} color={tint} size={20} />
      </View>
      <View style={styles.text}>
        <AppText style={styles.title} color={HUD.ink} numberOfLines={2}>{title}</AppText>
        <AppText variant="caption" color={HUD.muted} numberOfLines={2}>{body}</AppText>
        {meta ? <AppText variant="caption" color={tint} style={styles.meta} numberOfLines={1}>{meta}</AppText> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexBasis: '47%', flexGrow: 1, minHeight: 168, borderRadius: 16, borderWidth: 1.5, overflow: 'hidden', backgroundColor: '#1B1631', padding: 12, justifyContent: 'space-between' },
  pressed: { opacity: 0.85 },
  art: { opacity: 0.9 },
  icon: { width: 38, height: 38, borderRadius: 12, borderWidth: 1.5, backgroundColor: 'rgba(12,10,24,0.85)', alignItems: 'center', justifyContent: 'center' },
  text: { gap: 3 },
  title: { fontFamily: fonts.display, fontSize: 16, lineHeight: 20 },
  meta: { fontWeight: '700' },
});
