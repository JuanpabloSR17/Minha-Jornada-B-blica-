import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { CinemaTheme, useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText, Button, Card, Icon, IconBadge, Notice, Screen } from '@/ui';
import { errorMessage } from '@/lib/errors';
import { StepHeader } from '@/features/avatar/components/StepHeader';
import { ItemIcon } from '@/features/avatar/components/ItemIcon';
import { displayName, getItem } from '@/features/avatar/domain/catalog';
import { TabernacleStage } from '@/features/journey/components/TabernacleStage';
import { nativeDriver } from '@/features/journey/useAmbient';
import { ActiveSessionCard } from '../components/ActiveSessionCard';
import { getMissionOverview, type MissionOverview } from '../mission/mission.service';
import { startMission } from '../mission/session';
import { useMissionSession } from '../mission/useMissionSession';
import { refLabel } from '../refs';
import { useMilestones } from '../useMilestones';
import { completedTrailSteps, RUTH_TRAIL, TABERNACLE_TRAIL, type Trail } from './trails';
import { TrailReflection } from './TrailReflection';

const ruthArt = require('../../../../assets/journey/ruth.webp');
const ruthReward = getItem('book_rut');

export function ReadingTrailScreen() {
  const { trail } = useLocalSearchParams<{ trail?: string }>();
  return (
    <CinemaTheme>
      <ReadingTrail key={trail === 'tabernacle' ? 'tabernacle' : 'ruth'} trail={trail === 'tabernacle' ? TABERNACLE_TRAIL : RUTH_TRAIL} />
    </CinemaTheme>
  );
}

function TabernaclePreview({ title }: { title: string }) {
  const { rows } = useMilestones();
  const furniture = rows?.find((milestone) => milestone.id === TABERNACLE_TRAIL.steps[0]?.milestoneId);
  return (
    <View style={styles.stageWrap}>
      {furniture ? <TabernacleStage items={furniture.items} completed={furniture.completed} /> : null}
      <AppText variant="display" accessibilityRole="header">{title}</AppText>
    </View>
  );
}

