import { useLocalSearchParams } from 'expo-router';
import { WorldScreen } from '@/features/worlds/WorldScreen';

export default function World() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <WorldScreen id={String(id ?? '')} />;
}
