import { useLocalSearchParams } from 'expo-router';
import { ItemDetailScreen } from '@/features/avatar/screens/ItemDetailScreen';

export default function ItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ItemDetailScreen id={String(id)} />;
}
