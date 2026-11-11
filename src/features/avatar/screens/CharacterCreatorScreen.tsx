import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText, Button, ConfirmDialog, Icon, Notice, type IconName } from '@/ui';
import { fmt, strings } from '@/i18n';
import { errorCode, errorMessage } from '@/lib/errors';
import { useAuth } from '@/features/auth/AuthProvider';
import { AvatarStage } from '../components/AvatarStage';
import { CategoryBar } from '../components/CategoryBar';
import { ColorSwatches, OptionCarousel, type CarouselOption } from '../components/OptionCarousel';
import { GroupTabs } from '../components/GroupTabs';
import { SyncBadge, type SyncState } from '../components/SyncBadge';
import { CREATOR_STEPS, type CreatorGroup, type CreatorStep } from '../creatorSteps';
import { APPEARANCE_OPTIONS, LOOK_PRESETS, appearanceHasArt, getItem, itemHasArt, itemsForSlot } from '../domain/catalog';
import { defaultLook, looksEqual, normalizeLook, randomLook, setEquipped } from '../domain/avatar.rules';
import type { AvatarLook, EquipmentSlot } from '../domain/avatar.types';
import { getMyAvatar, getMyInventoryIds, saveAvatar } from '../services/avatar.service';
import { draftStorage } from '../services/draftStorage';
import { useAvatarDraft } from '../state/avatarDraft';

export type CreatorMode = 'onboarding' | 'guest' | 'edit';

type Props = {
  mode: CreatorMode;
  /** chamado após salvar com sucesso no onboarding */
  onFinished?: () => void;
  /** voltar a partir do primeiro passo */
  onExit?: () => void;
};

const STEP_ICON: Record<CreatorStep['key'], IconName> = { body: 'body', face: 'face', hair: 'hair', outfit: 'outfit' };
const groupLabel = (g: CreatorGroup) => strings.creator.groups[g.id as keyof typeof strings.creator.groups];

/** Grupos com pelo menos uma opção ilustrada na versão atual da arte. */
function visibleGroups(step: CreatorStep): CreatorGroup[] {
  return step.groups.filter((g) => {
    if (g.kind === 'presets') return LOOK_PRESETS.length > 0;
    if (g.kind === 'appearance') return APPEARANCE_OPTIONS[g.id].some((o) => appearanceHasArt(g.id, o.id));
    return itemsForSlot(g.slot, (i) => itemHasArt(i) && !i.premium).length > 0;
  });
}

