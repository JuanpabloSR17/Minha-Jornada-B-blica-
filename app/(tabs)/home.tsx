import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CinemaTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { AppText, Button, Card, IconBadge, Notice, Screen } from '@/ui';
import { fmt, strings } from '@/i18n';
import { useAuth } from '@/features/auth/AuthProvider';
import { useMyAvatar } from '@/features/avatar/hooks/useMyAvatar';
import { getDailyGoalStatus, getMissionOverview, getNextReading, type DailyGoalStatus, type MissionOverview } from '@/features/reading/mission/mission.service';
import { useMissionSession } from '@/features/reading/mission/useMissionSession';
import { missionStorage } from '@/features/reading/mission/storage';
import { nextChapter } from '@/features/reading/mission/session';
import bible from '@/features/reading/bible-books.json';
import { DailyGoalCard } from '@/features/reading/components/DailyGoalCard';
import { CampHero } from '@/features/journey/components/CampHero';
import { ActionPanel } from '@/features/journey/components/ActionPanel';
import { Plaque } from '@/features/journey/components/Plaque';
import { FeaturedTrail } from '@/features/journey/components/FeaturedTrail';
import { nextBookObjective, readingLevel } from '@/features/journey/progression';

const TAB_BAR = 64;

/** Início no acampamento: personagem real do jogador, passagem atual e ação principal sem rolagem. */
export default function Home() {
  const router = useRouter();
  const { profile, userId } = useAuth();
  const { avatar, error } = useMyAvatar();
  const { session, now } = useMissionSession();
  const { height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [overview, setOverview] = useState<MissionOverview | null>(null);
  const [goal, setGoal] = useState<DailyGoalStatus | null>(null);
  const [next, setNext] = useState<{ book: string; chapter: number } | null>(null);
  const [allDone, setAllDone] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getMissionOverview().then(setOverview, () => setOverview(null));
      getDailyGoalStatus().then(setGoal, () => setGoal(null));
    }, []),
  );
  // próxima leitura sugerida pelo servidor (progresso da conta, vale num aparelho novo);
  // sem conexão, usa a última leitura deste aparelho
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    getNextReading().then(
      (r) => {
        if (!alive) return;
        setAllDone(r.allDone);
        setNext(r.allDone ? null : r.next ?? { book: 'GEN', chapter: 1 });
      },
      () => missionStorage.loadResult(userId).then((r) => {
        const n = r ? nextChapter(bible as { code: string; chapters: number }[], r.book.code, r.chapter) : null;
        if (alive) setNext(n ?? { book: 'GEN', chapter: 1 });
      }),
    );
    return () => { alive = false; };
  }, [userId, session, overview]);

  const heroH = Math.max(470, Math.min(820, winH - insets.top - TAB_BAR));
  const level = overview ? readingLevel(overview.xpTotal) : null;
  const objective = overview ? nextBookObjective(overview.chaptersByBook) : null;

  return (
    <CinemaTheme>
      <Screen edges={['top', 'left', 'right']} contentStyle={styles.content}>
        <CampHero
          look={avatar}
          height={heroH}
          top={
            <>
              <Plaque title={strings.journey.appTitle} />
              <AppText variant="title" style={styles.greeting} color="#F6ECD6">{fmt(strings.home.greeting, { name: profile?.display_name ?? '' })}</AppText>
              {level ? (
                <View style={styles.hud} testID="camp-level">
                  <IconBadge name={level.rankIcon} color="#F2CE84" size={31} />
                  <AppText variant="label" color="#F4D899">Nível {level.level} · {level.title}</AppText>
                </View>
              ) : null}
            </>
          }
          bottom={
            <ActionPanel
              session={session}
              now={now}
              next={next}
              allDone={allDone}
              today={goal ? { done: goal.newChaptersToday, target: goal.target ?? null } : null}
              onOpenSession={() => router.push('/reading/mission')}
              onStart={() => allDone ? router.push('/(tabs)/profile') : next ? router.push({ pathname: '/(tabs)/read', params: { book: next.book, chapter: String(next.chapter), selection: String(Date.now()) } }) : router.push('/(tabs)/read')}
              onChoose={() => router.push('/(tabs)/read')}
            />
          }
        />
        <View style={styles.below}>
          {error ? <Notice tone="error">{error}</Notice> : null}
          {objective && objective.chaptersRead > 0 ? (
            <Card testID="camp-next-objective">
              <View style={styles.sectionTitle}>
                <IconBadge name="medal" />
                <View style={styles.flex}>
                  <AppText variant="caption" muted>Conquista ao alcance</AppText>
                  <AppText variant="heading">Concluir {objective.bookName}</AppText>
                </View>
              </View>
              <AppText muted>{objective.remaining === 1 ? 'Falta 1 capítulo' : `Faltam ${objective.remaining} capítulos`} · {objective.worldName}</AppText>
              <Button compact variant="secondary" icon="forward" title="Retomar esse livro"
                onPress={() => router.push({ pathname: '/(tabs)/read', params: { book: objective.book, chapter: String(objective.chapter), selection: String(Date.now()) } })} />
            </Card>
          ) : null}
          <FeaturedTrail completed={overview ? (overview.chaptersByBook.RUT?.length ?? 0) : undefined} />
          <DailyGoalCard session={session} hideStart />
          <Card>
            <View style={styles.sectionTitle}>
              <IconBadge name="compass" />
              <AppText variant="heading" style={styles.flex}>{strings.home.missionsTitle}</AppText>
            </View>
            {overview ? (
              <AppText variant="label">
                {fmt(strings.home.progress, { chapters: overview.chaptersCompleted, total: overview.totalChapters, xp: overview.xpTotal, siclos: overview.siclosBalance })}
              </AppText>
            ) : null}
            <Button icon="bag" title={strings.market.open} onPress={() => router.push('/market')} />
            <View style={styles.row}>
              <Button compact variant="secondary" icon="flag" title={strings.home.changeGoal} onPress={() => router.push('/settings/pace')} style={styles.flex} />
              <Button compact icon="outfit" title={strings.wardrobe.title} onPress={() => router.push('/avatar/wardrobe')} style={styles.flex} />
            </View>
            <Button compact variant="secondary" icon="sanctuary" title={strings.sanctuary.title} onPress={() => router.push('/avatar/sanctuary')} />
          </Card>
        </View>
      </Screen>
    </CinemaTheme>
  );
}

const styles = StyleSheet.create({
  hud: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#9E713B', backgroundColor: 'rgba(16, 12, 27, 0.9)', borderRadius: 22, paddingVertical: 2, paddingHorizontal: 9 },
  content: { padding: 0, gap: 0 },
  below: { padding: spacing.lg, gap: spacing.lg },
  greeting: { fontSize: 18, lineHeight: 24, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.7)', textShadowRadius: 6 },
  row: { flexDirection: 'row', gap: spacing.sm },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1, minWidth: 0 },
});
