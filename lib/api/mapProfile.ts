import type { ApiDiscoveryProfile } from './client';
import type { MockProfile, ProfileCard } from '@/lib/mock/profiles';

/** Map Railway discovery card → deck shape */
export function mapDiscoveryToDeck(p: ApiDiscoveryProfile): MockProfile {
  const photos = Array.isArray(p.photos) ? p.photos : [];
  const urls = photos.map((x) => x?.url).filter(Boolean) as string[];
  const headUrl =
    urls[0] ??
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&q=80';

  const media: Extract<ProfileCard, { type: 'media' }>[] = urls.slice(1).map((url) => ({
    type: 'media',
    kind: 'photo',
    url,
  }));
  // deck needs at least some media cards
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
    age: p.age ?? 0,
    distanceKm: p.distance_km ?? 0,
    vibe: p.vibe ?? p.bio ?? (p.interests ?? []).slice(0, 3).join(' · ') ?? '',
    headUrl,
    media,
    prompts,
  };
}
