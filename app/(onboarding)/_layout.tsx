import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F3EFE6' },
        animation: 'slide_from_right',
      }}
    />
  );
}
