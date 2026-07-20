import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Pressable, type PressableProps } from 'react-native';

const chipVariants = cva(
  'rounded-pill border border-border px-3 py-1.5 active:scale-105',
  {
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
  }
);

type ChipProps = PressableProps &
  VariantProps<typeof chipVariants> & {
    label: string;
    className?: string;
  };

function Chip({ label, tone, active = true, className, ...props }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className={cn(chipVariants({ tone, active }), className)}
      {...props}
    >
      <Text
        className={cn(
          'text-left font-jakarta-bold text-xs uppercase tracking-wide text-fym-ink',
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export { Chip, chipVariants };
export type { ChipProps };
