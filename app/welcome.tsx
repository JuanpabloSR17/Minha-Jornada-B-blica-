import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { AppText, Button, Icon, Notice, Ornament, Screen } from '@/ui';
import { strings } from '@/i18n';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { AvatarStage } from '@/features/avatar/components/AvatarStage';
import { defaultLook } from '@/features/avatar/domain/avatar.rules';
import { draftStorage } from '@/features/avatar/services/draftStorage';
import type { AvatarLook } from '@/features/avatar/domain/avatar.types';

export default function Welcome() {
  const router = useRouter();
  const { colors } = useTheme();
  const [look, setLook] = useState<AvatarLook>(() => ({
    ...defaultLook(),
    equipment: { ...defaultLook().equipment, back: 'cloak-desert', hands: 'staff-shepherd' },
  }));
  const [hasGuest, setHasGuest] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void draftStorage.readGuest().then((g) => {
        setHasGuest(!!g);
        if (g) setLook(g.look);
      });
    }, []),
  );

  return (
    <Screen
      footer={
        <>
          <Button title={strings.welcome.signUp} onPress={() => router.push({ pathname: '/auth', params: { mode: 'signup' } })} disabled={!isSupabaseConfigured} />
          <Button title={strings.welcome.signIn} variant="secondary" onPress={() => router.push({ pathname: '/auth', params: { mode: 'signin' } })} disabled={!isSupabaseConfigured} />
          <Button title={strings.welcome.tryIt} variant="ghost" onPress={() => router.push('/try')} accessibilityHint={strings.welcome.tryHint} />
        </>
      }
    >
      <View style={styles.hero}>
        <AppText variant="caption" muted style={styles.kicker}>RPG DE LEITURA BÍBLICA</AppText>
        <AppText variant="display" style={styles.center}>{strings.app.name}</AppText>
        <Ornament />
      </View>
      <AvatarStage look={look} height={300} />
      <AppText muted style={styles.center}>{strings.app.tagline}</AppText>
      <View style={styles.principles}>
        {strings.welcome.principles.map((p) => (
          <View key={p} style={styles.principle}>
            <Icon name="check" size={18} color={colors.success} />
            <AppText variant="caption">{p}</AppText>
          </View>
        ))}
      </View>
      {hasGuest ? <Notice>{strings.auth.guestDraftNotice}</Notice> : null}
      {!isSupabaseConfigured ? <Notice tone="warning" title={strings.config.missingTitle}>{strings.config.missingBody}</Notice> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  kicker: { letterSpacing: 2 },
  center: { textAlign: 'center' },
  principles: { gap: spacing.sm, alignSelf: 'center' },
  principle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
