import { StepShell } from '@/components/onboarding/StepShell';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import { ApiError, setOnboardingStep, updateInterests } from '@/lib/api/client';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { View } from 'react-native';

const OPTIONS = [
  'Chai',
  'Indie gigs',
  'Trail runs',
  'Zines',
  'Thrift',
  'Momos',
  'Cricket',
  'Films',
  'Startups',
  'Yoga',
  'Dogs',
  'Cats',
  'Cooking',
  'Travel',
  'Books',
  'DJ nights',
];

export default function InterestsScreen() {
  const [picked, setPicked] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  const toggle = (label: string) => {
    setPicked((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label].slice(0, 12),
    );
  };

  const save = async () => {
    if (picked.length < 1) {
      setError('Pick at least one');
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await updateInterests(picked);
      await setOnboardingStep('interests');
      router.push('/(onboarding)/quiz' as Href);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <StatusBar style="dark" />
      <StepShell
        step="interests"
        title={"What are you\ninto?"}
        subtitle="Pick a few. We use these to find people with overlapping interests."
        footer={
          <Button size="lg" disabled={busy} onPress={save}>
            <Text>{busy ? 'Saving…' : 'Next'}</Text>
          </Button>
        }
      >
        <View className="flex-row flex-wrap gap-2">
          {OPTIONS.map((label) => {
            const on = picked.includes(label);
            return (
              <Chip
                key={label}
                label={label}
                tone={on ? 'coral' : 'cream'}
                active={on}
                onPress={() => toggle(label)}
              />
            );
          })}
        </View>
        {error ? (
          <Text className="mt-4 font-jakarta-bold text-sm text-red-500">{error}</Text>
        ) : null}
      </StepShell>
    </>
  );
}
