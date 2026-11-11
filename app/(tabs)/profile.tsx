import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText, Button, Card, ComingSoon, Icon, Notice, Screen, type IconName } from '@/ui';
import { strings } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { useAuth } from '@/features/auth/AuthProvider';
import { signOut } from '@/features/auth/auth.service';
import { goalLabel } from '@/features/profile/goalLabel';
import { AvatarStage } from '@/features/avatar/components/AvatarStage';
import { useMyAvatar } from '@/features/avatar/hooks/useMyAvatar';
import { setPrivacyMode } from '@/features/avatar/services/wardrobe.service';

const SHORTCUTS: { label: string; icon: IconName; href: '/avatar/wardrobe' | '/avatar/loadouts' | '/avatar/collections' | '/avatar/editor' | '/avatar/sanctuary' }[] = [
  { label: 'Guarda-roupa', icon: 'outfit', href: '/avatar/wardrobe' },
  { label: 'Visuais salvos', icon: 'profile', href: '/avatar/loadouts' },
  { label: 'Coleções', icon: 'sparkle', href: '/avatar/collections' },
  { label: 'Aparência', icon: 'face', href: '/avatar/editor' },
  { label: 'Santuário', icon: 'sparkle', href: '/avatar/sanctuary' },
];

export default function ProfileTab() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile, readingPreferences, refreshProfile } = useAuth();
  const { avatar, error } = useMyAvatar();
  const [privacyError, setPrivacyError] = useState<string | null>(null);
  if (!profile) return null;

  const changePrivacy = async (mode: 'private' | 'public') => {
    setPrivacyError(null);
    try {
      await setPrivacyMode(mode);
      await refreshProfile();
    } catch (e) {
      setPrivacyError(errorMessage(e));
    }
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      {error ? <Notice tone="error">{error}</Notice> : null}
      {avatar ? <AvatarStage look={avatar} height={460} /> : null}
      <View style={styles.identity}>
        <AppText variant="title" style={styles.center}>{profile.display_name}</AppText>
        <AppText muted style={styles.center}>@{profile.username}</AppText>
        <View style={[styles.badge, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
          <Icon name="lock" size={14} color={colors.textMuted} />
          <AppText variant="caption" muted>{strings.profile.privacy[profile.privacy_mode]}</AppText>
        </View>
      </View>
      <View style={styles.grid}>
        {SHORTCUTS.map((s) => (
          <Pressable
            key={s.href}
            accessibilityRole="button"
            accessibilityLabel={s.label}
            onPress={() => router.push(s.href)}
            style={({ pressed }) => [styles.shortcut, { backgroundColor: pressed ? colors.backgroundAlt : colors.surface, borderColor: colors.borderStrong }]}
          >
            <Icon name={s.icon} size={26} color={colors.primary} />
            <AppText variant="label">{s.label}</AppText>
          </Pressable>
        ))}
      </View>
      <Card>
        <AppText variant="label" muted>{strings.profile.readingGoal}</AppText>
        <AppText variant="heading">{goalLabel(readingPreferences)}</AppText>
        <Button compact variant="secondary" title={strings.home.changeGoal} onPress={() => router.push('/settings/pace')} />
      </Card>
      <Card>
        <AppText variant="heading">{strings.social.privacyTitle}</AppText>
        <View style={styles.segment} accessibilityRole="radiogroup">
          {(['private', 'public'] as const).map((m) => {
            const on = profile.privacy_mode === m;
            return (
              <Pressable
                key={m}
                accessibilityRole="radio"
                aria-checked={on}
                accessibilityState={{ checked: on }}
                onPress={() => void changePrivacy(m)}
                style={[styles.segItem, { borderColor: on ? colors.primary : colors.border, backgroundColor: on ? colors.surfaceRaised : 'transparent' }]}
              >
                <AppText variant="label" color={on ? colors.text : colors.textMuted}>{strings.profile.privacy[m]}</AppText>
              </Pressable>
            );
          })}
        </View>
        <AppText variant="caption" muted>{strings.social.privacyFriendsSoon}</AppText>
        <AppText variant="caption" muted>{strings.social.privacyHint}</AppText>
        {privacyError ? <Notice tone="error">{privacyError}</Notice> : null}
        <Button compact variant="ghost" title={strings.social.viewPublic} onPress={() => router.push({ pathname: '/users/[username]', params: { username: profile.username } })} />
      </Card>
      <ComingSoon title={`${strings.profile.achievements} · ${strings.profile.share}`} body="O mural de conquistas e o compartilhamento chegam com a leitura (Marco 3) e o social (Marco 4)." />
      <Button title={strings.profile.signOut} variant="danger" onPress={() => void signOut()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { alignItems: 'center', gap: 4 },
  center: { textAlign: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  shortcut: { flexGrow: 1, flexBasis: '45%', minHeight: 76, borderRadius: radius.lg, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', gap: 4 },
  segment: { flexDirection: 'row', gap: spacing.sm },
  segItem: { flex: 1, minHeight: 44, borderRadius: radius.md, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
