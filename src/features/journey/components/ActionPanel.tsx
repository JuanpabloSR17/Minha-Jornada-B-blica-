import { StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { AppText, Button } from '@/ui';
import { fonts } from '@/theme/tokens';
import { fmt, strings } from '@/i18n';
import { RARITY_COLOR } from '@/features/avatar/components/RarityBadge';
import { getCatalogMission } from '@/features/avatar/domain/catalog';
import { activeMs, formatClock, type MissionSession } from '@/features/reading/mission/session';
import { refLabel } from '@/features/reading/refs';

const j = strings.journey;
const m = strings.mission;

/** Rolo de pergaminho (ícone do painel de leitura). */
function Scroll() {
  return (
    <Svg width={46} height={46} viewBox="0 0 48 48" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Rect x={10} y={10} width={28} height={28} rx={2} fill="#E9D3A0" stroke="#7A5418" strokeWidth={1.6} />
      <Path d="M6 12 a4 4 0 0 1 8 0 v26 a4 4 0 0 1 -8 0 Z M34 10 a4 4 0 0 1 8 0 v26 a4 4 0 0 1 -8 0 Z" fill="#D9B46A" stroke="#7A5418" strokeWidth={1.6} />
      <Path d="M16 18 h16 M16 23 h16 M16 28 h12 M16 33 h14" stroke="#8A6A3A" strokeWidth={1.4} />
    </Svg>
  );
}

/**
 * Painel da ação principal do Início: prioriza a sessão pendente (Verificar resultado), depois a
 * sessão em andamento (Continuar leitura) e, sem sessão, a próxima leitura com a meta do dia.
 */
export function ActionPanel({
  session,
  now,
  next,
  today,
  onOpenSession,
  onStart,
}: {
  session: MissionSession | null;
  now: number;
  next: { book: string; chapter: number } | null;
  today: { done: number; target: number | null } | null;
  onOpenSession: () => void;
  onStart: () => void;
}) {
  const pending = !!session && (session.status === 'pending' || session.status === 'finishing');
  const marco = session ? getCatalogMission(session.milestone) : null;
  const ref = session ? refLabel(session.book, session.chapter) : next ? refLabel(next.book, next.chapter) : null;
  const pct = today?.target ? Math.min(1, today.done / today.target) : 0;
  const label = pending ? j.pendingReading : session ? j.activeReading : j.nextReading;
  const button = pending ? m.sessionVerify : session || (today?.done ?? 0) > 0 ? strings.home.dailyContinue : strings.home.dailyStart;

  return (
    <View style={[styles.panel, pending && styles.pending]} testID="home-action-panel">
      <View style={styles.row}>
        <Scroll />
        <View style={styles.flex}>
          <AppText variant="caption" color={pending ? '#F2907E' : '#C9BBA0'}>{label}</AppText>
          {ref ? <AppText style={styles.ref} color="#F6ECD6" numberOfLines={1} adjustsFontSizeToFit>{ref}</AppText> : null}
          {marco ? <AppText variant="caption" color={RARITY_COLOR.holy} numberOfLines={2}>{fmt(m.milestoneBanner, { name: marco.name })}</AppText> : null}
        </View>
      </View>
      {session && !pending ? (
        <AppText variant="label" color="#F6ECD6" accessibilityLabel={`${m.time}: ${formatClock(activeMs(session, now))}`}>
          {formatClock(activeMs(session, now))} · {session.status === 'paused' ? m.paused : m.running}
        </AppText>
      ) : null}
      {pending ? <AppText variant="caption" color="#E9DCC0">{m.sessionWaiting}</AppText> : null}
      {!session && today?.target ? (
        <View style={styles.gap}>
          <AppText variant="caption" color="#C9BBA0">{fmt(j.todayProgress, { done: Math.min(today.done, today.target), target: today.target })}</AppText>
          <View style={styles.bar}><View style={[styles.fill, { width: `${pct * 100}%` }]} /></View>
        </View>
      ) : null}
      <Button variant="gold" title={button} onPress={session ? onOpenSession : onStart} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: 'rgba(16, 12, 24, 0.9)', borderColor: '#C9A24A', borderWidth: 1.5, borderRadius: 14, padding: 12, gap: 10 },
  pending: { borderColor: '#F2907E' },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  flex: { flex: 1, minWidth: 0 },
  ref: { fontFamily: fonts.display, fontSize: 24, lineHeight: 30 },
  gap: { gap: 6 },
  bar: { height: 10, borderRadius: 5, backgroundColor: '#2A2336', borderWidth: 1, borderColor: '#5A4A2A', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#E9BA5B' },
});
