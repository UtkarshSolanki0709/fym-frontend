import { parseClasses, Shadow } from '@/components/ui/shadow';
import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Pressable, type PressableProps } from 'react-native';

const buttonVariants = cva(
  'flex-row items-center justify-center gap-2 rounded-pill px-6 py-3.5',
  {
    variants: {
      variant: {
        primary: 'bg-fym-ink',
        secondary: 'bg-fym-surface border border-border',
        ghost: 'bg-transparent px-3 py-2',
        danger: 'bg-destructive',
        gold: 'bg-fym-gold',
        mint: 'bg-fym-mint',
      },
      size: {
        default: 'min-h-12',
        sm: 'min-h-10 px-4 py-2',
        lg: 'min-h-14 px-8',
        icon: 'h-12 w-12 px-0 py-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

const buttonTextVariants = cva('text-left font-jakarta-bold text-sm', {
  variants: {
    variant: {
      primary: 'text-white',
      secondary: 'text-fym-ink',
      ghost: 'text-fym-coral',
      danger: 'text-white',
      gold: 'text-fym-ink',
      mint: 'text-fym-ink',
    },
    size: {
      default: '',
      sm: 'text-xs',
      lg: 'text-base',
      icon: '',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'default',
  },
});

type ButtonProps = PressableProps &
  VariantProps<typeof buttonVariants> & {
    shadowOffset?: number;
    className?: string;
  };

function Button({
  className,
  variant = 'primary',
  size = 'default',
  shadowOffset = 4,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const [pressed, setPressed] = React.useState(false);
  const isGhost = variant === 'ghost';

  const { wrapperClasses, contentClasses } = parseClasses(className);

  const body = (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPressIn={(e) => {
        setPressed(true);
        props.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        props.onPressOut?.(e);
      }}
      className={cn(
        buttonVariants({ variant, size }),
        disabled && 'opacity-50',
        contentClasses
      )}
      {...props}
    >
      {children}
    </Pressable>
  );

  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      {isGhost ? (
        body
      ) : (
        <Shadow
          offset={shadowOffset}
          sunk={pressed || !!disabled}
          className={cn('rounded-pill', wrapperClasses)}
        >
          {body}
        </Shadow>
      )}
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
