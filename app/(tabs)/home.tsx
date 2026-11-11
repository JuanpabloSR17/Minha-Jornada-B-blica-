import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@/theme/tokens';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { AppText, Button, Card, Notice, Ornament, Screen } from '@/ui';
import { getMissionOverview, type MissionOverview } from '@/features/reading/mission/mission.service';
import { useMissionSession } from '@/features/reading/mission/useMissionSession';
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
  const { session } = useMissionSession();
  const [overview, setOverview] = useState<MissionOverview | null>(null);
  useFocusEffect(
    useCallback(() => {
      getMissionOverview().then(setOverview, () => setOverview(null));
    }, []),
  );

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
          <Button compact title={strings.wardrobe.title} onPress={() => router.push('/avatar/wardrobe')} style={styles.flex} />
        </View>
      </Card>
      <Card>
        <AppText variant="heading">{strings.home.missionsTitle}</AppText>
        <AppText muted>{strings.home.missionsBody}</AppText>
        {overview ? <AppText variant="label">{fmt(strings.home.progress, { chapters: overview.chaptersCompleted, total: overview.totalChapters, xp: overview.xpTotal })}</AppText> : null}
        <Button title={session ? strings.home.missionContinue : strings.home.missionStart} onPress={() => router.push(session ? '/reading/mission' : '/(tabs)/read')} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
});
