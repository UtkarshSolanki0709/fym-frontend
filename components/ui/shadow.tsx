import { BRAND } from '@/lib/theme';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { View, type ViewProps } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

const INK = BRAND.ink;

type ShadowProps = ViewProps & {
  offset?: number;
  sunk?: boolean;
  brutal?: boolean;
  contentClassName?: string;
  shadowClassName?: string;
};

function parseClasses(className?: string) {
  const wrapperClasses: string[] = [];
  const contentClasses: string[] = [];
  const roundedClasses: string[] = [];

  if (!className) {
    return { wrapperClasses: '', contentClasses: '', roundedClasses: '' };
  }

  const classes = className.split(/\s+/);
  classes.forEach((c) => {
    if (!c) return;

    if (c.startsWith('rounded') || c.includes('rounded-')) {
      roundedClasses.push(c);
    } else if (
      c.startsWith('m-') ||
      c.startsWith('mx-') ||
      c.startsWith('my-') ||
      c.startsWith('mt-') ||
      c.startsWith('mr-') ||
      c.startsWith('mb-') ||
      c.startsWith('ml-')
    ) {
      wrapperClasses.push(c);
    } else if (
      c.startsWith('w-') ||
      c.startsWith('h-') ||
      c.startsWith('min-w-') ||
      c.startsWith('max-w-') ||
      c.startsWith('min-h-') ||
      c.startsWith('max-h-') ||
      c.startsWith('aspect-')
    ) {
      wrapperClasses.push(c);
    } else if (
      c === 'flex-1' ||
      c === 'flex-none' ||
      c.startsWith('flex-[') ||
      c.startsWith('shrink') ||
      c.startsWith('grow') ||
      c.startsWith('self-')
    ) {
      wrapperClasses.push(c);
    } else if (
      c === 'absolute' ||
      c === 'relative' ||
      c.startsWith('top-') ||
      c.startsWith('bottom-') ||
      c.startsWith('left-') ||
      c.startsWith('right-') ||
      c.startsWith('z-')
    ) {
      wrapperClasses.push(c);
    } else {
      contentClasses.push(c);
    }
  });

  return {
    wrapperClasses: wrapperClasses.join(' '),
    contentClasses: contentClasses.join(' '),
    roundedClasses: roundedClasses.join(' '),
  };
}

function Shadow({
  brutal = false,
  offset = 4,
  sunk = false,
  className,
  contentClassName,
  children,
  style,
  ...props
}: ShadowProps) {
  const { wrapperClasses, contentClasses, roundedClasses } = parseClasses(className);

  const hasFlexOrSize = wrapperClasses.split(/\s+/).some((c) => {
    return c === 'flex-1' || c.startsWith('h-') || c.startsWith('w-');
  });

  const shadowStyle = React.useMemo(() => {
    if (!brutal) {
      return {
        shadowColor: '#1A0E05',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 2,
      };
    }
    if (sunk) {
      return {
        shadowColor: INK,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
      };
    }
    return {
      shadowColor: INK,
      shadowOffset: { width: offset, height: offset },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: offset,
    };
  }, [brutal, sunk, offset]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!brutal) {
      return {
        transform: [
          {
            scale: withSpring(sunk ? 0.97 : 1, {
              damping: 15,
              stiffness: 150,
            }),
          },
        ],
      };
    }
    return {
      transform: [
        {
          translateX: withSpring(sunk ? offset : 0, {
            damping: 15,
            stiffness: 200,
          }),
        },
        {
          translateY: withSpring(sunk ? offset : 0, {
            damping: 15,
            stiffness: 200,
          }),
        },
      ],
    };
  });

  return (
    <View
      className={cn('relative', wrapperClasses, roundedClasses)}
      style={[
        style,
        shadowStyle,
        brutal && { overflow: 'visible' },
      ]}
      {...props}
    >
      <Animated.View
        className={cn(
          roundedClasses,
          contentClasses,
          hasFlexOrSize && 'w-full h-full',
          contentClassName
        )}
        style={animatedStyle}
      >
        {children}
      </Animated.View>
    </View>
  );
}

export { Shadow, parseClasses };
export type { ShadowProps };
