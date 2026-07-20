import { cn } from '@/lib/utils';
import { Slot } from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Platform, Text as RNText, type Role } from 'react-native';

const textVariants = cva(
  cn('text-left text-fym-text font-jakarta', Platform.select({ web: 'select-text' })),
  {
    variants: {
      variant: {
        default: 'text-base',
        display: 'font-display-extrabold text-4xl leading-tight tracking-tight',
        h1: 'font-display-extrabold text-3xl leading-tight tracking-tight',
        h2: 'font-display text-2xl leading-snug',
        h3: 'font-jakarta-bold text-xl',
        h4: 'font-jakarta-bold text-lg',
        body: 'font-jakarta text-base leading-relaxed',
        lead: 'font-jakarta text-lg text-fym-text-muted leading-relaxed',
        label: 'font-jakarta-bold text-sm uppercase tracking-wide',
        caption: 'font-jakarta-semibold text-xs text-fym-text-muted',
        muted: 'text-sm text-fym-text-muted',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

type TextVariantProps = VariantProps<typeof textVariants>;
type TextVariant = NonNullable<TextVariantProps['variant']>;

const ROLE: Partial<Record<TextVariant, Role>> = {
  display: 'heading',
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
};

const ARIA_LEVEL: Partial<Record<TextVariant, string>> = {
  display: '1',
  h1: '1',
  h2: '2',
  h3: '3',
  h4: '4',
};

const TextClassContext = React.createContext<string | undefined>(undefined);

function Text({
  className,
  asChild = false,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof RNText> &
  React.RefAttributes<typeof RNText> &
  TextVariantProps & {
    asChild?: boolean;
  }) {
  const textClass = React.useContext(TextClassContext);
  const Component = asChild ? Slot : RNText;
  return (
    <Component
      className={cn(textVariants({ variant }), textClass, className)}
      role={variant ? ROLE[variant] : undefined}
      aria-level={variant ? ARIA_LEVEL[variant] : undefined}
      {...props}
    />
  );
}

export { Text, TextClassContext };
