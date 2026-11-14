import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { CinemaTheme, useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText, Button, Card, ComingSoon, Icon, Notice, Screen, type IconName } from '@/ui';
import { fmt, strings } from '@/i18n';
import { useMilestones } from '@/features/reading/useMilestones';
import { milestoneSummary } from '@/features/reading/milestones';
import { getWorldProgress, type WorldProgress } from '@/features/reading/mission/mission.service';
import { BOOKS, refLabel } from '@/features/reading/refs';
import { errorMessage } from '@/lib/errors';
import { useAuth } from '@/features/auth/AuthProvider';
import { signOut } from '@/features/auth/auth.service';
import { goalLabel } from '@/features/profile/goalLabel';
import { AvatarStage } from '@/features/avatar/components/AvatarStage';
import { useMyAvatar } from '@/features/avatar/hooks/useMyAvatar';
import { setPrivacyMode } from '@/features/avatar/services/wardrobe.service';

const SHORTCUTS: { label: string; icon: IconName; href: '/avatar/wardrobe' | '/avatar/loadouts' | '/avatar/collections' | '/avatar/editor' | '/avatar/sanctuary' }[] = [
  { label: 'Guarda-roupa', icon: 'outfit', href: '/avatar/wardrobe' },
  { label: 'Visuais salvos', icon: 'profile', href: '/avatar/loadouts' },
  { label: 'Coleções', icon: 'sparkle', href: '/avatar/collections' },
  { label: 'Aparência', icon: 'face', href: '/avatar/editor' },
  { label: 'Santuário', icon: 'sparkle', href: '/avatar/sanctuary' },
];

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
  const medals = worlds?.filter((w) => w.completedAt);
  const milestones = rows?.filter((row) => row.completed);
  const items: ({ label: string; value: string } | null)[] = [
    overview ? { label: p.chaptersRead, value: `${overview.chaptersCompleted} de ${overview.totalChapters}` } : null,
    overview ? { label: p.booksRead, value: `${overview.booksCompleted} de ${BOOKS.length}` } : null,
    sum ? { label: p.achMilestones, value: `${sum.milestonesDone} de ${sum.milestonesTotal}` } : null,
    sum ? { label: p.achSaints, value: `${sum.saintsOwned} de ${sum.saintsTotal}` } : null,
    medals && worlds ? { label: p.achWorlds, value: `${medals.length} de ${worlds.length}` } : null,
  ];
  const shown = items.filter((x): x is { label: string; value: string } => !!x);
  return (
    <Card testID="profile-achievements">
      <AppText variant="heading" accessibilityRole="header">{p.progress}</AppText>
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
            accessible accessibilityLabel={`${it.label}: ${it.value}`}>
            <AppText variant="heading" color={colors.selection}>{it.value}</AppText>
            <AppText variant="caption" muted style={styles.center}>{it.label}</AppText>
          </View>
        ))}
      </View>
      <Button compact variant="secondary" title={p.openJourney} icon={<Icon name="map" color={colors.primary} size={18} />}
        onPress={() => router.navigate('/journey')} />
      {medals ? (
        <>
          <AppText variant="heading" accessibilityRole="header">{p.worldsMedals}</AppText>
          {medals.length ? medals.map((world) => (
            <View key={world.id} testID={`profile-medal-${world.id}`} style={[styles.achievement, { borderColor: colors.border }]}>
              <Icon name="medal" size={28} color={colors.primary} />
              <View style={styles.detail}>
                <AppText variant="label">{world.name}</AppText>
                <AppText variant="caption" muted>{fmt(strings.journey.worldChapters, { done: world.done, total: world.chapters })}</AppText>
              </View>
            </View>
          )) : <AppText variant="caption" muted>{p.worldsMedalsEmpty}</AppText>}
        </>
      ) : null}
      {milestones?.slice(0, 3).map((row) => (
        <Pressable key={row.id} accessibilityRole="link"
          onPress={() => router.push({ pathname: '/reading/milestone/[id]', params: { id: row.id } })}
          style={[styles.achievement, { borderColor: colors.border }]}>
          <Icon name="check" color={colors.selection} />
          <View style={styles.detail}>
            <AppText variant="label">{row.name}</AppText>
            <AppText variant="caption" muted>{refLabel(row.book, row.chapter)}</AppText>
          </View>
        </Pressable>
      ))}
      <Button compact variant="secondary" title={p.openMilestones} onPress={() => router.push('/reading/milestones')} />
    </Card>
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
      {avatar ? <AvatarStage look={avatar} height={460} /> : null}
      <View style={styles.identity}>
        <AppText variant="title" style={styles.center}>{profile.display_name}</AppText>
        <AppText muted style={styles.center}>@{profile.username}</AppText>
        <View style={[styles.badge, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
          <Icon name="lock" size={14} color={colors.textMuted} />
          <AppText variant="caption" muted>{strings.profile.privacy[profile.privacy_mode]}</AppText>
        </View>
      </View>
      <Achievements key={profile.id} />
      <View style={styles.grid}>
        {SHORTCUTS.map((s) => (
          <Pressable
            key={s.href}
            accessibilityRole="button"
            accessibilityLabel={s.label}
            onPress={() => router.push(s.href)}
            style={({ pressed }) => [styles.shortcut, { backgroundColor: pressed ? colors.backgroundAlt : colors.surface, borderColor: colors.borderStrong }]}
          >
            <Icon name={s.icon} size={26} color={colors.primary} />
            <AppText variant="label" color={colors.text}>{s.label}</AppText>
          </Pressable>
        ))}
      </View>
      <Card>
        <AppText variant="label" muted>{strings.profile.readingGoal}</AppText>
        <AppText variant="heading">{goalLabel(readingPreferences)}</AppText>
        <Button compact variant="secondary" title={strings.home.changeGoal} onPress={() => router.push('/settings/pace')} />
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  shortcut: { width: '48%', minHeight: 76, borderRadius: radius.lg, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', gap: 4 },
  segment: { flexDirection: 'row', gap: spacing.sm },
  plaques: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  achievement: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, minHeight: 52, borderWidth: 1, borderRadius: radius.md },
  detail: { flex: 1, minWidth: 0 },
  plaque: { flexGrow: 1, flexBasis: '30%', minWidth: 88, minHeight: 76, borderWidth: 1.5, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', padding: spacing.sm, gap: 2 },
  segItem: { flex: 1, minHeight: 44, borderRadius: radius.md, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
