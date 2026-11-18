import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Svg, { Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { CinemaTheme } from '@/theme/ThemeProvider';
import { fonts, radius, spacing } from '@/theme/tokens';
import { AppText, Button, Icon, Notice, Screen } from '@/ui';
import { fmt, strings } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { StepHeader } from '@/features/avatar/components/StepHeader';
import { AvatarStage } from '@/features/avatar/components/AvatarStage';
import { FirelightPortrait } from '@/features/avatar/styles/cinematic';
import { wearFrom } from '@/features/avatar/styles/archetypes';
import { getMyAvatar } from '@/features/avatar/services/avatar.service';
import type { AvatarState } from '@/features/avatar/domain/avatar.types';
import {
  RARITY_ORDER, SKINS, SKIN_RARITY_COLOR, SKIN_RARITY_LABEL, getSkin, howToGet, skinLook, skinToneColor, styleLook,
  type Skin, type SkinSelection,
} from './catalog';
import { equipSkin, getMySkins } from './skins.service';

const v = strings.vestiario;
type Filter = 'mine' | 'all';

/** Palco do vestiário: arco de pedra com luz do alto, na cor da raridade. */
function StageBackdrop({ color }: { color: string }) {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 100 140" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="vsBg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1B1631" />
          <Stop offset="1" stopColor="#0C0A16" />
        </LinearGradient>
        <RadialGradient id="vsLight" cx="50" cy="40" r="48" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={color} stopOpacity={0.42} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={100} height={140} fill="url(#vsBg)" />
      <Rect width={100} height={140} fill="url(#vsLight)" />
      <Path d="M8 140 V46 A42 42 0 0 1 92 46 V140" fill="none" stroke={color} strokeOpacity={0.35} strokeWidth={0.8} />
      <Path d="M0 124 Q50 116 100 124 V140 H0 Z" fill="#000" fillOpacity={0.35} />
    </Svg>
  );
}

