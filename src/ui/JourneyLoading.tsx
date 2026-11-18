import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { strings } from '@/i18n';

const emblem = require('../../assets/brand/emblem.png');

export function JourneyLoading() {
  return (
    <View style={styles.screen}>
      <Image source={emblem} style={styles.emblem} resizeMode="contain" accessible={false} />
      <Text style={styles.title} accessibilityRole="header">{strings.app.name}</Text>
      <ActivityIndicator color="#EFC77E" size="small" accessibilityLabel={strings.common.loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#151225', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  emblem: { width: 180, height: 180 },
  title: { color: '#F9E8C6', fontSize: 28, fontWeight: '700', textAlign: 'center', marginTop: -12 },
});
