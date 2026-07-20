import { ApiError, sendOtp, signIn, signUp } from '@/lib/api/client';
import { setPendingPhone } from '@/lib/api/pendingPhone';
import { storageSet } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Auth credentials screen.
 * Flow: welcome → here (Sign up | Sign in) → OTP (phone) | session (email password)
 */
type Intent = 'signup' | 'signin';
type Channel = 'phone' | 'email';

function toE164(raw: string): string {
  let cleaned = raw.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    return '+' + cleaned.slice(1).replace(/\D/g, '');
  }
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ intent?: string }>();
  const initialIntent: Intent =
    params.intent === 'signin' ? 'signin' : 'signup';

  const [intent, setIntent] = React.useState<Intent>(initialIntent);
  const [channel, setChannel] = React.useState<Channel>('phone');
  const [phone, setPhone] = React.useState('+91 ');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  React.useEffect(() => {
    if (params.intent === 'signin' || params.intent === 'signup') {
      setIntent(params.intent);
    }
  }, [params.intent]);

  const submit = async () => {
    setError(undefined);
    setBusy(true);
    try {
      await storageSet('fym.auth_intent', intent);

      if (channel === 'phone') {
        // Both signup + signin use same phone OTP (Supabase creates user on first verify)
        const e164 = toE164(phone);
        if (!/^\+[1-9]\d{7,14}$/.test(e164)) {
          setError('Enter a full mobile number with country code.');
          return;
        }
        const res = await sendOtp(e164);
        const phoneUsed = res?.phone ?? e164;
        await setPendingPhone(phoneUsed);
        router.push({
          pathname: '/(auth)/otp-verify',
          params: {
            channel: 'phone',
            target: phoneUsed.replace(/^\+/, ''),
            intent,
          },
        } as unknown as Href);
        return;
      }

      // Email path — password (no Twilio OTP on email yet)
      const em = email.trim();
      if (!em.includes('@') || password.length < 6) {
        setError('Email + password (min 6 characters) required.');
        return;
      }
      if (intent === 'signup') {
        await signUp(em, password);
        // Session may be null if email confirm required — try sign-in anyway
        try {
          await signIn(em, password);
        } catch {
          /* account created; user may need confirm */
        }
        router.replace('/(onboarding)/basic-info' as Href);
      } else {
        await signIn(em, password);
        router.replace('/(tabs)/discovery' as Href);
      }
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Something went wrong',
      );
    } finally {
      setBusy(false);
    }
  };

  const title =
    intent === 'signup'
      ? channel === 'phone'
        ? "What's your\nnumber?"
        : "Create your\naccount"
      : channel === 'phone'
        ? "Welcome\nback"
        : "Sign in";

  const subtitle =
    channel === 'phone'
      ? intent === 'signup'
        ? "We'll text a 6-digit code. No password to remember."
        : "We'll text a new code to this number."
      : intent === 'signup'
        ? 'Email and password. You can add a phone later.'
        : 'Use the email and password you signed up with.';

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

        {/* Intent: Sign up | Sign in */}
        <View className="mt-4 flex-row rounded-pill border border-border bg-white p-1">
          {(
            [
              { id: 'signup' as const, label: 'Sign up' },
              { id: 'signin' as const, label: 'Sign in' },
            ] as const
          ).map((t) => {
            const on = intent === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => {
                  setIntent(t.id);
                  setError(undefined);
                }}
                className={`flex-1 items-center rounded-pill py-2.5 ${on ? 'bg-fym-coral' : ''}`}
              >
                <Text
                  className={`font-jakarta-bold text-xs ${on ? 'text-white' : 'text-fym-text-muted'}`}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text variant="h1" className="mt-6 text-fym-ink">
          {title}
        </Text>
        <Text variant="lead" className="mt-2">
          {subtitle}
        </Text>

        {/* Channel: Phone | Email */}
        <View className="mt-6 flex-row rounded-pill border border-border bg-white p-1">
          {(
            [
              { id: 'phone' as const, label: 'Phone' },
              { id: 'email' as const, label: 'Email' },
            ] as const
          ).map((c) => {
            const on = channel === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => {
                  setChannel(c.id);
                  setError(undefined);
                }}
                className={`flex-1 items-center rounded-pill py-2.5 ${on ? 'bg-fym-ink' : ''}`}
              >
                <Text
                  className={`font-jakarta-bold text-xs ${on ? 'text-white' : 'text-fym-text-muted'}`}
                >
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="mt-6 gap-3">
          {channel === 'phone' ? (
            <Input
              label="Mobile"
              keyboardType="phone-pad"
              autoComplete="tel"
              value={phone}
              onChangeText={setPhone}
              error={error}
              placeholder="+91 98XXX XXXXX"
            />
          ) : (
            <>
              <Input
                label="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
              />
              <Input
                label="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                error={error}
                placeholder="Min 6 characters"
              />
            </>
          )}
        </View>

        <View className="mt-8">
          <Button size="lg" disabled={busy} onPress={submit}>
            <Text>
              {busy
                ? channel === 'phone'
                  ? 'Sending…'
                  : intent === 'signup'
                    ? 'Creating…'
                    : 'Signing in…'
                : channel === 'phone'
                  ? 'Get OTP'
                  : intent === 'signup'
                    ? 'Create account'
                    : 'Sign in'}
            </Text>
          </Button>
        </View>

        <Text variant="caption" className="mt-6 text-center">
          {channel === 'phone'
            ? 'Next you will enter the code from the text message.'
            : 'Phone signup is the main path. Email works if you prefer it.'}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
