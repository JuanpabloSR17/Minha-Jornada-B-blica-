import { useEffect, useId, useRef, useState } from 'react';
import {
  AccessibilityInfo, Animated, Easing, Image, Modal, Pressable, ScrollView, StyleSheet, View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { AppText, Button, Icon, type IconName } from '@/ui';
import { fmt, strings } from '@/i18n';
import { CinemaTheme, useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, spacing } from '@/theme/tokens';
import { displayName, displayNameOf } from '@/features/avatar/domain/catalog';
import type { Rarity } from '@/features/avatar/domain/avatar.types';
import { ItemIcon } from '@/features/avatar/components/ItemIcon';
import { ArtifactArt, ARTIFACT_RATIO, isArtifact } from '@/features/journey/art/artifacts';
import { GlassPanel, glassTones } from '@/features/journey/components/GlassPanel';
import { ProgressMeter } from '@/features/journey/components/ProgressMeter';
import { nativeDriver } from '@/features/journey/useAmbient';
import type { ReadingReward } from '../mission/rewards';

const closedArt = require('../../../../assets/journey/rewards/pouch-closed.webp');
const openArt = require('../../../../assets/journey/rewards/pouch-open.webp');
const quantity = new Intl.NumberFormat('pt-BR');
const rarityTint: Record<Rarity, string> = {
  common: '#EBD5B7', uncommon: '#A4E9AE', rare: '#8DD8FF',
  epic: '#E7AEFF', legendary: '#FFBA77', holy: '#FFE4A4',
};

function rewardDetails(reward: ReadingReward): { title: string; description: string; tint: string; icon: IconName } {
  if (reward.kind === 'xp') {
    return {
      title: `+${quantity.format(reward.amount)} XP`,
      description: reward.bonus > 0 ? `${reward.chapterXp} da leitura + ${reward.bonus} da meta diária` : 'Experiência de leitura',
      tint: glassTones.xp.light,
      icon: 'sparkle',
    };
  }
  if (reward.kind === 'siclos') {
    return { title: `+${quantity.format(reward.amount)} Siclos`, description: 'Meta diária', tint: glassTones.gold.light, icon: 'coin' };
  }
  return {
    title: reward.item ? displayName(reward.item) : reward.id,
    description: reward.item ? strings.rarity[reward.item.rarity] : 'Item recebido',
    tint: rarityTint[reward.item?.rarity ?? 'common'],
    icon: 'chest',
  };
}

function Halo({ tint, rings = false }: { tint: string; rings?: boolean }) {
  const id = `halo${useId().replace(/[^a-z0-9]/gi, '')}`;
  return (
    <Svg width="100%" height="100%" viewBox="0 0 340 320" preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill} pointerEvents="none" aria-hidden>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" rx="49%" ry="50%">
          <Stop offset="0%" stopColor={tint} stopOpacity={0.32} />
          <Stop offset="56%" stopColor={tint} stopOpacity={0.13} />
          <Stop offset="100%" stopColor={tint} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={340} height={320} fill={`url(#${id})`} />
      {rings ? (
        <>
          <Circle cx={170} cy={160} r={93} fill="none" stroke={tint} strokeOpacity={0.28} />
          <Circle cx={170} cy={160} r={111} fill="none" stroke={tint} strokeOpacity={0.2} strokeDasharray="2 8" />
        </>
      ) : null}
    </Svg>
  );
}

function RewardArt({ reward, size, tint, icon }: {
  reward: ReadingReward; size: number; tint: string; icon: IconName;
}) {
  if (reward.kind === 'item') {
    if (isArtifact(reward.id)) {
      return <ArtifactArt id={reward.id} width={Math.min(size * 1.4, size * ARTIFACT_RATIO[reward.id])} glow />;
    }
    if (reward.item) return <ItemIcon item={reward.item} size={size} />;
  }
  return (
    <View style={[styles.medallion, { width: size, height: size, borderColor: `${tint}80`, backgroundColor: `${tint}1C` }]}>
      <View style={[styles.medallionInset, { borderColor: `${tint}48` }]} />
      <Icon name={icon} size={size * 0.47} color={tint} />
    </View>
  );
}

