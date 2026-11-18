import { useCallback, useMemo, useState } from 'react';
import { SkinThumb } from '@/features/skins/SkinThumb';
import { ActivityIndicator, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { CinemaTheme } from '@/theme/ThemeProvider';
import { fonts, radius, spacing } from '@/theme/tokens';
import { AppText, Button, Icon, Notice, Screen } from '@/ui';
import { fmt, strings } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { getMissionOverview, getWorldProgress, type MissionOverview, type WorldProgress } from '@/features/reading/mission/mission.service';
import { useMilestones } from '@/features/reading/useMilestones';
import { refLabel } from '@/features/reading/refs';
import { journeyProgress, WORLDS } from '@/features/journey/worlds';
import { worldIcons } from '@/features/journey/worldIcons';
import { SKINS, SKIN_RARITY_COLOR, SKIN_RARITY_LABEL } from '@/features/skins/catalog';
import { getMySkins } from '@/features/skins/skins.service';
import { WorldScene } from './WorldScene';
import { WORLD_THEMES, type WorldId } from './worldThemes';

const w = strings.world;
/** Skins da Temporada 1 (Êxodo) pertencem ao mundo das Origens. */
const SEASON_WORLD: WorldId = 'origens';

/** Anel de progresso do mundo (capítulos lidos). */
function Ring({ done, total, color, size = 64 }: { done: number; total: number; color: string; size?: number }) {
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  const pct = total ? done / total : 0;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessible accessibilityRole="progressbar" accessibilityLabel={fmt(w.ringLabel, { done, total })}
      accessibilityValue={{ min: 0, max: total, now: done }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.18)" strokeWidth={5} fill="rgba(0,0,0,0.35)" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={5} fill="none" strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </Svg>
      <AppText style={styles.ringPct} color="#FFFFFF">{Math.floor(pct * 100)}%</AppText>
    </View>
  );
}

type BookNode = ReturnType<typeof journeyProgress>[number]['books'][number];

