import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText, Button, Card, ComingSoon, Icon, Notice, Screen } from '@/ui';
import { strings } from '@/i18n';
import { useAuth } from '@/features/auth/AuthProvider';
import { goalLabel } from '@/features/profile/goalLabel';
import { signOut } from '@/features/auth/auth.service';
import { AvatarStage } from '@/features/avatar/components/AvatarStage';
import { useMyAvatar } from '@/features/avatar/hooks/useMyAvatar';

export default function ProfileTab() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile, readingPreferences } = useAuth();
  const { avatar, error } = useMyAvatar();
  if (!profile) return null;
  const goal = goalLabel(readingPreferences);

  return (
    <Screen edges={['top', 'left', 'right']}>
      {error ? <Notice tone="error">{error}</Notice> : null}
      {avatar ? <AvatarStage look={avatar} height={340} /> : null}
      <View style={styles.identity}>
        <AppText variant="title" style={styles.center}>{profile.display_name}</AppText>
        <AppText muted style={styles.center}>@{profile.username}</AppText>
        <View style={[styles.badge, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
          <Icon name="lock" size={14} color={colors.textMuted} />
          <AppText variant="caption" muted>{strings.profile.privacy[profile.privacy_mode]}</AppText>
        </View>
      </View>
      <Button title={strings.profile.customize} onPress={() => router.push('/avatar/editor')} />
      <Card>
        <AppText variant="label" muted>{strings.profile.readingGoal}</AppText>
        <AppText variant="heading">{goal}</AppText>
        <Button compact variant="secondary" title={strings.home.changeGoal} onPress={() => router.push('/settings/pace')} />
      </Card>
      <ComingSoon title={`${strings.profile.inventory} · ${strings.profile.achievements} · ${strings.profile.share}`} body={strings.profile.futureNote} />
      <Button title={strings.profile.signOut} variant="danger" onPress={() => void signOut()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { alignItems: 'center', gap: 4 },
  center: { textAlign: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, marginTop: 4 },
});
