import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText, Button, Card, ConfirmDialog, Icon, Notice, PromptDialog, Screen } from '@/ui';
import { fmt, strings } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { StepHeader } from '../components/StepHeader';
import { AvatarCard } from '../components/AvatarSizes';
import {
  activateLoadout,
  createLoadout,
  deleteLoadout,
  getWardrobe,
  renameLoadout,
  type LoadoutInfo,
  type WardrobeState,
} from '../services/wardrobe.service';

/** Visuais salvos (P06): criar, renomear, usar, editar e excluir — limites validados no servidor. */
export function LoadoutsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [w, setW] = useState<WardrobeState | null>(null);
  const [notice, setNotice] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<LoadoutInfo | null>(null);
  const [deleting, setDeleting] = useState<LoadoutInfo | null>(null);

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

  const act = async (fn: () => Promise<WardrobeState>) => {
    setBusy(true);
    setNotice(null);
    try {
      setW(await fn());
    } catch (e) {
      setNotice({ tone: 'error', text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  if (!w) {
    return (
      <Screen>
        <StepHeader title={strings.loadouts.title} onBack={() => router.back()} />
        {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : <ActivityIndicator color={colors.primary} />}
      </Screen>
    );
  }

  const count = w.loadouts.length;
  const atLimit = count >= w.plan.loadoutLimit;

  return (
    <Screen>
      <StepHeader title={strings.loadouts.title} onBack={() => router.back()} />
      <Card style={{ backgroundColor: colors.surfaceRaised }}>
        <AppText variant="label">
          {fmt(w.plan.tier === 'premium' ? strings.loadouts.planPremium : strings.loadouts.planFree, { count, limit: w.plan.loadoutLimit })}
        </AppText>
        {w.plan.tier === 'free' ? <AppText variant="caption" muted>{strings.loadouts.premiumNote}</AppText> : null}
        <Button title={strings.loadouts.new} onPress={() => setCreating(true)} disabled={atLimit || busy} accessibilityHint={atLimit ? strings.loadouts.limitReached : undefined} />
        {atLimit ? <AppText variant="caption" muted>{strings.loadouts.limitReached}</AppText> : null}
      </Card>
      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}
      <View style={styles.list}>
        {w.loadouts.map((l) => (
          <View key={l.id} style={[styles.item, { borderColor: l.isActive ? colors.primary : colors.border, backgroundColor: colors.surface }]}>
            <AvatarCard look={{ appearance: w.appearance, equipment: l.equipment }} height={180} width={124} />
            <View style={styles.info}>
              <AppText variant="heading" numberOfLines={1}>{l.name}</AppText>
              <View style={styles.badges}>
                {l.isActive ? <Badge text={strings.loadouts.active} color={colors.success} /> : null}
                {l.locked ? <Badge text={strings.loadouts.locked} color={colors.warning} icon /> : null}
              </View>
              {l.locked ? <AppText variant="caption" muted>{strings.errors.loadout_locked}</AppText> : null}
              <View style={styles.actions}>
                {!l.isActive && !l.locked ? <Button compact title={strings.loadouts.use} onPress={() => void act(() => activateLoadout(l.id))} disabled={busy} /> : null}
                {!l.locked ? <Button compact variant="secondary" title={strings.loadouts.edit} onPress={() => router.push({ pathname: '/avatar/wardrobe', params: { loadout: l.id } })} /> : null}
                {!l.locked ? <Button compact variant="ghost" title={strings.loadouts.rename} onPress={() => setRenaming(l)} disabled={busy} /> : null}
                {count > 1 ? <Button compact variant="danger" title={strings.loadouts.delete} onPress={() => setDeleting(l)} disabled={busy} /> : null}
              </View>
            </View>
          </View>
        ))}
      </View>
      <PromptDialog
        visible={creating}
        title={strings.loadouts.new}
        label={strings.loadouts.newName}
        initial={fmt(strings.loadouts.defaultName, { n: count + 1 })}
        onCancel={() => setCreating(false)}
        onConfirm={(name) => {
          setCreating(false);
          void act(() => createLoadout(name));
        }}
      />
      <PromptDialog
        visible={!!renaming}
        title={strings.loadouts.rename}
        label={strings.loadouts.newName}
        initial={renaming?.name ?? ''}
        onCancel={() => setRenaming(null)}
        onConfirm={(name) => {
          const id = renaming!.id;
          setRenaming(null);
          void act(() => renameLoadout(id, name));
        }}
      />
      <ConfirmDialog
        visible={!!deleting}
        title={strings.loadouts.deleteTitle}
        body={fmt(strings.loadouts.deleteBody, { name: deleting?.name ?? '' })}
        confirmLabel={strings.loadouts.delete}
        destructive
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          const id = deleting!.id;
          setDeleting(null);
          void act(() => deleteLoadout(id));
        }}
      />
    </Screen>
  );
}

function Badge({ text, color, icon }: { text: string; color: string; icon?: boolean }) {
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      {icon ? <Icon name="lock" size={12} color={color} /> : null}
      <AppText variant="caption" color={color}>{text}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  item: { flexDirection: 'row', gap: spacing.md, borderWidth: 1.5, borderRadius: radius.lg, padding: spacing.sm },
  info: { flex: 1, gap: spacing.sm },
  badges: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 'auto' },
});
