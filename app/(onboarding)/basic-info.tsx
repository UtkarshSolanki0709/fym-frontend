import { StepShell } from '@/components/onboarding/StepShell';
import { Button } from '@/components/ui/button';
import { Illustration } from '@/components/ui/illustration';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { ApiError, setOnboardingStep, updateProfileMe } from '@/lib/api/client';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { View } from 'react-native';

export default function BasicInfoScreen() {
  const [name, setName] = React.useState('');
  const [age, setAge] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  const save = async () => {
    setError(undefined);
    const ageN = parseInt(age, 10);
    if (name.trim().length < 2) {
      setError('Name needs at least 2 chars');
      return;
    }
    if (!Number.isFinite(ageN) || ageN < 18 || ageN > 99) {
      setError('Age must be 18–99');
      return;
    }
    setBusy(true);
    try {
      await updateProfileMe({
        display_name: name.trim(),
        age: ageN,
        bio: bio.trim() || undefined,
      });
      await setOnboardingStep('basic_info');
      router.push('/(onboarding)/photos' as Href);
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
        step="basic"
        title={"A few\nbasics"}
        subtitle="Name and age show on your profile card. Bio is optional."
        footer={
          <Button size="lg" disabled={busy} onPress={save}>
            <Text>{busy ? 'Saving…' : 'Continue'}</Text>
          </Button>
        }
      >
        <View className="mb-4 flex-row items-center gap-3 rounded-card border-brutal border-fym-ink bg-fym-pastel-yellow p-3">
          <Illustration name="heartPennantFlag" size={36} />
          <View className="flex-1">
            <Text className="font-jakarta-bold text-xs uppercase tracking-wide text-fym-ink">
              Step 2 · Your Identity
            </Text>
            <Text className="font-jakarta text-xs text-fym-text-muted">
              Keep it genuine. Real profiles get 4x more mutual likes.
            </Text>
          </View>
        </View>

        <View className="gap-4">
          <Input label="Display name" value={name} onChangeText={setName} placeholder="Ananya" />
          <Input
            label="Age"
            keyboardType="number-pad"
            value={age}
            onChangeText={setAge}
            placeholder="26"
          />
          <Input
            label="Bio (optional)"
            value={bio}
            onChangeText={setBio}
            placeholder="What should people know in one line?"
            error={error}
          />
        </View>
      </StepShell>
    </>
  );
}
