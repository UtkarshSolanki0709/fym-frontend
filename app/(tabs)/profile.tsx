import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Edit3, Settings, Shield, Zap } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const INK = '#14213D';

const brutalShadow = {
  shadowColor: INK,
  shadowOffset: { width: 3, height: 3 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 3,
} as const;

function Toggle({
  value,
  onToggle,
}: {
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      className="relative h-6 w-12 overflow-hidden rounded-full border-brutal border-fym-ink"
      style={{ backgroundColor: value ? '#D4EDE9' : '#FFFFFF' }}
    >
      <View
        className="absolute top-0 h-full w-6 rounded-full bg-white"
        style={{
          borderColor: INK,
          ...(value
            ? { right: 0, borderLeftWidth: 2 }
            : { left: 0, borderRightWidth: 2 }),
        }}
      />
    </Pressable>
  );
}

const badges = [
  { label: 'Pro Member', bg: 'bg-fym-pastel-pink' },
  { label: 'Top Contributor', bg: 'bg-fym-pastel-lavender' },
];

const details = [
  { label: 'Full Name', value: 'Alex Vanguard' },
  { label: 'Email', value: 'alex.v@example.com' },
  { label: 'Location', value: 'Neo Tokyo Hub' },
];

const preferences = [
  { label: 'Push Notifications', key: 'notifications' as const },
  { label: 'Weekly Digest', key: 'digest' as const },
  { label: 'Dark Mode', key: 'darkMode' as const },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [pressedEdit, setPressedEdit] = useState(false);
  const [pressedSecSettings, setPressedSecSettings] = useState(false);
  const [pressedLogout, setPressedLogout] = useState(false);
  const [toggles, setToggles] = useState({
    notifications: true,
    digest: false,
    darkMode: false,
  });

  const toggle = (key: keyof typeof toggles) =>
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <View className="flex-1 bg-fym-surface">
      <StatusBar style="dark" />

      <View
        className="flex-row items-center justify-between border-b-brutal border-fym-ink bg-fym-surface px-gutter"
        style={{ paddingTop: insets.top, paddingBottom: 8 }}
      >
        <Pressable className="p-2 active:translate-x-[1px] active:translate-y-[1px]">
          <Zap size={24} color={INK} />
        </Pressable>
        <Text className="font-display-extrabold text-2xl uppercase tracking-tighter text-fym-ink">
          FYM
        </Text>
        <Pressable className="p-2 active:translate-x-[1px] active:translate-y-[1px]">
          <Settings size={24} color={INK} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerClassName="px-gutter pb-36"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center py-10">
          <View className="relative mb-6">
            <View
              className="h-32 w-32 overflow-hidden rounded-full border-brutal border-fym-ink"
              style={brutalShadow}
            >
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
                }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            </View>
            <Pressable
              onPressIn={() => setPressedEdit(true)}
              onPressOut={() => setPressedEdit(false)}
              className="absolute bottom-0 right-0 z-20 rounded-full border-brutal border-fym-ink bg-fym-mint p-2"
              style={
                pressedEdit
                  ? {
                      shadowOpacity: 0,
                      transform: [{ translateX: 2 }, { translateY: 2 }],
                    }
                  : brutalShadow
              }
            >
              <Edit3 size={18} color={INK} />
            </Pressable>
          </View>

          <Text className="font-display-extrabold text-3xl tracking-tight text-fym-ink">
            Alex Vanguard
          </Text>
          <View className="mt-1 flex-row items-center gap-1.5">
            <View className="h-2 w-2 rounded-full border border-fym-ink bg-fym-mint" />
            <Text className="font-jakarta text-base text-fym-text-muted">
              Online & Ready
            </Text>
          </View>

          <View className="mt-3 flex-row flex-wrap justify-center gap-3">
            {badges.map((b) => (
              <View
                key={b.label}
                className={`rounded-full border-brutal border-fym-ink ${b.bg} px-4 py-1`}
                style={brutalShadow}
              >
                <Text className="font-jakarta-bold text-xs text-fym-ink">
                  {b.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Card brutal contentClassName="bg-fym-cream p-6">
          <View className="border-b-2 border-fym-ink pb-2">
            <Text className="font-jakarta-extrabold text-sm uppercase tracking-wide text-fym-ink">
              Details
            </Text>
          </View>
          <View className="mt-3 gap-3">
            {details.map((d) => (
              <View key={d.label}>
                <Text className="font-jakarta-bold text-[10px] uppercase tracking-wide text-fym-text-muted">
                  {d.label}
                </Text>
                <Text className="font-jakarta text-base text-fym-ink">
                  {d.value}
                </Text>
              </View>
            ))}
          </View>
          <Pressable
            className="mt-3 self-start rounded-full border-brutal border-fym-ink bg-fym-pastel-lavender px-5 py-2"
            style={brutalShadow}
          >
            <Text className="font-jakarta-bold text-xs text-fym-ink">
              Edit Details
            </Text>
          </Pressable>
        </Card>

        <View className="mt-6">
          <Card
            brutal
            reverse
            contentClassName="bg-fym-pastel-lavender p-6"
          >
            <View className="border-b-2 border-fym-ink pb-2">
              <Text className="font-jakarta-extrabold text-sm uppercase tracking-wide text-fym-ink">
                Preferences
              </Text>
            </View>
            <View className="mt-1">
              {preferences.map((p, i) => (
                <View
                  key={p.key}
                  className={`flex-row items-center justify-between border-b-2 border-fym-ink py-3 ${
                    i === preferences.length - 1 ? 'border-0' : ''
                  }`}
                >
                  <Text className="font-jakarta-bold text-sm text-fym-ink">
                    {p.label}
                  </Text>
                  <Toggle
                    value={toggles[p.key]}
                    onToggle={() => toggle(p.key)}
                  />
                </View>
              ))}
            </View>
          </Card>
        </View>

        <View className="mt-6">
          <Card brutal contentClassName="bg-white p-6">
            <View className="flex-row items-center gap-2">
              <View className="flex h-8 w-8 items-center justify-center rounded-full border-brutal border-fym-ink bg-fym-pastel-yellow">
                <Shield size={16} color={INK} />
              </View>
              <Text className="font-jakarta-extrabold text-sm uppercase tracking-wide text-fym-ink">
                Security
              </Text>
            </View>
            <Text className="mt-1 font-jakarta text-sm text-fym-text-muted">
              Manage password, 2FA, and connected devices.
            </Text>
            <View className="mt-3 flex-row gap-3">
              <Pressable
                onPressIn={() => setPressedSecSettings(true)}
                onPressOut={() => setPressedSecSettings(false)}
                className="rounded-full border-brutal border-fym-ink bg-fym-mint px-5 py-2.5"
                style={
                  pressedSecSettings
                    ? {
                        shadowOpacity: 0,
                        transform: [{ translateX: 2 }, { translateY: 2 }],
                      }
                    : brutalShadow
                }
              >
                <Text className="font-jakarta-bold text-xs text-fym-ink">
                  Settings
                </Text>
              </Pressable>
              <Pressable
                onPressIn={() => setPressedLogout(true)}
                onPressOut={() => setPressedLogout(false)}
                className="rounded-full border-brutal border-fym-ink bg-destructive px-5 py-2.5"
                style={
                  pressedLogout
                    ? {
                        shadowOpacity: 0,
                        transform: [{ translateX: 2 }, { translateY: 2 }],
                      }
                    : brutalShadow
                }
              >
                <Text className="font-jakarta-bold text-xs text-fym-ink">
                  Log Out
                </Text>
              </Pressable>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}
