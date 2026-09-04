import { ScreenEnter } from '@/components/motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import {
  ApiError,
  getWhoLikedMe,
  type IncomingLike,
} from '@/lib/api/client';
import { hasSession } from '@/lib/api/session';
import { Enter } from '@/lib/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Image } from 'expo-image';
import { Lock } from 'lucide-react-native';
import * as React from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from 'expo-router';

export default function LikesScreen() {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [likes, setLikes] = React.useState<IncomingLike[] | null>(null);
  const [total, setTotal] = React.useState(0);
  const [tier, setTier] = React.useState('FREE');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [needAuth, setNeedAuth] = React.useState(false);

  const load = React.useCallback(async () => {
    setError(null);
    try {
      if (!(await hasSession())) {
        setNeedAuth(true);
        setLoading(false);
        return;
      }
      const data = await getWhoLikedMe();
      setTier(data.tier);
      setTotal(data.total);
      setLikes(data.profiles);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load likes');
    } finally {
      setLoading(false);
      setNeedAuth(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void load();
    }, [load]),
  );

  const locked = tier === 'FREE';

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
            {locked
              ? 'Upgrade to Plus to see who liked you.'
              : 'These people already like you — like them back to match.'}
          </Text>
        </ScreenEnter>

        {loading ? (
          <View className="mt-16 items-center">
            <ActivityIndicator color="#F0A020" />
          </View>
        ) : needAuth ? (
          <ScreenEnter variant="up" className="mt-10">
            <Card contentClassName="items-center p-6">
              <Text variant="h3" className="text-center">
                Sign in to see your likes
              </Text>
              <Text variant="caption" className="mt-2 text-center text-fym-text-muted">
                Create a profile and start swiping — likes land here.
              </Text>
            </Card>
          </ScreenEnter>
        ) : error ? (
          <ScreenEnter variant="up" className="mt-10">
            <Card contentClassName="items-center p-6">
              <Text variant="h3" className="text-center">
                Something went wrong
              </Text>
              <Text variant="caption" className="mt-2 text-center text-fym-text-muted">
                {error}
              </Text>
              <View className="mt-4">
                <Button variant="secondary" onPress={() => void load()}>
                  <Text>Try again</Text>
                </Button>
              </View>
            </Card>
          </ScreenEnter>
        ) : locked ? (
          <>
            {/* Teaser: real count, zero fake photos */}
            <ScreenEnter variant="up" className="mt-8">
              <Card contentClassName="items-center bg-fym-pastel-lavender/40 p-8">
                <View className="h-12 w-12 items-center justify-center rounded-full border-brutal border-fym-ink bg-white">
                  <Lock size={20} color="#14213D" />
                </View>
                <Text variant="h1" className="mt-4">
                  {total}
                </Text>
                <Text variant="lead" className="text-center text-fym-ink">
                  {total === 1 ? 'person likes you' : 'people like you'}
                </Text>
                <Text variant="caption" className="mt-2 text-center text-fym-text-muted">
                  Keep swiping — when you like them back, you match for free.
                </Text>
              </Card>
            </ScreenEnter>
            <ScreenEnter variant="up" delayIndex={1} className="mt-6">
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
                        'Purchases land with the next release. Your likes are already counted — nothing is lost.',
                      )
                    }
                  >
                    <Text>Unlock likes</Text>
                  </Button>
                </View>
              </Card>
            </ScreenEnter>
          </>
        ) : (likes?.length ?? 0) === 0 ? (
          <ScreenEnter variant="up" className="mt-10">
            <Card contentClassName="items-center p-6">
              <Text variant="h3" className="text-center">
                No likes yet
              </Text>
              <Text variant="caption" className="mt-2 text-center text-fym-text-muted">
                Fresh profiles get the most eyes — check back after your next swipe session.
              </Text>
            </Card>
          </ScreenEnter>
        ) : (
          <View className="mt-6 gap-3">
            {(likes ?? []).map((like, i) => (
              <Animated.View key={like.id} entering={Enter.stagger(reduced, i)}>
                <Card>
                  <View className="flex-row items-center gap-3 p-3">
                    <View className="h-14 w-14 overflow-hidden rounded-full border-brutal border-fym-ink">
                      {like.photo_url ? (
                        <Image
                          source={{ uri: like.photo_url }}
                          style={{ width: '100%', height: '100%' }}
                          contentFit="cover"
                        />
                      ) : (
                        <View className="h-full w-full items-center justify-center bg-fym-pastel-lavender">
                          <Text className="font-jakarta-extrabold text-lg text-fym-ink">
                            {like.display_name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="font-jakarta-extrabold text-base text-fym-ink">
                        {like.display_name}
                        {like.age != null ? `, ${like.age}` : ''}
                      </Text>
                      {like.note ? (
                        <Text
                          variant="caption"
                          className="mt-0.5 text-fym-text"
                          numberOfLines={2}
                        >
                          “{like.note}”
                        </Text>
                      ) : (
                        <Text variant="caption" className="mt-0.5 text-fym-text-muted">
                          {like.superliked ? 'Sent you a Superlike ♠' : 'Liked your profile'}
                        </Text>
                      )}
                    </View>
                  </View>
                </Card>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
