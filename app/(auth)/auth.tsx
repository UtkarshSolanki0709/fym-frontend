import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as AuthSession from 'expo-auth-session';
import { supabase } from '@/lib/supabase';
import { saveSession } from '@/lib/api/session';
import { getOnboardingStatus } from '@/lib/api/client';
import { ensurePublishedKeys } from '@/lib/chat/useChat';
import { loadUserProfile } from '@/lib/userProfile';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
      const redirectTo = isExpoGo
        ? AuthSession.makeRedirectUri({ path: 'auth' })
        : AuthSession.makeRedirectUri({ scheme: 'fym', path: 'auth' });

      console.log('[Google OAuth] Environment:', { isExpoGo, redirectTo });

      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (authError) throw authError;
      if (!data.url) throw new Error('No authorization URL returned from Supabase');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success' && result.url) {
        // Parse parameters (handles both query string and hash fragment)
        const url = result.url.replace('#', '?');
        const parsed = Linking.parse(url);
        const { access_token, refresh_token, code } = parsed.queryParams || {};

        let user;
        let sessionAccessToken: string | undefined;
        let sessionRefreshToken: string | undefined;

        if (code && typeof code === 'string') {
          // PKCE flow
          const { data: exchangeData, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError || !exchangeData.user || !exchangeData.session) {
            throw exchangeError || new Error('Failed to exchange code for session');
          }
          user = exchangeData.user;
          sessionAccessToken = exchangeData.session.access_token;
          sessionRefreshToken = exchangeData.session.refresh_token;
        } else if (access_token && refresh_token) {
          // Implicit flow
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: access_token as string,
            refresh_token: refresh_token as string,
          });
          if (sessionError || !sessionData.user) {
            throw sessionError || new Error('Failed to establish user session');
          }
          user = sessionData.user;
          sessionAccessToken = access_token as string;
          sessionRefreshToken = refresh_token as string;
        } else {
          throw new Error('OAuth authentication tokens or authorization code missing from redirect callback.');
        }

        // Save session locally for backend endpoints calls
        await saveSession({
          access_token: sessionAccessToken,
          refresh_token: sessionRefreshToken,
          user,
        });

        // Initialize user profile keys and configuration
        try {
          await ensurePublishedKeys();
        } catch (e) {
          console.warn('Failed to publish chat keys:', e);
        }
        try {
          await loadUserProfile();
        } catch (e) {
          console.warn('Failed to load local user profile:', e);
        }

        // Fetch onboarding status and route
        const status = await getOnboardingStatus();
        if (status.onboarding_step === 'complete') {
          router.replace('/(tabs)/discovery' as Href);
        } else {
          router.replace('/(onboarding)/basic-info' as Href);
        }
      }
    } catch (err: any) {
      setError(err?.message ?? 'Google Sign-In failed');
    } finally {
      setBusy(false);
    }
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
