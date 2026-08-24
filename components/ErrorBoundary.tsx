import * as React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';

type State = { error: Error | null; retryKey: number };

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onRetry?: () => void },
  State
> {
  state: State = { error: null, retryKey: 0 };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  handleRetry = () => {
    this.setState((prev) => ({ error: null, retryKey: prev.retryKey + 1 }));
    this.props.onRetry?.();
  };

  render() {
    if (this.state.error) {
      return (
        <View className="flex-1 items-center justify-center bg-fym-surface px-6">
          <Text variant="h2" className="text-fym-brand">
            Something went wrong
          </Text>
          <Text variant="caption" className="mt-2 text-center">
            {this.state.error.message}
          </Text>
          <View className="mt-6">
            <Button onPress={this.handleRetry}>
              <Text>Try again</Text>
            </Button>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}