export function CharacterCreatorScreen({ mode, onFinished, onExit }: Props) {
  const { colors } = useTheme();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { userId, refreshProfile } = useAuth();
  const { state, dispatch, dirty } = useAvatarDraft();
  const [stepIndex, setStepIndex] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [groupId, setGroupId] = useState<string>(visibleGroups(CREATOR_STEPS[0]!)[0]!.id);
  const [loading, setLoading] = useState(mode !== 'guest');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'error' | 'success' | 'info'; text: string } | null>(null);
  const [confirm, setConfirm] = useState<null | 'reset' | 'discard' | 'leave'>(null);
  const [guestDone, setGuestDone] = useState(false);
  const [localSaved, setLocalSaved] = useState(false);
  const [inventory, setInventory] = useState<Set<string>>(new Set());
  const [stageH, setStageH] = useState(0);
  const hydrated = useRef(false);

  const isEdit = mode === 'edit';
  const step = CREATOR_STEPS[stepIndex]!;
  const groups = useMemo(() => visibleGroups(step), [step]);
  const group = groups.find((g) => g.id === groupId) ?? groups[0]!;
  const look = state.draft;

  /** Item possuído: iniciais gratuitos (o servidor os concede ao salvar) ou já no inventário. */
  const isOwned = useCallback((id: string) => {
    const item = getItem(id);
    return !!item && ((item.starter && !item.premium) || inventory.has(id));
  }, [inventory]);
  const lockedEquipped = useMemo(
    () => Object.values(look.equipment).filter((id): id is string => !!id && !isOwned(id)),
    [look.equipment, isOwned],
  );

  // ---------------------------------------------------------------- carregar
  const load = useCallback(async () => {
    setLoadError(null);
    if (mode === 'guest') {
      const g = await draftStorage.readGuest();
      dispatch({ type: 'hydrate', saved: null, draft: g?.look ?? defaultLook() });
      if (g) {
        setStepIndex(g.step);
        setMaxStep(g.step);
      }
      hydrated.current = true;
      setLoading(false);
      return;
    }
    if (!userId) return;
    setLoading(true);
    const local = mode === 'onboarding' ? await draftStorage.readUser(userId) : null;
    const guest = mode === 'onboarding' && !local ? await draftStorage.readGuest() : null;
    try {
      const [server, owned] = await Promise.all([getMyAvatar(), getMyInventoryIds().catch(() => new Set<string>())]);
      setInventory(owned);
      const useLocal = local && (!server?.updatedAt || local.updatedAt > server.updatedAt);
      dispatch({ type: 'hydrate', saved: server, draft: useLocal ? local.look : server ? undefined : guest?.look ?? defaultLook() });
      if (useLocal) {
        setStepIndex(local.step);
        setMaxStep(local.step);
      }
      if (server && mode === 'onboarding') setMaxStep(CREATOR_STEPS.length - 1);
    } catch (e) {
      if (isEdit) {
        setLoadError(errorMessage(e));
      } else {
        // Sem rede no onboarding: continua com o rascunho local, sem afirmar salvamento.
        dispatch({ type: 'hydrate', saved: null, draft: local?.look ?? guest?.look ?? defaultLook() });
        setNotice({ tone: 'info', text: strings.errors.offline });
      }
    } finally {
      hydrated.current = true;
      setLoading(false);
    }
  }, [mode, userId, dispatch, isEdit]);

  useEffect(() => {
    void load();
  }, [load]);

  // ------------------------------------------------- rascunho local automático
  useEffect(() => {
    if (!hydrated.current || isEdit) return;
    setLocalSaved(false);
    const t = setTimeout(async () => {
      const ok = mode === 'guest'
        ? await draftStorage.writeGuest(look, stepIndex)
        : userId
          ? await draftStorage.writeUser(userId, look, stepIndex)
          : false;
      setLocalSaved(ok);
    }, 350);
    return () => clearTimeout(t);
  }, [look, stepIndex, mode, userId, isEdit]);

  // ---------------------------------------------------------------- opções
  const carousel: CarouselOption[] = useMemo(() => {
    if (group.kind === 'presets') {
      return LOOK_PRESETS.map((p) => ({ id: p.id, label: p.name, look: normalizeLook(p.look), crop: 'full' as const }));
    }
    if (group.kind === 'appearance') {
      return APPEARANCE_OPTIONS[group.id]
        .filter((o) => appearanceHasArt(group.id, o.id))
        .map((o) => ({
          id: o.id,
          label: o.name,
          crop: group.crop,
          look: { equipment: group.id === 'body' ? look.equipment : {}, appearance: { ...look.appearance, [group.key]: o.id } },
        }));
    }
    const slot = group.slot;
    const items = itemsForSlot(slot, (i) => itemHasArt(i) && !i.premium).map<CarouselOption>((it) => {
      const locked = !isOwned(it.id);
      return {
        id: it.id,
        label: it.name,
        crop: group.crop,
        rarity: it.rarity,
        locked,
        hint: it.unlockLabel ?? strings.creator.lockedHintDefault,
        look: { ...look, equipment: setEquipped(look.equipment, slot, it.id) },
        onlySources: [`${slot}/${it.id}`],
      };
    });
    if (group.optional) items.unshift({ id: null, label: strings.creator.none });
    return items;
  }, [group, look, isOwned]);

  const selectedId =
    group.kind === 'presets'
      ? LOOK_PRESETS.find((p) => looksEqual(normalizeLook(p.look), look))?.id ?? null
      : group.kind === 'appearance'
        ? look.appearance[group.key]
        : look.equipment[group.slot] ?? null;

  const onSelect = useCallback(
    (opt: CarouselOption) => {
      setNotice(null);
      if (group.kind === 'presets') {
        const preset = LOOK_PRESETS.find((p) => p.id === opt.id);
        if (preset) dispatch({ type: 'replace', look: normalizeLook(preset.look) });
      } else if (group.kind === 'appearance') {
        if (opt.id) dispatch({ type: 'applyPreview', patch: { [group.key]: opt.id } });
      } else {
        dispatch({ type: 'equip', slot: group.slot, itemId: opt.id });
      }
    },
    [group, dispatch],
  );

  // ---------------------------------------------------------------- ações
  const goToStep = (i: number) => {
    setStepIndex(i);
    setMaxStep((m) => Math.max(m, i));
    setGroupId(visibleGroups(CREATOR_STEPS[i]!)[0]!.id);
  };

  const randomize = () => dispatch({ type: 'replace', look: randomLook(Math.random, look.equipment.background) });
  const askReset = () => {
    if (!looksEqual(look, defaultLook())) setConfirm('reset');
  };

  /** Tira a prévia de itens bloqueados, voltando à peça salva (ou nenhuma). */
  const removeLockedPreview = () => {
    for (const id of lockedEquipped) {
      const slot = getItem(id)?.slot as EquipmentSlot | undefined;
      if (!slot) continue;
      const fallback = state.saved?.equipment[slot] ?? defaultLook().equipment[slot] ?? null;
      dispatch({ type: 'equip', slot, itemId: fallback && isOwned(fallback) ? fallback : null });
    }
  };

  const save = async () => {
    if (lockedEquipped.length) {
      setNotice({ tone: 'info', text: strings.creator.lockedCannotSave });
      return;
    }
    dispatch({ type: 'saveStart' });
    setNotice(null);
    try {
      const saved = await saveAvatar(look, state.savedVersion);
      dispatch({ type: 'saveSuccess', state: saved });
      if (mode === 'onboarding' && userId) {
        await draftStorage.clearUser(userId);
        await draftStorage.clearGuest();
        await refreshProfile();
        onFinished?.();
      } else {
        setNotice({ tone: 'success', text: strings.creator.sync.saved });
      }
    } catch (e) {
      const code = errorCode(e);
      dispatch({ type: 'saveError', error: errorMessage(e) });
      setNotice({ tone: 'error', text: errorMessage(e) });
      if (code === 'version_conflict') {
        try {
          dispatch({ type: 'hydrate', saved: await getMyAvatar() });
        } catch {
          /* mantém o rascunho; a mensagem já foi exibida */
        }
      }
    }
  };

  const onPrimary = () => {
    if (stepIndex < CREATOR_STEPS.length - 1) return goToStep(stepIndex + 1);
    if (lockedEquipped.length) return setNotice({ tone: 'info', text: strings.creator.lockedCannotSave });
    if (mode === 'guest') {
      void draftStorage.writeGuest(look, stepIndex).then(() => setGuestDone(true));
      return;
    }
    // Personagem já salvo e sem mudanças (usuário voltou de etapa seguinte): só avança.
    if (mode === 'onboarding' && !dirty && state.saved) return onFinished?.();
    return void save();
  };

  const onBack = () => {
    if (isEdit) return dirty ? setConfirm('leave') : router.back();
    if (stepIndex > 0) return goToStep(stepIndex - 1);
    onExit?.();
  };

  // ---------------------------------------------------------------- status
  const syncState: SyncState = (() => {
    if (state.status === 'saving') return 'saving';
    if (state.status === 'error') return 'error';
    if (mode === 'guest') return 'guest';
    if (isEdit) return dirty ? 'unsaved' : 'saved';
    if (state.status === 'saved') return 'saved';
    return 'local';
  })();
  const syncLabel = {
    guest: strings.creator.sync.guest,
    local: localSaved ? strings.creator.sync.local : strings.creator.sync.unsaved,
    unsaved: strings.creator.sync.unsaved,
    saving: strings.creator.sync.saving,
    saved: strings.creator.sync.saved,
    error: strings.creator.sync.error,
  }[syncState];

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <AppText muted>{strings.common.loading}</AppText>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background, padding: spacing.xl }]}>
        <Notice tone="error">{loadError}</Notice>
        <Button title={strings.common.retry} onPress={() => void load()} />
        <Button title={strings.common.back} variant="ghost" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------- layout
  const wide = width >= 860;
  const short = height < 700;
  const lockedItem = getItem(lockedEquipped[0]);
  const isLast = stepIndex === CREATOR_STEPS.length - 1;
  const categories = CREATOR_STEPS.map((s, i) => ({ id: String(i), label: strings.creator.steps[s.key], icon: STEP_ICON[s.key] }));

  const stage = (
    <View style={[styles.stageWrap, wide && styles.stageWide]} onLayout={(e) => setStageH(Math.round(e.nativeEvent.layout.height))}>
      {stageH > 0 ? (
        <AvatarStage look={look} height={stageH} camera={step.camera === 'portrait' ? 'portrait' : 'full'}>
          <View style={styles.stageTop} pointerEvents="box-none">
            {short ? <View /> : <SyncBadge state={syncState} label={syncLabel} compact />}
            <View style={styles.tools}>
              <ToolButton label={strings.creator.random} icon="dice" onPress={randomize} hint="Sorteia apenas peças iniciais gratuitas" iconOnly={short} />
              <ToolButton label={strings.creator.reset} icon="undo" onPress={askReset} iconOnly={short} />
            </View>
          </View>
        </AvatarStage>
      ) : null}
    </View>
  );

  const panel = (
    <View style={[styles.panel, short && styles.panelCompact, { backgroundColor: colors.surface, borderColor: colors.border }, wide && styles.panelWide]}>
      <CategoryBar
        items={categories}
        value={String(stepIndex)}
        onChange={(id) => goToStep(Number(id))}
        doneUpTo={isEdit ? undefined : maxStep}
        compact={short}
      />
      {groups.length > 1 ? <GroupTabs items={groups.map((g) => ({ id: g.id, label: groupLabel(g) }))} value={group.id} onChange={setGroupId} /> : null}
      {group.kind === 'appearance' && group.display === 'swatch' ? (
        <ColorSwatches
          label={groupLabel(group)}
          options={APPEARANCE_OPTIONS[group.id].map((o) => ({ id: o.id, label: o.name, color: o.color }))}
          value={look.appearance[group.key]}
          onSelect={(id) => onSelect({ id, label: id })}
        />
      ) : (
        <OptionCarousel label={groupLabel(group)} options={carousel} value={selectedId} onSelect={onSelect} compact={short} />
      )}
      {!short ? (
        <AppText variant="caption" muted numberOfLines={2}>
          {group.kind === 'presets' ? strings.creator.presetsHint : step.key === 'outfit' ? strings.creator.inclusiveNote : strings.creator.placeholderArtNote}
        </AppText>
      ) : null}
    </View>
  );

  const footer = isEdit ? (
    <View style={styles.footerRow}>
      <Button title={strings.common.discard} variant="secondary" disabled={!dirty || state.status === 'saving'} onPress={() => setConfirm('discard')} style={styles.flex} />
      <Button title={strings.common.save} disabled={!dirty || lockedEquipped.length > 0} loading={state.status === 'saving'} onPress={() => void save()} style={styles.flexWide} />
    </View>
  ) : (
    <View style={styles.footerRow}>
      <Button title={strings.common.back} variant="secondary" onPress={onBack} style={styles.flex} disabled={state.status === 'saving' || (stepIndex === 0 && !onExit)} />
      <Button title={isLast ? strings.creator.finish : strings.common.continue} onPress={onPrimary} loading={state.status === 'saving'} style={styles.flexWide} />
    </View>
  );

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top', 'bottom', 'left', 'right']}>
      <View style={[styles.flex, styles.page, wide && styles.pageWide]}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel={strings.common.back} onPress={onBack} hitSlop={10} style={styles.back}>
            <Icon name="back" color={colors.text} size={24} />
          </Pressable>
          <AppText variant="title" style={styles.title} numberOfLines={1}>
            {isEdit ? strings.creator.editTitle : strings.creator.title}
          </AppText>
          {!isEdit ? <AppText variant="label" muted>{fmt(strings.creator.stepOf, { current: stepIndex + 1, total: CREATOR_STEPS.length })}</AppText> : null}
        </View>
        {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}
        {lockedItem ? (
          <View style={[styles.locked, { backgroundColor: colors.warningSurface, borderColor: colors.warning }]} accessibilityLiveRegion="polite">
            <Icon name="lock" size={18} color={colors.warning} />
            <View style={styles.flex}>
              <AppText variant="label">{fmt(strings.creator.lockedPreviewTitle, { name: lockedItem.name })}</AppText>
              <AppText variant="caption" muted>{fmt(strings.creator.lockedPreviewBody, { hint: lockedItem.unlockLabel ?? strings.creator.lockedHintDefault })}</AppText>
            </View>
            <Button compact variant="secondary" title={strings.creator.removePreview} onPress={removeLockedPreview} />
          </View>
        ) : null}
        <View style={[styles.flex, wide ? styles.row : styles.col]}>
          {stage}
          {panel}
        </View>
        {footer}
      </View>

      <ConfirmDialog
        visible={confirm === 'reset'}
        title={strings.creator.resetConfirmTitle}
        body={strings.creator.resetConfirmBody}
        confirmLabel={strings.creator.reset}
        onConfirm={() => {
          dispatch({ type: 'reset' });
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        visible={confirm === 'discard' || confirm === 'leave'}
        title={strings.creator.discardConfirmTitle}
        body={strings.creator.discardConfirmBody}
        confirmLabel={strings.common.discard}
        destructive
        onConfirm={() => {
          const leaving = confirm === 'leave';
          dispatch({ type: 'discard' });
          setConfirm(null);
          setNotice(null);
          if (leaving) router.back();
        }}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        visible={guestDone}
        title={strings.creator.guestDoneTitle}
        body={strings.creator.guestDoneBody}
        confirmLabel={strings.creator.guestCreateAccount}
        onConfirm={() => {
          setGuestDone(false);
          router.push({ pathname: '/auth', params: { mode: 'signup' } });
        }}
        onCancel={() => setGuestDone(false)}
      />
    </SafeAreaView>
  );
}

