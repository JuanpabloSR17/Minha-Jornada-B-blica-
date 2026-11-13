import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CinemaTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { AppText, Button, Card, Notice, Screen } from '@/ui';
import { fmt, strings } from '@/i18n';
import { useAuth } from '@/features/auth/AuthProvider';
import { useMyAvatar } from '@/features/avatar/hooks/useMyAvatar';
import { getDailyGoalStatus, getMissionOverview, type DailyGoalStatus, type MissionOverview } from '@/features/reading/mission/mission.service';
import { useMissionSession } from '@/features/reading/mission/useMissionSession';
import { missionStorage } from '@/features/reading/mission/storage';
import { nextChapter } from '@/features/reading/mission/session';
import bible from '@/features/reading/bible-books.json';
import { DailyGoalCard } from '@/features/reading/components/DailyGoalCard';
import { CampHero } from '@/features/journey/components/CampHero';
import { ActionPanel } from '@/features/journey/components/ActionPanel';
import { Plaque } from '@/features/journey/components/Plaque';

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

  useFocusEffect(
    useCallback(() => {
      getMissionOverview().then(setOverview, () => setOverview(null));
      getDailyGoalStatus().then(setGoal, () => setGoal(null));
    }, []),
  );
  // próxima leitura sugerida: o capítulo seguinte ao último lido neste aparelho (ou Gênesis 1)
  useEffect(() => {
    if (!userId) return;
    void missionStorage.loadResult(userId).then((r) => {
      const n = r ? nextChapter(bible as { code: string; chapters: number }[], r.book.code, r.chapter) : null;
      setNext(n ?? { book: 'GEN', chapter: 1 });
    });
  }, [userId, session]);

  const heroH = Math.max(470, Math.min(820, winH - insets.top - TAB_BAR));

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
            </>
          }
          bottom={
            <ActionPanel
              session={session}
              now={now}
              next={next}
              today={goal ? { done: goal.newChaptersToday, target: goal.target ?? null } : null}
              onOpenSession={() => router.push('/reading/mission')}
              onStart={() => (next ? router.push({ pathname: '/(tabs)/read', params: { book: next.book, chapter: String(next.chapter) } }) : router.push('/(tabs)/read'))}
            />
          }
        />
        <View style={styles.below}>
          {error ? <Notice tone="error">{error}</Notice> : null}
          <DailyGoalCard session={session} hideStart />
          <Card>
            <AppText variant="heading">{strings.home.missionsTitle}</AppText>
            {overview ? (
              <AppText variant="label">
                {fmt(strings.home.progress, { chapters: overview.chaptersCompleted, total: overview.totalChapters, xp: overview.xpTotal, siclos: overview.siclosBalance })}
              </AppText>
            ) : null}
            <Button title={strings.market.open} onPress={() => router.push('/market')} />
            <View style={styles.row}>
              <Button compact variant="secondary" title={strings.home.changeGoal} onPress={() => router.push('/settings/pace')} style={styles.flex} />
              <Button compact title={strings.wardrobe.title} onPress={() => router.push('/avatar/wardrobe')} style={styles.flex} />
            </View>
            <Button compact variant="secondary" title={strings.sanctuary.title} onPress={() => router.push('/avatar/sanctuary')} />
          </Card>
        </View>
      </Screen>
    </CinemaTheme>
  );
}

const styles = StyleSheet.create({
  content: { padding: 0, gap: 0 },
  below: { padding: spacing.lg, gap: spacing.lg },
  greeting: { fontSize: 18, lineHeight: 24, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.7)', textShadowRadius: 6 },
  row: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
});
