import { resolveMediaUrl, type ApiDiscoveryProfile } from './client';
import { resolveCached } from '@/lib/media/photoCache';
import type { DeckProfileModel, ProfileCard } from '@/lib/deck/types';

/** Deck profile shape mapped from the discovery API */
export type DeckProfile = DeckProfileModel & {
  id: string;
  displayName: string;
  age: number;
  distanceKm: number;
  vibe: string;
  headUrl: string;
  verified: boolean;
  media: Extract<ProfileCard, { type: 'media' }>[];
  prompts: Extract<ProfileCard, { type: 'prompt' }>[];
};

/** Map discovery card → deck */
export function mapDiscoveryToDeck(p: ApiDiscoveryProfile): DeckProfile {
  const photos = Array.isArray(p.photos) ? p.photos : [];
  const urls = photos
    .map((x) => resolveMediaUrl(x?.url))
    .filter(Boolean) as string[];
  // No stock-photo fallback: photo-less profiles render initials in the deck
  const headUrl = urls[0] ?? '';

  const media: Extract<ProfileCard, { type: 'media' }>[] = urls.slice(1).map((url) => ({
    type: 'media',
    kind: 'photo' as const,
    url,
  }));
  if (media.length === 0 && urls[0]) {
    media.push({ type: 'media', kind: 'photo', url: urls[0] });
  }

  const prompts: Extract<ProfileCard, { type: 'prompt' }>[] = (p.prompts ?? []).map(
    (pr) => ({
      type: 'prompt',
      question: pr.question,
      answer: pr.answer,
    }),
  );

  return {
    id: p.id,
    displayName: p.display_name ?? 'Someone',
    age: p.age ?? 18,
    distanceKm: p.distance_km ?? 0,
    vibe: p.vibe ?? p.bio ?? (p.interests ?? []).slice(0, 3).join(' · ') ?? '',
    headUrl,
    verified: Boolean(p.is_verified),
    media,
    prompts,
  };
}

/**
 * Map + resolve photos through the on-device cache — deck images render from
 * `file://` once downloaded instead of re-fetching rotated signed URLs.
 */
export async function mapDiscoveryToDeckCached(
  p: ApiDiscoveryProfile,
): Promise<DeckProfile> {
  const deck = mapDiscoveryToDeck(p);
  const resolvedMedia = await Promise.all(deck.media.map((m) => resolveCached(m.url)));
  deck.media = deck.media.map((m, i) => ({ ...m, url: resolvedMedia[i] ?? m.url }));
  deck.headUrl = (await resolveCached(deck.headUrl)) ?? deck.headUrl;
  return deck;
}
