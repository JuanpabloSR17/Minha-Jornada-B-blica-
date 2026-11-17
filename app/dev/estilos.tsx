import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { CinemaTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { AppText } from '@/ui';
import { APPEARANCE_OPTIONS, COSMETIC_ITEMS } from '@/features/avatar/domain/catalog';
import { StyledCharacter, StyledEmblem, type CharacterStyle } from '@/features/avatar/styles/StyledCharacter';
import { wearFrom } from '@/features/avatar/styles/archetypes';

const ENABLED = __DEV__ || process.env.EXPO_PUBLIC_AVATAR_LAB === '1';
const color = (cat: 'skin_tone' | 'hair_color', id: string) => APPEARANCE_OPTIONS[cat].find((o) => o.id === id)?.color ?? '#888888';
const byName = (n: string) => COSMETIC_ITEMS.find((i) => i.name === n)?.id;

const STYLES: { id: CharacterStyle; name: string; note: string }[] = [
  { id: 'vitral', name: 'Vitral', note: 'Traço grosso de chumbo, cores de joia, janela de vidro em arco.' },
  { id: 'gravura', name: 'Gravura', note: 'Contorno a tinta, hachura para a sombra, cor em aguada.' },
  { id: 'iluminura', name: 'Iluminura', note: 'Traço fino, cores chapadas, nicho dourado de manuscrito.' },
  { id: 'aventureiro', name: 'Aventureiro', note: 'Corpo inteiro arredondado, sombra de desenho animado, objeto na mão.' },
];

const CHARS = [
  { name: 'José', look: { bodyId: 'body-b', skin: color('skin_tone', 'skin-4'), hair: color('hair_color', 'haircolor-black'), hairStyle: 'hair-short' },
    eq: { outfit: byName('Túnica de José'), back: byName('Manto Noturno'), head: byName('Coroa da Aliança Davídica'), hands: byName('Harpa de Davi') } },
  { name: 'Rute', look: { bodyId: 'body-a', skin: color('skin_tone', 'skin-2'), hair: color('hair_color', 'haircolor-auburn'), hairStyle: 'hair-long-wavy' },
    eq: { outfit: byName('Túnica Céu da Galileia'), back: byName('Capa de Rute'), head: byName('Coroa da Sabedoria'), neck: byName('Colar de Contas'), hands: byName('Rolo do Escriba') } },
  { name: 'Boaz', look: { bodyId: 'body-c', skin: color('skin_tone', 'skin-6'), hair: color('hair_color', 'haircolor-gray'), hairStyle: 'hair-curly' },
    eq: { outfit: byName('Túnica de Trabalhador'), back: byName('Manto do Profeta'), head: byName('Turbante de Areia'), chest: byName('Peitoral das Doze Pedras'), hands: byName('Escudo da Fé') } },
];

/** Comparação de estilos de personagem (ferramenta interna). `?estilo=` mostra um só. */
export default function Estilos() {
  const q = useLocalSearchParams<{ estilo?: string; w?: string }>();
  if (!ENABLED) return <AppText style={{ padding: 24 }}>Ferramenta interna indisponível.</AppText>;
  const list = q.estilo ? STYLES.filter((s) => s.id === q.estilo) : STYLES;
  const w = Number(q.w ?? 200);
  return (
    <CinemaTheme>
      <ScrollView style={{ backgroundColor: '#0C1124' }} contentContainerStyle={styles.page} testID="estilos">
        {list.map((s) => (
          <View key={s.id} style={styles.row} testID={`estilo-${s.id}`}>
            <AppText style={styles.title} color="#F6ECD6">{s.name}</AppText>
            <AppText variant="caption" color="#C9BBA0">{s.note}</AppText>
            <View style={styles.chars}>
              {CHARS.map((c) => {
                const wear = wearFrom(c.eq);
                return (
                  <View key={c.name} style={styles.cell}>
                    <View style={styles.frame}>
                      <StyledCharacter style={s.id} look={c.look} wear={wear} width={w} label={`${c.name} no estilo ${s.name}`} />
                      {s.id !== 'aventureiro' ? <View style={styles.emblem}><StyledEmblem style={s.id} wear={wear} size={Math.round(w * 0.3)} /></View> : null}
                    </View>
                    <AppText variant="label" color="#F6ECD6">{c.name}</AppText>
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
  page: { padding: 16, gap: 22 },
  row: { gap: 6 },
  title: { fontFamily: fonts.display, fontSize: 20, lineHeight: 26 },
  chars: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 6 },
  cell: { alignItems: 'center', gap: 6 },
  frame: { borderWidth: 4, borderColor: '#B4892F', borderRadius: 10, overflow: 'visible', backgroundColor: '#3A2A16' },
  emblem: { position: 'absolute', right: -12, bottom: -12 },
});
