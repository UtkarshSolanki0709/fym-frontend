import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Shadow } from '@/components/ui/shadow';
import { Text } from '@/components/ui/text';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Welcome — marketing only.
 * Voice: calm, direct, India-first. No throwaway "mate".
 */
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-fym-surface px-edge"
      style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }}
    >
      <StatusBar style="dark" />

      <View className="flex-row flex-wrap gap-2">
        <Chip label="Built for India" tone="yellow" />
        <Chip label="Verified faces" tone="mint" />
        <Chip label="Private chat" tone="blue" />
      </View>

      <View className="mt-10 items-start">
        <Shadow offset={6} className="rounded-card">
          <View className="rounded-card border border-fym-brand/20 bg-fym-ink px-5 py-3">
            <Text className="font-display-extrabold text-3xl tracking-tight text-fym-cream">
              FYM
            </Text>
          </View>
        </Shadow>
        <Text variant="display" className="mt-6 max-w-[320px] text-fym-ink">
          Meet someone{'\n'}worth a{'\n'}
          <Text variant="display" className="text-fym-brand">
            second coffee
          </Text>
          .
        </Text>
        <Text variant="lead" className="mt-4 max-w-[300px]">
          Browse real profiles, say what didn&apos;t click, and chat without an audience.
        </Text>
      </View>

      <View className="mt-10 flex-1 flex-row gap-3">
        <Shadow offset={5} className="flex-1 rounded-card">
          <View className="flex-1 justify-between rounded-card border border-border bg-fym-pastel-lavender p-4">
            <Text className="text-3xl">♠</Text>
            <View>
              <Text variant="label">Super like</Text>
              <Text variant="caption" className="mt-1">
                One strong signal when you mean it.
              </Text>
            </View>
          </View>
        </Shadow>
        <View className="flex-1 gap-3">
          <Shadow offset={4} className="flex-1 rounded-card">
            <View className="flex-1 justify-between rounded-card border border-border bg-fym-pastel-yellow p-4">
              <Text className="text-2xl">♥</Text>
              <Text variant="label">Like</Text>
              <Text variant="caption" className="mt-1">
                Interested. No drama.
              </Text>
            </View>
          </Shadow>
          <Shadow offset={4} className="flex-1 rounded-card">
            <View className="flex-1 justify-between rounded-card border border-border bg-fym-mint p-4">
              <Text className="font-jakarta-bold text-xs uppercase">Encrypted</Text>
              <Text variant="caption">Messages stay between you two</Text>
            </View>
          </Shadow>
        </View>
      </View>

      <View className="mt-8 gap-3">
        <Button
          size="lg"
          onPress={() => router.push('/(auth)/auth?intent=signup' as Href)}
          accessibilityLabel="Create account"
        >
          <Text>Create account</Text>
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onPress={() => router.push('/(auth)/auth?intent=signin' as Href)}
        >
          <Text>Sign in</Text>
        </Button>
        <Button
          variant="ghost"
          size="lg"
          onPress={() => router.replace('/(tabs)/discovery' as Href)}
        >
          <Text>Browse demo profiles</Text>
        </Button>
      </View>
    </View>
  );
}
