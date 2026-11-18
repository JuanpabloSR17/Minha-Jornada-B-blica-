import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { fmt, strings } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { ActiveSessionCard } from '@/features/reading/components/ActiveSessionCard';
import { getMissionOverview, getWorldProgress, type MissionOverview, type WorldProgress } from '@/features/reading/mission/mission.service';
import { refLabel } from '@/features/reading/refs';
import { CinemaTheme, useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText, Button, Card, Icon, IconBadge, Notice, Screen } from '@/ui';
import { journeyProgress } from './worlds';
import { worldIcons } from './worldIcons';
import { featuredWorld, nextPassage, worldStatus, type AtlasWorld } from './atlasRoute';
import { WorldAtlasMap, statusLabel, worldColors } from './WorldAtlasMap';
import { GlassPanel, glassTones } from './components/GlassPanel';
import { ProgressMeter } from './components/ProgressMeter';

const t = strings.journey;
type AtlasBook = AtlasWorld['books'][number];
type OpenChapter = (book: string, chapter: number) => void;

function ChapterProgress({ done, total }: { done: number; total: number }) {
  const tone = done === total && total > 0 ? 'complete' : 'reading';
  return (
    <View style={styles.progress}>
      <AppText variant="caption" color={glassTones[tone].light} style={styles.numeric}>{fmt(t.worldChapters, { done, total })}</AppText>
      <ProgressMeter value={done} total={total} tone={tone} />
    </View>
  );
}

