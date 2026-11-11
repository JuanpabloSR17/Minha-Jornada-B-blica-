import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { spacing } from '@/theme/tokens';
import { AppText, Button, Notice, Ornament, Screen, TextField } from '@/ui';
import { fmt, strings } from '@/i18n';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { StepHeader } from '@/features/avatar/components/StepHeader';
import { authErrorMessage, requestPasswordReset, signIn, signUp, validateCredentials } from '@/features/auth/auth.service';

type Mode = 'signin' | 'signup' | 'reset';

export default function AuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<Mode>(params.mode === 'signup' ? 'signup' : params.mode === 'reset' ? 'reset' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setError(null);
    setInfo(null);
    setFieldErrors({});
  }, [mode]);

  const title = mode === 'signup' ? strings.auth.signUpTitle : mode === 'reset' ? strings.auth.resetTitle : strings.auth.signInTitle;

  const submit = async () => {
    const errs = validateCredentials(email, mode === 'reset' ? undefined : password);
    setFieldErrors(errs);
    if (errs.email || errs.password) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
        // A navegação acontece sozinha quando a sessão muda (rotas protegidas).
      } else if (mode === 'signup') {
        const { needsConfirmation } = await signUp(email, password);
        if (needsConfirmation) setInfo(fmt(strings.auth.checkEmail, { email: email.trim() }));
      } else {
        await requestPasswordReset(email);
        setInfo(fmt(strings.auth.resetSent, { email: email.trim() }));
      }
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      footer={
        <Button
          title={mode === 'signup' ? strings.auth.submitSignUp : mode === 'reset' ? strings.auth.submitReset : strings.auth.submitSignIn}
          onPress={() => void submit()}
          loading={busy}
          disabled={!isSupabaseConfigured}
        />
      }
    >
      <StepHeader title={title} onBack={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))} />
      <Ornament />
      {!isSupabaseConfigured ? <Notice tone="warning" title={strings.config.missingTitle}>{strings.config.missingBody}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      {info ? <Notice tone="success">{info}</Notice> : null}

      <TextField
        label={strings.auth.email}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        error={fieldErrors.email}
        returnKeyType={mode === 'reset' ? 'send' : 'next'}
        onSubmitEditing={mode === 'reset' ? () => void submit() : undefined}
      />
      {mode !== 'reset' ? (
        <TextField
          label={strings.auth.password}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          textContentType={mode === 'signup' ? 'newPassword' : 'password'}
          hint={mode === 'signup' ? strings.auth.passwordHint : undefined}
          error={fieldErrors.password}
          returnKeyType="go"
          onSubmitEditing={() => void submit()}
        />
      ) : null}

      <View style={styles.links}>
        {mode === 'signin' ? <LinkText label={strings.auth.forgot} onPress={() => setMode('reset')} /> : null}
        {mode === 'signin' ? <LinkText label={strings.auth.noAccount} onPress={() => setMode('signup')} /> : null}
        {mode === 'signup' ? <LinkText label={strings.auth.haveAccount} onPress={() => setMode('signin')} /> : null}
        {mode === 'reset' ? <LinkText label={strings.auth.backToSignIn} onPress={() => setMode('signin')} /> : null}
      </View>
      <AppText variant="caption" muted style={styles.center}>{strings.auth.socialUnavailable}</AppText>
    </Screen>
  );
}

function LinkText({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} hitSlop={8} style={styles.link}>
      <AppText variant="label" style={{ textDecorationLine: 'underline' }}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  links: { gap: spacing.sm, alignItems: 'center' },
  link: { minHeight: 44, justifyContent: 'center' },
  center: { textAlign: 'center' },
});
