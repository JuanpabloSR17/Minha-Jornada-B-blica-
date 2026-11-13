import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CinemaTheme, useTheme } from '@/theme/ThemeProvider';
import { ExhibitionHall, counterText } from '@/features/journey/components/ExhibitionHall';
import { radius, spacing } from '@/theme/tokens';
import { AppText, Button, Card, Icon, Notice, Screen } from '@/ui';
import { useMilestones } from '@/features/reading/useMilestones';
import { milestoneSummary } from '@/features/reading/milestones';
import { fmt, strings } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { StepHeader } from '../components/StepHeader';
import { ItemIcon } from '../components/ItemIcon';
import { RARITY_COLOR } from '../components/RarityBadge';
import { COLLECTIONS, COSMETIC_ITEMS, displayName, getItem, getRarity, resolveItemId } from '../domain/catalog';
import { getWardrobe } from '../services/wardrobe.service';
import bible from '../../reading/bible-books.json';

const WORKS = ['works-father', 'works-son', 'works-spirit', 'works-triune'];
type Book = { code: string; name: string; chapters: number; testament: 'AT' | 'NT' };

/**
 * Santuário das Conquistas: itens santos agrupados nas obras do Pai, do Filho, do Espírito Santo
 * e do Deus Triúno (relíquias só em exibição), e a Biblioteca Lendária (um lendário por livro).
 */
export function SanctuaryScreen() {
  return (
    <CinemaTheme>
      <Sanctuary />
    </CinemaTheme>
  );
}

