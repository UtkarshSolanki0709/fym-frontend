import { MessageList } from '@/components/chat/MessageList';
import { useScreenGuard } from '@/components/chat/useScreenGuard';
import { Text } from '@/components/ui/text';
import { ApiError, fetchChatMedia, getMatches, uploadChatMedia } from '@/lib/api/client';
import { getUserId } from '@/lib/api/session';
import { useChat } from '@/lib/chat/useChat';
import { decryptBytes, encryptBytes } from '@/lib/crypto/crypto';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, ImagePlus, Send } from 'lucide-react-native';
import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const INK = '#14213D';
const localMediaCache = new Map<string, string>();

function ChatBody({
  roomId,
  peerId,
  peerName,
  peerPhoto,
}: {
  roomId: string;
  peerId: string;
  peerName: string;
  peerPhoto: string | null;
}) {
  const insets = useSafeAreaInsets();
  const [text, setText] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [bg, setBg] = React.useState(false);
  const [fullImage, setFullImage] = React.useState<string | null>(null);

  const { messages, loading, error, ready, send, myId, keyRef } = useChat(roomId, peerId);

  const onScreenshot = React.useCallback(() => {
    void (async () => {
      const me = (await getUserId()) ?? 'unknown';
      try {
        await send(
          {
            v: 1,
            t: 'system',
            kind: 'screenshot_alert',
            by: me,
            at: new Date().toISOString(),
          },
          'system',
        );
      } catch {
        /* local alert already shown */
      }
    })();
  }, [send]);

  useScreenGuard({ enabled: true, onScreenshot });

  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setBg(s !== 'active'));
    return () => sub.remove();
  }, []);

  const onSend = async () => {
    const body = text.trim();
    if (!body || !ready || sending) return;
    setSending(true);
    setText('');
    try {
      await send({ v: 1, t: 'text', body });
    } catch (e) {
      Alert.alert('Send failed', e instanceof ApiError ? e.message : 'Try again');
      setText(body);
    } finally {
      setSending(false);
    }
  };

  const onPickImage = async () => {
    if (!ready || !keyRef.current) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setSending(true);
    try {
      const manip = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      );
      if (!manip.base64) throw new Error('No image data');
      const raw = Uint8Array.from(globalThis.atob(manip.base64), (c) => c.charCodeAt(0));
      const { ciphertext_b64, nonce_b64 } = await encryptBytes(keyRef.current, raw);
      const packB64 = globalThis.btoa(JSON.stringify({ n: nonce_b64, c: ciphertext_b64 }));
      const { media_id } = await uploadChatMedia(roomId, packB64, 'image/jpeg');
      if (media_id.startsWith('local:')) localMediaCache.set(media_id, packB64);
      await send(
        {
          v: 1,
          t: 'image',
          mediaId: media_id,
          mime: 'image/jpeg',
          w: manip.width,
          h: manip.height,
        },
        'image',
      );
    } catch (e) {
      Alert.alert('Image failed', e instanceof Error ? e.message : 'Try again');
    } finally {
      setSending(false);
    }
  };

  const openImage = async (mediaId: string) => {
    try {
      const k = keyRef.current;
      if (!k) return;
      let packB64 = localMediaCache.get(mediaId);
      if (!packB64) {
        const res = await fetchChatMedia(roomId, mediaId);
        packB64 = res.ciphertext_b64;
      }
      const { n, c } = JSON.parse(globalThis.atob(packB64)) as { n: string; c: string };
      const bytes = await decryptBytes(k, c, n);
      if (!bytes) {
        Alert.alert('Could not open image');
        return;
      }
      const CHUNK_SZ = 0x8000;
      const chunks: string[] = [];
      for (let i = 0; i < bytes.length; i += CHUNK_SZ) {
        chunks.push(
          String.fromCharCode.apply(
            null,
            bytes.subarray(i, i + CHUNK_SZ) as unknown as number[],
          ),
        );
      }
      setFullImage(`data:image/jpeg;base64,${globalThis.btoa(chunks.join(''))}`);
    } catch {
      Alert.alert('Could not open image');
    }
  };

  return (
    <View className="flex-1 bg-fym-surface" style={{ paddingTop: insets.top }}>
      <StatusBar style="dark" />
      <View className="flex-row items-center gap-2 border-b border-border px-edge py-2">
        <Pressable onPress={() => router.back()} hitSlop={12} className="p-1">
          <ChevronLeft size={28} color={INK} />
        </Pressable>
        {peerPhoto ? (
          <Image source={{ uri: peerPhoto }} style={{ width: 36, height: 36, borderRadius: 18 }} />
        ) : (
          <View className="h-9 w-9 rounded-full bg-fym-pastel-lavender" />
        )}
        <Text className="flex-1 font-jakarta-extrabold text-base text-fym-ink" numberOfLines={1}>
          {peerName}
        </Text>
      </View>

      <Text className="bg-fym-mint/20 px-edge py-1.5 text-center font-jakarta-bold text-[11px] text-fym-ink">
        Messages are end-to-end encrypted
      </Text>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={INK} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-edge">
          <Text className="text-center font-jakarta-bold text-sm text-red-600">{error}</Text>
        </View>
      ) : (
        <View className="flex-1">
          <MessageList
            messages={messages}
            myId={myId}
            onImagePress={(id) => void openImage(id)}
          />
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.bottom}
      >
        <View
          className="flex-row items-end gap-2 border-t border-border bg-white px-edge py-2"
          style={{ paddingBottom: Math.max(insets.bottom, 8) }}
        >
          <Pressable
            onPress={() => void onPickImage()}
            disabled={!ready || sending}
            className="mb-1 p-2"
          >
            <ImagePlus size={24} color={INK} />
          </Pressable>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message"
            placeholderTextColor="#79776E"
            multiline
            className="max-h-28 min-h-11 flex-1 rounded-card border border-border bg-fym-cream px-3 py-2.5 font-jakarta text-base text-fym-text"
          />
          <Pressable
            onPress={() => void onSend()}
            disabled={!ready || sending || !text.trim()}
            className="mb-1 rounded-full bg-fym-ink p-2.5 disabled:opacity-40"
          >
            <Send size={20} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {bg ? <BlurView intensity={40} className="absolute inset-0" tint="light" /> : null}

      <Modal visible={!!fullImage} transparent animationType="fade">
        <Pressable
          className="flex-1 items-center justify-center bg-black/90"
          onPress={() => setFullImage(null)}
        >
          {fullImage ? (
            <Image
              source={{ uri: fullImage }}
              style={{ width: '90%', height: '70%' }}
              contentFit="contain"
            />
          ) : null}
        </Pressable>
      </Modal>
    </View>
  );
}

