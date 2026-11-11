import { StyleSheet, View } from 'react-native';
import { AppText } from '@/ui';
import { strings } from '@/i18n';
import type { Rarity } from '../domain/avatar.types';

export const RARITY_COLOR: Record<Rarity, string> = {
  common: '#8C8273',
  uncommon: '#4E8A4A',
  rare: '#2F6FA8',
  epic: '#8A3FA0',
  legendary: '#C9771A',
  holy: '#B8932F',
};

/** Raridade é só visual: nunca representa poder ou vantagem. */
export function RarityBadge({ rarity }: { rarity: Rarity }) {
  if (rarity === 'common') return null;
  return (
    <View style={[styles.badge, { backgroundColor: RARITY_COLOR[rarity] }]}>
      <AppText variant="caption" color="#FFFFFF" style={styles.text}>{strings.rarity[rarity]}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { position: 'absolute', top: 4, left: 4, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  text: { fontSize: 10, lineHeight: 14, fontWeight: '700' },
});
