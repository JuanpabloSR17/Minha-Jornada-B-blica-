import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CinemaTheme, useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText, Button, ConfirmDialog, Icon, Notice } from '@/ui';
import { fmt, strings } from '@/i18n';
import { errorCode, errorMessage } from '@/lib/errors';
import { AvatarStage } from '../components/AvatarStage';
import { GroupTabs } from '../components/GroupTabs';
import { ItemCard } from '../components/ItemCard';
import { RarityBadge } from '../components/RarityBadge';
import { OptionCarousel } from '../components/OptionCarousel';
import { RARITIES, displayName, getItem } from '../domain/catalog';
import { RARITY_COLOR } from '../components/RarityBadge';
import type { Rarity } from '../domain/avatar.types';
import {
  INVENTORY_CATEGORIES,
  appearanceChanged,
  hairOptions,
  initialWardrobe,
  itemView,
  listItems,
  lockedInDraft,
  wardrobeDirty,
  wardrobeReducer,
  type ItemFilter,
  type ItemView,
} from '../domain/wardrobe';
import { activateLoadout, getWardrobe, saveWardrobe } from '../services/wardrobe.service';

/** Guarda-roupa (P03): inventário por categoria, prévia ao vivo, equipar/remover e Salvar/Descartar. */
/** Guarda-roupa na identidade da jornada (índigo, bronze, dourado; seleção em neon violeta). */
export function WardrobeScreen() {
  return (
    <CinemaTheme>
      <Wardrobe />
    </CinemaTheme>
  );
}

