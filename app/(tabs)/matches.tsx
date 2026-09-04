import { ScreenEnter } from '@/components/motion';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { getMatches } from '@/lib/api/client';
import { decryptPreview, ensurePublishedKeys } from '@/lib/chat/useChat';
import type { MatchRow } from '@/lib/chat/types';
import { cn } from '@/lib/utils';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Settings, Zap } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const INK = '#14213D';

const shadowStyle = {
  shadowColor: INK,
  shadowOffset: { width: 3, height: 3 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 3,
} as const;

function isOnline(last: string | null): boolean {
  if (!last) return false;
  return Date.now() - new Date(last).getTime() < 5 * 60 * 1000;
}

export default function MatchesScreen() {
  const insets = useSafeAreaInsets();
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      await ensurePublishedKeys().catch(() => undefined);
      const { matches: rows } = await getMatches();
      setMatches(rows);
      setError(null);
      const map: Record<string, string> = {};
      await Promise.all(
        rows.map(async (m) => {
          if (!m.last_message) {
            map[m.room_id] = 'Say hi';
            return;
          }
          map[m.room_id] = await decryptPreview(
            m.peer.id,
            m.room_id,
            m.last_message.ciphertext,
            m.last_message.nonce,
          );
        }),
      );
      setPreviews(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load chats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const newMatches = matches.filter((m) => !m.last_message);
  const convos = matches.filter((m) => m.last_message);

  const open = (m: MatchRow) => {
    router.push({
      pathname: '/chat/[roomId]',
      params: {
        roomId: m.room_id,
        peerId: m.peer.id,
        name: m.peer.display_name,
        photo: m.peer.photo_url ?? '',
      },
    } as Href);
  };

  return (
    <View className="flex-1 bg-fym-surface">
      <StatusBar style="dark" />
      <View
        className="flex-row items-center justify-between border-b-brutal border-fym-ink bg-fym-surface px-gutter"
        style={{ paddingTop: insets.top, paddingBottom: 8 }}
      >
        <Pressable
          onPress={() => router.push('/(tabs)/discovery' as Href)}
          className="p-2"
        >
          <Zap size={24} color={INK} />
        </Pressable>
        <Text className="font-display-extrabold text-2xl uppercase tracking-tighter text-fym-ink">
          Chat
        </Text>
        <Pressable onPress={() => router.push('/settings' as Href)} className="p-2">
          <Settings size={24} color={INK} />
        </Pressable>
      </View>

      {error && !loading ? (
        <View className="mx-gutter mt-3 rounded-card border border-fym-coral bg-fym-pastel-pink/60 px-3 py-2">
          <Text className="font-jakarta-bold text-xs text-fym-ink">
            {error} — pull down to retry.
          </Text>
        </View>
      ) : null}

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={INK} />
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="px-gutter pb-36"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
            />
          }
        >
          <ScreenEnter variant="down" className="mt-6">
            <Text className="border-b-2 border-fym-ink pb-1 font-jakarta-extrabold text-[11px] uppercase tracking-[2px] text-fym-brand">
              New Matches
            </Text>
          </ScreenEnter>

          {newMatches.length === 0 ? (
            <Text className="mt-3 font-jakarta text-sm text-fym-text-muted">
              Mutual likes show up here first.
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="-mx-gutter mt-3"
              contentContainerClassName="px-gutter gap-6 pb-3"
            >
              {newMatches.map((m) => (
                <Pressable key={m.room_id} onPress={() => open(m)} className="items-center">
                  <View className="h-20 w-20 rounded-full" style={shadowStyle}>
                    <View className="h-full w-full overflow-hidden rounded-full border-brutal border-fym-ink">
                      {m.peer.photo_url ? (
                        <Image
                          source={{ uri: m.peer.photo_url }}
                          style={{ width: '100%', height: '100%' }}
                          contentFit="cover"
                        />
                      ) : (
                        <View className="flex-1 bg-fym-pastel-lavender" />
                      )}
                    </View>
                    {isOnline(m.peer.last_active_at) ? (
                      <View className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-fym-ink bg-fym-mint" />
                    ) : null}
                  </View>
                  <Text className="mt-1 font-jakarta-bold text-xs text-fym-ink">
                    {m.peer.display_name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          <ScreenEnter variant="down" delayIndex={1} className="mt-10">
            <Text className="border-b-2 border-fym-ink pb-1 font-jakarta-extrabold text-[11px] uppercase tracking-[2px] text-fym-brand">
              Conversations
            </Text>
          </ScreenEnter>

          <View className="mt-3 gap-4">
            {convos.length === 0 ? (
              <Text className="font-jakarta text-sm text-fym-text-muted">
                When you match, chats show up here.
              </Text>
            ) : (
              convos.map((m) => (
                <Pressable key={m.room_id} onPress={() => open(m)}>
                  <Card
                    brutal
                    reverse={m.unread > 0}
                    contentClassName="flex-row items-center gap-3 p-3"
                  >
                    <View className="h-14 w-14 overflow-hidden rounded-full border-brutal border-fym-ink">
                      {m.peer.photo_url ? (
                        <Image
                          source={{ uri: m.peer.photo_url }}
                          style={{ width: '100%', height: '100%' }}
                          contentFit="cover"
                        />
                      ) : (
                        <View className="flex-1 bg-fym-pastel-blue" />
                      )}
                    </View>
                    <View className="min-w-0 flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="font-jakarta-bold text-sm text-fym-ink">
                          {m.peer.display_name}
                        </Text>
                        {m.unread > 0 ? (
                          <View className="rounded-full bg-fym-coral px-2 py-0.5">
                            <Text className="font-jakarta-bold text-[10px] text-white">
                              {m.unread}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text
                        className={cn(
                          'mt-0.5 text-sm',
                          m.unread > 0
                            ? 'font-jakarta-bold text-fym-ink'
                            : 'font-jakarta text-fym-text-muted',
                        )}
                        numberOfLines={1}
                      >
                        {previews[m.room_id] ?? '…'}
                      </Text>
                    </View>
                  </Card>
                </Pressable>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
