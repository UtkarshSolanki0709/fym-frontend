import { ScreenEnter } from '@/components/motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BLUR_TILES = [
  {
    uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=60',
    h: 180,
  },
  {
    uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=60',
    h: 220,
  },
  {
    uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=60',
    h: 200,
  },
  {
    uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=60',
    h: 160,
  },
];

export default function LikesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-fym-surface" style={{ paddingTop: insets.top }}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerClassName="px-edge pb-36"
        showsVerticalScrollIndicator={false}
      >
        <ScreenEnter variant="down">
          <Text className="mt-2 font-jakarta-extrabold text-[11px] uppercase tracking-[2px] text-fym-brand">
            Likes
          </Text>
          <Text variant="h1">Who liked you</Text>
          <Text variant="lead" className="mt-1">
            Free accounts see blurred photos. Upgrade to see who it is.
          </Text>
        </ScreenEnter>

        <View className="mt-6 flex-row flex-wrap justify-between gap-y-3">
          {BLUR_TILES.map((tile, i) => (
            <ScreenEnter key={i} delayIndex={i} style={{ width: '48%' }}>
              <Card offset={4}>
                <View style={{ height: tile.h }} className="relative overflow-hidden">
                  <Image
                    source={{ uri: tile.uri }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    blurRadius={28}
                  />
                  <View className="absolute inset-0 bg-fym-pastel-lavender/30" />
                </View>
              </Card>
            </ScreenEnter>
          ))}
        </View>

        <ScreenEnter variant="up" delayIndex={4} className="mt-8">
          <Card contentClassName="items-center bg-fym-pastel-pink p-6">
            <Text variant="h3" className="text-center">
              Level up to Plus
            </Text>
            <Text variant="caption" className="mt-2 text-center text-fym-ink">
              ₹299/mo · see who liked you · 100 profiles/day
            </Text>
            <View className="mt-4 w-full">
              <Button
                variant="primary"
                onPress={() =>
                  Alert.alert(
                    'FYM Plus',
                    '₹299/mo unlocks who liked you and 100 profiles/day. Payments wire up with RevenueCat next.',
                  )
                }
              >
                <Text>Unlock likes</Text>
              </Button>
            </View>
          </Card>
        </ScreenEnter>
      </ScrollView>
    </View>
  );
}
