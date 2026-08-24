import { NAV } from '@/lib/motion';
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F3EFE6' },
        animation: NAV.onboarding.animation,
        animationDuration: NAV.onboarding.animationDuration,
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
      }}
    />
  );
}
