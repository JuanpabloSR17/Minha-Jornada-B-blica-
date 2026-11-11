import { useRouter } from 'expo-router';
import { CharacterCreatorScreen } from '@/features/avatar/screens/CharacterCreatorScreen';

export default function AvatarStep() {
  const router = useRouter();
  return (
    <CharacterCreatorScreen
      mode="onboarding"
      onFinished={() => router.replace('/onboarding/pace')}
      onExit={() => router.replace('/onboarding/identity')}
    />
  );
}