function StyleSwatches({ skin, value, onChange }: { skin: Skin; value: number; onChange: (n: number) => void }) {
  return (
    <View style={styles.swatches} accessibilityRole="radiogroup" accessibilityLabel={v.styles}>
      {skin.styles.map((st, i) => {
        const on = value === i + 1;
        return (
          <Pressable key={i} onPress={() => onChange(i + 1)} accessibilityRole="radio" aria-checked={on}
            accessibilityState={{ checked: on }} accessibilityLabel={fmt(v.styleLabel, { n: i + 1, skin: skin.name })}
            style={[styles.swatch, on && styles.swatchOn]}>
            <View style={[styles.swatchDot, { backgroundColor: skinToneColor(st) }]} />
            <AppText style={styles.swatchText} color={on ? '#FFE7A3' : '#C9BBA0'}>{fmt(v.styleShort, { n: i + 1 })}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function SkinTile({ skin, owned, worn, active, onPress }: { skin: Skin; owned: boolean; worn: boolean; active: boolean; onPress: () => void }) {
  const color = SKIN_RARITY_COLOR[skin.rarity];
  return (
    <Pressable onPress={onPress} accessibilityRole="button" testID={`vestiario-${skin.id}`}
      accessibilityLabel={`${skin.name}, ${SKIN_RARITY_LABEL[skin.rarity]}${worn ? `, ${v.worn}` : owned ? '' : `, ${v.locked}`}`}
      accessibilityState={{ selected: active }}
      style={[styles.tile, { borderColor: active ? '#FFE7A3' : color + (owned ? 'CC' : '55') }]}>
      <View style={[styles.tileArt, !owned && styles.dim]}>
        <FirelightPortrait look={styleLook(skin.styles[0]!)} wear={wearFrom(skin.preview)} width={96} />
      </View>
      <View style={[styles.tileGem, { backgroundColor: color }]} />
      {!owned ? <View style={styles.lock}><Icon name="lock" color="#F6ECD6" size={16} /></View> : null}
      {worn ? <View style={styles.wornTag}><Icon name="check" color="#120E1C" size={12} /></View> : null}
      <AppText style={styles.tileName} color="#F6ECD6" numberOfLines={2}>{skin.name}</AppText>
    </Pressable>
  );
}

/**
 * Vestiário: o viajante veste uma skin inteira (traje, pele e cabelo de um dos 3 estilos).
 * As obtidas se vestem na hora; as bloqueadas mostram como conseguir. O servidor confere a posse.
 */
export function VestiarioScreen() {
  return <CinemaTheme><VestiarioContent /></CinemaTheme>;
}

function VestiarioContent() {
  const router = useRouter();
  const [base, setBase] = useState<AvatarState | null>(null);
  const [owned, setOwned] = useState<Set<string> | null>(null);
  const [worn, setWorn] = useState<SkinSelection | null>(null);
  const [focus, setFocus] = useState<SkinSelection | null>(null);
  const [filter, setFilter] = useState<Filter>('mine');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const [avatar, skins] = await Promise.all([getMyAvatar(), getMySkins()]);
      setBase(avatar);
      setOwned(new Set(skins.owned.map((o) => o.skinId)));
      setWorn(skins.selected);
      setFocus((f) => f ?? skins.selected);
    } catch (e) {
      setMsg({ tone: 'error', text: errorMessage(e) });
    }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const skin = getSkin(focus?.skinId) ?? getSkin(worn?.skinId);
  const style = focus?.style ?? 1;
  const isOwned = !!skin && !!owned?.has(skin.id);
  const isWorn = !!skin && worn?.skinId === skin.id && worn.style === style;
  const color = skin ? SKIN_RARITY_COLOR[skin.rarity] : '#E9BA5B';
  const look = useMemo(() => skinLook(base, skin ? { skinId: skin.id, style } : worn), [base, skin, style, worn]);
  const list = SKINS.filter((s) => filter === 'all' || owned?.has(s.id));
  const groups = RARITY_ORDER.map((r) => ({ r, items: list.filter((s) => s.rarity === r) })).filter((g) => g.items.length);
  const total = SKINS.length;

  const wear = async () => {
    if (!skin || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const sel = await equipSkin(skin.id, style);
      setWorn(sel);
      setMsg({ tone: 'success', text: fmt(v.wearing, { skin: skin.name, n: style }) });
    } catch (e) {
      setMsg({ tone: 'error', text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <StepHeader title={v.title} onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))} />
      <View style={styles.stage} testID="vestiario-stage">
        <StageBackdrop color={color} />
        <AvatarStage look={look} height={300} />
        {skin ? (
          <View style={[styles.rarity, { borderColor: color }]}>
            <View style={[styles.rarityGem, { backgroundColor: color }]} />
            <AppText style={styles.rarityText} color={color}>{SKIN_RARITY_LABEL[skin.rarity]}</AppText>
          </View>
        ) : null}
      </View>

      {skin ? (
        <View style={styles.info}>
          <AppText style={styles.name} color="#F6ECD6" testID="vestiario-name">{skin.name}</AppText>
          <AppText variant="caption" color="#C9BBA0">{skin.scriptureRef}</AppText>
          <StyleSwatches skin={skin} value={style} onChange={(n) => setFocus({ skinId: skin.id, style: n })} />
          {isOwned ? (
            <Button variant="gold" icon="check" title={isWorn ? v.isWorn : fmt(v.wear, { n: style })} disabled={isWorn} loading={busy} onPress={wear} />
          ) : (
            <View style={styles.lockedBox} testID="vestiario-locked">
              <Icon name="lock" color={color} size={20} />
              <View style={{ flex: 1 }}>
                <AppText variant="label" color="#F6ECD6">{v.lockedTitle}</AppText>
                <AppText variant="caption" color="#C9BBA0">{howToGet(skin)}</AppText>
              </View>
              {skin.inShop ? <Button compact variant="secondary" icon="shop" title={v.toShop} onPress={() => router.push('/market')} /> : null}
            </View>
          )}
          {msg ? <Notice tone={msg.tone}>{msg.text}</Notice> : null}
        </View>
      ) : null}

      <View style={styles.filters} accessibilityRole="tablist">
        {(['mine', 'all'] as Filter[]).map((f) => (
          <Pressable key={f} accessibilityRole="tab" accessibilityState={{ selected: filter === f }} aria-selected={filter === f}
            onPress={() => setFilter(f)} style={[styles.chip, filter === f && styles.chipOn]}>
            <AppText style={styles.chipText} color={filter === f ? '#120E1C' : '#F6ECD6'}>
              {f === 'mine' ? fmt(v.mine, { n: owned?.size ?? 0 }) : fmt(v.all, { n: total })}
            </AppText>
          </Pressable>
        ))}
      </View>

      {groups.map((g) => (
        <View key={g.r} style={styles.group}>
          <View style={styles.groupHead}>
            <View style={[styles.rarityGem, { backgroundColor: SKIN_RARITY_COLOR[g.r] }]} />
            <AppText style={styles.groupTitle} color={SKIN_RARITY_COLOR[g.r]}>{SKIN_RARITY_LABEL[g.r]}</AppText>
            <AppText variant="caption" color="#8F84A8">{g.items.length}</AppText>
          </View>
          <View style={styles.grid}>
            {g.items.map((s) => (
              <SkinTile key={s.id} skin={s} owned={!!owned?.has(s.id)} worn={worn?.skinId === s.id}
                active={skin?.id === s.id}
                onPress={() => setFocus({ skinId: s.id, style: worn?.skinId === s.id ? worn.style : 1 })} />
            ))}
          </View>
        </View>
      ))}
      <AppText variant="caption" color="#8F84A8" style={styles.note}>{v.note}</AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: { height: 320, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(233,186,91,0.35)', justifyContent: 'flex-end' },
  rarity: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, borderWidth: 1, backgroundColor: 'rgba(12,10,22,0.8)' },
  rarityGem: { width: 9, height: 9, borderRadius: 2, transform: [{ rotate: '45deg' }] },
  rarityText: { fontFamily: fonts.display, fontSize: 13, lineHeight: 17 },
  info: { gap: spacing.sm, marginTop: spacing.md },
  name: { fontFamily: fonts.display, fontSize: 24, lineHeight: 30 },
  swatches: { flexDirection: 'row', gap: spacing.sm },
  swatch: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(246,236,214,0.25)', backgroundColor: '#1B1631' },
  swatchOn: { borderColor: '#E9BA5B', backgroundColor: '#2A2140' },
  swatchDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)' },
  swatchText: { fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 18 },
  lockedBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(246,236,214,0.2)', backgroundColor: '#1B1631' },
  filters: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  chip: { paddingHorizontal: 14, minHeight: 38, justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(233,186,91,0.5)' },
  chipOn: { backgroundColor: '#E9BA5B' },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 18 },
  group: { marginTop: spacing.lg, gap: spacing.sm },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  groupTitle: { fontFamily: fonts.display, fontSize: 16, lineHeight: 20, flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: 100, borderRadius: 12, borderWidth: 2, overflow: 'hidden', backgroundColor: '#120E1C', paddingBottom: 6 },
  tileArt: { height: 96, overflow: 'hidden', alignItems: 'center' },
  dim: { opacity: 0.4 },
  tileGem: { position: 'absolute', top: 6, left: 6, width: 8, height: 8, borderRadius: 2, transform: [{ rotate: '45deg' }] },
  lock: { position: 'absolute', top: 36, alignSelf: 'center', width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(12,10,22,0.85)', alignItems: 'center', justifyContent: 'center' },
  wornTag: { position: 'absolute', top: 5, right: 5, width: 20, height: 20, borderRadius: 10, backgroundColor: '#E9BA5B', alignItems: 'center', justifyContent: 'center' },
  tileName: { fontFamily: fonts.bodyBold, fontSize: 12.5, lineHeight: 16, paddingHorizontal: 6, marginTop: 4, textAlign: 'center' },
  note: { marginTop: spacing.lg, marginBottom: spacing.xl },
});
