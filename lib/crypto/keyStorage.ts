import * as SecureStore from 'expo-secure-store';

const PRIV = 'fym.ecdh.p256.private.jwk';
const PUB = 'fym.ecdh.p256.public.jwk';

export async function loadKeyPairJwk(): Promise<{
  privateJwk: JsonWebKey;
  publicJwk: JsonWebKey;
} | null> {
  try {
    const priv = await SecureStore.getItemAsync(PRIV);
    const pub = await SecureStore.getItemAsync(PUB);
    if (!priv || !pub) return null;
    return { privateJwk: JSON.parse(priv), publicJwk: JSON.parse(pub) };
  } catch {
    return null;
  }
}

export async function saveKeyPairJwk(
  privateJwk: JsonWebKey,
  publicJwk: JsonWebKey,
): Promise<void> {
  await SecureStore.setItemAsync(PRIV, JSON.stringify(privateJwk));
  await SecureStore.setItemAsync(PUB, JSON.stringify(publicJwk));
}
