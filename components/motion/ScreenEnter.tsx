import { Enter } from '@/lib/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import * as React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

type Variant = 'screen' | 'fade' | 'up' | 'down';

type Props = {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  variant?: Variant;
  /** Stagger index for list rows (variant ignored delays via down+index) */
  delayIndex?: number;
};

/**
 * Mount enter for a screen block. No-op animation when reduce-motion is on.
 */
export function ScreenEnter({
  children,
  className,
  style,
  variant = 'screen',
  delayIndex,
}: Props) {
  const reduced = useReducedMotion();

  const entering =
    delayIndex != null
      ? Enter.stagger(reduced, delayIndex)
      : variant === 'fade'
        ? Enter.screenFade(reduced)
        : variant === 'up'
          ? Enter.up(reduced)
          : variant === 'down'
            ? Enter.down(reduced)
            : Enter.screen(reduced);

  if (reduced || !entering) {
    return (
      <Animated.View className={className} style={style}>
        {children}
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={entering} className={className} style={style}>
      {children}
    </Animated.View>
  );
}
