import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CinemaTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { AppText, Button, Card, IconBadge, Notice, Screen } from '@/ui';
import { strings } from '@/i18n';
import { useAuth } from '@/features/auth/AuthProvider';
import { AvatarCard } from '@/features/avatar/components/AvatarSizes';
import { useMyAvatar } from '@/features/avatar/hooks/useMyAvatar';

export default function FriendsTab() {
  const { profile } = useAuth();
  const { avatar } = useMyAvatar();
  const router = useRouter();
  return (
    <CinemaTheme>
      <Screen edges={['top', 'left', 'right']}>
        <View style={styles.heading}>
          <IconBadge name="friends" size={42} />
          <AppText variant="title">{strings.tabs.friends}</AppText>
        </View>
        <Notice title="Prévia da área social">Lista de amigos, desafios e classificação ainda estão em desenvolvimento.</Notice>
        {avatar && profile ? (
          <Card>
            <AppText variant="heading">Prévia do seu cartão</AppText>
            <AvatarCard look={avatar} title={profile.display_name} subtitle={`@${profile.username}`} />
            <AppText muted>{strings.social.privacyHint}</AppText>
            <Button icon="profile" variant="secondary" title="Abrir meu Perfil" onPress={() => router.push('/(tabs)/profile')} />
          </Card>
        ) : null}
      </Screen>
    </CinemaTheme>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
