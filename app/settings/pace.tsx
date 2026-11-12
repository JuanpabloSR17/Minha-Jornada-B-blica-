import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, Notice, Screen } from '@/ui';
import { fmt, strings } from '@/i18n';
import { dayLabel } from '@/features/reading/components/dayLabel';
import { errorMessage } from '@/lib/errors';
import { useAuth } from '@/features/auth/AuthProvider';
import { StepHeader } from '@/features/avatar/components/StepHeader';
import { PaceForm, paceFromPrefs, type PaceValue } from '@/features/onboarding/PaceForm';
import { setReadingPreferences } from '@/features/profile/profile.service';

export default function PaceSettings() {
  const router = useRouter();
  const { readingPreferences, refreshProfile } = useAuth();
  const [value, setValue] = useState<PaceValue>(paceFromPrefs(readingPreferences));
  const [msg, setMsg] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const saved = await setReadingPreferences(value);
      await refreshProfile();
      // depois da primeira definição, a mudança vale só a partir da próxima data civil
      setMsg({
        tone: 'success',
        text: saved.pending_effective_day ? fmt(strings.onboarding.paceScheduled, { day: dayLabel(saved.pending_effective_day) }) : strings.onboarding.paceSaved,
      });
    } catch (e) {
      setMsg({ tone: 'error', text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen footer={<Button title={strings.onboarding.paceSettingsSave} onPress={() => void save()} loading={busy} />}>
      <StepHeader title={strings.onboarding.paceSettingsTitle} onBack={() => router.back()} />
      {msg ? <Notice tone={msg.tone}>{msg.text}</Notice> : null}
      <PaceForm value={value} onChange={setValue} />
    </Screen>
  );
}
