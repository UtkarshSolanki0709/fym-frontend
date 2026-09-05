import { MessageList } from '@/components/chat/MessageList';
import { useScreenGuard } from '@/components/chat/useScreenGuard';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Illustration } from '@/components/ui/illustration';
import { Text } from '@/components/ui/text';
import {
  ApiError,
  blockUser,
  fetchChatMedia,
  getMatches,
  REPORT_REASONS,
  submitReport,
  uploadChatMedia,
} from '@/lib/api/client';
import { getUserId } from '@/lib/api/session';
import { useChat } from '@/lib/chat/useChat';
import { decryptBytes, encryptBytes } from '@/lib/crypto/crypto';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Flag, ImagePlus, Send } from 'lucide-react-native';
import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const INK = '#14213D';
const localMediaCache = new Map<string, string>();
const MAX_CACHED_MEDIA = 50;

function cacheMedia(mediaId: string, packB64: string) {
  if (localMediaCache.size >= MAX_CACHED_MEDIA) {
    const oldest = localMediaCache.keys().next().value;
    if (oldest) localMediaCache.delete(oldest);
  }
  localMediaCache.set(mediaId, packB64);
}

type ReportModalProps = {
  visible: boolean;
  peerId: string;
  roomId: string;
  peerName: string;
  onClose: () => void;
  onBlocked: () => void;
};

function ReportModal({ visible, peerId, roomId, peerName, onClose, onBlocked }: ReportModalProps) {
  const [reasons, setReasons] = React.useState<string[]>([]);
  const [notes, setNotes] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const toggleReason = (r: string) =>
    setReasons((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  const submit = async () => {
    if (reasons.length === 0) {
      Alert.alert('Pick a reason', 'Choose at least one reason so moderators can act.');
      return;
    }
    setBusy(true);
    try {
      await submitReport({
        target_id: peerId,
        room_id: roomId,
        reasons,
        notes: notes.trim() || undefined,
      });
      setReasons([]);
      setNotes('');
      onClose();
      Alert.alert(
        'Report sent',
        "Thanks — our moderators will review it. You won't get a follow-up from the other person.",
      );
    } catch (e) {
      Alert.alert('Could not send report', e instanceof ApiError ? e.message : 'Try again');
    } finally {
      setBusy(false);
    }
  };

  const block = () => {
    Alert.alert(
      `Block ${peerName}?`,
      "You won't see each other anywhere in FYM. This can't be undone from the app.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            setBusy(true);
            blockUser(peerId)
              .then(onBlocked)
              .catch((e) =>
                Alert.alert('Could not block', e instanceof ApiError ? e.message : 'Try again'),
              )
              .finally(() => setBusy(false));
          },
        },
      ],
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View className="flex-1 justify-end bg-fym-ink/70">
        <Card className="mx-edge mb-6 rounded-card" offset={6} contentClassName="p-5">
          <Text variant="h3">Report {peerName}</Text>
          <Text variant="caption" className="mt-1 text-fym-text-muted">
            Your report is anonymous. Reports made in good faith are always protected.
          </Text>

          <ScrollView className="mt-4" style={{ maxHeight: 260 }} bounces={false}>
            <View className="flex-row flex-wrap gap-2">
              {REPORT_REASONS.map((r) => (
                <Chip
                  key={r}
                  label={r}
                  tone={reasons.includes(r) ? 'coral' : 'cream'}
                  active
                  onPress={() => toggleReason(r)}
                />
              ))}
            </View>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Anything else moderators should know? (optional)"
              placeholderTextColor="#79776E"
              multiline
              maxLength={1000}
              className="mt-4 min-h-20 rounded-card border border-border bg-fym-cream px-3 py-2.5 font-jakarta text-sm text-fym-text"
            />
          </ScrollView>

          <View className="mt-4 flex-row gap-2">
            <View className="flex-1">
              <Chip label="Cancel" tone="cream" onPress={onClose} />
            </View>
            <View className="flex-1">
              <Chip label="Block" tone="yellow" onPress={block} />
            </View>
            <View className="flex-1">
              <Chip label={busy ? 'Sending…' : 'Send report'} tone="coral" onPress={() => void submit()} />
            </View>
          </View>
        </Card>
      </View>
    </Modal>
  );
}

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
  const [reportOpen, setReportOpen] = React.useState(false);

  const {
    messages,
    loading,
    error,
    ready,
    send,
    myId,
    keyRef,
    loadOlder,
    hasMore,
    loadingOlder,
  } = useChat(roomId, peerId);

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
      if (media_id.startsWith('local:')) cacheMedia(media_id, packB64);
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
        <Pressable onPress={() => setReportOpen(true)} hitSlop={12} className="p-1">
          <Flag size={22} color={INK} />
        </Pressable>
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
      ) : messages.length === 0 ? (
        <View className="flex-1 items-center justify-center px-edge">
          <View className="mb-4 items-center justify-center rounded-card border-brutal border-fym-ink bg-white p-6 shadow-brutal">
            <Illustration name="roseInVase" size={80} />
          </View>
          <Text variant="h3" className="text-center text-fym-ink">
            Mutual Match
          </Text>
          <Text variant="caption" className="mt-2 max-w-[260px] text-center text-fym-text-muted">
            Say hi to {peerName}! Start with a question about their prompts or mutual interests.
          </Text>
        </View>
      ) : (
        <View className="flex-1">
          <MessageList
            messages={messages}
            myId={myId}
            onImagePress={(id) => void openImage(id)}
            onLoadOlder={() => void loadOlder()}
            hasMore={hasMore}
            loadingOlder={loadingOlder}
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

      <ReportModal
        visible={reportOpen}
        peerId={peerId}
        roomId={roomId}
        peerName={peerName}
        onClose={() => setReportOpen(false)}
        onBlocked={() => {
          setReportOpen(false);
          router.back();
        }}
      />

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
  const { roomId, peerId: peerQ, name: nameQ, photo: photoQ } = useLocalSearchParams<{
    roomId: string;
    peerId?: string;
    name?: string;
    photo?: string;
  }>();
  const [peerId, setPeerId] = React.useState(peerQ ?? '');
  const [peerName, setPeerName] = React.useState(nameQ ?? 'Match');
  const [peerPhoto, setPeerPhoto] = React.useState<string | null>(
    photoQ ? photoQ : null,
  );
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
