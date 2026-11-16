import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText, Button, Card, Icon, IconBadge } from '@/ui';
import type { MissionResult } from '../mission/mission.service';
import { RUTH_TRAIL, TABERNACLE_TRAIL, type TrailStep } from './trails';

export function TrailReflection({ step }: { step: TrailStep }) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const { question, choices, correct, commentary } = step.reflection;
  return (
    <Card testID="trail-reflection">
      <View style={styles.row}>
        <IconBadge name="sparkle" color={colors.selection} />
        <View style={styles.copy}>
          <AppText variant="heading">Pausa para refletir</AppText>
          <AppText variant="caption" muted>{step.focus} · Opcional</AppText>
        </View>
      </View>
      {!expanded ? (
        <Button compact variant="secondary" icon="scroll" title="Abrir pergunta" onPress={() => setExpanded(true)} />
      ) : (
        <>
          <AppText variant="label">{question}</AppText>
          {choices.map((choice, index) => {
            const chosen = selected === index;
            const correctChoice = selected !== null && correct === index;
            const color = correctChoice ? colors.success : chosen ? colors.selection : colors.text;
            return (
              <Pressable
                key={choice}
                accessibilityRole="radio"
                accessibilityState={{ checked: chosen }}
                accessibilityLabel={correctChoice ? `${choice} Resposta correta.` : choice}
                onPress={() => setSelected(index)}
                style={({ pressed }) => [styles.option, {
                  borderColor: correctChoice || chosen ? color : colors.border,
                  backgroundColor: pressed || correctChoice || chosen ? colors.surfaceRaised : colors.backgroundAlt,
                }]}
              >
                <Icon name={correctChoice ? 'check' : chosen ? 'flag' : 'book'} size={17} color={color} />
                <AppText variant="label" color={color} style={styles.copy}>{choice}</AppText>
              </Pressable>
            );
          })}
          {selected !== null ? (
            <View style={[styles.commentary, { backgroundColor: colors.backgroundAlt }]} accessibilityLiveRegion="polite">
              <AppText variant="label" color={selected === correct ? colors.success : colors.primary}>
                {selected === correct ? 'Isso mesmo.' : 'Veja a resposta comentada'}
              </AppText>
              <AppText>{commentary}</AppText>
            </View>
          ) : null}
          <Button compact variant="ghost" title="Fechar pergunta" onPress={() => setExpanded(false)} />
        </>
      )}
    </Card>
  );
}

export function RelatedTrailReflection({ result }: { result: MissionResult }) {
  const router = useRouter();
  const trail = result.book.code === RUTH_TRAIL.book ? RUTH_TRAIL : TABERNACLE_TRAIL;
  const step = trail.book === result.book.code ? trail.steps.find((s) => s.chapter === result.chapter) : undefined;
  if (!step) return null;
  const trailId = trail === RUTH_TRAIL ? 'ruth' : 'tabernacle';
  return (
    <>
      <TrailReflection key={result.sessionId} step={step} />
      <Button variant="secondary" icon="compass" title={`Abrir ${trail.title.toLowerCase()}`} onPress={() => router.dismissTo({
        pathname: '/reading/trail',
        params: { trail: trailId },
      })} />
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  copy: { flex: 1, minWidth: 0 },
  option: { borderWidth: 1, borderRadius: radius.md, minHeight: 48, flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  commentary: { borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
});

