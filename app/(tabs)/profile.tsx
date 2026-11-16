import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { CinemaTheme, useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText, Button, Card, ComingSoon, Icon, IconBadge, Notice, Screen, type IconName } from '@/ui';
import { fmt, strings } from '@/i18n';
import { useMilestones } from '@/features/reading/useMilestones';
import { milestoneSummary } from '@/features/reading/milestones';
import { getWorldProgress, type WorldProgress } from '@/features/reading/mission/mission.service';
import { BOOKS, refLabel } from '@/features/reading/refs';
import { earnedWorldMedals, nextBookObjective } from '@/features/journey/progression';
import { ReadingRank } from '@/features/journey/components/ReadingRank';
import { WORLDS } from '@/features/journey/worlds';
import { worldIcons } from '@/features/journey/worldIcons';
import { errorMessage } from '@/lib/errors';
import { useAuth } from '@/features/auth/AuthProvider';
import { signOut } from '@/features/auth/auth.service';
import { goalLabel } from '@/features/profile/goalLabel';
import { AvatarStage } from '@/features/avatar/components/AvatarStage';
import { useMyAvatar } from '@/features/avatar/hooks/useMyAvatar';
import { setPrivacyMode } from '@/features/avatar/services/wardrobe.service';

const SHORTCUTS: { label: string; icon: IconName; href: '/avatar/wardrobe' | '/avatar/loadouts' | '/avatar/collections' | '/avatar/editor' | '/avatar/sanctuary' }[] = [
  { label: 'Guarda-roupa', icon: 'outfit', href: '/avatar/wardrobe' },
  { label: 'Visuais salvos', icon: 'bag', href: '/avatar/loadouts' },
  { label: 'Coleções', icon: 'chest', href: '/avatar/collections' },
  { label: 'Aparência', icon: 'face', href: '/avatar/editor' },
  { label: 'Santuário', icon: 'sanctuary', href: '/avatar/sanctuary' },
];

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' });

/** Perfil na identidade da jornada, com as conquistas reais da conta. */
export default function ProfileTab() {
  return (
    <CinemaTheme>
      <Profile />
    </CinemaTheme>
  );
}

