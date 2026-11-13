import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { fmt, strings } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { ActiveSessionCard } from '@/features/reading/components/ActiveSessionCard';
import { getMissionOverview, type MissionOverview } from '@/features/reading/mission/mission.service';
import { refLabel } from '@/features/reading/refs';
import { CinemaTheme, useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, spacing } from '@/theme/tokens';
import { AppText, Button, Card, Icon, Notice, Screen } from '@/ui';
import { journeyProgress } from './worlds';

const t = strings.journey;
const atlas = require('../../../assets/journey/worlds.webp');
type World = ReturnType<typeof journeyProgress>[number];

function ChapterProgress({ done, total }: { done: number; total: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.progress}>
      <AppText variant="caption" muted>{fmt(t.worldChapters, { done, total })}</AppText>
      <View style={[styles.track, { backgroundColor: colors.background }]} importantForAccessibility="no">
        <View style={[styles.fill, { backgroundColor: colors.primary, width: `${100 * done / total}%` }]} />
      </View>
    </View>
  );
}

function WorldCard({ world, expanded, onToggle, onRead }: {
  world: World;
  expanded: boolean;
  onToggle: () => void;
  onRead: (book: string, chapter: number) => void;
}) {
  const { colors } = useTheme();
  const [openBook, setOpenBook] = useState<string | null>(null);
  return (
    <Card style={{ borderColor: expanded ? colors.primary : colors.border }}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={onToggle} style={styles.row}>
        <View style={[styles.seal, { backgroundColor: colors.background, borderColor: colors.borderStrong }]}>
          <Icon name={world.done === world.total ? 'check' : 'map'} color={colors.primary} />
        </View>
        <View style={styles.grow}>
          <AppText variant="heading" style={styles.worldTitle}>{world.name}</AppText>
          <ChapterProgress done={world.done} total={world.total} />
        </View>
        <AppText color={colors.primary} accessibilityElementsHidden importantForAccessibility="no">{expanded ? '−' : '+'}</AppText>
      </Pressable>
      {expanded && world.books.map((book) => {
        const bookExpanded = openBook === book.code;
        return (
          <View key={book.code} style={[styles.book, { borderTopColor: colors.border }]}>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: bookExpanded }}
              onPress={() => setOpenBook(bookExpanded ? null : book.code)} style={styles.row}>
              <Icon name={book.nextChapter ? 'book' : 'check'} size={18} color={colors.primary} />
              <AppText variant="label" style={styles.grow}>{book.name}</AppText>
              <AppText variant="caption" muted>{book.chaptersRead.size} / {book.chapters}</AppText>
              <AppText color={colors.primary} accessibilityElementsHidden importantForAccessibility="no">{bookExpanded ? '−' : '+'}</AppText>
            </Pressable>
            {bookExpanded && (
              <View style={styles.chapterList}>
                {book.nextChapter && (
                  <Button compact variant="gold" title={fmt(t.worldReadChapter, { chapter: book.nextChapter })}
                    accessibilityHint={refLabel(book.code, book.nextChapter)} onPress={() => onRead(book.code, book.nextChapter!)} />
                )}
                <View style={styles.chapters}>
                  {Array.from({ length: book.chapters }, (_, i) => i + 1).map((chapter) => {
                    const read = book.chaptersRead.has(chapter);
                    return (
                      <Pressable key={chapter} accessibilityRole="button"
                        accessibilityLabel={`${refLabel(book.code, chapter)}${read ? `, ${strings.mission.chapterDone}` : ''}`}
                        onPress={() => onRead(book.code, chapter)}
                        style={[styles.chapter, { borderColor: read ? colors.success : colors.border, backgroundColor: read ? colors.successSurface : colors.background }]}>
                        <AppText variant="label" color={read ? colors.success : colors.text}>{chapter}</AppText>
                        {read && <Icon name="check" size={12} color={colors.success} />}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        );
      })}
    </Card>
  );
}

function Atlas() {
  const { colors } = useTheme();
  const router = useRouter();
  const [overview, setOverview] = useState<MissionOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    setError(null);
    try {
      setOverview(await getMissionOverview());
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  const worlds = useMemo(() => overview ? journeyProgress(overview.chaptersByBook) : [], [overview]);
  const openChapter = (book: string, chapter: number) =>
    router.navigate({ pathname: '/(tabs)/read', params: { book, chapter: String(chapter), selection: String(Date.now()) } });

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ImageBackground source={atlas} resizeMode="cover" style={[styles.hero, { borderColor: colors.borderStrong }]} testID="journey-atlas">
        <View style={styles.heroText}>
          <AppText variant="title" accessibilityRole="header" style={styles.title}>{strings.tabs.journey}</AppText>
          {overview && <AppText variant="label" muted>{fmt(t.worldSummary, { books: overview.booksCompleted, worlds: worlds.filter((world) => world.done === world.total).length, total: worlds.length })}</AppText>}
        </View>
      </ImageBackground>
      <ActiveSessionCard />
      {error ? <Card>
        <Notice tone="error">{error}</Notice>
        <Button title={strings.common.retry} variant="secondary" onPress={() => void refresh()} />
      </Card> : null}
      {overview ? (
        <>
          <Card><ChapterProgress done={overview.chaptersCompleted} total={overview.totalChapters} /></Card>
          {worlds.map((world) => (
            <WorldCard key={world.id} world={world} expanded={expanded === world.id}
              onToggle={() => setExpanded(expanded === world.id ? null : world.id)} onRead={openChapter} />
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
  hero: { height: 216, justifyContent: 'flex-end', borderWidth: 1, borderRadius: radius.lg, overflow: 'hidden' },
  heroText: { backgroundColor: 'rgba(12, 10, 22, 0.87)', padding: spacing.md, gap: spacing.xs },
  title: { fontFamily: fonts.display },
  worldTitle: { fontFamily: fonts.displayRegular, fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44 },
  grow: { flex: 1, minWidth: 0 },
  seal: { width: 42, height: 42, borderWidth: 1, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  progress: { gap: spacing.xs },
  track: { height: 6, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  book: { borderTopWidth: 1, paddingTop: spacing.xs },
  chapterList: { gap: spacing.sm, paddingBottom: spacing.sm },
  chapters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chapter: { minWidth: 44, minHeight: 44, paddingHorizontal: spacing.xs, borderWidth: 1, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 2 },
});
