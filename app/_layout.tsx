import { Cinzel_600SemiBold, Cinzel_700Bold, useFonts } from '@expo-google-fonts/cinzel';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, onboardingStep, useAuth } from '@/features/auth/AuthProvider';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { AppText, Button, Notice } from '@/ui';
import { errorMessage } from '@/lib/errors';
import { strings } from '@/i18n';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Cinzel_600SemiBold, Cinzel_700Bold });
  const ready = fontsLoaded || !!fontError;
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);
  if (!ready) return null;
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { colors, dark } = useTheme();
  const { status, profile, profileLoaded, profileError, refreshProfile, passwordRecovery } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (passwordRecovery) router.replace('/auth/update-password');
  }, [passwordRecovery, router]);

  const signedIn = status === 'signedIn';
  const waitingProfile = signedIn && !profileLoaded;

  if (status === 'loading' || waitingProfile) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, gap: 12 }}>
        <ActivityIndicator color={colors.primary} size="large" />
        <AppText muted>{strings.common.loading}</AppText>
      </View>
    );
  }

  // Falha ao carregar o perfil (ex.: sem rede): não mandar usuário existente de volta ao onboarding.
  if (signedIn && profileError && !profile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 16, backgroundColor: colors.background }}>
        <Notice tone="error">{errorMessage(profileError)}</Notice>
        <Button title={strings.common.retry} onPress={() => void refreshProfile()} />
      </View>
    );
  }

  const onboarded = signedIn && onboardingStep(profile) === 'done';

  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="welcome" />
          <Stack.Screen name="auth/index" />
          <Stack.Screen name="try" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !onboarded}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={onboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="avatar/editor" />
          <Stack.Screen name="settings/pace" />
        </Stack.Protected>
        <Stack.Screen name="auth/callback" />
        <Stack.Screen name="auth/update-password" />
        <Stack.Screen name="index" />
      </Stack>
    </>
  );
}
