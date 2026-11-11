import { useRouter } from 'expo-router';
import { useState } from 'react';
import { AppText, Button, Notice, Screen, TextField } from '@/ui';
import { strings } from '@/i18n';
import { useAuth } from '@/features/auth/AuthProvider';
import { authErrorMessage, MIN_PASSWORD, updatePassword } from '@/features/auth/auth.service';

export default function UpdatePassword() {
  const router = useRouter();
  const { status, clearPasswordRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (password.length < MIN_PASSWORD) return setError(strings.auth.errors.shortPassword);
    setBusy(true);
    setError(null);
    try {
      await updatePassword(password);
      clearPasswordRecovery();
      setDone(true);
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen footer={done ? <Button title={strings.common.continue} onPress={() => router.replace('/')} /> : <Button title={strings.auth.submitUpdatePassword} loading={busy} onPress={() => void submit()} disabled={status !== 'signedIn'} />}>
      <AppText variant="title">{strings.auth.updatePasswordTitle}</AppText>
      {status !== 'signedIn' ? <Notice tone="warning">{strings.errors.not_authenticated}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      {done ? <Notice tone="success">{strings.auth.passwordUpdated}</Notice> : (
        <TextField label={strings.auth.newPassword} value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" hint={strings.auth.passwordHint} />
      )}
    </Screen>
  );
}
