import { ScreenEnter } from '@/components/motion';
import { Text } from '@/components/ui/text';
import { Illustration } from '@/components/ui/illustration';
import { MS } from '@/lib/motion';
import * as React from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 2026-09-05: face check moved after photos so the server can compare the
// live frames against the uploaded photos (see docs/FACE_VERIFICATION.md)
const STEPS = ['basic', 'photos', 'liveness', 'interests', 'quiz'] as const;

type Props = {
  step: (typeof STEPS)[number];
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function StepShell({ step, title, subtitle, children, footer }: Props) {
  const insets = useSafeAreaInsets();
  const idx = STEPS.indexOf(step);
  const progress = useSharedValue((idx + 1) / STEPS.length);

  React.useEffect(() => {
    progress.value = withTiming((idx + 1) / STEPS.length, {
      duration: MS.ui,
      easing: Easing.out(Easing.cubic),
    });
  }, [idx, progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View
      className="flex-1 bg-fym-surface px-edge"
      style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }}
    >
      <View className="mb-6 flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-card border-brutal border-fym-ink bg-fym-cream shadow-brutal">
          <Illustration name="heartBannerPole" size={24} />
        </View>
        <View className="h-2 flex-1 overflow-hidden rounded-full border border-fym-ink/20 bg-border">
          <Animated.View className="h-full rounded-full bg-fym-coral" style={barStyle} />
        </View>
      </View>

      <ScreenEnter variant="down">
        <Text variant="h1" className="text-fym-ink">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="lead" className="mt-2">
            {subtitle}
          </Text>
        ) : null}
      </ScreenEnter>

      <ScreenEnter variant="fade" className="mt-6 flex-1">
        {children}
      </ScreenEnter>

      {footer ? (
        <ScreenEnter variant="up" className="mt-4">
          {footer}
        </ScreenEnter>
      ) : null}
    </View>
  );
}
