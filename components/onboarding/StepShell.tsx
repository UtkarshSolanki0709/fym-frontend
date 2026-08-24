import { ScreenEnter } from '@/components/motion';
import { Text } from '@/components/ui/text';
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

const STEPS = ['liveness', 'basic', 'photos', 'interests', 'quiz'] as const;

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
      <View className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-border">
        <Animated.View className="h-full rounded-full bg-fym-coral" style={barStyle} />
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
