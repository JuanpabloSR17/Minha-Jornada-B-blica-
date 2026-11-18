import { useRouter } from 'expo-router';
import { SkinPickerScreen } from '@/features/skins/SkinPickerScreen';

export default function Try() {
  const router = useRouter();
  return <SkinPickerScreen mode="guest" onExit={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))} />;
}