function UnwrappedReward({ reward }: { reward: ReadingReward }) {
  const { reduceMotion } = useTheme();
  const effect = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const details = rewardDetails(reward);

  useEffect(() => {
    if (reduceMotion) {
      effect.setValue(1);
      return;
    }
    const enter = Animated.timing(effect, {
      toValue: 1, duration: 510, easing: Easing.out(Easing.cubic), useNativeDriver: nativeDriver,
    });
    enter.start();
    return () => enter.stop();
  }, [effect, reduceMotion]);

  return (
    <View style={styles.openScene}>
      <Halo tint={details.tint} rings />
      <Animated.View aria-hidden style={[styles.openPouch, {
        transform: [{ scale: effect.interpolate({ inputRange: [0, 0.26, 1], outputRange: [0.82, 1.15, 1] }) }],
      }]}>
        <Image source={openArt} style={styles.openArt} resizeMode="contain" />
      </Animated.View>
      <Animated.View style={[styles.rewardCard, {
        opacity: effect.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.12, 0.92, 1] }),
        transform: [
          { translateY: effect.interpolate({ inputRange: [0, 1], outputRange: [62, 0] }) },
          { scale: effect.interpolate({ inputRange: [0, 0.8, 1], outputRange: [0.5, 1.035, 1] }) },
        ],
      }]} testID={reward.kind === 'item' ? `reveal-item-${reward.id}` : `reveal-${reward.kind}`}>
        <View style={styles.rewardArt} aria-hidden>
          <RewardArt reward={reward} size={118} tint={details.tint} icon={details.icon} />
        </View>
        <AppText variant="title" style={styles.rewardTitle}>{details.title}</AppText>
        <AppText variant="label" color={details.tint} style={styles.center}>{details.description}</AppText>
      </Animated.View>
    </View>
  );
}

function ReceiptRow({ reward }: { reward: ReadingReward }) {
  const details = rewardDetails(reward);
  return (
    <View style={styles.receiptRow} testID={reward.kind === 'item' ? `receipt-item-${reward.id}` : `receipt-${reward.kind}`}>
      <View style={styles.thumb} aria-hidden>
        <RewardArt reward={reward} size={40} tint={details.tint} icon={details.icon} />
      </View>
      <View style={styles.receiptText}>
        <AppText variant="label">{details.title}</AppText>
        <AppText variant="caption" color={details.tint}>{details.description}</AppText>
      </View>
    </View>
  );
}

type PouchProps = {
  rewards: ReadingReward[];
  reference: string;
  alreadyOwned?: string[];
  onClose: () => void;
  onSanctuary?: () => void;
};

export function RewardPouch(props: PouchProps) {
  if (props.rewards.length === 0) return null;
  return (
    <CinemaTheme>
      <Pouch {...props} />
    </CinemaTheme>
  );
}

