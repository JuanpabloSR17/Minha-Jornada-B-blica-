import { Redirect } from 'expo-router';

/** O Santuário expunha peças Santas; sem peças na interface, as conquistas ficam nos Marcos. */
export default function LegacySanctuary() {
  return <Redirect href="/reading/milestones" />;
}
