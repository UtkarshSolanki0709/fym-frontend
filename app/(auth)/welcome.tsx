import { ScreenEnter } from '@/components/motion';
import { Button } from '@/components/ui/button';
import { Shadow } from '@/components/ui/shadow';
import { Text } from '@/components/ui/text';
import { signInWithGoogle } from '@/lib/auth/googleOAuth';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

/**
 * Welcome Screen — marketing and unified Google Sign-In.
 * Voice: calm, direct, India-first. No throwaway "mate".
 */
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await signInWithGoogle();
    if (!result.ok) setError(result.message);
    setBusy(false);
  };

  return (
    <View
      className="flex-1 bg-fym-surface px-edge"
      style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }}
    >
      <StatusBar style="dark" />

      <ScreenEnter variant="down" className="mt-8 items-center text-center">
        <Shadow offset={6} className="rounded-card">
          <Image
            source={require('@/assets/images/logo.png')}
            className="w-24 h-24"
            contentFit="contain"
          />
        </Shadow>
        <Text variant="display" className="mt-8 text-center text-fym-ink">
          Meet someone{'\n'}worth a{' '}
          <Text variant="display" className="text-fym-brand">
            second coffee
          </Text>
          .
        </Text>
        <Text variant="lead" className="mt-4 max-w-[300px] text-center">
          Browse real profiles, say what didn&apos;t click, and chat without an audience.
        </Text>
      </ScreenEnter>

      <View className="flex-1" />

      <ScreenEnter variant="up" delayIndex={3} className="mt-8 gap-3">
        {error ? (
          <Text className="text-center font-jakarta-bold text-sm text-red-500 mb-2">
            {error}
          </Text>
        ) : null}

        <Button
          size="lg"
          onPress={handleGoogleSignIn}
          disabled={busy}
          accessibilityLabel="Continue with Google"
        >
          {busy ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text>Continue with Google</Text>
          )}
        </Button>
      </ScreenEnter>
    </View>
  );
}
