import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText, Button, Card, Icon, Notice, Screen } from '@/ui';
import { fmt, strings } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { getMissionOverview, type MissionOverview } from '../mission/mission.service';
import { startMission, type MissionMode } from '../mission/session';
import { useMissionSession } from '../mission/useMissionSession';
import { DailyGoalCard } from '../components/DailyGoalCard';
import { RARITY_COLOR } from '@/features/avatar/components/RarityBadge';
import { ActiveSessionCard } from '../components/ActiveSessionCard';
import { useMilestones } from '../useMilestones';
import { milestoneSummary } from '../milestones';

export { bookName, refLabel } from '../refs';
import { BOOKS, refLabel } from '../refs';

/** Modo Missão (aba Ler): escolher livro, capítulo e modo de leitura, e iniciar a missão. */
export function MissionHomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ book?: string; chapter?: string; selection?: string }>();
  const { userId, session, loaded, commit } = useMissionSession();
  const [overview, setOverview] = useState<MissionOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [book, setBook] = useState<string | null>(null);
  const [chapter, setChapter] = useState<number | null>(null);
  const [mode, setMode] = useState<MissionMode>('physical');
  // marcos dos Santos: só o resumo aqui; a escolha do marco fica na tela do marco
  const { rows: milestoneRowsData } = useMilestones();
  const milestoneSum = milestoneRowsData ? milestoneSummary(milestoneRowsData) : null;
  const nextMilestone = milestoneRowsData?.find((r) => !r.completed);

  useFocusEffect(
    useCallback(() => {
      getMissionOverview().then((o) => { setOverview(o); setError(null); }, (e) => setError(errorMessage(e)));
    }, []),
  );

  // "Próximo capítulo" na tela de recompensa chega aqui já selecionado
  useEffect(() => {
    const requested = BOOKS.find((b) => b.code === params.book);
    if (requested) {
      setBook(requested.code);
      const ch = Number(params.chapter);
      setChapter(Number.isInteger(ch) && ch >= 1 && ch <= requested.chapters ? ch : null);
    }
  }, [params.book, params.chapter, params.selection]);

  const selectedBook = BOOKS.find((b) => b.code === book) ?? null;
  const done = useMemo(() => new Set(overview?.chaptersByBook[book ?? ''] ?? []), [overview, book]);

  const start = async () => {
    if (!userId || !book || !chapter || session) return;
    try {
      await commit(startMission({ userId, book, chapter, mode }));
      router.push('/reading/mission');
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const chip = (selected: boolean) => [styles.chip, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.surfaceRaised : colors.surface }];

  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppText variant="title">{strings.mission.title}</AppText>
      <AppText muted>{strings.mission.intro}</AppText>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <ActiveSessionCard />

      {overview ? (
        <Card>
          <AppText variant="label">
            {fmt(strings.mission.progress, { chapters: overview.chaptersCompleted, total: overview.totalChapters, percent: overview.percent, books: overview.booksCompleted, xp: overview.xpTotal })} · {overview.siclosBalance} {strings.mission.siclos}
          </AppText>
          <AppText variant="caption" muted>{strings.mission.xpNote}</AppText>
        </Card>
      ) : null}

      <DailyGoalCard session={session} hideStart />


      {milestoneSum ? (
        <Card style={{ borderColor: RARITY_COLOR.holy }}>
          <AppText variant="heading">{strings.mission.milestones}</AppText>
          <AppText variant="label">{fmt(strings.mission.milestonesDone, { done: milestoneSum.milestonesDone, total: milestoneSum.milestonesTotal })}</AppText>
          <AppText variant="caption" muted>{fmt(strings.mission.saintsOwned, { owned: milestoneSum.saintsOwned, total: milestoneSum.saintsTotal })}</AppText>
          {nextMilestone ? <AppText variant="caption" muted>{fmt(strings.mission.milestonesNext, { name: nextMilestone.name, ref: refLabel(nextMilestone.book, nextMilestone.chapter) })}</AppText> : null}
          <Button variant="secondary" title={strings.mission.milestonesSeeAll} onPress={() => router.push('/reading/milestones')} />
        </Card>
      ) : null}

      {overview?.missions.some((m) => m.kind === 'mission') ? (
        <Card>
          <AppText variant="heading">{strings.mission.curated}</AppText>
          {overview.missions.filter((m) => m.kind === 'mission').map((m) => (
            <Pressable key={m.id} accessibilityRole="button" onPress={() => { setBook(m.book); setChapter(m.chapter); }} style={styles.missionRow}>
              <Icon name={m.completed ? 'check' : 'sparkle'} size={18} color={m.completed ? colors.success : colors.primary} />
              <View style={styles.flex}>
                <AppText variant="label">{m.name}</AppText>
                <AppText variant="caption" muted>{refLabel(m.book, m.chapter)}{m.completed ? ` · ${strings.mission.curatedDone}` : ''}</AppText>
              </View>
            </Pressable>
          ))}
        </Card>
      ) : null}

      <Card>
        <AppText variant="heading">{strings.mission.chooseBook}</AppText>
        {(['AT', 'NT'] as const).map((t) => (
          <View key={t} style={styles.section}>
            <AppText variant="caption" muted>{t === 'AT' ? strings.mission.oldTestament : strings.mission.newTestament}</AppText>
            <View style={styles.wrap} accessibilityRole="radiogroup">
              {BOOKS.filter((b) => b.testament === t).map((b) => {
                const n = overview?.chaptersByBook[b.code]?.length ?? 0;
                const sel = b.code === book;
                return (
                  <Pressable key={b.code} accessibilityRole="radio" accessibilityState={{ checked: sel }} accessibilityLabel={`${b.name}, ${n} de ${b.chapters}`}
                    onPress={() => { setBook(b.code); setChapter(null); }} style={chip(sel)}>
                    <AppText variant="caption" style={styles.chipText}>{b.name}</AppText>
                    <AppText variant="caption" muted style={styles.chipText}>{fmt(strings.mission.bookProgress, { done: n, total: b.chapters })}</AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </Card>

      {selectedBook ? (
        <Card>
          <AppText variant="heading">{fmt('{c}: {b}', { c: strings.mission.chooseChapter, b: selectedBook.name })}</AppText>
          <View style={styles.wrap} accessibilityRole="radiogroup">
            {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((n) => {
              const sel = n === chapter;
              const isDone = done.has(n);
              return (
                <Pressable key={n} accessibilityRole="radio" accessibilityState={{ checked: sel }}
                  accessibilityLabel={`${strings.mission.chooseChapter} ${n}${isDone ? `, ${strings.mission.chapterDone}` : ''}`}
                  onPress={() => setChapter(n)}
                  style={[styles.num, { borderColor: sel ? colors.primary : isDone ? colors.primary : colors.border, backgroundColor: sel ? colors.primary : colors.surface }]}>
                  <AppText variant="label" color={sel ? colors.onPrimary : isDone ? colors.primary : colors.text}>{n}</AppText>
                  {isDone && !sel ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
                </Pressable>
              );
            })}
          </View>
        </Card>
      ) : null}

      {selectedBook && chapter ? (milestoneRowsData ?? []).filter((r) => !r.completed && r.book === selectedBook.code && r.chapter === chapter).map((mk) => (
        <Card key={mk.id} style={{ borderColor: RARITY_COLOR.holy }} testID="chapter-milestone-hint">
          <AppText variant="label">{fmt(strings.mission.chapterHasMilestone, { name: mk.name })}</AppText>
          <AppText variant="caption" muted>{strings.mission.ordinaryHasMilestoneBody}</AppText>
          <Button compact variant="secondary" title={strings.mission.openMilestone} onPress={() => router.push({ pathname: '/reading/milestone/[id]', params: { id: mk.id } })} />
        </Card>
      )) : null}

      {selectedBook && chapter ? (
        <Card>
          <AppText variant="heading">{strings.mission.chooseMode}</AppText>
          <Pressable accessibilityRole="radio" accessibilityState={{ checked: mode === 'physical' }} onPress={() => setMode('physical')} style={[styles.mode, chip(mode === 'physical')]}>
            <Icon name="book" size={22} color={colors.primary} />
            <View style={styles.flex}>
              <AppText variant="label">{strings.mission.physical}</AppText>
              <AppText variant="caption" muted>{strings.mission.physicalHint}</AppText>
            </View>
          </Pressable>
          <Pressable accessibilityRole="radio" accessibilityState={{ checked: false, disabled: true }} disabled style={[styles.mode, chip(false), { opacity: 0.55 }]}>
            <Icon name="device" size={22} color={colors.textMuted} />
            <View style={styles.flex}>
              <AppText variant="label">{strings.mission.digital}</AppText>
              <AppText variant="caption" muted>{strings.mission.digitalUnavailable}</AppText>
            </View>
          </Pressable>
          {session ? <Notice tone="info">{fmt(strings.mission.otherActive, { ref: refLabel(session.book, session.chapter) })}</Notice> : null}
          <AppText variant="caption" muted>{strings.mission.noTime}</AppText>
          <Button
            title={`${strings.mission.start}: ${refLabel(selectedBook.code, chapter)}`}
            onPress={() => void start()} disabled={!!session || !loaded} />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  section: { gap: spacing.xs, marginTop: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { borderWidth: 1, borderRadius: radius.md, paddingVertical: 6, paddingHorizontal: 10 },
  chipText: { fontSize: 12, lineHeight: 15 },
  num: { width: 44, height: 44, borderWidth: 1, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', bottom: 4, width: 5, height: 5, borderRadius: 3 },
  mode: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  missionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
});
