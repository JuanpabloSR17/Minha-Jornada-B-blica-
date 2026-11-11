import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { AppText, Button, Icon, Notice, Screen, TextField } from '@/ui';
import { fmt, strings } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { useAuth } from '@/features/auth/AuthProvider';
import { StepHeader } from '@/features/avatar/components/StepHeader';
import { signOut } from '@/features/auth/auth.service';
import { claimProfile, isUsernameAvailable, normalizeUsername, USERNAME_RE } from '@/features/profile/profile.service';

type Availability = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export default function IdentityStep() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [availability, setAvailability] = useState<Availability>(profile ? 'available' : 'idle');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    const u = normalizeUsername(username);
    if (!u) return setAvailability('idle');
    if (!USERNAME_RE.test(u)) return setAvailability('invalid');
    setAvailability('checking');
    const mySeq = ++seq.current;
    const t = setTimeout(() => {
      isUsernameAvailable(u)
        .then((ok) => mySeq === seq.current && setAvailability(ok ? 'available' : 'taken'))
        .catch(() => mySeq === seq.current && setAvailability('idle'));
    }, 400);
    return () => clearTimeout(t);
  }, [username]);

  const nameOk = displayName.trim().replace(/\s+/g, ' ').length >= 2 && displayName.trim().length <= 40;
  const canSubmit = nameOk && (availability === 'available' || availability === 'idle') && USERNAME_RE.test(normalizeUsername(username));

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await claimProfile(normalizeUsername(username), displayName);
      await refreshProfile();
      router.replace('/onboarding/avatar');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const status = {
    idle: null,
    checking: { text: strings.onboarding.usernameChecking, tone: 'muted' as const },
    available: { text: strings.onboarding.usernameAvailable, tone: 'ok' as const },
    taken: { text: strings.onboarding.usernameTaken, tone: 'bad' as const },
    invalid: { text: strings.onboarding.usernameHint, tone: 'bad' as const },
  }[availability];

  return (
    <Screen footer={<Button title={strings.common.continue} onPress={() => void submit()} loading={busy} disabled={!canSubmit} />}>
      <StepHeader
        title={strings.onboarding.identityTitle}
        right={fmt(strings.onboarding.stepOf, { current: 1, total: 3 })}
        progress={{ current: 1, total: 3 }}
      />
      <AppText muted>{strings.onboarding.identityBody}</AppText>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <TextField
        label={strings.onboarding.displayName}
        value={displayName}
        onChangeText={setDisplayName}
        maxLength={40}
        hint={strings.onboarding.displayNameHint}
        autoComplete="name"
      />
      <TextField
        label={strings.onboarding.username}
        value={username}
        onChangeText={(t) => setUsername(t.replace(/\s/g, '').toLowerCase())}
        maxLength={20}
        autoCapitalize="none"
        autoCorrect={false}
        hint={strings.onboarding.usernameHint}
        status={status}
      />
      <View style={styles.privacy}>
        <Icon name="lock" size={18} color={colors.textMuted} />
        <AppText variant="caption" muted>{strings.onboarding.privacyNote}</AppText>
      </View>
      <Button title={strings.profile.signOut} variant="ghost" onPress={() => void signOut()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  privacy: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
