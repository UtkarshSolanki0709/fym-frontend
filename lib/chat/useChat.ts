import {
  getMessages,
  getPeerKey,
  markRoomRead,
  postMessage,
  publishKey,
} from '@/lib/api/client';
import { getAccessToken, getRefreshToken, getUserId } from '@/lib/api/session';
import type { ChatPayloadV1, DecryptedMessage, WireMessage } from '@/lib/chat/types';
import {
  decryptPayload,
  deriveRoomAesKey,
  encryptPayload,
  ensureIdentityKeys,
  newClientId,
} from '@/lib/crypto/crypto';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import * as React from 'react';

const roomKeyCache = new Map<string, CryptoKey>();

export async function ensurePublishedKeys(): Promise<void> {
  const { publicJwkJson } = await ensureIdentityKeys();
  await publishKey(publicJwkJson);
}

export async function getRoomKey(roomId: string, peerId: string): Promise<CryptoKey> {
  const hit = roomKeyCache.get(roomId);
  if (hit) return hit;
  const { public_key } = await getPeerKey(peerId);
  const key = await deriveRoomAesKey(public_key);
  roomKeyCache.set(roomId, key);
  return key;
}

async function decryptWire(roomKey: CryptoKey, m: WireMessage): Promise<DecryptedMessage> {
  const payload = await decryptPayload(roomKey, m.ciphertext, m.nonce);
  return {
    id: m.id,
    sender_id: m.sender_id,
    created_at: m.created_at,
    client_id: m.client_id,
    payload,
    decryptError: !payload,
  };
}

export function useChat(roomId: string, peerId: string) {
  const [messages, setMessages] = React.useState<DecryptedMessage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);
  const [myId, setMyId] = React.useState<string | null>(null);
  const keyRef = React.useRef<CryptoKey | null>(null);
  const channelRef = React.useRef<RealtimeChannel | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await ensurePublishedKeys();
        const me = await getUserId();
        if (!cancelled) setMyId(me);
        const roomKey = await getRoomKey(roomId, peerId);
        if (cancelled) return;
        keyRef.current = roomKey;

        const { messages: raw } = await getMessages(roomId);
        const dec = await Promise.all(raw.map((m) => decryptWire(roomKey, m)));
        setMessages(dec.reverse());
        setReady(true);
        void markRoomRead(roomId);

        const access = await getAccessToken();
        const refresh = await getRefreshToken();
        if (access && refresh) {
          await supabase.auth
            .setSession({ access_token: access, refresh_token: refresh })
            .catch(() => undefined);
        }

        const ch = supabase
          .channel(`room:${roomId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `room_id=eq.${roomId}`,
            },
            (payload) => {
              const row = payload.new as WireMessage;
              void (async () => {
                let k = keyRef.current;
                if (!k) {
                  try {
                    k = await getRoomKey(roomId, peerId);
                    keyRef.current = k;
                  } catch {
                    return;
                  }
                }
                const d = await decryptWire(k, row);
                setMessages((prev) => {
                  if (
                    prev.some(
                      (p) =>
                        p.id === d.id ||
                        (d.client_id && p.client_id === d.client_id),
                    )
                  ) {
                    return prev.map((p) =>
                      d.client_id && p.client_id === d.client_id
                        ? { ...d, pending: false }
                        : p,
                    );
                  }
                  return [...prev, d];
                });
                if (row.sender_id !== me) void markRoomRead(roomId);
              })();
            },
          )
          .subscribe();
        channelRef.current = ch;
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Chat failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomId, peerId]);

  const send = React.useCallback(
    async (payload: ChatPayloadV1, content_type?: 'text' | 'image' | 'system') => {
      const k = keyRef.current;
      if (!k) throw new Error('Room key not ready');
      const client_id = newClientId();
      const { ciphertext, nonce } = await encryptPayload(k, payload);
      const type =
        content_type ??
        (payload.t === 'image' ? 'image' : payload.t === 'system' ? 'system' : 'text');

      setMessages((prev) => [
        ...prev,
        {
          id: `local-${client_id}`,
          sender_id: myId ?? '',
          created_at: new Date().toISOString(),
          client_id,
          payload,
          pending: true,
        },
      ]);

      try {
        const row = await postMessage(roomId, {
          ciphertext,
          nonce,
          client_id,
          content_type: type,
        });
        setMessages((prev) =>
          prev.map((m) =>
            m.client_id === client_id
              ? {
                  id: row.id,
                  sender_id: row.sender_id,
                  created_at: row.created_at,
                  client_id: row.client_id,
                  payload,
                  pending: false,
                }
              : m,
          ),
        );
      } catch (e) {
        setMessages((prev) => prev.filter((m) => m.client_id !== client_id));
        throw e;
      }
    },
    [roomId, myId],
  );

  return { messages, loading, error, ready, send, myId, keyRef };
}

export async function decryptPreview(
  peerId: string,
  roomId: string,
  ciphertext: string,
  nonce: string,
): Promise<string> {
  try {
    const key = await getRoomKey(roomId, peerId);
    const p = await decryptPayload(key, ciphertext, nonce);
    if (!p) return 'Encrypted message';
    if (p.t === 'text') return p.body;
    if (p.t === 'image') return 'Photo';
    if (p.t === 'system') return 'Safety notice';
    return 'Message';
  } catch {
    return 'Encrypted message';
  }
}
