import { Redirect } from 'expo-router';
import { onboardingStep, useAuth } from '@/features/auth/AuthProvider';

export default function OnboardingIndex() {
  const { profile } = useAuth();
  const step = onboardingStep(profile);
  if (step === 'identity') return <Redirect href="/onboarding/identity" />;
  if (step === 'avatar') return <Redirect href="/onboarding/avatar" />;
  return <Redirect href="/onboarding/pace" />;
}
