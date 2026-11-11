import { Redirect } from 'expo-router';
import { onboardingStep, useAuth } from '@/features/auth/AuthProvider';

export default function Index() {
  const { status, profile } = useAuth();
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return onboardingStep(profile) === 'done' ? <Redirect href="/home" /> : <Redirect href="/onboarding" />;
}
