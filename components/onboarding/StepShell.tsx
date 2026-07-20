import { Text } from '@/components/ui/text';
import * as React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STEPS = ['liveness', 'basic', 'photos', 'interests', 'quiz'] as const;

type Props = {
  step: (typeof STEPS)[number];
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function StepShell({ step, title, subtitle, children, footer }: Props) {
  const insets = useSafeAreaInsets();
  const idx = STEPS.indexOf(step);

  return (
    <View
      className="flex-1 bg-fym-surface px-edge"
      style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }}
    >
      <View className="mb-6 flex-row gap-1.5">
        {STEPS.map((s, i) => (
          <View
            key={s}
            className={`h-1.5 flex-1 rounded-full ${
              i <= idx ? 'bg-fym-coral' : 'bg-border'
            }`}
          />
        ))}
      </View>
      <Text variant="h1" className="text-fym-ink">
        {title}
      </Text>
      {subtitle ? (
        <Text variant="lead" className="mt-2">
          {subtitle}
        </Text>
      ) : null}
      <View className="mt-6 flex-1">{children}</View>
      {footer ? <View className="mt-4">{footer}</View> : null}
    </View>
  );
}
