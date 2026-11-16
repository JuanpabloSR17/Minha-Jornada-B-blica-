import { StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { cinemaColors } from '@/theme/tokens';
import { Icon, type IconName } from '@/ui';
import { strings } from '@/i18n';

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'home', title: strings.tabs.home, icon: 'home' },
  { name: 'journey', title: strings.tabs.journey, icon: 'map' },
  { name: 'read', title: strings.tabs.read, icon: 'book' },
  { name: 'friends', title: strings.tabs.friends, icon: 'friends' },
  { name: 'profile', title: strings.tabs.profile, icon: 'profile' },
];

/** Medalhão dourado da aba Ler: o "jogar" do lobby, elevado acima da doca. */
function ReadMedallion({ focused }: { focused: boolean }) {
  return (
    <View style={styles.medallion}>
      <Svg width={60} height={60} viewBox="0 0 60 60" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="readMedal" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFE7A3" />
            <Stop offset="0.5" stopColor="#E9BA5B" />
            <Stop offset="1" stopColor="#9A6418" />
          </LinearGradient>
        </Defs>
        <Circle cx={30} cy={30} r={28} fill="#120E1C" stroke={focused ? '#B48CFF' : '#7A5A2A'} strokeWidth={2} />
        <Circle cx={30} cy={30} r={23} fill="url(#readMedal)" stroke="#FFF3CC" strokeOpacity={0.6} strokeWidth={1} />
      </Svg>
      <View style={styles.medallionIcon}><Icon name="book" color="#2A1606" size={26} /></View>
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // doca do lobby (noite, bronze e dourado) em qualquer tema; seleção em neon violeta
        tabBarActiveTintColor: cinemaColors.primary,
        tabBarInactiveTintColor: cinemaColors.textMuted,
        tabBarStyle: styles.dock,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.item,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color, size, focused }) =>
              t.name === 'read' ? (
                <ReadMedallion focused={focused} />
              ) : (
                <View style={[styles.iconWrap, focused && styles.iconFocused]}>
                  <Icon name={t.icon} color={String(color)} size={size} />
                </View>
              ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  dock: { backgroundColor: '#120E1C', borderTopColor: '#7A5A2A', borderTopWidth: 1.5, height: 72, paddingTop: 6, paddingBottom: 8, overflow: 'visible' },
  label: { fontSize: 12, fontWeight: '700' },
  item: { overflow: 'visible' },
  iconWrap: { width: 44, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  iconFocused: { backgroundColor: 'rgba(233, 186, 91, 0.16)', borderWidth: 1, borderColor: 'rgba(233, 186, 91, 0.5)' },
  medallion: { width: 60, height: 60, borderRadius: 30, marginTop: -30, alignItems: 'center', justifyContent: 'center', shadowColor: '#E9BA5B', shadowOpacity: 0.45, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
  medallionIcon: { position: 'relative', zIndex: 1 },
});
