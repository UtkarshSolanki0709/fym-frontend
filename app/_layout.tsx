import {
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  DMSans_800ExtraBold,
} from '@expo-google-fonts/dm-sans';
import {
  Fraunces_700Bold,
  Fraunces_800ExtraBold,
} from '@expo-google-fonts/fraunces';
import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AnimatedSplash } from '@/components/motion';
import { hasSession } from '@/lib/api/session';
import { registerForChatPush } from '@/lib/chat/registerPush';
import { NAV } from '@/lib/motion';
import { BRAND, NAV_THEME } from '@/lib/theme';

import '../global.css';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

// Foreground presentation — without this, pushes arrive silently on Android.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Best-effort push registration once a session exists (permission prompt included). */
function usePushRegistration(splashDone: boolean) {
  useEffect(() => {
    if (!splashDone) return;
    let cancelled = false;
    void hasSession().then((authed) => {
      if (authed && !cancelled) void registerForChatPush();
    });
    return () => {
      cancelled = true;
    };
  }, [splashDone]);
}

export default function RootLayout() {
  const [loaded] = useFonts({
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    DMSans_800ExtraBold,
    Fraunces_700Bold,
    Fraunces_800ExtraBold,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [loaded]);

  const [splashDone, setSplashDone] = useState(false);
  usePushRegistration(splashDone);

  // Keep a plain dark view underneath until the splash overlay finishes
  // its own exit animation — avoids a white flash on first render.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Dark base — visible only during the splash overlay's exit fade */}
      {!splashDone && <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: '#1A0A2E' }} />}

      {/* Animated in-app splash — exits once fonts are loaded */}
      {!splashDone && (
        <AnimatedSplash
          ready={loaded}
          onFinished={() => setSplashDone(true)}
        />
      )}

      <SafeAreaProvider>
        <ErrorBoundary>
          <ThemeProvider value={NAV_THEME}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: BRAND.surface },
                animation: NAV.root.animation,
                animationDuration: NAV.root.animationDuration,
              }}
            >
              <Stack.Screen name="index" options={{ animation: 'none', title: 'FYM — Find Your Mate' }} />
              <Stack.Screen name="(auth)" options={NAV.auth} />
              <Stack.Screen name="(onboarding)" options={NAV.onboarding} />
              <Stack.Screen
                name="(tabs)"
                options={{ animation: 'fade', animationDuration: NAV.root.animationDuration, title: 'Discover' }}
              />
              <Stack.Screen
                name="settings"
                options={{ animation: 'slide_from_right', animationDuration: 220, title: 'Settings' }}
              />
              <Stack.Screen
                name="edit-profile"
                options={{ animation: 'slide_from_bottom', animationDuration: 240, title: 'Edit Profile' }}
              />
              <Stack.Screen
                name="chat/[roomId]"
                options={{ animation: 'slide_from_right', animationDuration: 220, title: 'Chat' }}
              />
              <Stack.Screen
                name="grievance"
                options={{ animation: 'slide_from_right', animationDuration: 220, title: 'Grievance' }}
              />
            </Stack>
          </ThemeProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