/** Progresso privado, medalhas dos mundos e marcos já registrados. */
function Achievements() {
  const p = strings.profile;
  const { colors } = useTheme();
  const router = useRouter();
  const { rows, overview, error, reload } = useMilestones();
  const [worlds, setWorlds] = useState<WorldProgress[] | null>(null);
  const [worldError, setWorldError] = useState<string | null>(null);
  const loadWorlds = useCallback(() => {
    getWorldProgress().then((progress) => {
      setWorlds(progress);
      setWorldError(null);
    }, (e) => setWorldError(errorMessage(e)));
  }, []);
  useFocusEffect(loadWorlds);
  const sum = rows ? milestoneSummary(rows) : null;
  const progressError = error ?? worldError;
  const medals = worlds ? earnedWorldMedals(worlds) : null;
  const earned = new Set(medals?.map(({ id }) => id));
  const milestones = rows?.filter((row) => row.completed);
  const objective = overview ? nextBookObjective(overview.chaptersByBook) : null;
  type Counter = { label: string; done: number; total: number; icon: IconName };
  const items: (Counter | null)[] = [
    overview ? { label: p.chaptersRead, done: overview.chaptersCompleted, total: overview.totalChapters, icon: 'scroll' } : null,
    overview ? { label: p.booksRead, done: overview.booksCompleted, total: BOOKS.length, icon: 'book' } : null,
    sum ? { label: p.achMilestones, done: sum.milestonesDone, total: sum.milestonesTotal, icon: 'flag' } : null,
    sum ? { label: p.achSaints, done: sum.saintsOwned, total: sum.saintsTotal, icon: 'chest' } : null,
    medals && worlds ? { label: p.achWorlds, done: medals.length, total: worlds.length, icon: 'compass' } : null,
  ];
  const shown = items.filter((x): x is Counter => x !== null);
  return (
    <View style={styles.achievements} testID="profile-achievements">
      {overview ? <ReadingRank xpTotal={overview.xpTotal} /> : null}
      {objective ? (
        <Card style={{ borderColor: colors.borderStrong }} testID="profile-next-objective">
          <View style={styles.heading}>
            <IconBadge name="flag" />
            <View style={styles.detail}>
              <AppText variant="caption" color={colors.primary}>Próxima conquista</AppText>
              <AppText variant="heading">Concluir {objective.bookName}</AppText>
            </View>
          </View>
          <AppText variant="caption" muted>
            {objective.worldName} · {objective.remaining === 1
              ? 'Falta 1 capítulo'
              : `Faltam ${objective.remaining} capítulos`}
          </AppText>
          <Button compact variant="gold" icon="book" title={`Ler ${refLabel(objective.book, objective.chapter)}`}
            onPress={() => router.navigate({ pathname: '/read', params: { book: objective.book, chapter: String(objective.chapter), selection: String(Date.now()) } })} />
        </Card>
      ) : overview ? (
        <Card>
          <View style={styles.heading}>
            <IconBadge name="check" />
            <AppText variant="heading" style={styles.detail}>Bíblia concluída</AppText>
          </View>
          <AppText muted>Você registrou todos os capítulos. Explore o mapa para revisitar suas passagens.</AppText>
        </Card>
      ) : null}
      <Card>
        <View style={styles.heading}>
          <IconBadge name="medal" />
          <AppText variant="heading" accessibilityRole="header" style={styles.detail}>{p.progress}</AppText>
        </View>
        {progressError ? (
          <>
            <Notice tone="error">{progressError}</Notice>
            <Button compact variant="secondary" title={strings.common.retry} onPress={() => { reload(); loadWorlds(); }} />
          </>
        ) : null}
        {!shown.length && !progressError ? <ActivityIndicator color={colors.primary} accessibilityLabel={strings.common.loading} /> : null}
        <View style={styles.plaques}>
          {shown.map((it) => (
            <View key={it.label} style={[styles.plaque, { borderColor: colors.selection, backgroundColor: colors.surfaceRaised }]}
              accessible accessibilityLabel={`${it.label}: ${it.done} de ${it.total}`}>
              <Icon name={it.icon} color={colors.primary} size={20} />
              <AppText variant="heading" color={colors.selection} style={styles.center}>{it.done} de {it.total}</AppText>
              <AppText variant="caption" style={styles.center}>{it.label}</AppText>
              <View aria-hidden style={[styles.track, { backgroundColor: colors.background }]}>
                <View style={[styles.fill, { backgroundColor: colors.selection, width: `${it.total ? Math.min(100, it.done / it.total * 100) : 0}%` }]} />
              </View>
            </View>
          ))}
        </View>
        <Button compact variant="secondary" title={p.openJourney} icon="map"
          onPress={() => router.navigate('/journey')} />
      </Card>
      {medals ? (
        <Card>
          <View style={styles.heading}>
            <IconBadge name="medal" />
            <AppText variant="heading" accessibilityRole="header" style={styles.detail}>{p.worldsMedals}</AppText>
          </View>
          <View style={styles.medalGrid}>
            {WORLDS.map(({ id, name }) => {
              const owned = earned.has(id);
              return (
                <View key={id} style={[styles.medal, { borderColor: owned ? colors.borderStrong : colors.border, backgroundColor: colors.backgroundAlt }]}
                  accessible accessibilityLabel={`${name}, ${owned ? 'medalha conquistada' : 'medalha por conquistar'}`}>
                  <IconBadge name={worldIcons[id]} size={38} color={owned ? colors.primary : colors.textMuted} />
                  <AppText variant="caption" style={styles.center}>{name}</AppText>
                  <Icon name={owned ? 'check' : 'lock'} size={15} color={owned ? colors.success : colors.textMuted} />
                </View>
              );
            })}
          </View>
          {!medals.length ? <AppText variant="caption" muted>{p.worldsMedalsEmpty}</AppText> : null}
        </Card>
      ) : null}
      {medals?.length || milestones?.length ? (
        <Card>
          <View style={styles.heading}>
            <IconBadge name="scroll" />
            <AppText variant="heading" accessibilityRole="header" style={styles.detail}>Histórico de conquistas</AppText>
          </View>
          {medals?.map((world) => (
            <View key={world.id} testID={`profile-medal-${world.id}`} style={[styles.achievement, { borderColor: colors.borderStrong }]}>
              <IconBadge name="medal" size={40} />
              <View style={styles.detail}>
                <AppText variant="label">{world.name}</AppText>
                <AppText variant="caption" muted>{fmt(strings.journey.worldChapters, { done: world.done, total: world.chapters })}</AppText>
                {Number.isFinite(Date.parse(world.completedAt)) ? (
                  <AppText variant="caption" color={colors.primary}>{dateFormatter.format(new Date(world.completedAt))}</AppText>
                ) : null}
              </View>
            </View>
          ))}
          {milestones?.length ? <AppText variant="label">Marcos registrados</AppText> : null}
          {milestones?.slice(0, 3).map((row) => (
            <Pressable key={row.id} accessibilityRole="link"
              onPress={() => router.push({ pathname: '/reading/milestone/[id]', params: { id: row.id } })}
              style={[styles.achievement, { borderColor: colors.border }]}>
              <IconBadge name="flag" color={colors.selection} />
              <View style={styles.detail}>
                <AppText variant="label">{row.name}</AppText>
                <AppText variant="caption" muted>{refLabel(row.book, row.chapter)}</AppText>
              </View>
              <Icon name="forward" size={17} color={colors.selection} />
            </Pressable>
          ))}
          <Button compact variant="secondary" icon="flag" title={p.openMilestones} onPress={() => router.push('/reading/milestones')} />
        </Card>
      ) : (
        <Button compact variant="secondary" icon="flag" title={p.openMilestones} onPress={() => router.push('/reading/milestones')} />
      )}
    </View>
  );
}

