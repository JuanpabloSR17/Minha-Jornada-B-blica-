import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { CinemaTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { AppText } from '@/ui';
import { APPEARANCE_OPTIONS, COSMETIC_ITEMS } from '@/features/avatar/domain/catalog';
import { RARITY_COLOR } from '@/features/avatar/components/RarityBadge';
import { wearFrom } from '@/features/avatar/styles/archetypes';
import { CoinRelief, FirelightPortrait, Pilgrim } from '@/features/avatar/styles/cinematic';
import { HeroCard, topRarity } from '@/features/avatar/styles/HeroCard';

const ENABLED = __DEV__ || process.env.EXPO_PUBLIC_AVATAR_LAB === '1';
const color = (cat: 'skin_tone' | 'hair_color', id: string) => APPEARANCE_OPTIONS[cat].find((o) => o.id === id)?.color ?? '#888888';
const byName = (n: string) => COSMETIC_ITEMS.find((i) => i.name === n)?.id;

const CHARS = [
  { name: 'José', level: 4, stats: [12, 1, 3], look: { bodyId: 'body-b', skin: color('skin_tone', 'skin-4'), hair: color('hair_color', 'haircolor-black'), hairStyle: 'hair-short' },
    eq: { outfit: byName('Túnica de José'), back: byName('Manto Noturno'), head: byName('Coroa da Aliança Davídica'), hands: byName('Harpa de Davi') } },
  { name: 'Rute', level: 2, stats: [4, 0, 0], look: { bodyId: 'body-a', skin: color('skin_tone', 'skin-2'), hair: color('hair_color', 'haircolor-auburn'), hairStyle: 'hair-long-wavy' },
    eq: { outfit: byName('Túnica Céu da Galileia'), back: byName('Capa de Rute'), head: byName('Coroa da Sabedoria'), neck: byName('Colar de Contas'), hands: byName('Rolo do Escriba') } },
  { name: 'Boaz', level: 7, stats: [64, 4, 9], look: { bodyId: 'body-c', skin: color('skin_tone', 'skin-6'), hair: color('hair_color', 'haircolor-gray'), hairStyle: 'hair-curly' },
    eq: { outfit: byName('Túnica de Trabalhador'), back: byName('Manto do Profeta'), head: byName('Turbante de Areia'), chest: byName('Peitoral das Doze Pedras'), hands: byName('Cajado de Pastor') } },
];

const MODES = [
  { id: 'fogueira', name: 'À luz da fogueira', note: 'Retrato sobre a arte do acampamento: fogo quente de um lado, lua fria do outro, brasas no ar.' },
  { id: 'carta', name: 'Carta do Viajante', note: 'Carta colecionável: moldura e gema pela maior raridade equipada, progresso e itens do jogo.' },
  { id: 'siclo', name: 'Siclo de ouro', note: 'O viajante cunhado em relevo na moeda do jogo, com o nome no arco e a gema da raridade.' },
  { id: 'peregrino', name: 'Peregrino', note: 'Corpo inteiro de perfil, nas dunas ao entardecer, manto e lenço ao vento.' },
];

/** Estilos "cinematográficos" ligados à identidade do jogo (ferramenta interna). `?modo=` mostra um. */
export default function Cinematico() {
  const q = useLocalSearchParams<{ modo?: string; w?: string }>();
  if (!ENABLED) return <AppText style={{ padding: 24 }}>Ferramenta interna indisponível.</AppText>;
  const w = Number(q.w ?? 220);
  const list = q.modo ? MODES.filter((m) => m.id === q.modo) : MODES;
  return (
    <CinemaTheme>
      <ScrollView style={{ backgroundColor: '#0C1124' }} contentContainerStyle={styles.page} testID="cinematico">
        {list.map((m) => (
          <View key={m.id} style={styles.section} testID={`modo-${m.id}`}>
            <AppText style={styles.title} color="#F6ECD6">{m.name}</AppText>
            <AppText variant="caption" color="#C9BBA0">{m.note}</AppText>
            <View style={styles.row}>
              {CHARS.map((c) => {
                const wear = wearFrom(c.eq);
                return (
                  <View key={c.name} style={styles.cell}>
                    {m.id === 'fogueira' ? <View style={styles.frame}><FirelightPortrait look={c.look} wear={wear} width={w} /></View> : null}
                    {m.id === 'carta' ? <HeroCard name={c.name} look={c.look} equipment={c.eq} width={w} level={c.level}
                      stats={[{ label: 'Capítulos', value: c.stats[0]! }, { label: 'Marcos', value: c.stats[1]! }, { label: 'Santos', value: c.stats[2]! }]} /> : null}
                    {m.id === 'siclo' ? <CoinRelief look={c.look} wear={wear} width={w} name={c.name} caption={`Nível ${c.level}`} gem={RARITY_COLOR[topRarity(c.eq)]} /> : null}
                    {m.id === 'peregrino' ? <View style={styles.frame}><Pilgrim look={c.look} wear={wear} width={w} /></View> : null}
                    {m.id !== 'carta' ? <AppText variant="label" color="#F6ECD6">{c.name}</AppText> : null}
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </CinemaTheme>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 26 },
  section: { gap: 6 },
  title: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 6, alignItems: 'flex-start' },
  cell: { alignItems: 'center', gap: 6 },
  frame: { borderWidth: 3, borderColor: '#B4892F', borderRadius: 10, overflow: 'hidden' },
});
