export type ProfileCard =
  | { type: 'media'; kind: 'photo' | 'video'; url: string; stamp?: string }
  | { type: 'prompt'; question: string; answer: string };

/** The deck-facing profile model mapped from the discovery API */
export type DeckProfileModel = {
  id: string;
  displayName: string;
  age: number;
  distanceKm: number;
  vibe: string;
  headUrl: string;
  media: Extract<ProfileCard, { type: 'media' }>[];
  prompts: Extract<ProfileCard, { type: 'prompt' }>[];
};

/** Face-down hand entry after shuffle */
export type HandCard = {
  id: string;
  card: ProfileCard;
  /** Decorative rank shown on the back */
  rank: string;
  revealed: boolean;
};

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;

function shuffleInPlace<T>(arr: T[], rng = Math.random): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Shuffle media + prompts into a face-down hand with session-stable ranks.
 * Typical full hand: 5 photos + 4 prompts → 9 cards (3-3-3).
 */
export function buildShuffledHand(profile: DeckProfileModel, seed?: number): HandCard[] {
  const cards: ProfileCard[] = [...profile.media, ...profile.prompts];
  const rng =
    seed != null
      ? () => {
          // simple LCG for stable-ish re-deals when seed provided
          seed = (seed! * 1664525 + 1013904223) >>> 0;
          return seed / 0xffffffff;
        }
      : Math.random;

  shuffleInPlace(cards, rng);
  const rankPool = shuffleInPlace([...RANKS], rng);

  return cards.map((card, i) => ({
    id: `${profile.id}-${i}-${rankPool[i % rankPool.length]}`,
    card,
    rank: rankPool[i % rankPool.length]!,
    revealed: false,
  }));
}
