import {
  ApiError,
  getOnboardingStatus,
  sendEmailOtp,
  sendOtp,
  verifyEmailOtp,
  verifyOtp,
} from '@/lib/api/client';
import {
  clearPendingAuth,
  getPendingAuth,
  setPendingAuth,
} from '@/lib/api/pendingAuth';
import { loadUserProfile } from '@/lib/userProfile';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ensurePublishedKeys } from '@/lib/chat/useChat';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LENGTH = 6;

async function routeAfterAuth() {
  try {
    await ensurePublishedKeys();
  } catch {
    /* chat keys later */
  }
  try {
    await loadUserProfile();
  } catch {
    /* local defaults */
  }

  try {
    const status = await getOnboardingStatus();
    if (status.onboarding_step === 'complete') {
      router.replace('/(tabs)/discovery' as Href);
      return;
    }
  } catch {
    /* new user */
  }

  router.replace('/(onboarding)/basic-info' as Href);
}

export default function OtpVerifyScreen() {
  const insets = useSafeAreaInsets();
  const { target, channel: channelParam, intent: intentParam } = useLocalSearchParams<{
    target?: string;
    channel?: string;
    intent?: string;
  }>();

  const channel =
    (Array.isArray(channelParam) ? channelParam[0] : channelParam) === 'email'
      ? 'email'
      : 'phone';

  const [dest, setDest] = React.useState<string | null>(null);
  const [digits, setDigits] = React.useState('');
  const [seconds, setSeconds] = React.useState(30);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const inputRef = React.useRef<TextInput>(null);
  const inFlight = React.useRef(false);
  const done = React.useRef(false);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const stored = await getPendingAuth();
      if (!alive) return;
      if (stored && stored.channel === channel) {
        setDest(stored.target);
        return;
      }
      const raw = Array.isArray(target) ? target[0] : target;
      if (!raw) return;
      if (channel === 'phone') {
        const rebuilt = raw.startsWith('+') ? raw : `+${String(raw).replace(/\D/g, '')}`;
        setDest(rebuilt);
        await setPendingAuth({ channel: 'phone', target: rebuilt });
      } else {
        const em = String(raw).trim().toLowerCase();
        setDest(em);
        await setPendingAuth({ channel: 'email', target: em });
      }
    })();
    return () => {
      alive = false;
    };
  }, [target, channel]);

  React.useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  React.useEffect(() => {
    if (digits.length === LENGTH && dest) void verify(digits);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits, dest]);

  const verify = async (code: string) => {
    if (!dest) {
      setError('Missing destination — go back and resend.');
      return;
    }
    if (inFlight.current || done.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(undefined);
    try {
      if (channel === 'email') {
        await verifyEmailOtp(dest, code);
      } else {
        await verifyOtp(dest, code);
      }
      done.current = true;
      await clearPendingAuth();
      await routeAfterAuth();
    } catch (e) {
      setDigits('');
      const msg = e instanceof ApiError ? e.message : 'Invalid code';
      if (/expired|invalid/i.test(msg)) {
        setError(`${msg} — request a new code.`);
      } else {
        setError(msg);
      }
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!dest || inFlight.current) return;
    setError(undefined);
    try {
      if (channel === 'email') {
        await sendEmailOtp(dest);
      } else {
        await sendOtp(dest);
      }
      await setPendingAuth({ channel, target: dest });
      setSeconds(30);
      setDigits('');
      done.current = false;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Resend failed');
    }
  };

  const display =
    dest ??
    (channel === 'email'
      ? String(target ?? 'your email')
      : target
        ? `+${String(target).replace(/\D/g, '')}`
        : 'your phone');

  return (
    <View
      className="flex-1 bg-fym-surface px-edge"
      style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }}
    >
      <StatusBar style="dark" />
      <Pressable onPress={() => router.back()} hitSlop={12} className="self-start py-2">
        <Text className="font-jakarta-bold text-sm uppercase text-fym-coral">← Back</Text>
      </Pressable>

      <Text variant="h1" className="mt-6">
        Enter the{'\n'}6-digit code
      </Text>
      <Text variant="lead" className="mt-2">
        {channel === 'email'
          ? `Sent to ${display} via email. Check spam if needed.`
          : `Sent to ${display}. Codes expire after a few minutes.`}
      </Text>
      <Text variant="caption" className="mt-1">
        Step 2 of 2 — verification
      </Text>

      <Pressable
        className="mt-10 flex-row justify-between gap-2"
        onPress={() => inputRef.current?.focus()}
      >
        {Array.from({ length: LENGTH }).map((_, i) => {
          const char = digits[i] ?? '';
          const active = digits.length === i;
          return (
            <View
              key={i}
              className={`h-14 flex-1 items-center justify-center rounded-card border bg-white ${
                active ? 'border-fym-coral' : 'border-border'
              }`}
            >
              <Text className="font-jakarta-bold text-2xl text-fym-text">{char}</Text>
            </View>
          );
        })}
      </Pressable>

      <TextInput
        ref={inputRef}
        value={digits}
        onChangeText={(t) => setDigits(t.replace(/\D/g, '').slice(0, LENGTH))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoFocus
        className="absolute h-px w-px opacity-0"
        caretHidden
        editable={!busy && !done.current}
      />

      {error ? (
        <Text className="mt-4 text-center font-jakarta-bold text-sm text-red-500">{error}</Text>
      ) : null}

      <View className="mt-8">
        <Button
          size="lg"
          disabled={busy || digits.length < LENGTH || !dest}
          onPress={() => void verify(digits)}
        >
          <Text>{busy ? 'Checking…' : 'Verify & continue'}</Text>
        </Button>
      </View>

      <Pressable disabled={seconds > 0 || busy} onPress={() => void resend()} className="mt-6 items-center">
        <Text
          className={`font-jakarta-bold text-sm ${
            seconds > 0 ? 'text-fym-text-muted' : 'text-fym-coral'
          }`}
        >
          {seconds > 0 ? `Resend in 00:${String(seconds).padStart(2, '0')}` : 'Resend code'}
        </Text>
      </Pressable>
    </View>
  );
}
