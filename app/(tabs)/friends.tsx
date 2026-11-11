import { StyleSheet, View } from 'react-native';
import { spacing } from '@/theme/tokens';
import { AppText, Card, ComingSoon, Screen } from '@/ui';
import { strings } from '@/i18n';
import { useAuth } from '@/features/auth/AuthProvider';
import { AvatarBadge, AvatarCard } from '@/features/avatar/components/AvatarSizes';
import { useMyAvatar } from '@/features/avatar/hooks/useMyAvatar';

export default function FriendsTab() {
  const { profile } = useAuth();
  const { avatar } = useMyAvatar();
  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppText variant="title">{strings.tabs.friends}</AppText>
      {avatar && profile ? (
        <Card>
          <AppText variant="heading">{strings.social.howOthersSee}</AppText>
          <View style={styles.row}>
            <AvatarCard look={avatar} title={profile.display_name} subtitle={`@${profile.username}`} />
            <View style={styles.flex}>
              <AppText variant="caption" muted>{strings.social.inRankings}</AppText>
              <View style={styles.rank}>
                <AppText variant="label">1º</AppText>
                <AvatarBadge look={avatar} size={44} label={profile.display_name} />
                <AppText variant="label" numberOfLines={1} style={styles.flex}>{profile.display_name}</AppText>
              </View>
              <AppText variant="caption" muted>{strings.social.inCards}</AppText>
              <AppText variant="caption" muted>{strings.social.privacyHint}</AppText>
            </View>
          </View>
        </Card>
      ) : null}
      <ComingSoon title={strings.tabs.friends} body={strings.social.friendsSoon} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
  rank: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
