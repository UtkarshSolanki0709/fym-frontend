import * as ScreenCapture from 'expo-screen-capture';
import { useEffect } from 'react';
import { Alert, Platform } from 'react-native';

/**
 * Chat-only capture controls. onScreenshot → local alert + caller notifies peer.
 */
export function useScreenGuard(opts: {
  enabled: boolean;
  onScreenshot?: () => void;
}) {
  useEffect(() => {
    if (!opts.enabled) return;

    let sub: { remove: () => void } | undefined;
    (async () => {
      try {
        await ScreenCapture.preventScreenCaptureAsync();
      } catch {
        // Expo Go / unsupported
      }
      sub = ScreenCapture.addScreenshotListener(() => {
        Alert.alert(
          'Screenshot detected',
          Platform.OS === 'ios'
            ? 'iOS cannot block screenshots. Both people in this chat are being cautioned.'
            : 'A screenshot was detected. Both people in this chat are being cautioned.',
        );
        opts.onScreenshot?.();
      });
    })();

    return () => {
      sub?.remove();
      void ScreenCapture.allowScreenCaptureAsync().catch(() => undefined);
    };
  }, [opts.enabled, opts.onScreenshot]);
}
