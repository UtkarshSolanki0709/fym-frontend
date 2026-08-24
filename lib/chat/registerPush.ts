import { registerPushToken } from '@/lib/api/client';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/** Best-effort push token register after login. */
export async function registerForChatPush(): Promise<void> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let final = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      final = status;
    }
    if (final !== 'granted') return;
    const token = (
      await Notifications.getExpoPushTokenAsync().catch(() => ({ data: '' }))
    ).data;
    if (!token) return;
    await registerPushToken(token, Platform.OS);
  } catch {
    // ponytail: push optional until EAS credentials
  }
}
