import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { spacing } from '@/theme/tokens';
import { AppText, Button, Card, Notice, Ornament, Screen } from '@/ui';
import { fmt, strings } from '@/i18n';
import { useAuth } from '@/features/auth/AuthProvider';
import { AvatarStage } from '@/features/avatar/components/AvatarStage';
import { useMyAvatar } from '@/features/avatar/hooks/useMyAvatar';
import { getMissionOverview, type MissionOverview } from '@/features/reading/mission/mission.service';
import { useMissionSession } from '@/features/reading/mission/useMissionSession';
import { DailyGoalCard } from '@/features/reading/components/DailyGoalCard';

export default function Home() {
  const router = useRouter();
  const { profile } = useAuth();
  const { avatar, error } = useMyAvatar();
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
      <DailyGoalCard session={session} />
      {avatar ? <AvatarStage look={avatar} height={340} /> : null}
      <Card>
        <AppText variant="heading">{strings.home.missionsTitle}</AppText>
        {overview ? (
          <AppText variant="label">
            {fmt(strings.home.progress, { chapters: overview.chaptersCompleted, total: overview.totalChapters, xp: overview.xpTotal, siclos: overview.siclosBalance })}
          </AppText>
        ) : null}
        <View style={styles.row}>
          <Button compact variant="secondary" title={strings.home.changeGoal} onPress={() => router.push('/settings/pace')} style={styles.flex} />
          <Button compact title={strings.wardrobe.title} onPress={() => router.push('/avatar/wardrobe')} style={styles.flex} />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
});
