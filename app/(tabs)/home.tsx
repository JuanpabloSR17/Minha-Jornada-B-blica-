import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@/theme/tokens';
import { AppText, Button, Card, ComingSoon, Notice, Ornament, Screen } from '@/ui';
import { fmt, strings } from '@/i18n';
import { useAuth } from '@/features/auth/AuthProvider';
import { goalLabel } from '@/features/profile/goalLabel';
import { AvatarStage } from '@/features/avatar/components/AvatarStage';
import { useMyAvatar } from '@/features/avatar/hooks/useMyAvatar';

export default function Home() {
  const router = useRouter();
  const { profile, readingPreferences } = useAuth();
  const { avatar, error } = useMyAvatar();
  const goal = goalLabel(readingPreferences);

  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppText variant="title">{fmt(strings.home.greeting, { name: profile?.display_name ?? '' })}</AppText>
      <Ornament />
      {error ? <Notice tone="error">{error}</Notice> : null}
      {avatar ? <AvatarStage look={avatar} height={380} /> : null}
      <Card>
        <AppText variant="heading">{goal}</AppText>
        <View style={styles.row}>
          <Button compact variant="secondary" title={strings.home.changeGoal} onPress={() => router.push('/settings/pace')} style={styles.flex} />
          <Button compact title={strings.home.customize} onPress={() => router.push('/avatar/editor')} style={styles.flex} />
        </View>
      </Card>
      <ComingSoon title={strings.home.missionsTitle} body={strings.home.missionsBody} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
});
