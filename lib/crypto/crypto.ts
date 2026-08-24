/**
 * P-256 ECDH + AES-GCM envelopes for FYM chat.
 * ponytail: Web Crypto subtle; Expo 54+ / modern Hermes.
 */
import type { ChatPayloadV1 } from '@/lib/chat/types';
import { loadKeyPairJwk, saveKeyPairJwk } from './keyStorage';

function b64(bytes: ArrayBuffer | Uint8Array): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]!);
  return globalThis.btoa(s);
}

function fromB64(s: string): Uint8Array<ArrayBuffer> {
  const bin = globalThis.atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out as Uint8Array<ArrayBuffer>;
}

function asBufferSource(u8: Uint8Array): BufferSource {
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer;
}

function subtle(): SubtleCrypto {
  const c = globalThis.crypto?.subtle;
  if (!c) throw new Error('Web Crypto subtle unavailable');
  return c;
}

export async function ensureIdentityKeys(): Promise<{ publicJwkJson: string }> {
  const existing = await loadKeyPairJwk();
  if (existing) {
    return { publicJwkJson: JSON.stringify(existing.publicJwk) };
  }
  const pair = await subtle().generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits'],
  );
  const privateJwk = await subtle().exportKey('jwk', pair.privateKey);
  const publicJwk = await subtle().exportKey('jwk', pair.publicKey);
  await saveKeyPairJwk(privateJwk, publicJwk);
  return { publicJwkJson: JSON.stringify(publicJwk) };
}

async function importPrivate(): Promise<CryptoKey> {
  const stored = await loadKeyPairJwk();
  if (!stored) throw new Error('No local keypair');
  return subtle().importKey(
    'jwk',
    stored.privateJwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveBits'],
  );
}

async function importPeerPublic(publicJwkJson: string): Promise<CryptoKey> {
  const jwk = JSON.parse(publicJwkJson) as JsonWebKey;
  return subtle().importKey('jwk', jwk, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
}

/** Derive AES-GCM key for a 1:1 room from peer public JWK. */
export async function deriveRoomAesKey(peerPublicJwkJson: string): Promise<CryptoKey> {
  const priv = await importPrivate();
  const peer = await importPeerPublic(peerPublicJwkJson);
  const bits = await subtle().deriveBits(
    { name: 'ECDH', public: peer },
    priv,
    256,
  );
  // HKDF-ish: hash raw bits into AES key via import + digest
  const digest = await subtle().digest('SHA-256', bits);
  return subtle().importKey('raw', digest, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

export async function encryptPayload(
  roomKey: CryptoKey,
  payload: ChatPayloadV1,
): Promise<{ ciphertext: string; nonce: string }> {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const plain = new TextEncoder().encode(JSON.stringify(payload));
  const ct = await subtle().encrypt({ name: 'AES-GCM', iv }, roomKey, plain);
  return { ciphertext: b64(ct), nonce: b64(iv) };
}

export async function decryptPayload(
  roomKey: CryptoKey,
  ciphertext: string,
  nonce: string,
): Promise<ChatPayloadV1 | null> {
  try {
    const iv = fromB64(nonce);
    const ct = fromB64(ciphertext);
    const plain = await subtle().decrypt(
      { name: 'AES-GCM', iv },
      roomKey,
      asBufferSource(ct),
    );
    return JSON.parse(new TextDecoder().decode(plain)) as ChatPayloadV1;
  } catch {
    return null;
  }
}

/** Encrypt raw image bytes with room key (separate iv stored with envelope via mediaId path). */
export async function encryptBytes(
  roomKey: CryptoKey,
  data: Uint8Array,
): Promise<{ ciphertext_b64: string; nonce_b64: string }> {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const ct = await subtle().encrypt(
    { name: 'AES-GCM', iv },
    roomKey,
    asBufferSource(data),
  );
  return { ciphertext_b64: b64(ct), nonce_b64: b64(iv) };
}

export async function decryptBytes(
  roomKey: CryptoKey,
  ciphertext_b64: string,
  nonce_b64: string,
): Promise<Uint8Array | null> {
  try {
    const plain = await subtle().decrypt(
      { name: 'AES-GCM', iv: fromB64(nonce_b64) },
      roomKey,
      asBufferSource(fromB64(ciphertext_b64)),
    );
    return new Uint8Array(plain);
  } catch {
    return null;
  }
}

export function newClientId(): string {
  return globalThis.crypto.randomUUID();
}
