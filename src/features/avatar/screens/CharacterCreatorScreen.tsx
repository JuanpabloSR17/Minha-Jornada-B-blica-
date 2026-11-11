import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { AppText, Button, ConfirmDialog, Icon, Notice } from '@/ui';
import { fmt, strings } from '@/i18n';
import { errorCode, errorMessage } from '@/lib/errors';
import { useAuth } from '@/features/auth/AuthProvider';
import { AvatarStage } from '../components/AvatarStage';
import { AppearanceOptionPicker, type PickerOption } from '../components/AppearanceOptionPicker';
import { GroupTabs } from '../components/GroupTabs';
import { StepHeader } from '../components/StepHeader';
import { SyncBadge, type SyncState } from '../components/SyncBadge';
import { CREATOR_STEPS, type CreatorGroup } from '../creatorSteps';
import { APPEARANCE_OPTIONS, isStarterFree, itemsForSlot } from '../domain/catalog';
import { defaultLook, looksEqual, randomLook, setEquipped } from '../domain/avatar.rules';
import { getMyAvatar, saveAvatar } from '../services/avatar.service';
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

const groupLabel = (g: CreatorGroup) => strings.creator.groups[g.id as keyof typeof strings.creator.groups];

export function CharacterCreatorScreen({ mode, onFinished, onExit }: Props) {
  const { colors } = useTheme();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { userId, refreshProfile } = useAuth();
  const { state, dispatch, dirty } = useAvatarDraft();
  const [stepIndex, setStepIndex] = useState(0);
  const [groupId, setGroupId] = useState<string>(CREATOR_STEPS[0]!.groups[0]!.id);
  const [loading, setLoading] = useState(mode !== 'guest');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'error' | 'success' | 'info'; text: string } | null>(null);
  const [confirm, setConfirm] = useState<null | 'reset' | 'discard' | 'leave'>(null);
  const [guestDone, setGuestDone] = useState(false);
  const [localSaved, setLocalSaved] = useState(false);
  const hydrated = useRef(false);

  const isEdit = mode === 'edit';
  const step = CREATOR_STEPS[stepIndex]!;
  const group = step.groups.find((g) => g.id === groupId) ?? step.groups[0]!;
  const look = state.draft;

  // ---------------------------------------------------------------- carregar
  const load = useCallback(async () => {
    setLoadError(null);
    if (mode === 'guest') {
      const g = await draftStorage.readGuest();
      dispatch({ type: 'hydrate', saved: null, draft: g?.look ?? defaultLook() });
      if (g) setStepIndex(g.step);
      hydrated.current = true;
      setLoading(false);
      return;
    }
    if (!userId) return;
    setLoading(true);
    const local = mode === 'onboarding' ? await draftStorage.readUser(userId) : null;
    const guest = mode === 'onboarding' && !local ? await draftStorage.readGuest() : null;
    try {
      const server = await getMyAvatar();
      // rascunho local mais novo que o servidor tem prioridade no onboarding
      const useLocal = local && (!server?.updatedAt || local.updatedAt > server.updatedAt);
      dispatch({ type: 'hydrate', saved: server, draft: useLocal ? local.look : server ? undefined : guest?.look ?? defaultLook() });
      if (useLocal) setStepIndex(local.step);
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
  const options: PickerOption[] = useMemo(() => {
    if (group.kind === 'appearance') {
      return APPEARANCE_OPTIONS[group.id].map((o) => ({
        id: o.id,
        label: o.name,
        color: o.color,
        look: group.display === 'thumb' ? { ...look, appearance: { ...look.appearance, [group.key]: o.id } } : undefined,
      }));
    }
    const items = itemsForSlot(group.slot, isStarterFree).map<PickerOption>((it) => ({
      id: it.id,
      label: it.name,
      look: { ...look, equipment: setEquipped(look.equipment, group.slot, it.id) },
    }));
    if (group.optional) {
      items.unshift({ id: null, label: strings.creator.none, look: { ...look, equipment: setEquipped(look.equipment, group.slot, null) } });
    }
    return items;
  }, [group, look]);

  const selectedId = group.kind === 'appearance' ? look.appearance[group.key] : look.equipment[group.slot] ?? null;

  const onSelect = useCallback(
    (id: string | null) => {
      if (group.kind === 'appearance') {
        if (id) dispatch({ type: 'applyPreview', patch: { [group.key]: id } });
      } else {
        dispatch({ type: 'equip', slot: group.slot, itemId: id });
      }
      setNotice(null);
    },
    [group, dispatch],
  );

  // ---------------------------------------------------------------- ações
  const goToStep = (i: number) => {
    setStepIndex(i);
    setGroupId(CREATOR_STEPS[i]!.groups[0]!.id);
  };

  const randomize = () => dispatch({ type: 'replace', look: randomLook(Math.random, look.equipment.background) });

  const doReset = () => {
    dispatch({ type: 'reset' });
    setConfirm(null);
  };
  const askReset = () => {
    if (looksEqual(look, defaultLook())) return;
    setConfirm('reset');
  };

  const save = async () => {
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
          const server = await getMyAvatar();
          dispatch({ type: 'hydrate', saved: server });
        } catch {
          /* mantém o rascunho; a mensagem já foi exibida */
        }
      }
    }
  };

  const finishGuest = async () => {
    await draftStorage.writeGuest(look, stepIndex);
    setGuestDone(true);
  };

  const onPrimary = () => {
    if (stepIndex < CREATOR_STEPS.length - 1) return goToStep(stepIndex + 1);
    if (mode === 'guest') return void finishGuest();
    // Personagem já salvo e sem mudanças (usuário voltou de etapa seguinte): só avança.
    if (mode === 'onboarding' && !dirty && state.saved) return onFinished?.();
    return void save();
  };

  const onBack = () => {
    if (isEdit) {
      if (dirty) return setConfirm('leave');
      return router.back();
    }
    if (stepIndex > 0) return goToStep(stepIndex - 1);
    onExit?.();
  };

  // ---------------------------------------------------------------- layout
  const wide = width >= 860;
  const short = height < 720;
  const stageHeight = wide
    ? Math.max(320, Math.min(height - 260, 620))
    : short
      ? Math.max(160, height * 0.3)
      : Math.min(height * 0.4, 440);

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

  const title = isEdit ? strings.creator.editTitle : strings.creator.title;
  const stepTabs = CREATOR_STEPS.map((s, i) => ({ id: String(i), label: strings.creator.steps[s.key] }));

  const stage = (
    <View style={styles.stageWrap}>
      <AvatarStage look={look} height={stageHeight}>
        <View style={styles.stageTools}>
          <ToolButton label={strings.creator.random} icon="dice" onPress={randomize} hint="Sorteia apenas peças iniciais gratuitas" />
          <ToolButton label={strings.creator.reset} icon="undo" onPress={askReset} />
        </View>
      </AvatarStage>
      <SyncBadge state={syncState} label={syncLabel} />
    </View>
  );

  const picker = (
    <View style={styles.pickerCol}>
      {isEdit ? <GroupTabs items={stepTabs} value={String(stepIndex)} onChange={(id) => goToStep(Number(id))} /> : null}
      <GroupTabs
        items={step.groups.map((g) => ({ id: g.id, label: groupLabel(g) }))}
        value={group.id}
        onChange={setGroupId}
      />
      <ScrollView style={styles.flex} contentContainerStyle={styles.pickerContent}>
        <AppearanceOptionPicker
          options={options}
          value={selectedId}
          onSelect={onSelect}
          display={group.kind === 'appearance' ? group.display : 'thumb'}
          crop={group.crop}
          label={groupLabel(group)}
        />
        {step.key === 'outfit' ? <AppText variant="caption" muted>{strings.creator.inclusiveNote}</AppText> : null}
        <AppText variant="caption" muted>{strings.creator.placeholderArtNote}</AppText>
      </ScrollView>
    </View>
  );

  const isLast = stepIndex === CREATOR_STEPS.length - 1;
  const footer = isEdit ? (
    <View style={styles.footerRow}>
      <Button title={strings.common.discard} variant="secondary" disabled={!dirty || state.status === 'saving'} onPress={() => setConfirm('discard')} style={styles.flex} />
      <Button title={strings.common.save} disabled={!dirty} loading={state.status === 'saving'} onPress={() => void save()} style={styles.flex} />
    </View>
  ) : (
    <View style={styles.footerRow}>
      <Button title={strings.common.back} variant="secondary" onPress={onBack} style={styles.flex} disabled={state.status === 'saving' || (stepIndex === 0 && !onExit)} />
      <Button
        title={isLast ? strings.creator.finish : strings.common.continue}
        onPress={onPrimary}
        loading={state.status === 'saving'}
        style={styles.flexWide}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top', 'bottom', 'left', 'right']}>
      <View style={[styles.flex, styles.page, wide && styles.pageWide]}>
        <StepHeader
          title={title}
          onBack={onBack}
          right={isEdit ? undefined : fmt(strings.creator.stepOf, { current: stepIndex + 1, total: CREATOR_STEPS.length })}
          progress={isEdit ? undefined : { current: stepIndex + 1, total: CREATOR_STEPS.length }}
        />
        {!isEdit && !short ? <AppText variant="heading">{strings.creator.steps[step.key]}</AppText> : null}
        {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}
        <View style={[styles.flex, wide ? styles.row : styles.col]}>
          {stage}
          {picker}
        </View>
        {footer}
      </View>

      <ConfirmDialog
        visible={confirm === 'reset'}
        title={strings.creator.resetConfirmTitle}
        body={strings.creator.resetConfirmBody}
        confirmLabel={strings.creator.reset}
        onConfirm={doReset}
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
      <GuestDoneDialog visible={guestDone} onClose={() => setGuestDone(false)} />
    </SafeAreaView>
  );
}

