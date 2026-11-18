import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, spacing } from '@/theme/tokens';
import { AppText, Icon } from '@/ui';
import { GlassPanel, glassTones } from './GlassPanel';
import { ProgressMeter } from './ProgressMeter';
import { readingLevel } from '../progression';

export function ReadingRank({ xpTotal }: { xpTotal: number }) {
  const { colors } = useTheme();
  const rank = readingLevel(xpTotal);
  const xpColor = glassTones.xp.light;

  return (
    <GlassPanel tone="xp" testID="reading-rank">
      <View style={styles.row}>
        <View aria-hidden style={styles.emblem}>
          <Svg width="100%" height="100%" viewBox="0 0 60 64" style={StyleSheet.absoluteFill}>
            <Path d="M30 2 56 9v23c0 13-10 23-26 30C14 55 4 45 4 32V9Z" fill={colors.background}
              stroke={xpColor} strokeWidth={1.5} />
            <Path d="M30 7 51 13v19c0 10-7 20-21 25-14-5-21-15-21-25V13Z" fill={colors.stage}
              stroke={glassTones.xp.mid} strokeWidth={1} />
            <Path d="M25 47h10M27 51h6" stroke={xpColor} strokeWidth={1} />
          </Svg>
          <View style={styles.rankIcon}><Icon name={rank.rankIcon} size={26} color={xpColor} /></View>
        </View>
        <View style={styles.main}>
          <AppText variant="caption" color={xpColor}>Nível {rank.level}</AppText>
          <AppText variant="heading" accessibilityRole="header" style={styles.title}>{rank.title}</AppText>
          <AppText variant="caption" muted>XP acumulado · {rank.xpTotal.toLocaleString('pt-BR')}</AppText>
        </View>
      </View>
      <View style={styles.xp}>
        <View style={styles.row}>
          <AppText variant="caption" style={styles.main}>Nível {rank.level + 1}</AppText>
          <AppText variant="label" color={xpColor} style={styles.numeric}>{rank.currentXp} / {rank.xpForLevel} XP</AppText>
        </View>
        <ProgressMeter value={rank.currentXp} total={rank.xpForLevel} label={`Experiência para o nível ${rank.level + 1}`}
          tone="xp" height={14} from={0} />
        <AppText variant="caption" muted>{rank.remainingXp === 1 ? 'Falta 1 XP' : `Faltam ${rank.remainingXp} XP`}</AppText>
      </View>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  emblem: { width: 60, height: 64, alignItems: 'center', justifyContent: 'center', paddingBottom: 7 },
  rankIcon: { zIndex: 1 },
  title: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28 },
  main: { flex: 1, minWidth: 100 },
  xp: { gap: spacing.xs },
  numeric: { fontVariant: ['tabular-nums'] },
});
