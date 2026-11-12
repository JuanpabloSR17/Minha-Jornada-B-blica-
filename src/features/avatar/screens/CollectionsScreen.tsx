import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText, Card, Icon, Notice, Screen } from '@/ui';
import { fmt, strings } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { StepHeader } from '../components/StepHeader';
import { ItemIcon } from '../components/ItemIcon';
import { RARITY_COLOR } from '../components/RarityBadge';
import { displayName, getItem } from '../domain/catalog';
import { getCollections, type CollectionProgress } from '../services/wardrobe.service';

/** Coleções (P05): itens obtidos e faltantes, percentual e recompensa (concedida só pelo servidor). */
export function CollectionsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [data, setData] = useState<CollectionProgress[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      // a Biblioteca Lendária (66 itens) e as obras ficam no Santuário das Conquistas
      setData((await getCollections()).filter((c) => c.id !== 'legendary-library'));
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const open = (id: string) => router.push({ pathname: '/avatar/item/[id]', params: { id } });

  const tile = (itemId: string, owned: boolean, big = false) => {
    const item = getItem(itemId);
    if (!item) return null;
    const size = big ? 76 : 64;
    return (
      <Pressable key={itemId} accessibilityRole="link" accessibilityLabel={`${item.name}, ${owned ? strings.wardrobe.owned : strings.wardrobe.locked}`} onPress={() => open(itemId)} style={styles.tile}>
        <View style={[styles.tileArt, { width: size, height: size, borderColor: RARITY_COLOR[item.rarity], backgroundColor: colors.stage, opacity: owned ? 1 : 0.55 }]}>
          <ItemIcon item={item} size={size - 4} />
          {!owned ? (
            <View style={[styles.lock, { backgroundColor: colors.overlay }]}>
              <Icon name="lock" size={12} color="#FFFFFF" />
            </View>
          ) : null}
        </View>
        <AppText variant="caption" numberOfLines={2} style={[styles.tileLabel, { width: size + 16 }]}>{displayName(item)}</AppText>
      </Pressable>
    );
  };

  return (
    <Screen>
      <StepHeader title={strings.collections.title} onBack={() => router.back()} />
      {error ? <Notice tone="error">{error}</Notice> : null}
      {!data && !error ? <ActivityIndicator color={colors.primary} /> : null}
      {data?.length === 0 ? <AppText muted>{strings.collections.empty}</AppText> : null}
      {data?.map((c) => {
        const got = c.items.filter((i) => i.owned).length;
        const pct = c.items.length ? Math.round((got / c.items.length) * 100) : 0;
        return (
          <Card key={c.id}>
            <View style={styles.head}>
              <View style={styles.flex}>
                <AppText variant="heading">{c.name}</AppText>
                {c.description ? <AppText variant="caption" muted>{c.description}</AppText> : null}
              </View>
              <AppText variant="title" color={c.completed ? colors.success : colors.text}>{pct}%</AppText>
            </View>
            <View
              style={[styles.bar, { backgroundColor: colors.border }]}
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: c.items.length, now: got }}
              accessibilityLabel={fmt(strings.collections.progress, { owned: got, total: c.items.length })}
            >
              <View style={[styles.fill, { width: `${pct}%`, backgroundColor: c.completed ? colors.success : colors.accent }]} />
            </View>
            <AppText variant="caption" muted>{c.completed ? strings.collections.completed : fmt(strings.collections.progress, { owned: got, total: c.items.length })}</AppText>
            <View style={styles.tiles}>{c.items.map((i) => tile(i.itemId, i.owned))}</View>
            {c.rewardItemId ? (
              <View style={[styles.reward, { borderColor: colors.borderStrong, backgroundColor: colors.surfaceRaised }]}>
                {tile(c.rewardItemId, c.rewardOwned, true)}
                <View style={styles.flex}>
                  <AppText variant="label">{strings.collections.reward}</AppText>
                  <AppText variant="caption" muted>{getItem(c.rewardItemId)?.unlockLabel}</AppText>
                </View>
              </View>
            ) : null}
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: { alignItems: 'center', gap: 4 },
  tileArt: { borderWidth: 2, borderRadius: radius.md, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  tileLabel: { textAlign: 'center', fontSize: 11, lineHeight: 14 },
  lock: { position: 'absolute', right: 3, bottom: 3, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  reward: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1.5, borderRadius: radius.lg, padding: spacing.sm },
});
