import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Settings, Zap } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MATCHES = [
  { name: 'Alex', uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80', online: true },
  { name: 'Jordan', uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80', online: true },
  { name: 'Sam', uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80', online: false },
  { name: 'Casey', uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80', online: false },
];

type ConvStatus = 'active' | 'unread' | 'read';

const CONVOS: {
  name: string;
  preview: string;
  uri: string;
  time: string;
  status: ConvStatus;
  online: boolean;
}[] = [
  {
    name: 'Taylor',
    preview: "Let's meet up at the new gallery tonight!",
    uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
    time: 'Just now',
    status: 'active',
    online: true,
  },
  {
    name: 'Morgan',
    preview: 'Did you see that post I sent?',
    uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    time: '2h ago',
    status: 'unread',
    online: true,
  },
  {
    name: 'Riley',
    preview: 'Yeah, that sounds like a plan.',
    uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    time: 'Yesterday',
    status: 'read',
    online: false,
  },
  {
    name: 'Quinn',
    preview: 'Haha 😂',
    uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
    time: 'Mon',
    status: 'read',
    online: false,
  },
];

const shadowStyle = {
  shadowColor: '#14213D',
  shadowOffset: { width: 3, height: 3 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 3,
} as const;

export default function MatchesScreen() {
  const insets = useSafeAreaInsets();
  const [pressedMatch, setPressedMatch] = useState<string | null>(null);
  const [pressedConv, setPressedConv] = useState<string | null>(null);

  return (
    <View className="flex-1 bg-fym-surface">
      <StatusBar style="dark" />

      <View
        className="flex-row items-center justify-between border-b-brutal border-fym-ink bg-fym-surface px-gutter"
        style={{ paddingTop: insets.top, paddingBottom: 8 }}
      >
        <Pressable className="p-2 active:translate-x-[1px] active:translate-y-[1px]">
          <Zap size={24} color="#14213D" />
        </Pressable>
        <Text className="font-display-extrabold text-2xl uppercase tracking-tighter text-fym-ink">
          FYM
        </Text>
        <Pressable className="p-2 active:translate-x-[1px] active:translate-y-[1px]">
          <Settings size={24} color="#14213D" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerClassName="px-gutter pb-36"
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-6">
          <Text className="border-b-2 border-fym-ink pb-1 font-jakarta-extrabold text-[11px] uppercase tracking-[2px] text-fym-brand">
            New Matches
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="-mx-gutter mt-3"
            contentContainerClassName="px-gutter gap-6 pb-3"
          >
            {MATCHES.map((m) => {
              const isPressed = pressedMatch === m.name;
              return (
                <Pressable
                  key={m.name}
                  onPressIn={() => setPressedMatch(m.name)}
                  onPressOut={() => setPressedMatch(null)}
                  className="items-center"
                  style={
                    isPressed
                      ? { transform: [{ translateX: 2 }, { translateY: 2 }] }
                      : undefined
                  }
                >
                  <View
                    className="h-20 w-20 rounded-full"
                    style={!isPressed ? shadowStyle : undefined}
                  >
                    <View className="h-full w-full overflow-hidden rounded-full border-brutal border-fym-ink">
                      <Image
                        source={{ uri: m.uri }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                      />
                    </View>
                    {m.online && (
                      <View className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-fym-ink bg-fym-mint" />
                    )}
                  </View>
                  <Text className="mt-1 font-jakarta-bold text-xs text-fym-ink">
                    {m.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View className="mt-10">
          <Text className="border-b-2 border-fym-ink pb-1 font-jakarta-extrabold text-[11px] uppercase tracking-[2px] text-fym-brand">
            Conversations
          </Text>
          <View className="mt-3 gap-6">
            {CONVOS.map((c) => {
              const isPressed = pressedConv === c.name;
              const isRead = c.status === 'read';

              return (
                <Pressable
                  key={c.name}
                  onPressIn={() => setPressedConv(c.name)}
                  onPressOut={() => setPressedConv(null)}
                >
                  <Card
                    brutal
                    sunk={isPressed}
                    reverse={c.status === 'unread'}
                    contentClassName={cn(
                      'flex-row items-center gap-3 p-3',
                      c.status === 'active' && 'bg-fym-cream',
                      isRead && 'opacity-70'
                    )}
                  >
                    {c.status === 'active' && (
                      <View className="absolute -right-3 -top-3 h-10 w-10 rounded-full border-brutal border-fym-ink bg-fym-mint" />
                    )}
                    <View className="relative z-10 flex-row items-center gap-3">
                      <View className="relative h-16 w-16 flex-shrink-0">
                        <View
                          className={cn(
                            'h-full w-full overflow-hidden rounded-full border-2 border-fym-ink',
                            isRead && 'grayscale'
                          )}
                        >
                          <Image
                            source={{ uri: c.uri }}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="cover"
                          />
                        </View>
                        {c.online && (
                          <View className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border border-fym-ink bg-fym-mint" />
                        )}
                      </View>
                      <View className="flex-1">
                        <View className="mb-0.5 flex-row items-center justify-between">
                          <View className="flex-row items-center gap-1.5">
                            <Text className="font-jakarta-bold text-sm text-fym-ink">
                              {c.name}
                            </Text>
                            {c.status === 'unread' && (
                              <View className="h-2 w-2 rounded-full border border-fym-ink bg-fym-mint" />
                            )}
                          </View>
                          <Text className="font-jakarta-semibold text-[10px] text-fym-text-muted">
                            {c.time}
                          </Text>
                        </View>
                        <Text
                          className={cn(
                            'text-sm',
                            c.status === 'unread'
                              ? 'font-jakarta-bold text-fym-ink'
                              : 'font-jakarta text-fym-text-muted'
                          )}
                          numberOfLines={1}
                        >
                          {c.preview}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}


