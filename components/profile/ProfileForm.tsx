import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import {
  getUserProfile,
  patchUserProfile,
  type UserProfile,
} from '@/lib/userProfile';
import * as React from 'react';
import { View } from 'react-native';

type Props = {
  /** Called after each successful field commit (real-time parent refresh). */
  onUpdated?: (p: UserProfile) => void;
  /** Show save footer (default true). Live patches still run on blur/save. */
  showSave?: boolean;
  onSaved?: (p: UserProfile) => void;
};

/**
 * Edit display name, age, bio, location. Patches local store immediately;
 * server when session exists.
 */
export function ProfileForm({ onUpdated, onSaved, showSave = true }: Props) {
  const initial = getUserProfile();
  const [name, setName] = React.useState(initial.display_name);
  const [age, setAge] = React.useState(
    initial.age != null ? String(initial.age) : '',
  );
  const [bio, setBio] = React.useState(initial.bio);
  const [location, setLocation] = React.useState(initial.location);
  const [email, setEmail] = React.useState(initial.email);
  const [error, setError] = React.useState<string | undefined>();
  const [busy, setBusy] = React.useState(false);
  const [hint, setHint] = React.useState<string | undefined>();

  const apply = React.useCallback(
    async (partial: Partial<UserProfile>) => {
      setError(undefined);
      const next = await patchUserProfile(partial);
      onUpdated?.(next);
      setHint('Saved');
      return next;
    },
    [onUpdated],
  );

  const commitField = async () => {
    const ageN = age.trim() ? parseInt(age, 10) : null;
    if (name.trim().length < 2) {
      setError('Name needs at least 2 characters');
      return;
    }
    if (ageN != null && (!Number.isFinite(ageN) || ageN < 18 || ageN > 99)) {
      setError('Age must be 18–99');
      return;
    }
    setBusy(true);
    try {
      const next = await apply({
        display_name: name.trim(),
        age: ageN,
        bio: bio.trim(),
        location: location.trim() || 'Delhi NCR',
        email: email.trim(),
      });
      onSaved?.(next);
    } finally {
      setBusy(false);
    }
  };

  // Live-ish: debounce patch when fields change after first paint
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      const ageN = age.trim() ? parseInt(age, 10) : null;
      if (name.trim().length < 2) return;
      if (ageN != null && (!Number.isFinite(ageN) || ageN < 18 || ageN > 99)) return;
      void apply({
        display_name: name.trim(),
        age: ageN,
        bio: bio.trim(),
        location: location.trim() || 'Delhi NCR',
        email: email.trim(),
      });
    }, 400);
    return () => clearTimeout(t);
  }, [name, age, bio, location, email, apply]);

  return (
    <View className="gap-4">
      <Input
        label="Display name"
        value={name}
        onChangeText={setName}
        placeholder="Ananya"
        autoCapitalize="words"
      />
      <Input
        label="Age"
        keyboardType="number-pad"
        value={age}
        onChangeText={setAge}
        placeholder="26"
      />
      <Input
        label="Bio"
        value={bio}
        onChangeText={setBio}
        placeholder="One line about you"
      />
      <Input
        label="Location"
        value={location}
        onChangeText={setLocation}
        placeholder="Delhi NCR"
      />
      <Input
        label="Email (private)"
        value={email}
        onChangeText={setEmail}
        placeholder="you@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        error={error}
      />
      {hint && !error ? (
        <Text variant="caption" className="text-fym-ink">
          {hint}
        </Text>
      ) : null}
      {showSave ? (
        <Button size="lg" disabled={busy} onPress={() => void commitField()}>
          <Text>{busy ? 'Saving…' : 'Save profile'}</Text>
        </Button>
      ) : null}
    </View>
  );
}
