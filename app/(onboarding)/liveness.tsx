import { StepShell } from '@/components/onboarding/StepShell';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ApiError, setOnboardingStep, verifyLiveness } from '@/lib/api/client';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Image, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const FRAMES_NEEDED = 3;

function LivenessRing({ active }: { active: boolean }) {
  const pulse = useSharedValue(1);
  React.useEffect(() => {
    if (!active) {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, [active, pulse]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: active ? 0.85 : 0,
  }));
  return (
    <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
      <Animated.View
        style={style}
        className="h-48 w-48 rounded-full border-2 border-fym-mint"
      />
    </View>
  );
}

export default function LivenessScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [captured, setCaptured] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const cameraRef = React.useRef<CameraView>(null);

  const capture = async () => {
    if (!cameraRef.current || busy) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true });
      const b64 = photo?.base64;
      if (b64) {
        setCaptured((prev) => [...prev, b64]);
      }
    } catch {
      setError('Camera capture failed');
    }
  };

  React.useEffect(() => {
    if (captured.length >= FRAMES_NEEDED) {
      submitFrames(captured);
    }
  }, [captured.length]);

  const submitFrames = async (frames: string[]) => {
    setBusy(true);
    setError(undefined);
    try {
      await verifyLiveness(frames);
      await setOnboardingStep('liveness_done');
      router.push('/(onboarding)/basic-info' as Href);
    } catch (e) {
      setCaptured([]);
      setError(e instanceof ApiError ? e.message : 'Liveness check failed');
    } finally {
      setBusy(false);
    }
  };

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-fym-surface">
        <Text variant="caption">Camera loading…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <StepShell
        step="liveness"
        title="Camera access"
        subtitle="We take three short photos to confirm you are a real person."
        footer={
          <Button size="lg" onPress={requestPermission}>
            <Text>Allow camera</Text>
          </Button>
        }
      >
        <View className="flex-1 items-center justify-center rounded-card border border-dashed border-border bg-white p-8">
          <Text className="text-center font-jakarta-bold text-fym-text-muted">
            Camera permission needed
          </Text>
        </View>
      </StepShell>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <StepShell
        step="liveness"
        title={`Face check\n${captured.length}/${FRAMES_NEEDED}`}
        subtitle="Look at the camera and capture three frames from slightly different angles."
        footer={
          busy ? (
            <Button size="lg" disabled>
              <Text>Verifying…</Text>
            </Button>
          ) : captured.length >= FRAMES_NEEDED ? null : (
            <Button size="lg" onPress={capture}>
              <Text>Capture frame {captured.length + 1}</Text>
            </Button>
          )
        }
      >
        <View className="relative overflow-hidden rounded-card border border-border bg-black">
          <CameraView ref={cameraRef} style={{ width: '100%', height: 320 }} facing="front" />
          <LivenessRing active={!busy && captured.length < FRAMES_NEEDED} />
        </View>
        {error ? (
          <Text className="mt-3 font-jakarta-bold text-sm text-red-500">{error}</Text>
        ) : null}
        {captured.length > 0 ? (
          <View className="mt-3 flex-row gap-2">
            {captured.map((b64, i) => (
              <Image
                key={i}
                source={{ uri: `data:image/jpeg;base64,${b64}` }}
                className="h-12 w-12 rounded-lg border border-border"
                accessibilityLabel={`Liveness frame ${i + 1}`}
              />
            ))}
          </View>
        ) : null}
      </StepShell>
    </>
  );
}