function Entry({ children }: { children: ReactNode }) {
  const { reduceMotion } = useTheme();
  const alpha = useRef(new Animated.Value(reduceMotion ? 1 : 0.75)).current;
  useEffect(() => {
    if (reduceMotion) {
      alpha.setValue(1);
      return;
    }
    const fade = Animated.timing(alpha, { toValue: 1, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' });
    fade.start();
    return () => fade.stop();
  }, [alpha, reduceMotion]);
  return <Animated.View style={[styles.stack, { opacity: alpha }]}>{children}</Animated.View>;
}

function BookRow({ book, color, expanded, onToggle, onRead }: {
  book: AtlasBook;
  color: string;
  expanded: boolean;
  onToggle: () => void;
  onRead: OpenChapter;
}) {
  const { colors } = useTheme();
  const done = book.chaptersRead.size;
  const next = book.nextChapter;
  return (
    <View style={styles.book}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={({ pressed }) => [styles.bookRow, { opacity: pressed ? 0.75 : 1 }]}
      >
        <Icon name={next == null ? 'check' : 'book'} size={19} color={next == null ? colors.success : color} />
        <View style={styles.grow}>
          <AppText variant="label">{book.name}</AppText>
          {done > 0 ? <AppText variant="caption" color={next == null ? colors.success : colors.textMuted}>{next == null ? 'Livro concluído' : 'Em leitura'}</AppText> : null}
        </View>
        <AppText variant="caption" muted>{done} / {book.chapters}</AppText>
        <Icon name={expanded ? 'chevronUp' : 'chevronDown'} color={color} size={17} />
      </Pressable>
      {expanded ? (
        <Entry>
          <ChapterProgress done={done} total={book.chapters} />
          {next != null ? (
            <Button compact variant="secondary" icon="play" title={fmt(t.worldReadChapter, { chapter: next })}
              accessibilityHint={refLabel(book.code, next)} onPress={() => onRead(book.code, next)} />
          ) : null}
          <View style={styles.chapters}>
            {Array.from({ length: book.chapters }, (_, i) => i + 1).map((chapter) => {
              const read = book.chaptersRead.has(chapter);
              const highlighted = chapter === next;
              return (
                <Pressable key={chapter} accessibilityRole="button"
                  accessibilityLabel={`${refLabel(book.code, chapter)}${read ? `, ${strings.mission.chapterDone}` : ''}`}
                  accessibilityHint={highlighted ? 'Próximo capítulo deste livro' : undefined}
                  onPress={() => onRead(book.code, chapter)}
                  style={({ pressed }) => [
                    styles.chapter,
                    {
                      borderColor: read ? colors.success : highlighted ? color : '#46405B',
                      backgroundColor: read ? colors.successSurface : highlighted ? colors.surfaceRaised : colors.background,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}>
                  <AppText variant="label" color={read ? colors.success : highlighted ? color : colors.text}>{chapter}</AppText>
                  {read ? <Icon name="check" size={12} color={colors.success} /> : null}
                </Pressable>
              );
            })}
          </View>
        </Entry>
      ) : null}
    </View>
  );
}

function WorldObjective({ world, color, completed, onRead }: {
  world: AtlasWorld;
  color: string;
  completed: boolean;
  onRead: OpenChapter;
}) {
  const { colors } = useTheme();
  const next = completed ? null : nextPassage(world);
  return (
    <View style={[styles.objective, { borderColor: completed ? colors.success : color }]}>
      <View style={styles.row}>
        <IconBadge name={completed ? 'medal' : 'flag'} color={completed ? colors.success : color} size={42} />
        <View style={styles.grow}>
          <AppText variant="heading" color={completed ? colors.success : colors.text}>
            {completed ? 'Medalha conquistada' : next ? refLabel(next.code, next.chapter) : 'Todos os capítulos lidos'}
          </AppText>
          <AppText variant="caption" muted>
            {completed ? 'A medalha deste mundo está no seu Perfil.' : next ? (
              next.remainingInBook === 1 ? 'Último capítulo para concluir este livro' : `${next.remainingInBook} capítulos para concluir este livro`
            ) : 'Confira o registro da medalha no Perfil.'}
          </AppText>
        </View>
      </View>
      {next ? (
        <Button compact icon="play" variant="gold" title="Abrir próxima passagem" onPress={() => onRead(next.code, next.chapter)} />
      ) : null}
    </View>
  );
}

function WorldCard({ world, completed, expanded, onToggle, onRead, onTrail }: {
  world: AtlasWorld;
  completed: boolean;
  expanded: boolean;
  onToggle: () => void;
  onRead: OpenChapter;
  onTrail: (trail: 'ruth' | 'tabernacle') => void;
}) {
  const { colors } = useTheme();
  const [openBook, setOpenBook] = useState<string | null>(null);
  const state = worldStatus(world, completed);
  const tint = completed ? colors.success : worldColors[world.id];
  const booksDone = world.books.filter((book) => book.nextChapter == null).length;
  return (
    <Card
      testID={`journey-world-${world.id}`}
      style={[styles.worldCard, { borderColor: expanded || completed ? tint : '#49405D' }]}
    >
      <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={onToggle}
        style={({ pressed }) => [styles.worldRow, { opacity: pressed ? 0.75 : 1 }]}>
        <IconBadge name={completed ? 'medal' : worldIcons[world.id]} color={tint} size={49} />
        <View style={[styles.grow, styles.progress]}>
          <AppText variant="heading">{world.name}</AppText>
          <ChapterProgress done={world.done} total={world.total} />
          <View style={styles.statusRow}>
            <Icon name={state === 'complete' ? 'check' : state === 'started' ? 'flag' : 'compass'} color={tint} size={14} />
            <AppText variant="caption" color={tint}>{statusLabel[state]}</AppText>
          </View>
        </View>
        <Icon name={expanded ? 'chevronUp' : 'chevronDown'} color={tint} size={18} />
      </Pressable>
      {expanded ? (
        <Entry>
          <WorldObjective world={world} completed={completed} color={tint} onRead={onRead} />
          {world.id === 'reinos' ? (
            <Button compact variant="secondary" icon="scroll" title="Trilha guiada de Rute" onPress={() => onTrail('ruth')} />
          ) : null}
          {world.id === 'origens' ? (
            <Button compact variant="secondary" icon="sanctuary" title="Trilha do Tabernáculo" onPress={() => onTrail('tabernacle')} />
          ) : null}
          <View style={styles.bookHeading}>
            <Icon name="book" color={tint} size={18} />
            <AppText variant="label" style={styles.grow}>Livros</AppText>
            <AppText variant="caption" muted>{booksDone} de {world.books.length} concluídos</AppText>
          </View>
          <View style={styles.books}>
            {world.books.map((book) => (
              <BookRow key={book.code} book={book} color={tint} expanded={openBook === book.code}
                onToggle={() => setOpenBook(openBook === book.code ? null : book.code)} onRead={onRead} />
            ))}
          </View>
        </Entry>
      ) : null}
    </Card>
  );
}

function Atlas() {
  const { colors } = useTheme();
  const router = useRouter();
  const [progress, setProgress] = useState<{ overview: MissionOverview; worlds: WorldProgress[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [overview, worlds] = await Promise.all([getMissionOverview(), getWorldProgress()]);
      setProgress({ overview, worlds });
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  const overview = progress?.overview;
  const worlds = useMemo(() => overview ? journeyProgress(overview.chaptersByBook) : [], [overview]);
  const completed = new Set(progress?.worlds.filter((world) => world.completedAt).map((world) => world.id));
  const allWorldsCompleted = worlds.length > 0 && worlds.every((world) => completed.has(world.id));
  const featured = featuredWorld(worlds, completed);
  const visibleWorlds = selected ? worlds.filter((world) => world.id === selected) : worlds;
  const openChapter: OpenChapter = (book, chapter) =>
    router.navigate({ pathname: '/(tabs)/read', params: { book, chapter: String(chapter), selection: String(Date.now()) } });
  const selectWorld = (worldId: AtlasWorld['id']) => {
    setSelected(worldId);
    setExpanded(worldId);
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <WorldAtlasMap worlds={worlds} completed={completed} selected={selected} booksCompleted={overview?.booksCompleted} onSelect={selectWorld} />
      <ActiveSessionCard />
      {error ? <Card>
        <Notice tone="error">{error}</Notice>
        <Button title={strings.common.retry} variant="secondary" onPress={() => void refresh()} />
      </Card> : null}
      {overview ? (
        <>
          {selected ? <Button compact variant="ghost" icon="map" title={t.allWorlds} onPress={() => setSelected(null)} /> : null}
          {!selected ? (
            <Card style={styles.routeCard} testID="journey-overall">
              <View style={styles.row}>
                <IconBadge name={featured ? worldIcons[featured.id] : allWorldsCompleted ? 'medal' : 'book'}
                  color={featured ? worldColors[featured.id] : colors.success} size={42} />
                <View style={styles.grow}>
                  {featured ? <AppText variant="label" color={colors.textMuted}>Destino sugerido</AppText> : null}
                  <AppText variant="heading">
                    {featured?.name ?? (allWorldsCompleted ? 'Todos os mundos concluídos' : 'Todos os capítulos lidos')}
                  </AppText>
                </View>
              </View>
              {featured ? <Button compact variant="secondary" icon="compass" title="Explorar destino" onPress={() => selectWorld(featured.id)} /> : null}
              <GlassPanel tone="reading" style={styles.atlasProgress}>
                <ChapterProgress done={overview.chaptersCompleted} total={overview.totalChapters} />
              </GlassPanel>
            </Card>
          ) : null}
          {visibleWorlds.map((world) => (
            <WorldCard key={world.id} world={world} completed={completed.has(world.id)} expanded={expanded === world.id}
              onToggle={() => setExpanded(expanded === world.id ? null : world.id)} onRead={openChapter}
              onTrail={(trail) => router.push({ pathname: '/reading/trail', params: { trail } })} />
          ))}
        </>
      ) : !error ? <ActivityIndicator color={colors.primary} accessibilityLabel={strings.common.loading} /> : null}
    </Screen>
  );
}

export function JourneyScreen() {
  return <CinemaTheme><Atlas /></CinemaTheme>;
}

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grow: { flex: 1, minWidth: 0 },
  progress: { gap: spacing.xs },
  atlasProgress: { padding: spacing.md, borderRadius: radius.md },
  numeric: { fontVariant: ['tabular-nums'] },
  worldCard: { backgroundColor: '#1D1833', padding: spacing.md },
  worldRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 52 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  routeCard: { backgroundColor: '#231D3D', borderColor: '#766047' },
  objective: { borderWidth: 1, borderRadius: radius.md, backgroundColor: '#151329', padding: spacing.sm, gap: spacing.sm },
  bookHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  books: { gap: spacing.sm },
  book: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.md, backgroundColor: '#151225' },
  bookRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44 },
  chapters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.xs },
  chapter: { minWidth: 44, minHeight: 44, paddingHorizontal: spacing.xs, borderWidth: 1, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 2 },
});
