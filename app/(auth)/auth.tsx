import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { signInWithGoogle } from '@/lib/auth/googleOAuth';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
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
    <KeyboardAvoidingView
      className="flex-1 bg-fym-surface"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 16,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} hitSlop={12} className="self-start py-2">
          <Text className="font-jakarta-bold text-sm uppercase text-fym-coral">← Back</Text>
        </Pressable>

        <Text variant="h1" className="mt-6 text-fym-ink">
          Sign In
        </Text>
        <Text variant="lead" className="mt-2">
          We use Google authentication to verify your identity.
        </Text>

        <View className="flex-1 justify-center py-8">
          {error ? (
            <Text className="text-center font-jakarta-bold text-sm text-red-500 mb-4">
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
        </View>

        <Text variant="caption" className="text-center">
          Authentication is verified via Google. We do not share your private Google details.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
