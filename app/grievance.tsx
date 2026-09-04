import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import { ApiError, submitGrievance } from '@/lib/api/client';
import { hasSession } from '@/lib/api/session';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import * as React from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const INK = '#14213D';

const CATEGORIES = [
  'Account or login issue',
  'Report follow-up',
  'Privacy / data request',
  'Billing question',
  'Other',
];

const OFFICER_NAME = process.env.EXPO_PUBLIC_GRIEVANCE_OFFICER ?? '';
const OFFICER_EMAIL = process.env.EXPO_PUBLIC_GRIEVANCE_EMAIL ?? '';

export default function GrievanceScreen() {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = React.useState(CATEGORIES[0]);
  const [description, setDescription] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const submit = async () => {
    if (description.trim().length < 10) {
      Alert.alert('Tell us more', 'Please describe the issue in at least 10 characters.');
      return;
    }
    setBusy(true);
    try {
      if (!(await hasSession())) {
        Alert.alert(
          'Sign in required',
          'Grievances are filed from your account so we can follow up. Sign in and try again.',
        );
        return;
      }
      await submitGrievance({
        category,
        description: description.trim(),
        contact_email: email.trim() || undefined,
      });
      Alert.alert('Grievance received', 'We respond within 30 days as required by law — usually much sooner.', [
        { text: 'Done', onPress: () => router.back() },
      ]);
      setDescription('');
    } catch (e) {
      Alert.alert('Could not submit', e instanceof ApiError ? e.message : 'Try again');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-fym-surface" style={{ paddingTop: insets.top }}>
      <StatusBar style="dark" />
      <View className="flex-row items-center gap-2 border-b-2 border-fym-ink px-edge py-3">
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityLabel="Go back"
          className="p-1"
        >
          <ChevronLeft size={28} color={INK} />
        </Pressable>
        <Text variant="h2" className="text-fym-ink">
          Grievance & reports
        </Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerClassName="px-edge py-5 pb-24" showsVerticalScrollIndicator={false}>
          <Card brutal contentClassName="bg-fym-pastel-yellow/50 p-4">
            <Text className="font-jakarta-extrabold text-sm uppercase text-fym-ink">
              Grievance Officer
            </Text>
            <Text className="mt-2 font-jakarta text-sm text-fym-text-muted">
              {OFFICER_NAME || 'Our Grievance Officer'} handles complaints under the IT Rules, 2021
              and the DPDP Act.
              {OFFICER_EMAIL ? ` Reach them directly at ${OFFICER_EMAIL}, or file below.` : ' File below and we will respond to your account email.'}
            </Text>
            <Text className="mt-2 font-jakarta text-xs text-fym-text-muted">
              Response time: within 30 days of filing.
            </Text>
          </Card>

          <Text variant="h3" className="mt-6">
            File a grievance
          </Text>

          <View className="mt-3 flex-row flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Chip
                key={c}
                label={c}
                tone={category === c ? 'coral' : 'cream'}
                active
                onPress={() => setCategory(c)}
              />
            ))}
          </View>

          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the issue — include any profile names or chat details that help us act"
            placeholderTextColor="#79776E"
            multiline
            maxLength={2000}
            className="mt-4 min-h-32 rounded-card border border-border bg-white px-3 py-2.5 font-jakarta text-sm text-fym-text"
          />

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Reply-to email (optional)"
            placeholderTextColor="#79776E"
            autoCapitalize="none"
            keyboardType="email-address"
            className="mt-3 min-h-11 rounded-card border border-border bg-white px-3 py-2.5 font-jakarta text-sm text-fym-text"
          />

          <View className="mt-5">
            <Button variant="primary" onPress={() => void submit()} disabled={busy}>
              <Text>{busy ? 'Sending…' : 'Submit grievance'}</Text>
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
