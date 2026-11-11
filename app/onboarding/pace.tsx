import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@/theme/tokens';
import { AppText, Button, Notice, Screen } from '@/ui';
import { fmt, strings } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { useAuth } from '@/features/auth/AuthProvider';
import { StepHeader } from '@/features/avatar/components/StepHeader';
import { PaceForm, paceFromPrefs, type PaceValue } from '@/features/onboarding/PaceForm';
import { setReadingPreferences } from '@/features/profile/profile.service';

export default function PaceStep() {
  const router = useRouter();
  const { readingPreferences, refreshProfile } = useAuth();
  const [value, setValue] = useState<PaceValue>(paceFromPrefs(readingPreferences));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await setReadingPreferences(value);
      await refreshProfile();
      router.replace('/home');
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <Screen
      footer={
        <View style={styles.row}>
          <Button title={strings.common.back} variant="secondary" onPress={() => router.replace('/onboarding/avatar')} style={styles.flex} />
          <Button title={strings.onboarding.paceFinish} onPress={() => void submit()} loading={busy} style={styles.flexWide} />
        </View>
      }
    >
      <StepHeader title={strings.onboarding.paceTitle} right={fmt(strings.onboarding.stepOf, { current: 3, total: 3 })} progress={{ current: 3, total: 3 }} />
      <AppText muted>{strings.onboarding.paceBody}</AppText>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <PaceForm value={value} onChange={setValue} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
  flexWide: { flex: 1.5 },
});
