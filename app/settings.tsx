import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Illustration } from '@/components/ui/illustration';
import { Text } from '@/components/ui/text';
import { resolveMediaUrl } from '@/lib/api/client';
import { clearSession, hasSession } from '@/lib/api/session';
import {
  clearUserProfileLocal,
  getUserPrefs,
  getUserProfile,
  loadUserProfile,
  setUserPrefs,
  subscribeUserProfile,
  type UserPrefs,
  type UserProfile,
} from '@/lib/userProfile';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Eye,
  ImageIcon,
  LogOut,
  Moon,
  Pause,
  Shield,
  User,
} from 'lucide-react-native';
import * as React from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const INK = '#14213D';
const CYBER_CRIME = 'https://cybercrime.gov.in';
const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL ?? '';
const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL ?? '';

function openPolicy(url: string, name: string) {
  if (!url) {
    Alert.alert(
      name,
      'The full document is being finalized for launch. Questions? Reach the grievance officer via Safety center.',
    );
    return;
  }
  void Linking.openURL(url).catch(() => Alert.alert('Could not open link', url));
}

function Toggle({
  value,
  onToggle,
  label,
}: {
  value: boolean;
  onToggle: () => void;
  label: string;
}) {
  const x = useSharedValue(value ? 1 : 0);
  React.useEffect(() => {
    x.value = withTiming(value ? 1 : 0, {
      duration: 160,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, x]);
  const knob = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value * 24 }],
  }));
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      className="relative h-7 w-12 overflow-hidden rounded-full border-2 border-fym-ink"
      style={{ backgroundColor: value ? '#D4EDE9' : '#FFFFFF' }}
    >
      <Animated.View
        className="absolute left-0 top-0 h-full w-6 rounded-full border-r-2 border-fym-ink bg-white"
        style={knob}
      />
    </Pressable>
  );
}

function PrefRow({
  icon,
  title,
  subtitle,
  value,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <View className="flex-row items-center gap-3 border-t border-fym-ink/15 py-3.5">
      <View className="h-9 w-9 items-center justify-center rounded-full border border-fym-ink bg-white">
        {icon}
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-jakarta-bold text-sm text-fym-ink">{title}</Text>
        <Text className="mt-0.5 font-jakarta text-xs text-fym-text-muted" numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <Toggle value={value} onToggle={onToggle} label={title} />
    </View>
  );
}

