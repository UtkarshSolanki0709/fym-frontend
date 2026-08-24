import { ProfileForm } from '@/components/profile/ProfileForm';
import { Text } from '@/components/ui/text';
import { loadUserProfile } from '@/lib/userProfile';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const INK = '#14213D';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    void loadUserProfile();
  }, []);

  return (
    <View className="flex-1 bg-fym-surface" style={{ paddingTop: insets.top }}>
      <StatusBar style="dark" />
      <View className="flex-row items-center gap-2 border-b border-border px-edge py-3">
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Go back">
          <ChevronLeft size={28} color={INK} />
        </Pressable>
        <Text variant="h2" className="text-fym-ink">
          Edit details
        </Text>
      </View>
      <ScrollView
        contentContainerClassName="px-edge py-6 pb-16"
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="lead" className="mb-6">
          Changes save as you type. Name, age, and bio sync when you are signed in.
        </Text>
        <ProfileForm onSaved={() => router.back()} />
      </ScrollView>
    </View>
  );
}
