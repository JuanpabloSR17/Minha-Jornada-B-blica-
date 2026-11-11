import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { AppText, Button, Notice, Screen } from '@/ui';
import { strings } from '@/i18n';
import { authErrorMessage, exchangeCode } from '@/features/auth/auth.service';

/** Destino dos links de e-mail (confirmação de conta e recuperação de senha). */
export default function AuthCallback() {
  const router = useRouter();
  const { code, next, error_description } = useLocalSearchParams<{ code?: string; next?: string; error_description?: string }>();
  const [error, setError] = useState<string | null>(error_description ?? null);

  useEffect(() => {
    if (!code || error) return;
    exchangeCode(code)
      .then(() => router.replace(next === 'update-password' ? '/auth/update-password' : '/'))
      .catch((e) => setError(authErrorMessage(e)));
  }, [code, next, error, router]);

  return (
    <Screen>
      {error ? (
        <>
          <Notice tone="error">{error}</Notice>
          <Button title={strings.auth.backToSignIn} onPress={() => router.replace('/')} />
        </>
      ) : (
        <>
          <ActivityIndicator size="large" />
          <AppText muted style={{ textAlign: 'center' }}>{strings.common.loading}</AppText>
        </>
      )}
    </Screen>
  );
}
