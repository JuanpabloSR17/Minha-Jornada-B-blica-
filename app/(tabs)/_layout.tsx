import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { syncTimeZone } from '@/features/reading/mission/mission.service';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon, type IconName } from '@/ui';
import { strings } from '@/i18n';

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'home', title: strings.tabs.home, icon: 'home' },
  { name: 'journey', title: strings.tabs.journey, icon: 'map' },
  { name: 'read', title: strings.tabs.read, icon: 'book' },
  { name: 'friends', title: strings.tabs.friends, icon: 'friends' },
  { name: 'profile', title: strings.tabs.profile, icon: 'profile' },
];

export default function TabsLayout() {
  const { colors } = useTheme();
  // o dia da meta diária usa o fuso do perfil; o app informa o fuso do aparelho
  useEffect(() => {
    syncTimeZone().catch(() => undefined);
  }, []);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{ title: t.title, tabBarIcon: ({ color, size }) => <Icon name={t.icon} color={String(color)} size={size} /> }}
        />
      ))}
    </Tabs>
  );
}
