import { StepShell } from '@/components/onboarding/StepShell';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ApiError, setOnboardingStep, verifyLiveness } from '@/lib/api/client';
import {
  analyzeFrame,
  STAGES,
  STAGE_INSTRUCTION,
  type Stage,
} from '@/lib/face/verify';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Enter } from '@/lib/motion';
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

const FRAMES_NEEDED = STAGES.length;

function LivenessRing({ active }: { active: boolean }) {
  const reduced = useReducedMotion();
  const pulse = useSharedValue(1);
  React.useEffect(() => {
    if (!active || reduced) {
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
  }, [active, reduced, pulse]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: active ? 0.85 : 0,
  }));
  return (
    <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
      <Animated.View
        style={style}
        className="h-64 w-52 rounded-[999px] border-2 border-fym-mint"
      />
    </View>
  );
}

/** Oval guide — mint while the stage gate is green, coral on a rejection. */
function FaceOval({ state }: { state: 'idle' | 'ok' | 'reject' }) {
  const colorClass =
    state === 'ok' ? 'border-fym-mint' : state === 'reject' ? 'border-fym-coral' : 'border-white/70';
  return (
    <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
      <View className={`h-64 w-52 rounded-[999px] border-2 ${colorClass}`} />
    </View>
  );
}

export default function LivenessScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [stageIdx, setStageIdx] = React.useState(0);
  const [frames, setFrames] = React.useState<string[]>([]);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [rejection, setRejection] = React.useState<string | undefined>();
  const [degraded, setDegraded] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const cameraRef = React.useRef<CameraView>(null);

  const stage: Stage = STAGES[stageIdx];
  const done = frames.length >= FRAMES_NEEDED;

  const capture = async () => {
    if (!cameraRef.current || busy || analyzing || done) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.6,
      });
      const b64 = photo?.base64;
      if (!b64 || !photo?.uri) {
        setError('Camera capture failed');
        return;
      }

      setAnalyzing(true);
      setRejection(undefined);
      const check = await analyzeFrame(photo.uri, photo.width ?? 0, stage);
      if (!check.available) {
        // Native ML Kit module not linked (e.g. Expo Go) — degrade to manual
        // capture; the server still verifies the frames.
        setDegraded(true);
      }
      if (check.available && !check.ok) {
        setRejection(check.reason);
        setAnalyzing(false);
        return;
      }

      const nextFrames = [...frames, b64];
      setFrames(nextFrames);
      setStageIdx(Math.min(stageIdx + 1, FRAMES_NEEDED - 1));
      setAnalyzing(false);
    } catch {
      setAnalyzing(false);
      setError('Camera capture failed');
    }
  };

  React.useEffect(() => {
    if (frames.length >= FRAMES_NEEDED) {
      submitFrames(frames);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames.length]);

  const submitFrames = async (captured: string[]) => {
    setBusy(true);
    setError(undefined);
    try {
      await verifyLiveness(captured);
      await setOnboardingStep('liveness_done');
      router.push('/(onboarding)/interests' as Href);
    } catch (e) {
      setFrames([]);
      setStageIdx(0);
      setError(e instanceof ApiError ? e.message : 'Liveness check failed');
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
        subtitle="We take three quick live photos — straight, a smile, and a little head turn — to confirm it's really you."
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

  const ovalState: 'idle' | 'ok' | 'reject' = rejection
    ? 'reject'
    : analyzing
      ? 'ok'
      : 'idle';

  return (
    <>
      <StatusBar style="dark" />
      <StepShell
        step="liveness"
        title={`Face check\n${Math.min(frames.length + 1, FRAMES_NEEDED)}/${FRAMES_NEEDED}`}
        subtitle="Three quick live checks so we know you're real. Your photos stay private — frames are encrypted and deleted after review."
        footer={
          busy ? (
            <Button size="lg" disabled>
              <Text>Verifying…</Text>
            </Button>
          ) : done ? null : (
            <Button size="lg" onPress={capture} disabled={analyzing}>
              <Text>{analyzing ? 'Checking…' : `Capture ${frames.length + 1} of 3`}</Text>
            </Button>
          )
        }
      >
        <View className="relative overflow-hidden rounded-card border border-border bg-black">
          <CameraView ref={cameraRef} style={{ width: '100%', height: 340 }} facing="front" />
          <LivenessRing active={!busy && !analyzing && !done} />
          <FaceOval state={ovalState} />
          {!done ? (
            <Animated.View
              key={stage + (rejection ?? '')}
              entering={Enter.down(false)}
              className="absolute bottom-3 left-4 right-4 items-center"
              pointerEvents="none"
            >
              <View className="rounded-pill bg-black/60 px-4 py-1.5">
                <Text className="text-center font-jakarta-bold text-xs text-white">
                  {rejection ?? STAGE_INSTRUCTION[stage]}
                </Text>
              </View>
            </Animated.View>
          ) : null}
        </View>

        {degraded ? (
          <Text className="mt-2 font-jakarta-semibold text-xs text-fym-text-muted">
            On-device face check unavailable here — the server will verify your frames.
          </Text>
        ) : null}
        {error ? (
          <Text className="mt-3 font-jakarta-bold text-sm text-red-500">{error}</Text>
        ) : null}

        {frames.length > 0 ? (
          <View className="mt-3 flex-row gap-2">
            {frames.map((b64, i) => (
              <Image
                key={i}
                source={{ uri: `data:image/jpeg;base64,${b64}` }}
                className="h-12 w-12 rounded-lg border border-border"
                accessibilityLabel={`Verification frame ${i + 1}`}
              />
            ))}
          </View>
        ) : null}
      </StepShell>
    </>
  );
}