function ToolButton({ label, icon, onPress, hint }: { label: string; icon: 'dice' | 'undo'; onPress: () => void; hint?: string }) {
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
      <AppText variant="caption" style={styles.toolLabel}>{label}</AppText>
    </Pressable>
  );
}

function GuestDoneDialog({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  return (
    <ConfirmDialog
      visible={visible}
      title={strings.creator.guestDoneTitle}
      body={strings.creator.guestDoneBody}
      confirmLabel={strings.creator.guestCreateAccount}
      onConfirm={() => {
        onClose();
        router.push({ pathname: '/auth', params: { mode: 'signup' } });
      }}
      onCancel={onClose}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexWide: { flex: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  page: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, gap: spacing.sm, width: '100%', maxWidth: 1100, alignSelf: 'center' },
  pageWide: { paddingHorizontal: spacing.xxl },
  row: { flexDirection: 'row', gap: spacing.xl },
  col: { flexDirection: 'column', gap: spacing.md },
  stageWrap: { gap: spacing.sm },
  stageTools: { position: 'absolute', bottom: spacing.md, left: spacing.md, right: spacing.md, flexDirection: 'row', justifyContent: 'space-between' },
  tool: { minWidth: 48, minHeight: 48, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', gap: 1 },
  toolLabel: { fontSize: 11, lineHeight: 13 },
  pickerCol: { flex: 1, gap: spacing.md, minHeight: 0 },
  pickerContent: { paddingVertical: spacing.sm, gap: spacing.md },
  footerRow: { flexDirection: 'row', gap: spacing.md },
});
