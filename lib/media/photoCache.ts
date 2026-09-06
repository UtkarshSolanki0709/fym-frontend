/**
 * On-device media cache — kills the signed-URL latency on profile photos.
 *
 * Why this exists: media renders from HMAC-signed `/media?k=…&exp=…&sig=…`
 * URLs whose `exp`/`sig` rotate every session, so expo-image's own disk cache
 * misses on every cold start and every render re-fetches + the backend
 * decrypts AES-GCM per request. The `k` param (R2 storage key) is STABLE
 * across re-signs — so we download the bytes once to the filesystem cache
 * keyed by `k` and render `file://` from then on.
 *
 * Graceful by design: any failure returns the original URL; `file:`/data urls
 * pass through untouched.
 */
import * as FileSystem from 'expo-file-system/legacy';
import { resolveMediaUrl } from '@/lib/api/client';

const CACHE_DIR = `${FileSystem.cacheDirectory ?? ''}fym-media/`;

let dirEnsured: Promise<void> | null = null;

function ensureDir(): Promise<void> {
  if (!dirEnsured) {
    dirEnsured = FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true }).catch(
      () => undefined,
    );
  }
  return dirEnsured;
}

/** Stable cache key for a media URL: the R2 storage key (`k` param), else a hash. */
function keyFromUrl(url: string): string | null {
  try {
    const k = new URL(url, 'https://placeholder.local').searchParams.get('k');
    if (k) return `k_${k.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  } catch {
    /* fall through to hash */
  }
  let h = 0;
  for (let i = 0; i < url.length; i++) h = (h * 31 + url.charCodeAt(i)) | 0;
  return `h_${(h >>> 0).toString(36)}`;
}

/**
 * Resolve a media URL to a local `file://` path when possible:
 * cache hit → instant; miss → one download, then instant forever.
 * Returns the input unchanged for `file:`/`data:` urls or on any failure.
 */
export async function resolveCached(url?: string | null): Promise<string | undefined> {
  if (!url) return undefined;
  if (url.startsWith('file:') || url.startsWith('data:')) return url;

  const absolute = resolveMediaUrl(url);
  if (!absolute || absolute.startsWith('data:')) return absolute;

  const key = keyFromUrl(absolute);
  if (!key) return absolute;
  const path = `${CACHE_DIR}${key}`;

  try {
    await ensureDir();
    const info = await FileSystem.getInfoAsync(path);
    if (info.exists) return path;
    const res = await FileSystem.downloadAsync(absolute, path);
    return res.uri;
  } catch {
    return absolute;
  }
}

/** Fire-and-forget warmup — call after a profile/discovery refresh. */
export function primeMedia(urls: (string | null | undefined)[]): void {
  void Promise.allSettled(urls.filter((u): u is string => !!u).map((u) => resolveCached(u)));
}

/**
 * Copy a just-picked local asset into the cache under the uploaded photo's
 * key — the first render after upload is then instant (no network at all).
 */
export async function cacheLocalCopy(localUri: string, remoteSignedUrl: string): Promise<void> {
  try {
    const key = keyFromUrl(remoteSignedUrl);
    if (!key) return;
    await ensureDir();
    const path = `${CACHE_DIR}${key}`;
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) {
      await FileSystem.copyAsync({ from: localUri, to: path });
    }
  } catch {
    /* best-effort */
  }
}
