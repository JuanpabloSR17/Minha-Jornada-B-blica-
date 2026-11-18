import { Redirect } from 'expo-router';

/** As peças saíram da interface: o visual do viajante agora é a skin, escolhida no Vestiário. */
export default function LegacyItems() {
  return <Redirect href="/vestiario" />;
}
