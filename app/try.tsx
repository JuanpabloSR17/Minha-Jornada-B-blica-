import { useRouter } from 'expo-router';
import { CharacterCreatorScreen } from '@/features/avatar/screens/CharacterCreatorScreen';

/** Modo "Experimentar": criador completo, salvo apenas neste aparelho. */
export default function TryCreator() {
  const router = useRouter();
  return <CharacterCreatorScreen mode="guest" onExit={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))} />;
}
