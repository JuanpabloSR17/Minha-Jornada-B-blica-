import { ImageBackground, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText, Button, IconBadge } from '@/ui';

const fields = require('../../../../assets/journey/ruth.webp');

export function FeaturedTrail({ completed }: { completed?: number }) {
  const router = useRouter();
  const { colors } = useTheme();
  const done = (completed ?? 0) >= 4;
  return (
    <ImageBackground source={fields} style={[styles.art, { borderColor: colors.borderStrong }]} resizeMode="cover" testID="featured-ruth">
      <View style={styles.panel}>
        <View style={styles.row}>
          <IconBadge name={done ? 'medal' : 'scroll'} color="#F4CF83" />
          <View style={styles.flex}>
            <AppText variant="heading" color="#FFF1CF">Trilha de Rute</AppText>
            <AppText variant="caption" color="#EADBC1">{completed == null ? '4 capítulos guiados' : `${completed} de 4 capítulos lidos`}</AppText>
          </View>
        </View>
        <Button compact variant="gold" icon={done ? 'book' : 'forward'}
          title={done ? 'Revisitar Rute' : completed ? 'Continuar trilha' : 'Explorar a trilha'}
          onPress={() => router.push('/reading/trail')} />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  art: { minHeight: 216, justifyContent: 'flex-end', borderWidth: 1, borderRadius: radius.lg, overflow: 'hidden' },
  panel: { padding: spacing.md, gap: spacing.sm, backgroundColor: 'rgba(19, 13, 31, 0.94)' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1, minWidth: 0 },
});