function Wardrobe() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ loadout?: string; category?: string }>();
  const { width, height } = useWindowDimensions();
  const [s, dispatch] = useReducer(wardrobeReducer, initialWardrobe);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'error' | 'success' | 'info'; text: string } | null>(null);
  const [category, setCategory] = useState(params.category ?? 'outfit');
  const [filter, setFilter] = useState<ItemFilter>('all');
  const [rarity, setRarity] = useState<Rarity | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingLoadout, setPendingLoadout] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [stageH, setStageH] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);

  // avisos de sucesso somem sozinhos para liberar espaço no celular
  useEffect(() => {
    if (notice?.tone !== 'success') return;
    const t = setTimeout(() => setNotice(null), 2500);
    return () => clearTimeout(t);
  }, [notice]);

  const load = useCallback(async (loadoutId?: string | null) => {
    setLoadError(null);
    try {
      dispatch({ type: 'hydrate', state: await getWardrobe(), loadoutId: loadoutId ?? params.loadout ?? null });
    } catch (e) {
      setLoadError(errorMessage(e));
    }
  }, [params.loadout]);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = wardrobeDirty(s);
  const locked = lockedInDraft(s);
  const owned = useMemo(() => new Set(s.saved?.owned.map((o) => o.itemId) ?? []), [s.saved]);
  const loadout = s.saved?.loadouts.find((l) => l.id === s.loadoutId);
  const draft = s.draft;

  const items = useMemo(
    () => (draft ? listItems(category, { owned, equipment: draft.equipment, filter, rarity, search, bodyId: draft.appearance.bodyId }) : []),
    [category, owned, draft, filter, rarity, search],
  );
  const selected: ItemView | null = useMemo(() => {
    const it = getItem(selectedId);
    return it && draft ? itemView(it, owned, draft.equipment, draft.appearance.bodyId) : null;
  }, [selectedId, owned, draft]);

  const onItem = (v: ItemView) => {
    setSelectedId(v.item.id);
    setNotice(null);
    // tocar equipa na prévia (inclusive itens bloqueados, só para experimentar)
    if (!v.equipped && v.item.slot !== 'relic') dispatch({ type: 'equip', slot: v.item.slot, itemId: v.item.id });
  };

  const removeSelected = () => {
    if (selected && selected.item.slot !== 'relic') dispatch({ type: 'equip', slot: selected.item.slot, itemId: null });
  };

  const save = async () => {
    if (!s.saved || !draft || !loadout) return;
    if (locked.length) return setNotice({ tone: 'info', text: strings.creator.lockedCannotSave });
    dispatch({ type: 'saveStart' });
    try {
      const state = await saveWardrobe({
        loadoutId: loadout.id,
        equipment: draft.equipment,
        expectedVersion: loadout.version,
        appearance: appearanceChanged(s),
        expectedAppearanceVersion: s.saved.appearanceVersion,
      });
      dispatch({ type: 'saveSuccess', state });
      setNotice({ tone: 'success', text: strings.wardrobe.saved });
    } catch (e) {
      dispatch({ type: 'saveError', error: errorMessage(e) });
      setNotice({ tone: 'error', text: errorMessage(e) });
      if (errorCode(e) === 'version_conflict') void load(s.loadoutId);
    }
  };

  const useThisLoadout = async () => {
    if (!loadout) return;
    try {
      dispatch({ type: 'hydrate', state: await activateLoadout(loadout.id), loadoutId: loadout.id });
    } catch (e) {
      setNotice({ tone: 'error', text: errorMessage(e) });
    }
  };

  const pickLoadout = (id: string) => {
    if (id === s.loadoutId) return;
    if (dirty) return setPendingLoadout(id);
    dispatch({ type: 'selectLoadout', loadoutId: id });
  };

  if (loadError) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background, padding: spacing.xl }]}>
        <Notice tone="error">{loadError}</Notice>
        <Button title={strings.common.retry} onPress={() => void load()} />
      </SafeAreaView>
    );
  }
  if (!s.saved || !draft || !loadout) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  const wide = width >= 860;
  const short = height < 700;
  const cols = wide ? 5 : width < 360 ? 3 : 4;
  const panelW = wide ? Math.min(560, width * 0.48) : Math.min(width, 560) - spacing.lg * 2 - spacing.md * 2;
  const cardW = Math.floor((panelW - (cols - 1) * spacing.sm) / cols);
  const lockedItem = getItem(locked[0]);

  const stage = (
    <View style={[styles.stageWrap, wide ? styles.stageWide : { height: short ? height * 0.26 : height * 0.31 }]} onLayout={(e) => setStageH(Math.round(e.nativeEvent.layout.height))}>
      {stageH ? (
        <AvatarStage look={draft} height={stageH}>
          {/* prova 3D: o mesmo visual salvo da conta num palco 3D */}
          <Button compact variant="secondary" title={strings.avatar3d.open} style={styles.stage3d}
            onPress={() => router.push('/avatar/3d')} />
          {loadout.locked ? (
            <View style={[styles.stageBadge, { backgroundColor: colors.warningSurface }]}>
              <Icon name="lock" size={14} color={colors.warning} />
              <AppText variant="caption">{strings.wardrobe.lockedLoadout}</AppText>
            </View>
          ) : null}
        </AvatarStage>
      ) : null}
    </View>
  );

  const panel = (
    <View style={[styles.panel, wide && styles.panelWide, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <GroupTabs items={INVENTORY_CATEGORIES.map((c) => ({ id: c.id, label: c.label }))} value={category} onChange={(c) => { setCategory(c); setSelectedId(null); }} />
      {category === 'hair' ? (
        <>
          <OptionCarousel
            label="Cabelos"
            value={draft.appearance.hairStyleId}
            onSelect={(o) => o.id && dispatch({ type: 'setHair', hairStyleId: o.id })}
            options={hairOptions().map((o) => ({ id: o.id, label: o.name, crop: 'portrait', look: { appearance: { ...draft.appearance, hairStyleId: o.id }, equipment: {} } }))}
          />
          <AppText variant="caption" muted>{strings.wardrobe.hairNote}</AppText>
        </>
      ) : (
        <>
          <View style={styles.filterRow}>
            {(['all', 'owned', 'equipped'] as const).map((f) => (
              <Pressable
                key={f}
                accessibilityRole="radio"
                aria-checked={filter === f}
                accessibilityState={{ checked: filter === f }}
                onPress={() => setFilter(f)}
                style={[styles.chip, { borderColor: filter === f ? colors.primary : colors.border, backgroundColor: filter === f ? colors.surfaceRaised : 'transparent' }]}
              >
                <AppText variant="caption" color={filter === f ? colors.text : colors.textMuted}>{strings.wardrobe.filters[f]}</AppText>
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={strings.wardrobe.search}
              onPress={() => setSearchOpen((v) => !v)}
              style={[styles.chip, styles.searchBtn, { borderColor: searchOpen || search ? colors.primary : colors.border }]}
            >
              <Icon name="search" size={16} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.noGrow} contentContainerStyle={styles.rarityRow} accessibilityRole="radiogroup" accessibilityLabel="Raridade">
            {(['all', ...RARITIES.map((r) => r.id)] as (Rarity | 'all')[]).map((r) => {
              const on = rarity === r;
              const color = r === 'all' ? colors.text : RARITY_COLOR[r];
              return (
                <Pressable
                  key={r}
                  accessibilityRole="radio"
                  aria-checked={on}
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={r === 'all' ? 'Todas as raridades' : strings.rarity[r]}
                  onPress={() => setRarity(r)}
                  style={[styles.rarityChip, { borderColor: on ? color : colors.border, backgroundColor: on ? colors.surfaceRaised : 'transparent' }]}
                >
                  {r !== 'all' ? <View style={[styles.rarityDot, { backgroundColor: color }]} /> : null}
                  <AppText variant="caption" color={on ? colors.text : colors.textMuted}>{r === 'all' ? 'Todas' : strings.rarity[r]}</AppText>
                </Pressable>
              );
            })}
          </ScrollView>
          {searchOpen ? (
            <TextInput
              accessibilityLabel={strings.wardrobe.search}
              placeholder={strings.wardrobe.search}
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoFocus
              style={[styles.search, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
            />
          ) : null}
          <ScrollView style={styles.grid} contentContainerStyle={styles.gridContent}>
            {items.length ? (
              <View accessibilityRole="radiogroup" style={[styles.gridWrap, { gap: spacing.sm }]}>
                {items.map((v) => (
                  <ItemCard key={v.item.id} view={v} width={cardW} selected={v.item.id === selectedId} onPress={onItem} />
                ))}
              </View>
            ) : (
              <AppText muted style={styles.empty}>{strings.wardrobe.empty}</AppText>
            )}
          </ScrollView>
        </>
      )}
    </View>
  );

  const detail = selected ? (
    <View style={[styles.detail, { backgroundColor: colors.surfaceRaised, borderColor: colors.borderStrong }]}>
      <View style={styles.flex}>
        <View style={styles.detailTitle}>
          <AppText variant="label" numberOfLines={2} style={styles.flexShrink}>{displayName(selected.item)}</AppText>
          <View style={styles.inlineBadge}><RarityBadge rarity={selected.item.rarity} /></View>
        </View>
        <AppText variant="caption" muted numberOfLines={2}>
          {selected.locked ? fmt(strings.wardrobe.previewLocked, { hint: selected.item.unlockLabel ?? strings.creator.lockedHintDefault }) : selected.item.scriptureRef ?? selected.item.description}
        </AppText>
      </View>
      {selected.equipped && !selected.locked && selected.item.slot !== 'outfit' ? <Button compact variant="secondary" title={strings.wardrobe.remove} onPress={removeSelected} /> : null}
      <Button compact variant="ghost" title={strings.wardrobe.details} onPress={() => router.push({ pathname: '/avatar/item/[id]', params: { id: selected.item.id } })} />
    </View>
  ) : null;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top', 'bottom', 'left', 'right']}>
      <View style={[styles.flex, styles.page]}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel={strings.common.back} onPress={() => (dirty ? setConfirmLeave(true) : router.back())} hitSlop={10} style={styles.back}>
            <Icon name="back" color={colors.text} size={24} />
          </Pressable>
          <AppText variant="title" style={styles.flex} numberOfLines={1}>{strings.wardrobe.title}</AppText>
          <Button compact variant="ghost" title={strings.wardrobe.manageLoadouts} onPress={() => router.push('/avatar/loadouts')} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.loadoutRow} style={styles.noGrow} accessibilityRole="tablist">
          {s.saved.loadouts.map((l) => {
            const active = l.id === s.loadoutId;
            return (
              <Pressable
                key={l.id}
                accessibilityRole="tab"
                aria-selected={active}
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${l.name}${l.isActive ? `, ${strings.wardrobe.activeLoadout}` : ''}${l.locked ? `, ${strings.loadouts.locked}` : ''}`}
                onPress={() => pickLoadout(l.id)}
                style={[styles.loadoutChip, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.surfaceRaised : 'transparent' }]}
              >
                {l.locked ? <Icon name="lock" size={14} color={colors.textMuted} /> : null}
                <AppText variant="caption" color={active ? colors.text : colors.textMuted}>{l.name}</AppText>
                {l.isActive ? <View style={[styles.dot, { backgroundColor: colors.success }]} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
        {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}
        {lockedItem ? <Notice tone="warning">{fmt(strings.creator.lockedPreviewTitle, { name: lockedItem.name }) + ' — ' + (lockedItem.unlockLabel ?? strings.creator.lockedHintDefault)}</Notice> : null}
        <View style={[styles.flex, wide ? styles.row : styles.col]}>
          {stage}
          <View style={[styles.flex, styles.col]}>
            {panel}
            {detail}
          </View>
        </View>
        <View style={styles.footer}>
          {!loadout.isActive && !loadout.locked && !dirty ? (
            <Button title={strings.wardrobe.useLoadout} variant="secondary" onPress={() => void useThisLoadout()} style={styles.flex} />
          ) : (
            <Button title={strings.common.discard} variant="secondary" disabled={!dirty || s.status === 'saving'} onPress={() => { dispatch({ type: 'discard' }); setNotice(null); }} style={styles.flex} />
          )}
          <Button title={strings.common.save} onPress={() => void save()} loading={s.status === 'saving'} disabled={!dirty || locked.length > 0 || loadout.locked} style={width < 360 ? styles.flex : styles.flexWide} />
        </View>
      </View>
      <ConfirmDialog
        visible={!!pendingLoadout || confirmLeave}
        title={strings.wardrobe.switchConfirmTitle}
        body={strings.wardrobe.switchConfirmBody}
        confirmLabel={strings.common.discard}
        destructive
        onConfirm={() => {
          if (pendingLoadout) dispatch({ type: 'selectLoadout', loadoutId: pendingLoadout });
          setPendingLoadout(null);
          if (confirmLeave) {
            setConfirmLeave(false);
            router.back();
          }
        }}
        onCancel={() => {
          setPendingLoadout(null);
          setConfirmLeave(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  flexWide: { flex: 2 },
  noGrow: { flexGrow: 0, flexShrink: 0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  page: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.md, gap: spacing.sm, width: '100%', maxWidth: 1180, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -10 },
  loadoutRow: { gap: spacing.sm, alignItems: 'center' },
  loadoutChip: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1.5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  row: { flexDirection: 'row', gap: spacing.xl },
  col: { flexDirection: 'column', gap: spacing.sm },
  stageWrap: { minHeight: 160 },
  stageWide: { flex: 1 },
  stage3d: { position: 'absolute', top: spacing.sm, right: spacing.sm, minHeight: 40 },
  stageBadge: { position: 'absolute', top: spacing.sm, left: spacing.sm, flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  panel: { flex: 1, borderRadius: radius.xl, borderWidth: 1, padding: spacing.md, gap: spacing.sm, minHeight: 0 },
  panelWide: { maxWidth: 600 },
  filterRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  chip: { minHeight: 36, paddingHorizontal: 10, borderRadius: radius.pill, borderWidth: 1.5, justifyContent: 'center' },
  rarityRow: { gap: 6, alignItems: 'center' },
  rarityChip: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 32, paddingHorizontal: 10, borderRadius: radius.pill, borderWidth: 1.5 },
  rarityDot: { width: 9, height: 9, borderRadius: 5 },
  searchBtn: { marginLeft: 'auto', minWidth: 44, alignItems: 'center' },
  search: { minHeight: 38, borderWidth: 1.5, borderRadius: radius.pill, paddingHorizontal: spacing.md, fontSize: 14 },
  grid: { flex: 1 },
  gridContent: { paddingBottom: spacing.sm },
  gridWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  empty: { textAlign: 'center', marginTop: spacing.xl },
  detail: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1.5, borderRadius: radius.lg, padding: spacing.sm },
  detailTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  inlineBadge: { width: 70, height: 20 },
  footer: { flexDirection: 'row', gap: spacing.md },
});
