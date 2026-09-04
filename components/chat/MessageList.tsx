import type { DecryptedMessage } from '@/lib/chat/types';
import { Text } from '@/components/ui/text';
import * as React from 'react';
import { FlatList, Pressable, View } from 'react-native';

type Props = {
  messages: DecryptedMessage[];
  myId: string | null;
  onImagePress?: (mediaId: string, mime: string) => void;
  onLoadOlder?: () => void;
  hasMore?: boolean;
  loadingOlder?: boolean;
};

export function MessageList({
  messages,
  myId,
  onImagePress,
  onLoadOlder,
  hasMore = false,
  loadingOlder = false,
}: Props) {
  return (
    <FlatList
      data={[...messages].reverse()}
      inverted
      keyExtractor={(m) => m.id}
      contentContainerClassName="px-edge py-3"
      // Inverted list: end reached = scrolled to the top = oldest messages
      onEndReached={hasMore && !loadingOlder ? onLoadOlder : undefined}
      onEndReachedThreshold={0.6}
      ListFooterComponent={
        loadingOlder ? (
          <View className="items-center py-3">
            <Text className="font-jakarta-bold text-xs text-fym-text-muted">
              Loading earlier messages…
            </Text>
          </View>
        ) : null
      }
      renderItem={({ item }) => {
        if (item.payload?.t === 'system') {
          return (
            <View className="my-2 items-center px-6">
              <Text className="text-center font-jakarta-bold text-[11px] text-fym-text-muted">
                A screenshot may have been taken in this chat.
              </Text>
            </View>
          );
        }

        const mine = item.sender_id === myId;
        return (
          <View className={`mb-2 max-w-[82%] ${mine ? 'self-end' : 'self-start'}`}>
            <View
              className={`rounded-card px-3 py-2 ${
                mine
                  ? 'border-brutal border-fym-ink bg-fym-cream'
                  : 'border border-fym-text-muted/20 bg-fym-pastel-lavender/30'
              } ${item.pending ? 'opacity-60' : ''}`}
            >
              {item.decryptError || !item.payload ? (
                <Text className="font-jakarta text-sm text-fym-text-muted">
                  Unable to decrypt
                </Text>
              ) : item.payload.t === 'text' ? (
                <Text className="text-left font-jakarta text-base text-fym-text">
                  {item.payload.body}
                </Text>
              ) : item.payload.t === 'image' ? (
                <Pressable
                  onPress={() => {
                    const p = item.payload;
                    if (p?.t === 'image') onImagePress?.(p.mediaId, p.mime);
                  }}
                >
                  <View className="h-40 w-40 items-center justify-center rounded-lg bg-fym-ink/10">
                    <Text className="font-jakarta-bold text-xs text-fym-ink">Photo</Text>
                    <Text className="mt-1 font-jakarta text-[10px] text-fym-text-muted" numberOfLines={1}>
                      {item.payload.mediaId.slice(0, 24)}…
                    </Text>
                  </View>
                </Pressable>
              ) : null}
            </View>
          </View>
        );
      }}
    />
  );
}
