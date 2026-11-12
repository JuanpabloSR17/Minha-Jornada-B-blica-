import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText, Button, Card } from '@/ui';
import { fmt, strings } from '@/i18n';
import { RARITY_COLOR } from '@/features/avatar/components/RarityBadge';
import { getCatalogMission } from '@/features/avatar/domain/catalog';
import { activeMs, formatClock } from '../mission/session';
import { useMissionSession } from '../mission/useMissionSession';
import { refLabel } from '../refs';

const m = strings.mission;

/** Destaque da sessão em andamento ou aguardando confirmação, com acesso direto a ela. */
export function ActiveSessionCard() {
  const { colors } = useTheme();
  const router = useRouter();
  const { session, loaded, now } = useMissionSession();
  if (!loaded || !session) return null;
  const pending = session.status === 'pending' || session.status === 'finishing';
  const marco = getCatalogMission(session.milestone);
  return (
    <Card style={{ borderColor: pending ? colors.danger : colors.primary, borderWidth: 2 }}>
      <AppText variant="heading">{pending ? m.pendingTitle : m.active}</AppText>
      <AppText>{refLabel(session.book, session.chapter)} · {session.mode === 'physical' ? m.physical : m.digital}</AppText>
      {marco ? <AppText variant="label" color={RARITY_COLOR.holy}>{fmt(m.milestoneBanner, { name: marco.name })}</AppText> : null}
      {pending ? <AppText muted>{m.sessionWaiting}</AppText> : (
        <AppText variant="label" accessibilityLabel={`${m.time}: ${formatClock(activeMs(session, now))}`}>
          {formatClock(activeMs(session, now))} · {session.status === 'paused' ? m.paused : m.running}
        </AppText>
      )}
      <Button title={pending ? m.sessionVerify : m.sessionContinue} onPress={() => router.push('/reading/mission')} />
    </Card>
  );
}
