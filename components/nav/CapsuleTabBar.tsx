import { Shadow } from '@/components/ui/shadow';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { Compass, Heart, MessageCircle, User } from 'lucide-react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LABELS: Record<string, string> = {
  discovery: 'Home',
  likes: 'Likes',
  matches: 'Chat',
  profile: 'You',
};

const ICONS: Record<string, React.ComponentType<any>> = {
  discovery: Compass,
  likes: Heart,
  matches: MessageCircle,
  profile: User,
};

/** Floating sleek iOS capsule tab bar */
function CapsuleTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [trackW, setTrackW] = React.useState(0);
  const indexSV = useSharedValue(state.index);

  React.useEffect(() => {
    indexSV.value = withTiming(state.index, { duration: 200 });
  }, [state.index, indexSV]);

  const tabCount = state.routes.length;

  const blobStyle = useAnimatedStyle(() => {
    const slot = trackW > 0 ? trackW / tabCount : 0;
    return {
      transform: [{ translateX: indexSV.value * slot + (slot - 40) / 2 }],
      opacity: trackW > 0 ? 1 : 0,
    };
  });

  const circleStyle = useAnimatedStyle(() => {
    const isLikes = state.index === 1;
    return {
      opacity: withTiming(isLikes ? 0 : 1, { duration: 150 }),
      transform: [{ scale: withTiming(isLikes ? 0.6 : 1, { duration: 150 }) }],
    };
  }, [state.index]);

  const heartStyle = useAnimatedStyle(() => {
    const isLikes = state.index === 1;
    return {
      opacity: withTiming(isLikes ? 1 : 0, { duration: 150 }),
      transform: [{ scale: withTiming(isLikes ? 1 : 0.6, { duration: 150 }) }],
    };
  }, [state.index]);

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-4 right-4"
      style={{ bottom: Math.max(insets.bottom, 12) }}
    >
      <Shadow className="rounded-pill" contentClassName="bg-white">
        <View
          className="relative flex-row items-center rounded-pill border border-border bg-white px-1 py-1"
          onLayout={(e) => setTrackW(e.nativeEvent.layout.width - 8)}
        >
          <Animated.View
            className="absolute left-1 top-[8px] h-10 w-10 items-center justify-center"
            style={blobStyle}
          >
            {/* Circle background for non-likes tabs */}
            <Animated.View
              style={circleStyle}
              className="absolute inset-0 rounded-full bg-fym-coral"
            />
            {/* Heart background for likes tab */}
            <Animated.View
              style={heartStyle}
              className="absolute inset-0 items-center justify-center"
            >
              <Heart size={40} color="#F0A020" fill="#F0A020" />
            </Animated.View>
          </Animated.View>

          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const { options } = descriptors[route.key];
            const label = LABELS[route.name] ?? options.title ?? route.name;
            const IconComponent = ICONS[route.name];
            const hasNotification = route.name === 'matches';

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={focused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!focused && !event.defaultPrevented) {
                    navigation.navigate(route.name, route.params);
                  }
                }}
                className="z-10 h-14 flex-1 items-center justify-start pt-1"
              >
                <View className="h-10 w-10 items-center justify-center">
                  {IconComponent ? (
                    <IconComponent
                      size={20}
                      color={focused ? '#FFFFFF' : '#7C756E'}
                      strokeWidth={focused ? 2.5 : 2}
                      fill={focused ? '#FFFFFF' : 'none'}
                    />
                  ) : null}
                  {hasNotification && (
                    <View className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full border border-white bg-fym-coral" />
                  )}
                </View>
                <Text
                  className={cn(
                    'mt-0.5 font-jakarta-bold text-[9px] uppercase tracking-wide',
                    focused ? 'text-fym-coral' : 'text-fym-text-muted'
                  )}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Shadow>
    </View>
  );
}

export { CapsuleTabBar };


