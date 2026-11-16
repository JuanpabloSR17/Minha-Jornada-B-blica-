import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CinemaTheme } from '@/theme/ThemeProvider';
import { fonts, spacing } from '@/theme/tokens';
import { AppText, Button, Icon, Notice, Screen } from '@/ui';
import { fmt, strings } from '@/i18n';
import { useAuth } from '@/features/auth/AuthProvider';
import { useMyAvatar } from '@/features/avatar/hooks/useMyAvatar';
import { getDailyGoalStatus, getMissionOverview, getNextReading, getWorldProgress, type DailyGoalStatus, type MissionOverview, type WorldProgress } from '@/features/reading/mission/mission.service';
import { useMissionSession } from '@/features/reading/mission/useMissionSession';
import { missionStorage } from '@/features/reading/mission/storage';
import { nextChapter } from '@/features/reading/mission/session';
import bible from '@/features/reading/bible-books.json';
import { DailyGoalCard } from '@/features/reading/components/DailyGoalCard';
import { CampHero } from '@/features/journey/components/CampHero';
import { ActionPanel } from '@/features/journey/components/ActionPanel';
import { LobbyHud, HUD } from '@/features/lobby/LobbyHud';
import { LobbyRail } from '@/features/lobby/LobbyRail';
import { ModeCard } from '@/features/lobby/ModeCard';
import { CATALOG_MISSIONS } from '@/features/avatar/domain/catalog';

const MILESTONE_TOTAL = CATALOG_MISSIONS.filter((m) => m.kind === 'milestone').length;

const TAB_BAR = 72;
const l = strings.lobby;
const ART = {
  mission: require('../../assets/journey/camp-night.webp'),
  map: require('../../assets/journey/worlds.webp'),
  market: require('../../assets/journey/market.webp'),
};

/** Cabeçalho de seção do lobby: ícone gravado + título em Cinzel, com ação opcional à direita. */
function SectionHead({ icon, title, action }: { icon: 'chest' | 'compass'; title: string; action?: ReactNode }) {
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionTitle}>
        <Icon name={icon} color={HUD.gold} size={20} />
        <AppText accessibilityRole="header" style={styles.sectionText} color={HUD.ink}>{title}</AppText>
      </View>
      {action}
    </View>
  );
}

/**
 * Lobby do jogo no acampamento. Cada função tem o seu lugar:
 * - HUD (topo): quem eu sou (retrato, nível, XP) e o que eu tenho (Siclos, capítulos);
 * - trilho lateral: Loja, Vestiário, Troféus e Marcos;
 * - painel de jogar (base do cenário): a próxima leitura e o botão principal, sem rolagem;
 * - abaixo: missão diária e os modos de jogo.
 */
