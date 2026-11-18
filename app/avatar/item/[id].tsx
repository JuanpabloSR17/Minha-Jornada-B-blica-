import { Redirect } from 'expo-router';

/** As peças saíram da interface: o visual do viajante agora é a skin, escolhida no Vestiário. */
export default function LegacyItem() {
  return <Redirect href="/vestiario" />;
}
