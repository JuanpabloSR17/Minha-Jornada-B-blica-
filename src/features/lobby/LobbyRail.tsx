import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Icon, type IconName } from '@/ui';
import { HUD } from './LobbyHud';

export type RailItem = { key: string; label: string; accessibilityLabel: string; icon: IconName; onPress: () => void; badge?: boolean };

/**
 * Trilho lateral do lobby: cada função do jogo tem o seu lugar fixo (Loja, Vestiário, Troféus,
 * Marcos). Botões de 52 px com rótulo curto; o nome acessível é o nome completo da tela.
 */
export function LobbyRail({ items, compact }: { items: RailItem[]; compact?: boolean }) {
  return (
    <View style={[styles.rail, compact && styles.grid]} testID="lobby-rail">
      {items.map((it) => (
        <Pressable
          key={it.key}
          accessibilityRole="button"
          accessibilityLabel={it.accessibilityLabel}
          onPress={it.onPress}
          style={({ pressed }) => [styles.item, compact && styles.itemCompact, pressed && styles.pressed]}
          testID={`lobby-rail-${it.key}`}
        >
          <View style={[styles.gem, compact && styles.gemCompact]}>
            <Icon name={it.icon} color={HUD.gold} size={compact ? 21 : 24} />
            {it.badge ? <View style={styles.badge} /> : null}
          </View>
          <AppText style={styles.label} color={HUD.ink} numberOfLines={1}>{it.label}</AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: { gap: 10, alignItems: 'center' },
  /** telas baixas (320 × 640): 2 × 2, para não encostar no painel de jogar */
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 116, gap: 6, justifyContent: 'center' },
  itemCompact: { minWidth: 54 },
  gemCompact: { width: 46, height: 46, borderRadius: 14 },
  item: { alignItems: 'center', gap: 3, minWidth: 60 },
  pressed: { transform: [{ scale: 0.94 }] },
  gem: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: HUD.plate,
    borderColor: HUD.bronze,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  badge: { position: 'absolute', top: -3, right: -3, width: 12, height: 12, borderRadius: 6, backgroundColor: HUD.violet, borderWidth: 2, borderColor: '#0C1124' },
  label: { fontSize: 11, lineHeight: 14, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.9)', textShadowRadius: 4 },
});