function Sanctuary() {
  const { colors } = useTheme();
  const router = useRouter();
  const [owned, setOwned] = useState<Set<string> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setOwned(new Set((await getWardrobe()).owned.map((o) => resolveItemId(o.itemId))));
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  // progresso dos marcos (registro de conclusão) é diferente da posse mostrada nas coleções
  const { rows: milestoneRowsData } = useMilestones();
  const milestoneSum = milestoneRowsData ? milestoneSummary(milestoneRowsData) : null;
  const legendaryByBook = useMemo(() => new Map(COSMETIC_ITEMS.filter((i) => i.rarity === 'legendary' && i.book).map((i) => [i.book!, i])), []);
  const open = (id: string) => router.push({ pathname: '/avatar/item/[id]', params: { id } });

  if (!owned) {
    return (
      <Screen>
        <StepHeader title={strings.sanctuary.title} onBack={() => router.back()} />
        {error ? <Notice tone="error">{error}</Notice> : <ActivityIndicator color={colors.primary} />}
      </Screen>
    );
  }

  const legendaryOwned = [...legendaryByBook.values()].filter((i) => owned.has(i.id)).length;
  const holy = getRarity('holy');

  return (
    <Screen>
      <StepHeader title={strings.sanctuary.title} onBack={() => router.back()} />
      {/* sala de exposição com os contadores: marcos cumpridos (registro) × Santos obtidos (posse) */}
      <ExhibitionHall
        owned={owned}
        counters={milestoneSum ? counterText(milestoneSum.milestonesDone, milestoneSum.milestonesTotal, milestoneSum.saintsOwned, milestoneSum.saintsTotal) : null}
        onOpenItem={open}
      />
      <Button compact variant="secondary" title={strings.mission.milestonesSeeAll} onPress={() => router.push('/reading/milestones')} />

      <AppText muted>{strings.sanctuary.intro}</AppText>
      {holy ? (
        <View style={[styles.rarityNote, { borderLeftColor: RARITY_COLOR.holy }]}>
          <AppText variant="caption" muted>{holy.description}</AppText>
        </View>
      ) : null}

      {COLLECTIONS.filter((c) => WORKS.includes(c.id)).map((c) => {
        const got = c.items.filter((id) => owned.has(id)).length;
        return (
          <Card key={c.id} style={{ borderColor: RARITY_COLOR.holy }}>
            <View style={styles.head}>
              <View style={styles.flex}>
                <AppText variant="heading">{c.name}</AppText>
                <AppText variant="caption" muted>{c.description}</AppText>
              </View>
              {/* posse: itens DESTA coleção (catálogo vigente) que o jogador possui — não é o progresso dos marcos */}
              <AppText variant="label" color={RARITY_COLOR.holy} testID={`collection-owned-${c.id}`}
                accessibilityLabel={fmt(strings.sanctuary.collectionOwnedLabel, { owned: got, total: c.items.length })}>
                {fmt(strings.sanctuary.collectionOwned, { owned: got, total: c.items.length })}
              </AppText>
            </View>
            <View style={styles.relics}>
              {c.items.map((id) => {
                const item = getItem(id);
                if (!item) return null;
                const has = owned.has(id);
                return (
                  <Pressable key={id} accessibilityRole="link" accessibilityLabel={`${item.name}, ${has ? strings.wardrobe.owned : strings.wardrobe.locked}`} onPress={() => open(id)} style={styles.relic}>
                    <View style={[styles.pedestal, { borderColor: has ? RARITY_COLOR.holy : colors.border, backgroundColor: colors.stage, opacity: has ? 1 : 0.5 }]}>
                      <ItemIcon item={item} size={68} />
                      {!has ? (
                        <View style={[styles.lock, { backgroundColor: colors.overlay }]}>
                          <Icon name="lock" size={12} color="#FFFFFF" />
                        </View>
                      ) : null}
                    </View>
                    <AppText variant="caption" numberOfLines={2} style={styles.relicLabel}>{displayName(item)}</AppText>
                    {!has ? <AppText variant="caption" muted numberOfLines={2} style={styles.relicHint}>{item.scriptureRef}</AppText> : null}
                  </Pressable>
                );
              })}
            </View>
          </Card>
        );
      })}

      <Card style={{ borderColor: RARITY_COLOR.legendary }}>
        <View style={styles.head}>
          <View style={styles.flex}>
            <AppText variant="heading">{strings.sanctuary.libraryTitle}</AppText>
            <AppText variant="caption" muted>{strings.sanctuary.libraryBody}</AppText>
          </View>
          <AppText variant="label" color={RARITY_COLOR.legendary} testID="library-owned">{fmt(strings.sanctuary.libraryOwned, { owned: legendaryOwned, total: legendaryByBook.size })}</AppText>
        </View>
        {(['AT', 'NT'] as const).map((t) => (
          <View key={t} style={styles.testament}>
            <AppText variant="caption" muted>{t === 'AT' ? strings.sanctuary.oldTestament : strings.sanctuary.newTestament}</AppText>
            <View style={styles.books}>
              {(bible as Book[]).filter((b) => b.testament === t).map((b) => {
                const item = legendaryByBook.get(b.code);
                const has = !!item && owned.has(item.id);
                return (
                  <Pressable
                    key={b.code}
                    accessibilityRole="link"
                    accessibilityLabel={`${b.name}: ${item?.name ?? ''}, ${has ? strings.wardrobe.owned : strings.wardrobe.locked}`}
                    onPress={() => item && open(item.id)}
                    style={[styles.book, { borderColor: has ? RARITY_COLOR.legendary : colors.border, backgroundColor: has ? colors.warningSurface : colors.surfaceRaised }]}
                  >
                    <AppText variant="caption" style={styles.bookCode} color={has ? colors.text : colors.textMuted}>{b.code}</AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rarityNote: { borderLeftWidth: 4, paddingLeft: spacing.sm },
  relics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  relic: { width: 84, alignItems: 'center', gap: 3 },
  pedestal: { width: 76, height: 76, borderRadius: 38, borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  lock: { position: 'absolute', bottom: 4, right: 10, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  relicLabel: { textAlign: 'center', fontSize: 11, lineHeight: 14 },
  relicHint: { textAlign: 'center', fontSize: 10, lineHeight: 13 },
  testament: { gap: 6 },
  books: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  book: { width: 44, height: 36, borderRadius: radius.sm, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  bookCode: { fontSize: 11, fontWeight: '700' },
});
