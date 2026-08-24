import { MS, SPRING_HEART, SPRING_SPADE } from '@/lib/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

type Kind = 'like' | 'super';

type Props = {
  kind: Kind;
  /** Fires after full pulse (~900ms) or immediately if reduced motion */
  onDone?: () => void;
  label?: string;
  sublabel?: string;
};

/**
 * Signature success mask: coral heart or gold spade pulse (~900ms).
 */
export function ActionPulse({ kind, onDone, label, sublabel }: Props) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(reduced ? 1 : 0.6);
  const opacity = useSharedValue(1);
  const doneRef = React.useRef(false);

  const finish = React.useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone?.();
  }, [onDone]);

  React.useEffect(() => {
    doneRef.current = false;
    if (reduced) {
      const t = setTimeout(finish, 120);
      return () => clearTimeout(t);
    }

    const spring = kind === 'super' ? SPRING_SPADE : SPRING_HEART;
    const hold = kind === 'super' ? 280 : 180;

    scale.value = 0.6;
    opacity.value = 1;
    scale.value = withSequence(
      withSpring(1.45, spring),
      withTiming(1, { duration: 160, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: hold }),
      withTiming(0.92, { duration: 120 })
    );
    opacity.value = withSequence(
      withTiming(1, { duration: 80 }),
      withTiming(1, { duration: hold + 320 }),
      withTiming(0, { duration: 200, easing: Easing.out(Easing.quad) }, (finished) => {
        if (finished) runOnJS(finish)();
      })
    );

    // safety timer if callback path fails
    const t = setTimeout(finish, MS.success + 80);
    return () => clearTimeout(t);
  }, [kind, reduced, scale, opacity, finish]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const isSuper = kind === 'super';

  return (
    <View className="items-center justify-center">
      <Animated.View style={style}>
        <View
          className={cn(
            'items-center rounded-card border border-border px-12 py-10',
            isSuper ? 'bg-fym-gold' : 'bg-fym-coral'
          )}
        >
          <Text className="text-6xl">{isSuper ? '♠' : '♥'}</Text>
          <Text
            variant="h2"
            className={cn('mt-3 uppercase', isSuper ? 'text-fym-ink' : 'text-white')}
          >
            {label ?? (isSuper ? 'Spade sent' : 'Heart sent')}
          </Text>
          {sublabel ? (
            <Text
              variant="caption"
              className={cn('mt-1', isSuper ? 'text-fym-ink/70' : 'text-white/80')}
            >
              {sublabel}
            </Text>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}
