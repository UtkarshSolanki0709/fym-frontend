import { Shadow } from '@/components/ui/shadow';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { View, type ViewProps } from 'react-native';

type CardProps = ViewProps & {
  offset?: number;
  sunk?: boolean;
  brutal?: boolean;
  reverse?: boolean;
  contentClassName?: string;
};

function Card({
  brutal = false,
  reverse = false,
  offset = 4,
  sunk = false,
  className,
  contentClassName,
  children,
  ...props
}: CardProps) {
  const radiusStyle = React.useMemo(() => {
    if (!brutal) return {};
    if (reverse) {
      return {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 4,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 4,
      };
    }
    return {
      borderTopLeftRadius: 4,
      borderTopRightRadius: 24,
      borderBottomLeftRadius: 4,
      borderBottomRightRadius: 4,
    };
  }, [brutal, reverse]);

  return (
    <Shadow
      brutal={brutal}
      offset={offset}
      sunk={sunk}
      className={cn(!brutal && 'rounded-card', className)}
      {...props}
    >
      <View
        className={cn(
          'overflow-hidden border bg-white',
          brutal ? 'border-brutal border-fym-ink' : 'rounded-card border-border',
          contentClassName
        )}
        style={radiusStyle}
      >
        {children}
      </View>
    </Shadow>
  );
}

export { Card };
export type { CardProps };
