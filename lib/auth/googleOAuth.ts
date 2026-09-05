import * as AuthSession from 'expo-auth-session';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { getOnboardingStatus } from '@/lib/api/client';
import { saveSession } from '@/lib/api/session';
import { ensurePublishedKeys } from '@/lib/chat/useChat';
import { loadUserProfile } from '@/lib/userProfile';
import { supabase } from '@/lib/supabase';
import { router, type Href } from 'expo-router';

export type GoogleSignInResult = { ok: true } | { ok: false; message: string };

/** Google OAuth (PKCE when the broker provides a code, implicit otherwise),
 *  session persistence, key publish, and onboarding routing — shared by
 *  welcome + auth screens. */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  const redirectTo = isExpoGo
    ? AuthSession.makeRedirectUri({ preferLocalhost: true, path: 'auth' })
    : AuthSession.makeRedirectUri({ scheme: 'fym', path: 'auth' });

  const { data, error: authError } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (authError) return { ok: false, message: authError.message };
  if (!data.url) return { ok: false, message: 'No authorization URL returned from Supabase' };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success' || !result.url) {
    return { ok: false, message: 'Sign-in cancelled' };
  }

  // Parse parameters (handles both query string and hash fragment)
  const url = result.url.replace('#', '?');
  const parsed = Linking.parse(url);
  const { access_token, refresh_token, code } = parsed.queryParams || {};

  let user: { id?: string } | undefined;
  let sessionAccessToken: string | undefined;
  let sessionRefreshToken: string | undefined;

  if (code && typeof code === 'string') {
    const { data: exchangeData, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError || !exchangeData.user || !exchangeData.session) {
      return {
        ok: false,
        message: exchangeError?.message ?? 'Failed to exchange code for session',
      };
    }
    user = exchangeData.user;
    sessionAccessToken = exchangeData.session.access_token;
    sessionRefreshToken = exchangeData.session.refresh_token;
  } else if (access_token && refresh_token) {
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: access_token as string,
      refresh_token: refresh_token as string,
    });
    if (sessionError || !sessionData.user) {
      return {
        ok: false,
        message: sessionError?.message ?? 'Failed to establish user session',
      };
    }
    user = sessionData.user;
    sessionAccessToken = access_token as string;
    sessionRefreshToken = refresh_token as string;
  } else {
    return {
      ok: false,
      message: 'OAuth authentication tokens or authorization code missing from redirect callback.',
    };
  }

  await saveSession({
    access_token: sessionAccessToken,
    refresh_token: sessionRefreshToken,
    user,
  });

  // Key publish + local profile load are best-effort — onboarding can repair.
  try {
    await ensurePublishedKeys();
  } catch {
    /* retried on first chat open */
  }
  try {
    await loadUserProfile();
  } catch {
    /* profile loads again on the You tab */
  }

  let status: { onboarding_step?: string } | null = null;
  try {
    status = await getOnboardingStatus();
  } catch (e) {
    console.warn('Failed to fetch onboarding status from backend:', e);
  }

  if (status?.onboarding_step === 'complete') {
    router.replace('/(tabs)/discovery' as Href);
  } else {
    router.replace('/(onboarding)/basic-info' as Href);
  }
  return { ok: true };
}
