import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { cinemaColors, fonts, radius } from '@/theme/tokens';
import { Icon, type IconName } from '@/ui';
import { strings } from '@/i18n';

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'home', title: strings.tabs.home, icon: 'camp' },
  { name: 'journey', title: strings.tabs.journey, icon: 'compass' },
  { name: 'read', title: strings.tabs.read, icon: 'book' },
  { name: 'friends', title: strings.tabs.friends, icon: 'friends' },
  { name: 'profile', title: strings.tabs.profile, icon: 'profile' },
];

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // barra de abas na identidade da jornada (noite, bronze e dourado) em qualquer tema
        tabBarActiveTintColor: cinemaColors.primary,
        tabBarInactiveTintColor: cinemaColors.textMuted,
        tabBarStyle: { backgroundColor: '#120E1C', borderTopColor: '#7A5A2A', borderTopWidth: 1.5, height: 64, paddingTop: 4, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 13, fontFamily: fonts.bold },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color, focused }) => (
              <View style={{
                width: 42,
                height: 30,
                borderRadius: radius.pill,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? '#352538' : 'transparent',
              }}>
                <Icon name={t.icon} color={String(color)} size={22} />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