function ToolButton({ label, icon, onPress, hint, iconOnly }: { label: string; icon: 'dice' | 'undo'; onPress: () => void; hint?: string; iconOnly?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => [styles.tool, { backgroundColor: pressed ? colors.backgroundAlt : colors.surfaceRaised, borderColor: colors.borderStrong }]}
    >
      <Icon name={icon} size={20} color={colors.text} />
      {iconOnly ? null : <AppText variant="caption" style={styles.toolLabel}>{label}</AppText>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexWide: { flex: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  page: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.md, gap: spacing.sm, width: '100%', maxWidth: 1180, alignSelf: 'center' },
  pageWide: { paddingHorizontal: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -10 },
  title: { flex: 1 },
  row: { flexDirection: 'row', gap: spacing.xl },
  col: { flexDirection: 'column', gap: spacing.sm },
  stageWrap: { flex: 1, minHeight: 150 },
  stageWide: { flex: 1.1 },
  stageTop: { position: 'absolute', bottom: spacing.sm, left: spacing.sm, right: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  tools: { gap: spacing.sm, flexDirection: 'row' },
  tool: { minWidth: 52, minHeight: 50, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', gap: 1 },
  toolLabel: { fontSize: 11, lineHeight: 13 },
  panel: { borderRadius: radius.xl, borderWidth: 1, padding: spacing.md, gap: spacing.sm },
  panelCompact: { padding: spacing.sm, gap: 6 },
  panelWide: { flex: 1, alignSelf: 'flex-start' },
  locked: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderRadius: radius.md, padding: spacing.sm },
  footerRow: { flexDirection: 'row', gap: spacing.md },
});
