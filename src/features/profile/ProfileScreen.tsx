import { useCallback, useState } from 'react';
import { SkinThumb } from '@/features/skins/SkinThumb';
import { ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { CinemaTheme } from '@/theme/ThemeProvider';
import { fonts, radius, spacing } from '@/theme/tokens';
import { AppText, ConfirmDialog, Icon, Notice, Screen, type IconName } from '@/ui';
import { fmt, strings } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { useAuth } from '@/features/auth/AuthProvider';
import { signOut } from '@/features/auth/auth.service';
import { goalLabel } from './goalLabel';
import { useMyAvatar } from '@/features/avatar/hooks/useMyAvatar';
import { AvatarStage } from '@/features/avatar/components/AvatarStage';
import { setPrivacyMode } from '@/features/avatar/services/wardrobe.service';
import { useMilestones } from '@/features/reading/useMilestones';
import { milestoneSummary } from '@/features/reading/milestones';
import { getWorldProgress, type WorldProgress } from '@/features/reading/mission/mission.service';
import { BOOKS, refLabel } from '@/features/reading/refs';
import { nextBookObjective, readingLevel } from '@/features/journey/progression';
import { WORLDS } from '@/features/journey/worlds';
import { worldIcons } from '@/features/journey/worldIcons';
import { WORLD_THEMES, type WorldId } from '@/features/worlds/worldThemes';
import { SKINS, SKIN_RARITY_COLOR, SKIN_RARITY_LABEL, getSkin, skinDisplayName } from '@/features/skins/catalog';
import { getMySkins } from '@/features/skins/skins.service';

const p = strings.profile;
const GOLD = '#E9BA5B';
const INK = '#F6ECD6';
const MUTED = '#C9BBA0';
const camp = require('../../../assets/journey/camp-night.webp');

/** Botão de ação do perfil: ícone grande em medalhão + rótulo curto. */
function ActionTile({ icon, label, hint, onPress, testID }: { icon: IconName; label: string; hint?: string; onPress: () => void; testID?: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={hint ? `${label}. ${hint}` : label} testID={testID}
      style={({ pressed }) => [styles.tile, pressed && { backgroundColor: '#2A2140' }]}>
      <View style={styles.tileIcon}><Icon name={icon} color={GOLD} size={26} /></View>
      <AppText style={styles.tileLabel} color={INK} numberOfLines={1}>{label}</AppText>
      {hint ? <AppText style={styles.tileHint} color={MUTED} numberOfLines={1}>{hint}</AppText> : null}
    </Pressable>
  );
}

function Stat({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}`}>
      <Icon name={icon} color={GOLD} size={18} />
      <AppText style={styles.statValue} color={INK}>{value}</AppText>
      <AppText style={styles.statLabel} color={MUTED} numberOfLines={1}>{label}</AppText>
    </View>
  );
}

function SectionHead({ icon, title, action, onAction }: { icon: IconName; title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHead}>
      <Icon name={icon} color={GOLD} size={20} />
      <AppText accessibilityRole="header" style={styles.section} color={INK}>{title}</AppText>
      {action && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" hitSlop={8} style={styles.sectionAction}>
          <AppText variant="label" color={GOLD}>{action}</AppText>
          <Icon name="forward" color={GOLD} size={16} />
        </Pressable>
      ) : null}
    </View>
  );
}

function SettingRow({ icon, label, value, onPress, danger }: { icon: IconName; label: string; value?: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={value ? `${label}: ${value}` : label}
      style={({ pressed }) => [styles.setting, pressed && { backgroundColor: '#2A2140' }]}>
      <Icon name={icon} color={danger ? '#F2907E' : GOLD} size={20} />
      <View style={styles.flex}>
        <AppText variant="label" color={danger ? '#F2907E' : INK}>{label}</AppText>
        {value ? <AppText variant="caption" color={MUTED}>{value}</AppText> : null}
      </View>
      {!danger ? <Icon name="forward" color={MUTED} size={16} /> : null}
    </Pressable>
  );
}

/**
 * Perfil como ficha do herói: o viajante vestido com a skin, nível e título, os números da jornada,
 * medalhas dos mundos (cada uma abre o mundo), a coleção de skins e os ajustes da conta.
 */
export function ProfileScreen() {
  return <CinemaTheme><Profile /></CinemaTheme>;
}

function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, readingPreferences, refreshProfile } = useAuth();
  const { avatar, selection, error } = useMyAvatar();
  const { rows, overview, error: msError } = useMilestones();
  const [worlds, setWorlds] = useState<WorldProgress[] | null>(null);
  const [owned, setOwned] = useState<string[] | null>(null);
  const [privacyError, setPrivacyError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  useFocusEffect(useCallback(() => {
    getWorldProgress().then(setWorlds, () => setWorlds(null));
    getMySkins().then((s) => setOwned(s.owned.map((o) => o.skinId)), () => setOwned(null));
  }, []));

  if (!profile) return null;
  const lv = readingLevel(overview?.xpTotal ?? 0);
  const sum = rows ? milestoneSummary(rows) : null;
  const medals = new Set(worlds?.filter((x) => x.completedAt).map((x) => x.id));
  const objective = overview ? nextBookObjective(overview.chaptersByBook) : null;
  const skin = getSkin(selection?.skinId);
  const ownedSkins = (owned ?? []).map(getSkin).filter((s): s is NonNullable<typeof s> => !!s);
  const isPublic = profile.privacy_mode === 'public';

  const togglePrivacy = async () => {
    setPrivacyError(null);
    try {
      await setPrivacyMode(isPublic ? 'private' : 'public');
      await refreshProfile();
    } catch (e) {
      setPrivacyError(errorMessage(e));
    }
  };

  return (
    <Screen edges={['left', 'right']} contentStyle={styles.content}>
      {/* ficha do herói */}
      <ImageBackground source={camp} resizeMode="cover" style={[styles.hero, { paddingTop: insets.top + 8 }]} testID="profile-hero">
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 10 10">
          <Defs>
            <LinearGradient id="pfShade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#0C0A16" stopOpacity={0.35} />
              <Stop offset="0.65" stopColor="#0C0A16" stopOpacity={0.55} />
              <Stop offset="1" stopColor="#0C0A16" stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect width={10} height={10} fill="url(#pfShade)" />
        </Svg>
        <View style={styles.heroRow}>
          <View style={styles.heroAvatar} testID="profile-avatar">{avatar ? <AvatarStage look={avatar} height={250} /> : null}</View>
          <View style={styles.heroInfo}>
            <View style={styles.levelRow}>
              <View style={styles.levelBadge}><AppText style={styles.levelNum} color="#120E1C">{lv.level}</AppText></View>
              <View style={styles.flex}>
                <AppText variant="caption" color={GOLD}>{fmt(strings.lobby.level, { n: lv.level })}</AppText>
                <AppText style={styles.rank} color={INK} numberOfLines={1}>{lv.title}</AppText>
              </View>
            </View>
            <AppText accessibilityRole="header" style={styles.name} color={INK} numberOfLines={2}>{profile.display_name}</AppText>
            <AppText variant="caption" color={MUTED}>@{profile.username}</AppText>
            <View style={styles.xpBar} accessible accessibilityRole="progressbar"
              accessibilityLabel={fmt(p.xpLabel, { into: lv.currentXp, span: lv.xpForLevel, next: lv.level + 1 })}
              accessibilityValue={{ min: 0, max: lv.xpForLevel, now: lv.currentXp }}>
              <View style={[styles.xpFill, { width: `${lv.percent}%` }]} />
            </View>
            <AppText variant="caption" color={MUTED}>{fmt(p.xpToNext, { n: lv.remainingXp })}</AppText>
            {skin ? (
              <View style={[styles.skinChip, { borderColor: SKIN_RARITY_COLOR[skin.rarity] }]}>
                <Icon name="outfit" color={SKIN_RARITY_COLOR[skin.rarity]} size={14} />
                <AppText style={styles.skinChipText} color={INK} numberOfLines={1}>{skinDisplayName(skin, selection?.variant)}</AppText>
              </View>
            ) : null}
          </View>
        </View>
      </ImageBackground>

      <View style={styles.body} testID="profile-achievements">
        {error ? <Notice tone="error">{error}</Notice> : null}
        {msError ? <Notice tone="error">{msError}</Notice> : null}

        <View style={styles.actions}>
          <ActionTile icon="outfit" label={p.actVestiario} hint={fmt(p.actVestiarioHint, { n: ownedSkins.length, total: SKINS.length })} onPress={() => router.push('/vestiario')} testID="profile-act-vestiario" />
          <ActionTile icon="shop" label={p.actShop} hint={overview ? fmt(strings.lobby.siclos, { n: overview.siclosBalance }) : undefined} onPress={() => router.push('/market')} />
          <ActionTile icon="map" label={p.actMap} hint={fmt(p.actMapHint, { n: medals.size, total: WORLDS.length })} onPress={() => router.navigate('/journey')} />
          <ActionTile icon="flag" label={p.actMarcos} hint={sum ? fmt(p.actMarcosHint, { n: sum.milestonesDone, total: sum.milestonesTotal }) : undefined} onPress={() => router.push('/reading/milestones')} />
        </View>

        {overview ? (
          <View style={styles.stats}>
            <Stat icon="scroll" value={String(overview.chaptersCompleted)} label={p.chaptersRead} />
            <Stat icon="book" value={`${overview.booksCompleted}/${BOOKS.length}`} label={p.booksRead} />
            <Stat icon="sparkle" value={String(overview.xpTotal)} label="XP" />
            <Stat icon="medal" value={`${medals.size}/${WORLDS.length}`} label={p.achWorlds} />
          </View>
        ) : null}

        {objective ? (
          <Pressable testID="profile-next-objective" accessibilityRole="button"
            accessibilityLabel={`${p.nextTitle}: ${fmt(strings.lobby.objectiveBook, { book: objective.bookName })}. ${refLabel(objective.book, objective.chapter)}`}
            onPress={() => router.navigate({ pathname: '/read', params: { book: objective.book, chapter: String(objective.chapter), selection: String(Date.now()) } })}
            style={styles.objective}>
            <View style={styles.objIcon}><Icon name="medal" color={GOLD} size={26} /></View>
            <View style={styles.flex}>
              <AppText variant="caption" color={GOLD}>{p.nextTitle}</AppText>
              <AppText style={styles.objName} color={INK}>{fmt(strings.lobby.objectiveBook, { book: objective.bookName })}</AppText>
              <View style={styles.objBar}><View style={[styles.objFill, { width: `${(objective.chaptersRead / objective.chaptersTotal) * 100}%` }]} /></View>
              <AppText variant="caption" color={MUTED}>
                {objective.remaining === 1 ? strings.lobby.objectiveOne : fmt(strings.lobby.objectiveMany, { n: objective.remaining })} · {fmt(p.readRef, { ref: refLabel(objective.book, objective.chapter) })}
              </AppText>
            </View>
            <Icon name="play" color={GOLD} size={22} />
          </Pressable>
        ) : null}

        <SectionHead icon="medal" title={p.worldsMedals} action={p.openMap} onAction={() => router.navigate('/journey')} />
        <View style={styles.medals}>
          {WORLDS.map((wd) => {
            const id = wd.id as WorldId;
            const has = medals.has(id);
            const theme = WORLD_THEMES[id];
            return (
              <Pressable key={id} testID={has ? `profile-medal-${id}` : `profile-world-${id}`} accessibilityRole="button"
                accessibilityLabel={`${wd.name}, ${has ? p.medalOwned : p.medalLocked}. ${strings.world.enter}`}
                onPress={() => router.push({ pathname: '/world/[id]', params: { id } })} style={styles.medal}>
                <View style={[styles.medalDisc, { borderColor: has ? theme.accent : 'rgba(255,255,255,0.18)', backgroundColor: has ? theme.panel : '#151125' }]}>
                  <Icon name={worldIcons[id]} color={has ? theme.accent : '#6F6688'} size={24} />
                  {has ? <View style={[styles.medalCheck, { backgroundColor: theme.accent }]}><Icon name="check" color="#120E1C" size={10} /></View> : null}
                </View>
                <AppText style={styles.medalName} color={has ? INK : MUTED} numberOfLines={2}>{wd.name}</AppText>
              </Pressable>
            );
          })}
        </View>

        <SectionHead icon="outfit" title={p.skinsTitle} action={p.openVestiario} onAction={() => router.push('/vestiario')} />
        <View style={styles.skinRow}>
          {ownedSkins.slice(0, 6).map((s) => (
            <Pressable key={s.id} onPress={() => router.push('/vestiario')} accessibilityRole="button"
              accessibilityLabel={`${s.name}, ${SKIN_RARITY_LABEL[s.rarity]}`}
              style={[styles.skin, { borderColor: SKIN_RARITY_COLOR[s.rarity] }, selection?.skinId === s.id && styles.skinWorn]}>
              <SkinThumb skin={s} size={64} {...(selection?.skinId === s.id ? { variant: selection.variant, style: selection.style } : {})} />
            </Pressable>
          ))}
          <Pressable onPress={() => router.push('/market')} accessibilityRole="button" accessibilityLabel={p.moreSkins} style={[styles.skin, styles.moreSkin]}>
            <Icon name="shop" color={GOLD} size={22} />
          </Pressable>
        </View>

        <SectionHead icon="flag" title={p.recentMarcos} action={p.openMilestones} onAction={() => router.push('/reading/milestones')} />
        {rows?.filter((r) => r.completed).slice(0, 3).map((r) => (
          <Pressable key={r.id} accessibilityRole="link" onPress={() => router.push({ pathname: '/reading/milestone/[id]', params: { id: r.id } })} style={styles.setting}>
            <Icon name="check" color={GOLD} size={18} />
            <View style={styles.flex}>
              <AppText variant="label" color={INK}>{r.name}</AppText>
              <AppText variant="caption" color={MUTED}>{refLabel(r.book, r.chapter)}</AppText>
            </View>
          </Pressable>
        ))}
        {rows && !rows.some((r) => r.completed) ? <AppText variant="caption" color={MUTED}>{p.noMarcos}</AppText> : null}

        <SectionHead icon="device" title={p.settings} />
        <View style={styles.settings}>
          <SettingRow icon="flag" label={p.readingGoal} value={goalLabel(readingPreferences)} onPress={() => router.push('/settings/pace')} />
          <SettingRow icon="lock" label={p.privacyRow} value={strings.profile.privacy[profile.privacy_mode]} onPress={() => void togglePrivacy()} />
          <SettingRow icon="profile" label={strings.social.viewPublic} onPress={() => router.push({ pathname: '/users/[username]', params: { username: profile.username } })} />
          <SettingRow icon="back" label={p.signOut} onPress={() => setLeaving(true)} danger />
        </View>
        <AppText variant="caption" color="#8F84A8">{isPublic ? p.privacyPublicHint : p.privacyPrivateHint}</AppText>
        {privacyError ? <Notice tone="error">{privacyError}</Notice> : null}
      </View>
      <ConfirmDialog visible={leaving} title={p.signOutTitle} body={p.signOutBody} confirmLabel={p.signOut}
        destructive onConfirm={() => { setLeaving(false); void signOut(); }} onCancel={() => setLeaving(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 0, gap: 0 },
  hero: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  heroRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  heroAvatar: { width: '42%', height: 250 },
  heroInfo: { flex: 1, minWidth: 0, gap: 3, paddingBottom: spacing.sm },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  levelBadge: { width: 38, height: 38, borderRadius: 10, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '45deg' }] },
  levelNum: { fontFamily: fonts.display, fontSize: 17, lineHeight: 22, transform: [{ rotate: '-45deg' }] },
  rank: { fontFamily: fonts.display, fontSize: 15, lineHeight: 20 },
  name: { fontFamily: fonts.display, fontSize: 26, lineHeight: 32, marginTop: 6 },
  xpBar: { height: 9, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden', marginTop: 6, borderWidth: 1, borderColor: 'rgba(233,186,91,0.4)' },
  xpFill: { height: '100%', backgroundColor: '#B48CFF' },
  skinChip: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6, backgroundColor: 'rgba(12,10,22,0.75)', maxWidth: '100%' },
  skinChipText: { fontFamily: fonts.bodyBold, fontSize: 12.5, lineHeight: 16, flexShrink: 1 },
  body: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: { flexGrow: 1, flexBasis: '45%', minHeight: 92, borderRadius: radius.lg, borderWidth: 1.5, borderColor: 'rgba(233,186,91,0.45)', backgroundColor: '#1B1631', padding: spacing.sm, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tileIcon: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: 'rgba(233,186,91,0.5)', backgroundColor: '#120E1C', alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 20 },
  tileHint: { fontSize: 12.5, lineHeight: 16 },
  stats: { flexDirection: 'row', gap: 6 },
  stat: { flex: 1, minWidth: 0, alignItems: 'center', gap: 1, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: '#151125', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  statValue: { fontFamily: fonts.display, fontSize: 17, lineHeight: 22, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 11.5, lineHeight: 14 },
  objective: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1.5, borderColor: GOLD, backgroundColor: '#1B1631' },
  objIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#120E1C', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(233,186,91,0.5)' },
  objName: { fontFamily: fonts.display, fontSize: 18, lineHeight: 24 },
  objBar: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden', marginVertical: 4 },
  objFill: { height: '100%', backgroundColor: GOLD },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  section: { flex: 1, fontFamily: fonts.display, fontSize: 18, lineHeight: 24 },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 36 },
  medals: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'space-between' },
  medal: { width: '23%', alignItems: 'center', gap: 4, minHeight: 92 },
  medalDisc: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  medalCheck: { position: 'absolute', right: -2, bottom: -2, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  medalName: { fontSize: 11.5, lineHeight: 14, textAlign: 'center' },
  skinRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skin: { width: 66, height: 66, borderRadius: 12, borderWidth: 2, overflow: 'hidden', alignItems: 'center', backgroundColor: '#120E1C' },
  skinWorn: { borderWidth: 3 },
  moreSkin: { borderColor: 'rgba(233,186,91,0.5)', borderStyle: 'dashed', justifyContent: 'center' },
  settings: { borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#151125' },
  setting: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 56, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  flex: { flex: 1, minWidth: 0 },
});