export default function ChatRoomScreen() {
  const { roomId, peerId: peerQ, name: nameQ } = useLocalSearchParams<{
    roomId: string;
    peerId?: string;
    name?: string;
  }>();
  const [peerId, setPeerId] = React.useState(peerQ ?? '');
  const [peerName, setPeerName] = React.useState(nameQ ?? 'Match');
  const [peerPhoto, setPeerPhoto] = React.useState<string | null>(null);
  const [resolving, setResolving] = React.useState(!peerQ);

  React.useEffect(() => {
    if (peerQ) {
      setPeerId(peerQ);
      return;
    }
    void getMatches()
      .then((r) => {
        const m = r.matches.find((x) => x.room_id === roomId);
        if (m) {
          setPeerId(m.peer.id);
          setPeerName(m.peer.display_name);
          setPeerPhoto(m.peer.photo_url);
        }
      })
      .finally(() => setResolving(false));
  }, [roomId, peerQ]);

  if (!roomId) {
    return (
      <View className="flex-1 items-center justify-center bg-fym-surface">
        <Text>Missing room</Text>
      </View>
    );
  }

  if (resolving || !peerId) {
    return (
      <View className="flex-1 items-center justify-center bg-fym-surface">
        <ActivityIndicator color={INK} />
      </View>
    );
  }

  return (
    <ChatBody
      roomId={roomId}
      peerId={peerId}
      peerName={peerName}
      peerPhoto={peerPhoto}
    />
  );
}
