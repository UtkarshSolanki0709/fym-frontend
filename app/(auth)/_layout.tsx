import { NAV } from '@/lib/motion';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F3EFE6' },
        animation: NAV.auth.animation,
        animationDuration: NAV.auth.animationDuration,
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
      }}
    >
      <Stack.Screen name="welcome" options={{ animation: 'fade', animationDuration: 220 }} />
      <Stack.Screen name="auth" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="otp-verify" options={{ animation: 'slide_from_bottom', animationDuration: 240 }} />
    </Stack>
  );
}
