import { CapsuleTabBar } from '@/components/nav/CapsuleTabBar';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CapsuleTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: '#F3EFE6' },
      }}
    >
      <Tabs.Screen name="discovery" options={{ title: 'Home' }} />
      <Tabs.Screen name="likes" options={{ title: 'Likes' }} />
      <Tabs.Screen name="matches" options={{ title: 'Chat' }} />
      <Tabs.Screen name="profile" options={{ title: 'You' }} />
    </Tabs>
  );
}
