import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Enter } from '@/lib/motion';
import { Image } from 'expo-image';
import { Heart } from 'lucide-react-native';
import * as React from 'react';
import { Modal, Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';

type MatchPopupProps = {
  matchName: string;
  matchPhoto: string | null;
  onSayHi: () => void;
  onKeepSwiping: () => void;
};

/** Full-screen "It's a Match!" celebration. Dismiss-only via actions —
 *  a match is not something users should be able to accidentally swipe away. */
export function MatchPopup({
  matchName,
  matchPhoto,
  onSayHi,
  onKeepSwiping,
}: MatchPopupProps) {
  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <Pressable className="flex-1 justify-end bg-fym-ink/70" onPress={onKeepSwiping}>
        <Pressable onPress={() => undefined}>
          <Animated.View entering={Enter.up(false)}>
            <Card className="mx-edge mb-8 rounded-card" offset={6} contentClassName="items-center bg-fym-pastel-pink p-6">
              <View className="h-14 w-14 items-center justify-center rounded-full border-brutal border-fym-ink bg-fym-coral">
                <Heart size={26} color="#fff" fill="#fff" />
              </View>
              <Text variant="h1" className="mt-3 text-center">
                It&apos;s a Match!
              </Text>
              <Text variant="lead" className="mt-1 text-center text-fym-ink">
                You and {matchName} liked each other.
              </Text>

              <View className="mt-5 items-center">
                <View className="h-28 w-28 overflow-hidden rounded-full border-brutal border-fym-ink">
                  {matchPhoto ? (
                    <Image
                      source={{ uri: matchPhoto }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                  ) : (
                    <View className="h-full w-full items-center justify-center bg-fym-pastel-lavender">
                      <Text className="font-jakarta-extrabold text-3xl text-fym-ink">
                        {matchName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="mt-2 font-jakarta-extrabold text-base text-fym-ink">
                  {matchName}
                </Text>
              </View>

              <View className="mt-6 w-full gap-2">
                <Button variant="primary" onPress={onSayHi}>
                  <Text>Say hi</Text>
                </Button>
                <Button variant="secondary" onPress={onKeepSwiping}>
                  <Text>Keep swiping</Text>
                </Button>
              </View>
            </Card>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
