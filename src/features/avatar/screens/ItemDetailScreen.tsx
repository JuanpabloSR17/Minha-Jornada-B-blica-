import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText, Button, Card, Icon, Notice, Screen } from '@/ui';
import { strings } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { StepHeader } from '../components/StepHeader';
import { AvatarStage } from '../components/AvatarStage';
import { ItemIcon } from '../components/ItemIcon';
import { RARITY_COLOR } from '../components/RarityBadge';
import { collectionsOf, getItem, getRarity } from '../domain/catalog';
import bible from '../../reading/bible-books.json';

const bookName = (code: string) => (bible as { code: string; name: string }[]).find((b) => b.code === code)?.name ?? code;
import { INVENTORY_CATEGORIES, isSpecial, itemView, variantFamily } from '../domain/wardrobe';
import { equipItem, getWardrobe, unequipSlot, type WardrobeState } from '../services/wardrobe.service';

/** Detalhe do item (P04): arte, raridade, referência, condição de desbloqueio, status e variantes. */
export function ItemDetailScreen({ id }: { id: string }) {
  const { colors } = useTheme();
  const router = useRouter();
  const item = getItem(id);
  const [w, setW] = useState<WardrobeState | null>(null);
  const [notice, setNotice] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setW(await getWardrobe());
    } catch (e) {
      setNotice({ tone: 'error', text: errorMessage(e) });
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  if (!item) {
    return (
      <Screen>
        <StepHeader title={strings.item.notFound} onBack={() => router.back()} />
      </Screen>
    );
  }

  const active = w?.loadouts.find((l) => l.id === w.activeLoadoutId);
  const owned = new Set(w?.owned.map((o) => o.itemId) ?? []);
  const view = itemView(item, owned, active?.equipment ?? {}, w?.appearance.bodyId);
  const status = view.equipped ? strings.wardrobe.equipped : view.locked ? strings.wardrobe.locked : strings.wardrobe.owned;
  const family = variantFamily(item.id);
  const cols = collectionsOf(item.id);
  const category = item.slot === 'relic' ? strings.sanctuary.title : INVENTORY_CATEGORIES.find((c) => c.slot === item.slot)?.label ?? item.category;
  const previewLook = w && active ? { appearance: w.appearance, equipment: item.slot === 'relic' ? active.equipment : { ...active.equipment, [item.slot]: item.id } } : null;

  const act = async (fn: () => Promise<WardrobeState>) => {
    setBusy(true);
    setNotice(null);
    try {
      setW(await fn());
      setNotice({ tone: 'success', text: strings.wardrobe.saved });
    } catch (e) {
      setNotice({ tone: 'error', text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  const row = (label: string, value: string) => (
    <View style={styles.row} accessible accessibilityLabel={`${label}: ${value}`}>
      <AppText variant="caption" muted style={styles.rowLabel}>{label}</AppText>
      <AppText variant="body" style={styles.flex}>{value}</AppText>
    </View>
  );

  return (
    <Screen>
      <StepHeader title={item.name} onBack={() => router.back()} />
      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}
      {item.slot === 'relic' ? (
        <View style={[styles.relicHero, { borderColor: RARITY_COLOR[item.rarity], backgroundColor: colors.stage }]}>
          <ItemIcon item={item} size={220} />
        </View>
      ) : (
        <View style={styles.hero}>
          {previewLook ? (
            <View style={styles.flex}>
              <AvatarStage look={previewLook} height={340} />
            </View>
          ) : null}
          <View style={[styles.iconBox, { borderColor: RARITY_COLOR[item.rarity], backgroundColor: colors.stage }]}>
            <ItemIcon item={item} size={120} appearance={w?.appearance} />
          </View>
        </View>
      )}
      {view.art !== 'final' ? <Notice tone="info">{view.art === 'missing' ? `${strings.wardrobe.artMissing}: a peça aparece com um visual substituto até a ilustração ficar pronta.` : `${strings.wardrobe.artProvisional}: protótipo vetorial até a ilustração final.`}</Notice> : null}
      <Card>
        {row(strings.item.category, category)}
        {row(strings.item.rarity, strings.rarity[item.rarity])}
        {row(strings.item.acquisition, strings.item.acquisitionLabels[item.acquisition])}
        {item.book ? row(strings.item.book, bookName(item.book)) : null}
        {item.scriptureRef ? row(strings.item.reference, item.scriptureRef) : null}
        {row(strings.item.unlock, item.unlockLabel ?? strings.item.starterUnlock)}
        {row(strings.item.status, status)}
        {cols.length ? row(strings.item.collection, cols.map((c) => c.name).join(', ')) : null}
        <AppText>{item.description}</AppText>
        {item.slot === 'relic' ? <Notice tone="info">{strings.item.relicNote}</Notice> : null}
        {getRarity(item.rarity) ? (
          <View style={[styles.rarityBox, { borderLeftColor: RARITY_COLOR[item.rarity] }]}>
            <AppText variant="caption" muted>{strings.item.rarityAbout}: {getRarity(item.rarity)!.description}</AppText>
          </View>
        ) : null}
        {isSpecial(item) ? <AppText variant="caption" muted>{strings.item.symbolicNote}</AppText> : null}
      </Card>
      {family.length > 1 ? (
        <Card>
          <AppText variant="heading">{strings.item.variants}</AppText>
          {family.map((v) => {
            const vv = itemView(v, owned, active?.equipment ?? {}, w?.appearance.bodyId);
            return (
              <Pressable
                key={v.id}
                accessibilityRole="link"
                onPress={() => v.id !== item.id && router.push({ pathname: '/avatar/item/[id]', params: { id: v.id } })}
                style={[styles.variant, { borderColor: v.id === item.id ? colors.primary : colors.border }]}
              >
                <View style={[styles.variantIcon, { backgroundColor: colors.stage }]}>
                  <ItemIcon item={v} size={56} />
                </View>
                <View style={styles.flex}>
                  <AppText variant="label">{v.name}</AppText>
                  <AppText variant="caption" muted>{v.variantLabel ?? strings.item.variantBase}</AppText>
                </View>
                <Icon name={vv.locked ? 'lock' : 'check'} size={18} color={vv.locked ? colors.textMuted : colors.success} />
              </Pressable>
            );
          })}
        </Card>
      ) : null}
      {active && !view.locked && item.slot !== 'relic' ? (
        view.equipped ? (
          item.slot !== 'outfit' ? <Button title={strings.item.removeActive} variant="secondary" loading={busy} disabled={active.locked} onPress={() => void act(() => unequipSlot(active.id, item.slot, active.version))} /> : null
        ) : (
          <Button title={strings.item.equipActive} loading={busy} disabled={active.locked} onPress={() => void act(() => equipItem(active.id, item.id, active.version))} />
        )
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-end' },
  iconBox: { borderWidth: 2, borderRadius: radius.lg, overflow: 'hidden', position: 'absolute', right: spacing.sm, bottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'baseline' },
  rowLabel: { width: 120 },
  variant: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1.5, borderRadius: radius.md, padding: spacing.sm },
  relicHero: { alignSelf: 'center', borderWidth: 2, borderRadius: 140, overflow: 'hidden', padding: spacing.md },
  rarityBox: { borderLeftWidth: 4, paddingLeft: spacing.sm },
  variantIcon: { width: 56, height: 56, borderRadius: radius.sm, overflow: 'hidden' },
});