export default function Home() {
  const router = useRouter();
  const { profile, userId } = useAuth();
  const { avatar, error } = useMyAvatar();
  const { session, now } = useMissionSession();
  const { height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [overview, setOverview] = useState<MissionOverview | null>(null);
  const [goal, setGoal] = useState<DailyGoalStatus | null>(null);
  const [worlds, setWorlds] = useState<WorldProgress[] | null>(null);
  const [next, setNext] = useState<{ book: string; chapter: number } | null>(null);

  useFocusEffect(
    useCallback(() => {
      getMissionOverview().then(setOverview, () => setOverview(null));
      getDailyGoalStatus().then(setGoal, () => setGoal(null));
      getWorldProgress().then(setWorlds, () => setWorlds(null));
    }, []),
  );
  // próxima leitura sugerida pelo servidor (progresso da conta, vale num aparelho novo);
  // sem conexão, usa a última leitura deste aparelho
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    getNextReading().then(
      (r) => alive && setNext(r.next ?? { book: 'GEN', chapter: 1 }),
      () => missionStorage.loadResult(userId).then((r) => {
        const n = r ? nextChapter(bible as { code: string; chapters: number }[], r.book.code, r.chapter) : null;
        if (alive) setNext(n ?? { book: 'GEN', chapter: 1 });
      }),
    );
    return () => { alive = false; };
  }, [userId, session, overview]);

  const heroH = Math.max(500, Math.min(820, winH - insets.top - TAB_BAR));
  const name = profile?.display_name ?? '';
  const milestonesDone = overview?.missions.filter((m) => m.kind === 'milestone' && m.completed).length ?? null;
  const worldsDone = worlds ? worlds.filter((w) => w.completedAt).length : null;

  return (
    <CinemaTheme>
      <Screen edges={['top', 'left', 'right']} contentStyle={styles.content}>
        <CampHero
          look={avatar}
          height={heroH}
          top={
            <>
              <LobbyHud
                name={name}
                look={avatar}
                xp={overview?.xpTotal ?? null}
                siclos={overview?.siclosBalance ?? null}
                chapters={overview?.chaptersCompleted ?? null}
                onProfile={() => router.push('/(tabs)/profile')}
                onMarket={() => router.push('/market')}
              />
              <AppText variant="title" style={styles.greeting} color={HUD.ink}>{fmt(strings.home.greeting, { name })}</AppText>
            </>
          }
          side={
            <LobbyRail
              compact={heroH < 700}
              items={[
                { key: 'shop', label: l.shop, accessibilityLabel: strings.market.open, icon: 'shop', onPress: () => router.push('/market') },
                { key: 'wardrobe', label: l.wardrobe, accessibilityLabel: strings.wardrobe.title, icon: 'outfit', onPress: () => router.push('/avatar/wardrobe') },
                { key: 'trophies', label: l.trophies, accessibilityLabel: strings.sanctuary.title, icon: 'trophy', onPress: () => router.push('/avatar/sanctuary') },
                { key: 'milestones', label: l.milestones, accessibilityLabel: strings.mission.milestones, icon: 'flag', onPress: () => router.push('/reading/milestones') },
              ]}
            />
          }
          bottom={
            <ActionPanel
              session={session}
              now={now}
              next={next}
              today={goal ? { done: goal.newChaptersToday, target: goal.target ?? null } : null}
              onOpenSession={() => router.push('/reading/mission')}
              onStart={() => (next ? router.push({ pathname: '/(tabs)/read', params: { book: next.book, chapter: String(next.chapter), selection: String(Date.now()) } }) : router.push('/(tabs)/read'))}
              onChoose={() => router.push('/(tabs)/read')}
            />
          }
        />
        <View style={styles.below}>
          {error ? <Notice tone="error">{error}</Notice> : null}

          <View style={styles.panel} testID="lobby-daily">
            <SectionHead
              icon="chest"
              title={l.dailyTitle}
              action={<Button compact variant="ghost" title={strings.home.changeGoal} onPress={() => router.push('/settings/pace')} style={styles.headBtn} />}
            />
            <DailyGoalCard session={session} hideStart />
          </View>

          <View style={styles.modes}>
            <SectionHead icon="compass" title={l.modesTitle} />
            <View style={styles.grid}>
              <ModeCard
                testID="mode-mission"
                title={l.modeMission}
                body={l.modeMissionBody}
                meta={overview ? fmt(l.chaptersCount, { done: overview.chaptersCompleted, total: overview.totalChapters }) : null}
                icon="book"
                art={ART.mission}
                tint={HUD.gold}
                onPress={() => router.push('/(tabs)/read')}
              />
              <ModeCard
                testID="mode-map"
                title={l.modeMap}
                body={l.modeMapBody}
                meta={worldsDone != null ? fmt(l.worldsCount, { done: worldsDone, total: worlds?.length ?? 7 }) : null}
                icon="map"
                art={ART.map}
                tint="#8FC2FF"
                onPress={() => router.push('/(tabs)/journey')}
              />
              <ModeCard
                testID="mode-milestones"
                title={l.modeMilestones}
                body={l.modeMilestonesBody}
                meta={milestonesDone != null ? fmt(l.milestonesCount, { done: milestonesDone, total: MILESTONE_TOTAL }) : null}
                icon="flag"
                tint={HUD.violet}
                onPress={() => router.push('/reading/milestones')}
              />
              <ModeCard
                testID="mode-sanctuary"
                title={l.modeSanctuary}
                body={l.modeSanctuaryBody}
                icon="trophy"
                art={ART.market}
                tint="#F2C66C"
                onPress={() => router.push('/avatar/sanctuary')}
              />
            </View>
          </View>
        </View>
      </Screen>
    </CinemaTheme>
  );
}

const styles = StyleSheet.create({
  content: { padding: 0, gap: 0 },
  greeting: { fontSize: 16, lineHeight: 22, textAlign: 'left', alignSelf: 'flex-start', paddingLeft: 4, textShadowColor: 'rgba(0,0,0,0.85)', textShadowRadius: 6 },
  below: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxl },
  panel: { gap: spacing.sm },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, minHeight: 44 },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  sectionText: { fontFamily: fonts.display, fontSize: 18, lineHeight: 24 },
  headBtn: { minHeight: 40 },
  modes: { gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
});