/** Um livro como parada da trilha: medalha se concluído, anel se em leitura, pedra se a explorar. */
function BookStop({ book, color, onRead }: { book: BookNode; color: string; onRead: () => void }) {
  const done = book.nextChapter == null;
  const read = book.chaptersRead.size;
  const state = done ? w.bookDone : read ? fmt(w.bookReading, { done: read, total: book.chapters }) : fmt(w.bookNew, { total: book.chapters });
  return (
    <Pressable onPress={onRead} accessibilityRole="button" testID={`world-book-${book.code}`}
      accessibilityLabel={`${book.name}. ${state}. ${done ? w.reread : fmt(w.readNext, { ref: refLabel(book.code, book.nextChapter!) })}`}
      style={({ pressed }) => [styles.stop, pressed && { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
      <View style={[styles.node, { borderColor: done ? '#FFE7A3' : read ? color : 'rgba(255,255,255,0.3)', backgroundColor: done ? color : '#1B1631' }]}>
        <Icon name={done ? 'medal' : read ? 'book' : 'compass'} color={done ? '#120E1C' : read ? color : '#C9BBA0'} size={20} />
      </View>
      <View style={styles.stopText}>
        <AppText style={styles.bookName} color="#F6ECD6" numberOfLines={1}>{book.name}</AppText>
        <AppText variant="caption" color={done ? '#FFE7A3' : '#C9BBA0'}>{state}</AppText>
        {!done && read ? (
          <View style={styles.bar}><View style={[styles.barFill, { width: `${(read / book.chapters) * 100}%`, backgroundColor: color }]} /></View>
        ) : null}
      </View>
      <AppText variant="caption" color={done ? '#8F84A8' : color}>{done ? w.reread : fmt(w.readNext, { ref: refLabel(book.code, book.nextChapter!) })}</AppText>
    </Pressable>
  );
}

/** Página própria de um mundo: cena, medalha, trilha de livros, marcos e skins do mundo. */
export function WorldScreen({ id }: { id: string }) {
  return <CinemaTheme><WorldContent id={id} /></CinemaTheme>;
}

function WorldContent({ id }: { id: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const world = WORLDS.find((x) => x.id === id);
  const [overview, setOverview] = useState<MissionOverview | null>(null);
  const [worlds, setWorlds] = useState<WorldProgress[] | null>(null);
  const [owned, setOwned] = useState<Set<string> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { rows } = useMilestones();

  useFocusEffect(useCallback(() => {
    Promise.all([getMissionOverview(), getWorldProgress()]).then(([o, ws]) => { setOverview(o); setWorlds(ws); setError(null); },
      (e) => setError(errorMessage(e)));
    getMySkins().then((s) => setOwned(new Set(s.owned.map((o) => o.skinId))), () => setOwned(new Set()));
  }, []));

  const progress = useMemo(() => (overview ? journeyProgress(overview.chaptersByBook).find((x) => x.id === id) : undefined), [overview, id]);
  if (!world) {
    return (
      <Screen>
        <Notice tone="error">{w.notFound}</Notice>
        <Button title={w.backToMap} onPress={() => router.replace('/(tabs)/journey')} />
      </Screen>
    );
  }
  const wid = world.id as WorldId;
  const theme = WORLD_THEMES[wid];
  const index = WORLDS.findIndex((x) => x.id === id);
  const completedAt = worlds?.find((x) => x.id === id)?.completedAt ?? null;
  const books = progress?.books ?? [];
  const booksDone = books.filter((b) => b.nextChapter == null).length;
  const next = books.find((b) => b.chaptersRead.size > 0 && b.nextChapter != null) ?? books.find((b) => b.nextChapter != null);
  const codes = new Set<string>(world.codes);
  const marcos = (rows ?? []).filter((r) => codes.has(r.book));
  const skins = wid === SEASON_WORLD ? SKINS : [];
  const read = (book: string, chapter: number) =>
    router.navigate({ pathname: '/(tabs)/read', params: { book, chapter: String(chapter), selection: String(Date.now()) } });
  const heroH = Math.min(340, Math.max(250, width * 0.72));

  return (
    <Screen edges={['left', 'right']} contentStyle={styles.content}>
      <View style={[styles.hero, { height: heroH + insets.top }]} testID={`world-hero-${wid}`}>
        <WorldScene id={wid} />
        <View style={[styles.heroTop, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/journey'))} accessibilityRole="button"
            accessibilityLabel={strings.common.back} hitSlop={10} style={styles.back}>
            <Icon name="back" color="#FFFFFF" size={22} />
          </Pressable>
          <View style={[styles.worldTag, { borderColor: theme.accent }]}>
            <AppText style={styles.worldTagText} color={theme.accent}>{fmt(w.worldN, { n: index + 1, total: WORLDS.length })}</AppText>
          </View>
        </View>
        <View style={[styles.heroPanel, { backgroundColor: theme.panel, borderColor: theme.accent + '88' }]}>
          <View style={styles.heroRow}>
            <View style={[styles.emblem, { borderColor: theme.accent }]}>
              <Icon name={completedAt ? 'medal' : worldIcons[wid]} color={theme.accent} size={28} />
            </View>
            <View style={styles.flex}>
              <AppText accessibilityRole="header" style={styles.title} color={theme.ink}>{world.name}</AppText>
              <AppText variant="caption" color={theme.ink} style={{ opacity: 0.85 }}>{theme.tagline}</AppText>
            </View>
            {progress ? <Ring done={progress.done} total={progress.total} color={theme.accent} /> : null}
          </View>
        </View>
      </View>

      <View style={styles.body}>
        {error ? <Notice tone="error">{error}</Notice> : null}
        {!progress && !error ? <ActivityIndicator color={theme.accent} /> : null}

        {progress ? (
          <View style={styles.stats}>
            {[
              { icon: 'scroll' as const, value: `${progress.done}/${progress.total}`, label: w.chapters },
              { icon: 'book' as const, value: `${booksDone}/${books.length}`, label: w.books },
              { icon: 'flag' as const, value: `${marcos.filter((m) => m.completed).length}/${marcos.length}`, label: w.marcos },
            ].map((s) => (
              <View key={s.label} style={styles.stat} accessible accessibilityLabel={`${s.label}: ${s.value}`}>
                <Icon name={s.icon} color={theme.accent} size={18} />
                <AppText style={styles.statValue} color="#F6ECD6">{s.value}</AppText>
                <AppText variant="caption" color="#C9BBA0">{s.label}</AppText>
              </View>
            ))}
          </View>
        ) : null}

        {completedAt ? (
          <View style={[styles.medal, { borderColor: theme.accent }]} testID="world-medal">
            <Icon name="medal" color={theme.accent} size={30} />
            <View style={styles.flex}>
              <AppText variant="label" color="#F6ECD6">{w.medalEarned}</AppText>
              <AppText variant="caption" color="#C9BBA0">{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(completedAt))}</AppText>
            </View>
          </View>
        ) : next ? (
          <Button variant="gold" icon="play" title={fmt(w.continue, { ref: refLabel(next.code, next.nextChapter!) })} onPress={() => read(next.code, next.nextChapter!)} />
        ) : null}
        {theme.trail ? (
          <Button variant="secondary" icon="scroll" title={theme.trail.title} onPress={() => router.push({ pathname: '/reading/trail', params: { trail: theme.trail!.id } })} />
        ) : null}

        <View style={styles.sectionHead}>
          <Icon name="map" color={theme.accent} size={20} />
          <AppText accessibilityRole="header" style={styles.section} color="#F6ECD6">{w.trailTitle}</AppText>
          <AppText variant="caption" color="#C9BBA0">{fmt(w.booksDone, { done: booksDone, total: books.length })}</AppText>
        </View>
        <View style={styles.trail}>
          {books.length > 1 ? <View style={[styles.spine, { borderColor: theme.accent + '66' }]} /> : null}
          {books.map((b) => (
            <BookStop key={b.code} book={b} color={theme.accent}
              onRead={() => read(b.code, b.nextChapter ?? 1)} />
          ))}
        </View>

        {marcos.length ? (
          <>
            <View style={styles.sectionHead}>
              <Icon name="flag" color={theme.accent} size={20} />
              <AppText accessibilityRole="header" style={styles.section} color="#F6ECD6">{w.marcosTitle}</AppText>
            </View>
            {marcos.map((m) => (
              <Pressable key={m.id} accessibilityRole="link" onPress={() => router.push({ pathname: '/reading/milestone/[id]', params: { id: m.id } })}
                style={[styles.row, { borderColor: m.completed ? theme.accent : 'rgba(255,255,255,0.14)' }]}>
                <Icon name={m.completed ? 'check' : 'flag'} color={m.completed ? theme.accent : '#C9BBA0'} size={18} />
                <View style={styles.flex}>
                  <AppText variant="label" color="#F6ECD6">{m.name}</AppText>
                  <AppText variant="caption" color="#C9BBA0">{refLabel(m.book, m.chapter)}</AppText>
                </View>
                <AppText variant="caption" color={m.completed ? theme.accent : '#8F84A8'}>{m.completed ? w.done : w.todo}</AppText>
              </Pressable>
            ))}
          </>
        ) : null}

        <View style={styles.sectionHead}>
          <Icon name="outfit" color={theme.accent} size={20} />
          <AppText accessibilityRole="header" style={styles.section} color="#F6ECD6">{w.skinsTitle}</AppText>
          {skins.length ? <AppText variant="caption" color="#C9BBA0">{fmt(w.skinsOwned, { n: skins.filter((s) => owned?.has(s.id)).length, total: skins.length })}</AppText> : null}
        </View>
        {skins.length ? (
          <View style={styles.skins}>
            {skins.slice(0, 8).map((s) => {
              const has = !!owned?.has(s.id);
              return (
                <Pressable key={s.id} onPress={() => router.push('/vestiario')} accessibilityRole="button"
                  accessibilityLabel={`${s.name}, ${SKIN_RARITY_LABEL[s.rarity]}${has ? '' : `, ${strings.vestiario.locked}`}`}
                  style={[styles.skin, { borderColor: SKIN_RARITY_COLOR[s.rarity] + (has ? 'DD' : '55') }]}>
                  <View style={!has && { opacity: 0.4 }}><SkinThumb skin={s} size={72} /></View>
                  {!has ? <View style={styles.lock}><Icon name="lock" color="#F6ECD6" size={14} /></View> : null}
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.soon}>
            <AppText variant="caption" color="#C9BBA0">{fmt(w.skinsSoon, { world: world.name })}</AppText>
          </View>
        )}
        {skins.length ? <Button compact variant="secondary" icon="outfit" title={w.openVestiario} onPress={() => router.push('/vestiario')} /> : null}
        <AppText variant="caption" color="#8F84A8" style={styles.emblemRef}>{fmt(w.emblem, { ref: theme.emblemRef })}</AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 0, gap: 0 },
  hero: { overflow: 'hidden', justifyContent: 'space-between' },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  worldTag: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 3, backgroundColor: 'rgba(0,0,0,0.45)' },
  worldTagText: { fontFamily: fonts.display, fontSize: 12.5, lineHeight: 16 },
  heroPanel: { margin: spacing.md, borderWidth: 1, borderRadius: radius.lg, padding: spacing.md },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  emblem: { width: 50, height: 50, borderRadius: 25, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  title: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28 },
  ringPct: { fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 18 },
  flex: { flex: 1, minWidth: 0 },
  body: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: '#1B1631', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statValue: { fontFamily: fonts.display, fontSize: 18, lineHeight: 22, fontVariant: ['tabular-nums'] },
  medal: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderWidth: 1.5, borderRadius: radius.lg, backgroundColor: '#1B1631' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  section: { flex: 1, fontFamily: fonts.display, fontSize: 18, lineHeight: 24 },
  trail: { gap: 6 },
  spine: { position: 'absolute', left: 23, top: 28, bottom: 28, borderLeftWidth: 2, borderStyle: 'dashed' },
  stop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 60, borderRadius: radius.md, paddingRight: spacing.sm },
  node: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  stopText: { flex: 1, minWidth: 0, gap: 1 },
  bookName: { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 21 },
  bar: { height: 5, width: '80%', borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
  barFill: { height: 5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, backgroundColor: '#1B1631' },
  skins: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skin: { width: 76, height: 76, borderRadius: 12, borderWidth: 2, overflow: 'hidden', alignItems: 'center', backgroundColor: '#120E1C' },
  lock: { position: 'absolute', top: 24, alignSelf: 'center', width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(12,10,22,0.85)', alignItems: 'center', justifyContent: 'center' },
  soon: { padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.2)' },
  emblemRef: { textAlign: 'center', marginTop: spacing.md },
});