function Profile() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile, readingPreferences, refreshProfile } = useAuth();
  const { avatar, error } = useMyAvatar();
  const [privacyError, setPrivacyError] = useState<string | null>(null);
  if (!profile) return null;

  const changePrivacy = async (mode: 'private' | 'public') => {
    setPrivacyError(null);
    try {
      await setPrivacyMode(mode);
      await refreshProfile();
    } catch (e) {
      setPrivacyError(errorMessage(e));
    }
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <View style={styles.identity}>
        <AppText variant="title" style={styles.center}>{profile.display_name}</AppText>
        <AppText muted style={styles.center}>@{profile.username}</AppText>
        <View style={[styles.badge, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
          <Icon name="lock" size={14} color={colors.textMuted} />
          <AppText variant="caption" muted>{strings.profile.privacy[profile.privacy_mode]}</AppText>
        </View>
      </View>
      <Achievements key={profile.id} />
      {avatar ? <AvatarStage look={avatar} height={300} /> : null}
      <View style={styles.grid}>
        {SHORTCUTS.map((s) => (
          <Pressable
            key={s.href}
            accessibilityRole="button"
            accessibilityLabel={s.label}
            onPress={() => router.push(s.href)}
            style={({ pressed }) => [styles.shortcut, { backgroundColor: pressed ? colors.backgroundAlt : colors.surface, borderColor: colors.borderStrong }]}
          >
            <IconBadge name={s.icon} />
            <AppText variant="label" color={colors.text} style={styles.center}>{s.label}</AppText>
          </Pressable>
        ))}
      </View>
      <Card>
        <AppText variant="label" muted>{strings.profile.readingGoal}</AppText>
        <AppText variant="heading">{goalLabel(readingPreferences)}</AppText>
          <Button compact variant="secondary" icon="flag" title={strings.home.changeGoal} onPress={() => router.push('/settings/pace')} />
      </Card>
      <Card>
        <AppText variant="heading">{strings.social.privacyTitle}</AppText>
        <View style={styles.segment} accessibilityRole="radiogroup">
          {(['private', 'public'] as const).map((m) => {
            const on = profile.privacy_mode === m;
            return (
              <Pressable
                key={m}
                accessibilityRole="radio"
                aria-checked={on}
                accessibilityState={{ checked: on }}
                onPress={() => void changePrivacy(m)}
                style={[styles.segItem, { borderColor: on ? colors.selection : colors.border, backgroundColor: on ? colors.surfaceRaised : 'transparent' }]}
              >
                <AppText variant="label" color={on ? colors.text : colors.textMuted}>{strings.profile.privacy[m]}</AppText>
              </Pressable>
            );
          })}
        </View>
        <AppText variant="caption" muted>{strings.social.privacyFriendsSoon}</AppText>
        <AppText variant="caption" muted>{strings.social.privacyHint}</AppText>
        {privacyError ? <Notice tone="error">{privacyError}</Notice> : null}
        <Button compact variant="ghost" title={strings.social.viewPublic} onPress={() => router.push({ pathname: '/users/[username]', params: { username: profile.username } })} />
      </Card>
      <ComingSoon title={strings.profile.share} body="O compartilhamento chega com o social (Marco 4)." />
      <Button title={strings.profile.signOut} variant="danger" onPress={() => void signOut()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { alignItems: 'center', gap: 4 },
  center: { textAlign: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, marginTop: 4 },
  achievements: { gap: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  shortcut: { width: '48%', minHeight: 86, borderRadius: radius.lg, borderWidth: 1.5, padding: spacing.sm, alignItems: 'center', justifyContent: 'center', gap: 4 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  segment: { flexDirection: 'row', gap: spacing.sm },
  plaques: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  medalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  medal: { flexGrow: 1, flexBasis: '28%', minWidth: 74, alignItems: 'center', gap: spacing.xs, borderRadius: radius.md, borderWidth: 1, padding: spacing.sm },
  achievement: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, minHeight: 52, borderWidth: 1, borderRadius: radius.md },
  detail: { flex: 1, minWidth: 0 },
  plaque: { flexGrow: 1, flexBasis: '30%', minWidth: 88, minHeight: 76, borderWidth: 1.5, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', padding: spacing.sm, gap: 2 },
  track: { width: '100%', height: 4, marginTop: spacing.xs, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%' },
  segItem: { flex: 1, minHeight: 44, borderRadius: radius.md, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
