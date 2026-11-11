import { Link } from 'expo-router';
import { AppText, Screen } from '@/ui';

export default function NotFound() {
  return (
    <Screen>
      <AppText variant="title">Página não encontrada</AppText>
      <Link href="/" style={{ marginTop: 12 }}>
        <AppText variant="label">Voltar ao início</AppText>
      </Link>
    </Screen>
  );
}