function NavRow({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center border-t border-fym-ink/15 py-3.5 active:opacity-70"
    >
      <View className="min-w-0 flex-1">
        <Text className="font-jakarta-bold text-sm text-fym-ink">{title}</Text>
        {subtitle ? (
          <Text className="mt-0.5 font-jakarta text-xs text-fym-text-muted">{subtitle}</Text>
        ) : null}
      </View>
      <ChevronRight size={20} color={INK} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [prefs, setPrefsState] = React.useState<UserPrefs>(getUserPrefs());
  const [profile, setProfile] = React.useState<UserProfile>(getUserProfile());
  const [signedIn, setSignedIn] = React.useState(false);

  React.useEffect(() => {
    void loadUserProfile().then(setProfile);
    void hasSession().then(setSignedIn);
    return subscribeUserProfile(() => {
      setPrefsState(getUserPrefs());
      setProfile(getUserProfile());
    });
  }, []);

  const flip = (key: keyof UserPrefs) => {
    void setUserPrefs({ [key]: !prefs[key] }).then(setPrefsState);
  };

  const logout = () => {
    Alert.alert('Log out?', 'You will need to sign in again on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await clearSession();
            await clearUserProfileLocal();
            router.replace('/(auth)/welcome' as Href);
          })();
        },
      },
    ]);
  };

  const clearLocal = () => {
    Alert.alert(
      'Clear local data?',
      'Removes cached profile, photos, and preferences on this device. Does not delete your server account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            void clearUserProfileLocal().then(() => {
              setProfile(getUserProfile());
              setPrefsState(getUserPrefs());
              Alert.alert('Cleared', 'Local cache reset. Pull profile again when signed in.');
            });
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-fym-surface" style={{ paddingTop: insets.top }}>
      <StatusBar style="dark" />
      <View className="flex-row items-center gap-2 border-b-2 border-fym-ink px-edge py-3">
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityLabel="Go back"
          className="p-1"
        >
          <ChevronLeft size={28} color={INK} />
        </Pressable>
        <Text variant="h2" className="text-fym-ink">
          Settings
        </Text>
      </View>

      <ScrollView
        contentContainerClassName="px-edge py-5 pb-20"
        showsVerticalScrollIndicator={false}
      >
        {/* Account header */}
        <Card brutal contentClassName="bg-fym-cream p-4">
          <View className="flex-row items-center gap-3">
            <View className="h-14 w-14 overflow-hidden rounded-full border-2 border-fym-ink">
              <Image
                source={{ uri: resolveMediaUrl(profile.photo_url) }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="font-display-extrabold text-lg text-fym-ink" numberOfLines={1}>
                {profile.display_name}
                {profile.age != null ? `, ${profile.age}` : ''}
              </Text>
              <Text className="font-jakarta text-xs text-fym-text-muted" numberOfLines={1}>
                {profile.email || profile.location || 'No email on file'}
              </Text>
              <View className="mt-1 self-start rounded-pill border border-fym-ink bg-fym-mint/40 px-2 py-0.5">
                <Text className="font-jakarta-bold text-[9px] uppercase text-fym-ink">
                  {signedIn ? 'Signed in' : 'Demo / offline'}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Account actions */}
        <View className="mt-5">
          <View className="mb-2 flex-row items-center gap-2">
            <User size={16} color={INK} />
            <Text className="font-jakarta-extrabold text-xs uppercase tracking-wide text-fym-ink">
              Account
            </Text>
          </View>
          <Card brutal contentClassName="bg-white px-4 py-1">
            <NavRow
              title="Edit name, age & bio"
              subtitle="Profile form — updates live"
              onPress={() => router.push('/edit-profile' as Href)}
            />
            <NavRow
              title="Photos & prompts"
              subtitle="Manage on the You tab"
              onPress={() => router.push('/(tabs)/profile' as Href)}
            />
            <NavRow
              title="Discovery home"
              subtitle="Browse people nearby"
              onPress={() => router.push('/(tabs)/discovery' as Href)}
            />
          </Card>
        </View>

        {/* Preferences — moved from You */}
        <View className="mt-6">
          <View className="mb-2 flex-row items-center gap-2">
            <Bell size={16} color={INK} />
            <Text className="font-jakarta-extrabold text-xs uppercase tracking-wide text-fym-ink">
              Preferences
            </Text>
          </View>
          <Card brutal reverse contentClassName="bg-fym-pastel-lavender px-4 py-1">
            <PrefRow
              icon={<Bell size={16} color={INK} />}
              title="Push notifications"
              subtitle="Matches, likes, and safety alerts"
              value={prefs.notifications}
              onToggle={() => flip('notifications')}
            />
            <PrefRow
              icon={<ImageIcon size={16} color={INK} />}
              title="Weekly digest"
              subtitle="Email-style summary when available"
              value={prefs.digest}
              onToggle={() => flip('digest')}
            />
            <PrefRow
              icon={<Moon size={16} color={INK} />}
              title="Dark mode"
              subtitle="Preview preference (UI theme later)"
              value={prefs.darkMode}
              onToggle={() => flip('darkMode')}
            />
            <PrefRow
              icon={<Eye size={16} color={INK} />}
              title="Hide my age"
              subtitle="Keep age off your public card"
              value={prefs.hideAge}
              onToggle={() => flip('hideAge')}
            />
            <PrefRow
              icon={<Pause size={16} color={INK} />}
              title="Pause discovery"
              subtitle="Stop showing up in other decks"
              value={prefs.pauseDiscovery}
              onToggle={() => flip('pauseDiscovery')}
            />
            <PrefRow
              icon={<Shield size={16} color={INK} />}
              title="Read receipts"
              subtitle="Show partners when you've read their message"
              value={prefs.readReceipts}
              onToggle={() => flip('readReceipts')}
            />
          </Card>
        </View>

        {/* Security */}
        <View className="mt-6">
          <View className="mb-2 flex-row items-center gap-2">
            <Shield size={16} color={INK} />
            <Text className="font-jakarta-extrabold text-xs uppercase tracking-wide text-fym-ink">
              Security
            </Text>
          </View>
          <Card brutal contentClassName="bg-white p-4">
            <Text className="font-jakarta text-sm text-fym-text-muted">
              Session is stored on this device. Log out clears tokens and local profile cache.
            </Text>
            <View className="mt-4 gap-3">
              <Button variant="danger" onPress={logout}>
                <View className="flex-row items-center gap-2">
                  <LogOut size={18} color="#fff" />
                  <Text className="text-white">Log out</Text>
                </View>
              </Button>
              <Button variant="secondary" onPress={clearLocal}>
                <Text>Clear local cache</Text>
              </Button>
              {!signedIn ? (
                <Button
                  variant="primary"
                  onPress={() => router.push('/(auth)/auth?intent=signin' as Href)}
                >
                  <Text>Sign in</Text>
                </Button>
              ) : null}
            </View>
          </Card>
        </View>

        {/* Safety */}
        <View className="mt-6">
          <Card brutal contentClassName="bg-fym-pastel-yellow p-4">
            <View className="flex-row items-center gap-2">
              <Illustration name="starShield" size={24} />
              <Text className="font-jakarta-extrabold text-sm uppercase text-fym-ink">
                Safety center
              </Text>
            </View>
            <Text className="mt-2 font-jakarta text-sm text-fym-text-muted">
              Report and block live inside every chat (tap the flag). For urgent cybercrime, use the
              national portal.
            </Text>
            <View className="mt-3 gap-2">
              <Button
                variant="secondary"
                onPress={() => router.push('/grievance' as Href)}
              >
                <Text>Grievance & reports</Text>
              </Button>
              <Button
                variant="secondary"
                onPress={() => {
                  void Linking.openURL(CYBER_CRIME).catch(() =>
                    Alert.alert('Could not open link', CYBER_CRIME),
                  );
                }}
              >
                <Text>National Cyber Crime Portal</Text>
              </Button>
            </View>
          </Card>
        </View>

        {/* About */}
        <View className="mt-6 mb-4">
          <Card contentClassName="bg-white px-4 py-1">
            <NavRow
              title="Privacy policy"
              subtitle="How we handle your data"
              onPress={() => openPolicy(PRIVACY_URL, 'Privacy policy')}
            />
            <NavRow
              title="Terms of use"
              subtitle="Rules of the road"
              onPress={() => openPolicy(TERMS_URL, 'Terms of use')}
            />
            <View className="border-t border-fym-ink/15 py-3.5">
              <Text className="font-jakarta-bold text-xs uppercase text-fym-text-muted">
                FYM · Find Your Mate
              </Text>
              <Text className="mt-1 font-jakarta text-xs text-fym-text-muted">
                Version 1.0.0 · Built for India
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}
