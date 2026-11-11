import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText, Icon, Notice, Screen } from '@/ui';
import { strings } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { StepHeader } from '../components/StepHeader';
import { AvatarStage } from '../components/AvatarStage';
import { getPublicAvatar, type PublicAvatar } from '../services/wardrobe.service';

/** Perfil público (S02, parte do avatar): só dados consentidos — nome, usuário e visual em uso. */
export function PublicProfileScreen({ username }: { username: string }) {
  const { colors } = useTheme();
  const router = useRouter();
  const [data, setData] = useState<PublicAvatar | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPublicAvatar(username).then(setData).catch((e) => setError(errorMessage(e)));
  }, [username]);

  return (
    <Screen>
      <StepHeader title={`@${username}`} onBack={() => (router.canGoBack() ? router.back() : router.replace('/profile'))} />
      {error ? <Notice tone="error">{error}</Notice> : null}
      {data === undefined && !error ? <ActivityIndicator color={colors.primary} /> : null}
      {data === null ? <Notice>{strings.social.notFound}</Notice> : null}
      {data && !data.visible ? (
        <>
          <Icon name="lock" size={40} color={colors.textMuted} />
          <AppText muted>{strings.social.privateProfile}</AppText>
        </>
      ) : null}
      {data && data.visible ? (
        <>
          <AvatarStage look={{ appearance: data.appearance, equipment: data.equipment }} height={480} />
          <AppText variant="title" style={{ textAlign: 'center' }}>{data.displayName}</AppText>
          <AppText muted style={{ textAlign: 'center' }}>@{data.username}</AppText>
          {data.isSelf ? <AppText variant="caption" muted style={{ textAlign: 'center' }}>{strings.social.privacyHint}</AppText> : null}
        </>
      ) : null}
    </Screen>
  );
}
