import { ScreenEnter } from '@/components/motion';
import { Button } from '@/components/ui/button';
import { Shadow } from '@/components/ui/shadow';
import { Text } from '@/components/ui/text';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as AuthSession from 'expo-auth-session';
import { supabase } from '@/lib/supabase';
import { saveSession } from '@/lib/api/session';
import { getOnboardingStatus } from '@/lib/api/client';
import { ensurePublishedKeys } from '@/lib/chat/useChat';
import { loadUserProfile } from '@/lib/userProfile';
import Constants, { ExecutionEnvironment } from 'expo-constants';

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
    try {
      const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
      const redirectTo = isExpoGo
        ? AuthSession.makeRedirectUri({ preferLocalhost: true, path: 'auth' })
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
