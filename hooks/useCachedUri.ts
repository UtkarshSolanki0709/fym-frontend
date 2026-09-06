import { useEffect, useState } from 'react';
import { resolveCached } from '@/lib/media/photoCache';

/**
 * Resolve a media URL to its on-device cached `file://` path (see
 * lib/media/photoCache.ts). Renders the remote URL is never needed — the hook
 * starts undefined for remote urls and swaps once resolution finishes (cache
 * hit ≈ instant, miss = one download).
 */
export function useCachedUri(url: string | null | undefined): string | undefined {
  const [uri, setUri] = useState<string | undefined>(() =>
    url && (url.startsWith('file:') || url.startsWith('data:')) ? url : undefined,
  );

  useEffect(() => {
    let alive = true;
    if (!url) {
      setUri(undefined);
      return;
    }
    if (url.startsWith('file:') || url.startsWith('data:')) {
      setUri(url);
      return;
    }
    setUri(undefined);
    resolveCached(url).then((resolved) => {
      if (alive) setUri(resolved);
    });
    return () => {
      alive = false;
    };
  }, [url]);

  return uri;
}