function ReadingTrail({ trail }: { trail: Trail }) {
  const { colors, reduceMotion } = useTheme();
  const router = useRouter();
  const { chapter } = useLocalSearchParams<{ chapter?: string }>();
  const { session, loaded, userId, commit } = useMissionSession();
  const [overview, setOverview] = useState<MissionOverview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const starting = useRef(false);
  const requestId = useRef(0);
  const [selected, setSelected] = useState<number | null>(null);
  const opacity = useRef(new Animated.Value(1)).current;
  const exodus = trail === TABERNACLE_TRAIL;
  const chaptersRead = overview?.chaptersByBook[trail.book] ?? [];
  const milestonesDone = new Set(overview?.missions.filter((m) => m.kind === 'milestone' && m.completed).map((m) => m.id));
  const completed = completedTrailSteps(trail, chaptersRead, milestonesDone);
  const total = trail.steps.length;
  const allDone = !!overview && completed.length === total;
  const next = trail.steps.find((step) => !completed.includes(step));
  const step = trail.steps.find((s) => s.chapter === selected)
    ?? trail.steps.find((s) => s.chapter === Number(chapter))
    ?? (session?.book === trail.book ? trail.steps.find((s) => s.chapter === session.chapter) : undefined)
    ?? next
    ?? trail.steps[0]!;
  const stepDone = completed.includes(step);
  const canReflect = chaptersRead.includes(step.chapter);

  const refresh = useCallback(async () => {
    const request = ++requestId.current;
    setLoadError(null);
    try {
      const current = await getMissionOverview();
      if (request === requestId.current) setOverview(current);
    } catch (e) {
      if (request === requestId.current) setLoadError(errorMessage(e));
    }
  }, []);
  useFocusEffect(useCallback(() => {
    void refresh();
    return () => { requestId.current++; };
  }, [refresh]));

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(1);
      return;
    }
    opacity.setValue(0.8);
    const animation = Animated.timing(opacity, { toValue: 1, duration: 240, useNativeDriver: nativeDriver });
    animation.start();
    return () => animation.stop();
  }, [step.chapter, opacity, reduceMotion]);

  const begin = async () => {
    if (!loaded || session || !userId || starting.current) return;
    starting.current = true;
    setBusy(true);
    setActionError(null);
    try {
      await commit(startMission({ userId, book: trail.book, chapter: step.chapter, mode: 'physical' }));
      router.push('/reading/mission');
    } catch (e) {
      setActionError(errorMessage(e));
    } finally {
      starting.current = false;
      setBusy(false);
    }
  };
  const goBack = () => router.canGoBack() ? router.back() : router.replace('/(tabs)/read');
  const selectionColor = allDone ? colors.success : colors.primary;
  const trailLabel = `${completed.length} de ${total} etapas concluídas`;

  return (
    <Screen>
      <StepHeader title="Trilhas" onBack={goBack} />
      {exodus ? (
        <TabernaclePreview title={trail.title} />
      ) : (
        <ImageBackground source={ruthArt} imageStyle={styles.heroImage} style={[styles.hero, { borderColor: colors.borderStrong }]}>
          <View style={styles.heroText}>
            <AppText variant="display" color="#FFF3D8" accessibilityRole="header">{trail.title}</AppText>
            <AppText variant="caption" color="#F3E2C4">De Moabe aos campos de Belém</AppText>
          </View>
        </ImageBackground>
      )}

      <ActiveSessionCard />
      {loadError ? (
        <Card>
          <Notice tone="error">{loadError}</Notice>
          <Button variant="secondary" title="Atualizar progresso" onPress={() => void refresh()} />
        </Card>
      ) : !overview ? <ActivityIndicator color={colors.primary} accessibilityLabel="Carregando progresso da trilha" /> : null}

      {overview ? (
        <Card style={{ borderColor: selectionColor }} testID="trail-progress">
          <View style={styles.row}>
            <IconBadge name={allDone ? 'medal' : 'map'} color={selectionColor} />
            <View style={styles.flex}>
              <AppText variant="heading">{allDone ? 'Trilha concluída' : trailLabel}</AppText>
              {allDone ? <AppText variant="caption" muted>{trailLabel}</AppText> : null}
            </View>
          </View>
          <View accessibilityRole="progressbar" accessibilityLabel={trailLabel} accessibilityValue={{ min: 0, max: total, now: completed.length }} style={styles.rail}>
            {trail.steps.map((item) => (
              <View importantForAccessibility="no" key={item.chapter} style={[styles.segment, { backgroundColor: completed.includes(item) ? selectionColor : colors.border }]} />
            ))}
          </View>
          {allDone ? <AppText muted>{exodus ? 'Visite o Santuário para rever os artefatos da trilha.' : 'Seu livro está completo. Você pode revisitar a história ou rever o Manto do Resgate.'}</AppText> : null}
        </Card>
      ) : null}
      <View style={styles.tabs}>
        {trail.steps.map((item) => {
          const current = step === item;
          const done = completed.includes(item);
          const color = current ? colors.primary : done ? colors.success : colors.textMuted;
          const label = refLabel(trail.book, item.chapter);
          return (
            <Pressable
              key={item.chapter}
              testID={`trail-step-${item.chapter}`}
              accessibilityRole="button"
              accessibilityState={{ selected: current }}
              accessibilityLabel={`${label}, ${item.title}${done ? ', concluído' : ''}`}
              onPress={() => setSelected(item.chapter)}
              style={({ pressed }) => [styles.stepButton, {
                borderColor: current ? colors.primary : colors.border,
                backgroundColor: current || pressed ? colors.surfaceRaised : colors.surface,
              }]}
            >
              <Icon name={done ? 'check' : item.icon} color={color} size={21} />
              <AppText variant="label" color={color}>{item.chapter}</AppText>
            </Pressable>
          );
        })}
      </View>

      <Animated.View style={[styles.detail, { opacity }]}>
        <Card style={{ borderColor: stepDone ? colors.success : colors.borderStrong }} testID="trail-chapter">
          <View style={styles.row}>
            <IconBadge name={stepDone ? 'check' : step.icon} color={stepDone ? colors.success : colors.primary} />
            <View style={styles.flex}>
              <AppText variant="caption" color={stepDone ? colors.success : colors.primary}>
                {refLabel(trail.book, step.chapter)}{stepDone ? ' · Concluído' : step === next && overview ? ' · Próxima etapa' : ''}
              </AppText>
              <AppText variant="heading">{step.title}</AppText>
            </View>
          </View>
          <AppText>{step.introduction}</AppText>
          <AppText variant="caption" muted>Na Bíblia, observe {step.focus}.</AppText>
          {actionError ? <Notice tone="error">{actionError}</Notice> : null}
          {step.milestoneId ? (
            <>
              <Button variant={stepDone ? 'secondary' : 'gold'} icon="flag" title="Ver marco e artefatos" onPress={() => router.push({
                pathname: '/reading/milestone/[id]', params: { id: step.milestoneId! },
              })} />
              {stepDone ? <Button variant="ghost" icon="book" title={`Reler ${refLabel(trail.book, step.chapter)}`} disabled={!loaded || !!session} loading={busy} onPress={() => void begin()} /> : null}
            </>
          ) : (
            <Button
              variant="gold"
              icon={stepDone ? 'book' : 'play'}
              title={`${canReflect ? 'Reler' : 'Ler'} ${refLabel(trail.book, step.chapter)}`}
              disabled={!loaded || !!session}
              loading={busy}
              onPress={() => void begin()}
            />
          )}
        </Card>

        {canReflect ? <TrailReflection key={step.chapter} step={step} /> : null}
        {exodus ? (
          <Button variant="secondary" icon="sanctuary" title="Visitar Santuário" onPress={() => router.push('/avatar/sanctuary')} />
        ) : ruthReward ? (
          <Card style={styles.row}>
            <ItemIcon item={ruthReward} size={56} />
            <View style={styles.flex}>
              <AppText variant="label">{displayName(ruthReward)}</AppText>
              <AppText variant="caption" muted>Lendário por concluir os quatro capítulos de Rute.</AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Ver ${displayName(ruthReward)}`}
              style={styles.rewardLink}
              onPress={() => router.push({ pathname: '/avatar/item/[id]', params: { id: ruthReward.id } })}
            >
              <Icon name="forward" color={colors.primary} size={23} />
            </Pressable>
          </Card>
        ) : null}
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { minHeight: 210, justifyContent: 'flex-end', borderWidth: 1, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#251E3D' },
  heroImage: { borderRadius: radius.lg },
  heroText: { backgroundColor: 'rgba(12, 9, 20, 0.88)', padding: spacing.lg, gap: spacing.xs },
  stageWrap: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1, minWidth: 0 },
  rail: { flexDirection: 'row', gap: spacing.xs },
  segment: { flex: 1, height: 6, borderRadius: radius.pill },
  tabs: { flexDirection: 'row', gap: spacing.sm },
  stepButton: { flex: 1, minHeight: 58, justifyContent: 'center', alignItems: 'center', gap: spacing.xs, borderWidth: 1, borderRadius: radius.md },
  detail: { gap: spacing.lg },
  rewardLink: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});

