import { ApiError, getOnboardingStatus, sendOtp, verifyOtp } from '@/lib/api/client';
import {
  clearPendingPhone,
  getPendingPhone,
  setPendingPhone,
} from '@/lib/api/pendingPhone';
import { storageGet } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LENGTH = 6;

async function routeAfterOtp(intentHint?: string) {
  const intent =
    intentHint === 'signup' || intentHint === 'signin'
      ? intentHint
      : (await storageGet('fym.auth_intent')) ?? 'signup';

  if (intent === 'signin') {
    try {
      const status = await getOnboardingStatus();
      if (status.onboarding_step === 'complete') {
        router.replace('/(tabs)/discovery' as Href);
        return;
      }
    } catch {
      /* fall through to onboarding */
    }
  }
  router.replace('/(onboarding)/basic-info' as Href);
}

export default function OtpVerifyScreen() {
  const insets = useSafeAreaInsets();
  const { target, channel, intent: intentParam } = useLocalSearchParams<{
    target?: string;
    channel?: string;
    intent?: string;
  }>();
  const [phone, setPhone] = React.useState<string | null>(null);
  const [digits, setDigits] = React.useState('');
  const [seconds, setSeconds] = React.useState(30);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const inputRef = React.useRef<TextInput>(null);
  // prevent double verify (auto-submit + button, or React Strict double-fire)
  const inFlight = React.useRef(false);
  const done = React.useRef(false);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const stored = await getPendingPhone();
      if (!alive) return;
      if (stored) {
        setPhone(stored);
        return;
      }
      // fallback: rebuild from display param (digits only, no +)
      const raw = Array.isArray(target) ? target[0] : target;
      if (raw && channel === 'phone') {
        const rebuilt = raw.startsWith('+') ? raw : `+${String(raw).replace(/\D/g, '')}`;
        setPhone(rebuilt);
        await setPendingPhone(rebuilt);
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
    if (digits.length === LENGTH && phone) {
      void verify(digits);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits, phone]);

  const verify = async (code: string) => {
    if (!phone) {
      setError('Missing phone — go back and resend.');
      return;
    }
    if (inFlight.current || done.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(undefined);
    try {
      await verifyOtp(phone, code);
      done.current = true;
      await clearPendingPhone();
      const intent = Array.isArray(intentParam) ? intentParam[0] : intentParam;
      await routeAfterOtp(intent);
    } catch (e) {
      setDigits('');
      const msg = e instanceof ApiError ? e.message : 'Invalid code';
      // friendlier hint for common Twilio/Supabase cases
      if (/expired|invalid/i.test(msg)) {
        setError(`${msg} — request a new code. Use the latest SMS only.`);
      } else {
        setError(msg);
      }
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!phone || inFlight.current) return;
    setError(undefined);
    try {
      await sendOtp(phone);
      await setPendingPhone(phone);
      setSeconds(30);
      setDigits('');
      done.current = false;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Resend failed');
    }
  };

  const display = phone ?? (target ? `+${String(target).replace(/\D/g, '')}` : 'your phone');

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
        Sent to {display}. Codes expire after a few minutes.
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
          disabled={busy || digits.length < LENGTH || !phone}
          onPress={() => verify(digits)}
        >
          <Text>{busy ? 'Checking…' : 'Verify & continue'}</Text>
        </Button>
      </View>

      <Pressable disabled={seconds > 0 || busy} onPress={resend} className="mt-6 items-center">
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
