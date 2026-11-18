import { useRouter } from 'expo-router';
import { SkinPickerScreen } from '@/features/skins/SkinPickerScreen';

export default function AvatarStep() {
  const router = useRouter();
  return (
    <SkinPickerScreen
      mode="onboarding"
      onFinished={() => router.replace('/onboarding/pace')}
      onExit={() => router.replace('/onboarding/identity')}
    />
  );
}
