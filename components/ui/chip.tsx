import { SPRING_CHIP } from '@/lib/motion';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Pressable, type PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const chipVariants = cva('rounded-pill border border-border px-3 py-1.5', {
  variants: {
    tone: {
      pink: 'bg-fym-pastel-pink',
      blue: 'bg-fym-pastel-blue',
      yellow: 'bg-fym-pastel-yellow',
      green: 'bg-fym-pastel-green',
      mint: 'bg-fym-mint',
      gold: 'bg-fym-gold',
      cream: 'bg-fym-cream',
      coral: 'bg-fym-coral',
    },
    active: {
      true: '',
      false: 'bg-transparent opacity-70',
    },
  },
  defaultVariants: {
    tone: 'pink',
    active: true,
  },
});

type ChipProps = PressableProps &
  VariantProps<typeof chipVariants> & {
    label: string;
    className?: string;
  };

function Chip({ label, tone, active = true, className, onPressIn, onPressOut, onPress, ...props }: ChipProps) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      accessibilityRole="button"
      onPressIn={(e) => {
        scale.value = withTiming(0.96, { duration: 80 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        onPressOut?.(e);
      }}
      onPress={(e) => {
        scale.value = withSequence(withSpring(1.08, SPRING_CHIP), withSpring(1, SPRING_CHIP));
        onPress?.(e);
      }}
      {...props}
    >
      <Animated.View className={cn(chipVariants({ tone, active }), className)} style={style}>
        <Text className="text-left font-jakarta-bold text-xs uppercase tracking-wide text-fym-ink">
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export { Chip, chipVariants };
export type { ChipProps };