function Pouch({ rewards, reference, alreadyOwned, onClose, onSanctuary }: PouchProps) {
  const { colors, reduceMotion } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [cursor, setCursor] = useState(-1);
  const count = rewards.length;
  const sealed = cursor === -1;
  const summary = cursor >= count;
  const reward = rewards[cursor];
  const bagSize = Math.min(272, Math.max(152, height * 0.36), width - 40);
  const progress = `Recompensa ${cursor + 1} de ${count}`;
  const toSummary = () => setCursor(count);
  const advance = () => setCursor((step) => Math.min(count, step + 1));
  const details = reward ? rewardDetails(reward) : null;
  const announcement = details ? `${details.title}. ${details.description}. ${progress}` : '';

  useEffect(() => {
    if (announcement) AccessibilityInfo.announceForAccessibility?.(announcement);
  }, [announcement]);

  return (
    <Modal transparent animationType="none" onRequestClose={summary ? onClose : toSummary}>
      <View style={[styles.overlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]} testID="reveal-overlay"
        accessibilityRole="dialog" accessibilityViewIsModal accessibilityLabel="Recompensas da leitura">
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.panel}>
            <View style={styles.header}>
              <AppText variant="caption" color={colors.primary} style={styles.center}>{reference}</AppText>
              <AppText variant="display" style={styles.heading}>{summary ? 'Você recebeu' : 'Bolsa de recompensas'}</AppText>
            </View>
            {summary ? (
              <View style={styles.receiptWrap}>
                <GlassPanel style={styles.receipt} tone="complete" testID="reward-receipt">
                  {rewards.map((entry) => <ReceiptRow key={entry.kind === 'item' ? `item-${entry.id}` : entry.kind} reward={entry} />)}
                </GlassPanel>
                {alreadyOwned?.length ? (
                  <AppText variant="caption" style={styles.center} muted>
                    {fmt(strings.journey.revealAlreadyOwned, { items: alreadyOwned.map(displayNameOf).join(', ') })}
                  </AppText>
                ) : null}
              </View>
            ) : sealed ? (
              <View style={styles.sealed}>
                <Halo tint={glassTones.gold.mid} rings />
                <Pressable onPress={advance} accessible={false} focusable={false} tabIndex={-1} aria-hidden
                  style={({ pressed }) => !reduceMotion && pressed ? styles.pouchPressed : undefined}>
                  <Image source={closedArt} resizeMode="contain" style={{ width: bagSize, height: bagSize }} />
                </Pressable>
                <AppText variant="label" color={glassTones.gold.light} style={styles.center}>
                  {count === 1 ? '1 recompensa' : `${count} recompensas`}
                </AppText>
              </View>
            ) : reward ? (
              <>
                <UnwrappedReward key={cursor} reward={reward} />
                <View style={styles.steps} testID="reward-step">
                  <AppText variant="caption" muted style={styles.center} accessibilityLiveRegion="polite">{progress}</AppText>
                  <ProgressMeter value={cursor + 1} total={count} tone={reward.kind === 'xp' ? 'xp' : 'gold'} />
                </View>
              </>
            ) : null}
          </View>
        </ScrollView>
        <View style={styles.actions}>
          {summary ? (
            <>
              <Button title="Continuar" variant="gold" icon="check" onPress={onClose} />
              {onSanctuary ? <Button title="Ver no Santuário" variant="secondary" icon="sanctuary" onPress={onSanctuary} /> : null}
            </>
          ) : (
            <>
              <Button variant="gold" icon={sealed ? 'bag' : 'forward'}
                title={sealed ? 'Abrir bolsa' : cursor === count - 1 ? 'Ver todas as recompensas' : 'Próxima recompensa'}
                onPress={advance} />
              <Button variant="ghost" title="Ir ao resumo" onPress={toSummary} />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#0C1021' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  panel: { width: '100%', maxWidth: 500, alignSelf: 'center', gap: spacing.lg },
  header: { gap: 4, alignItems: 'center', paddingHorizontal: 4 },
  heading: { textAlign: 'center', fontSize: 27, lineHeight: 34 },
  center: { textAlign: 'center' },
  sealed: { alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, overflow: 'hidden' },
  pouchPressed: { transform: [{ scale: 0.96 }] },
  openScene: { alignItems: 'center', justifyContent: 'center', paddingVertical: 9, paddingBottom: 87, minHeight: 274 },
  openPouch: { position: 'absolute', bottom: -4, alignSelf: 'center' },
  openArt: { width: 114, height: 114 },
  rewardArt: { minHeight: 118, alignItems: 'center', justifyContent: 'center' },
  rewardCard: { alignItems: 'center', alignSelf: 'stretch', gap: 6, paddingHorizontal: 10, paddingBottom: 8 },
  rewardTitle: { fontFamily: fonts.bold, textAlign: 'center', fontVariant: ['tabular-nums'] },
  medallion: { borderRadius: radius.pill, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  medallionInset: { position: 'absolute', top: '10%', bottom: '10%', left: '10%', right: '10%', borderRadius: radius.pill, borderWidth: 1 },
  steps: { gap: 6, width: '58%', alignSelf: 'center' },
  actions: { width: '100%', maxWidth: 532, alignSelf: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: 4 },
  receipt: { padding: spacing.md, gap: 1 },
  receiptWrap: { gap: spacing.sm },
  receiptRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 62, paddingVertical: 5, paddingHorizontal: 6 },
  thumb: { width: 56, alignItems: 'center' },
  receiptText: { flex: 1, minWidth: 0 },
});
