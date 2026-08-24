import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  containerClassName?: string;
};

function Input({
  label,
  error,
  className,
  containerClassName,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const [focused, setFocused] = React.useState(false);

  return (
    <View className={cn('w-full gap-1.5', containerClassName)}>
      {label ? (
        <Text className="text-left font-jakarta-bold text-sm uppercase tracking-wide text-fym-text-muted">
          {label}
        </Text>
      ) : null}
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#79776E"
        className={cn(
          'rounded-card border bg-white px-4 py-3.5 font-jakarta text-base text-fym-text text-left',
          focused ? 'border-fym-coral' : 'border-border',
          error && 'border-destructive',
          className
        )}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
      {error ? (
        <Text className="text-left font-jakarta-semibold text-xs text-destructive">{error}</Text>
      ) : null}
    </View>
  );
}

export { Input };
export type { InputProps };
