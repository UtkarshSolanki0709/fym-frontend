export type ProfileCard =
  | { type: 'media'; kind: 'photo' | 'video'; url: string; stamp?: string }
  | { type: 'prompt'; question: string; answer: string };

export type MockProfile = {
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

/** Unsplash portraits — warm-tone friendly for FYM photo treatment */
export const MOCK_PROFILES: MockProfile[] = [
  {
    id: 'p1',
    displayName: 'Ananya',
    age: 26,
    distanceKm: 3.2,
    vibe: 'Bookshops, late dinners, quiet weekends',
    headUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&q=80',
    media: [
      {
        type: 'media',
        kind: 'photo',
        url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80',
        stamp: '📸 FILM',
      },
      {
        type: 'media',
        kind: 'photo',
        url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80',
      },
      {
        type: 'media',
        kind: 'photo',
        url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&q=80',
        stamp: '✨ NEW',
      },
      {
        type: 'media',
        kind: 'photo',
        url: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800&q=80',
      },
      {
        type: 'media',
        kind: 'photo',
        url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80&sat=-20',
      },
    ],
    prompts: [
      {
        type: 'prompt',
        question: 'Perfect Sunday looks like…',
        answer: 'Bookstore crawl, then momos at 4pm. No plans after that.',
      },
      {
        type: 'prompt',
        question: 'Green flag I notice first',
        answer: 'They remember how I take my coffee — and they show up on time.',
      },
      {
        type: 'prompt',
        question: 'I will never shut up about…',
        answer: 'That one indie bookshop in Khan Market. Also thrift denim.',
      },
      {
        type: 'prompt',
        question: 'Dating me is like…',
        answer: 'A slow playlist: soft openers, no skip button.',
      },
    ],
  },
  {
    id: 'p2',
    displayName: 'Rohan',
    age: 28,
    distanceKm: 7.8,
    vibe: 'Morning runs and bad jokes',
    headUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&q=80',
    media: [
      {
        type: 'media',
        kind: 'photo',
        url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80',
        stamp: '🏔️ OUTDOORS',
      },
      {
        type: 'media',
        kind: 'photo',
        url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&q=80',
      },
      {
        type: 'media',
        kind: 'photo',
        url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&q=80',
      },
      {
        type: 'media',
        kind: 'photo',
        url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80',
      },
      {
        type: 'media',
        kind: 'photo',
        url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80',
      },
    ],
    prompts: [
      {
        type: 'prompt',
        question: 'I geek out on…',
        answer: 'F1 race strategy and the perfect dosa batter.',
      },
      {
        type: 'prompt',
        question: 'Green flag I notice first',
        answer: 'They laugh at my bad jokes. Or at least pretend.',
      },
      {
        type: 'prompt',
        question: 'My simple pleasure',
        answer: '5am run, black coffee, no phone for an hour.',
      },
      {
        type: 'prompt',
        question: 'Two truths and a lie',
        answer: 'I DNF’d a half marathon. I cook better than my mom. I own three plants.',
      },
    ],
  },
  {
    id: 'p3',
    displayName: 'Meher',
    age: 24,
    distanceKm: 1.4,
    vibe: 'Weekend markets and thrift finds',
    headUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900&q=80',
    media: [
      {
        type: 'media',
        kind: 'photo',
        url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&q=80',
        stamp: '🎨 ART',
      },
      {
        type: 'media',
        kind: 'photo',
        url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80',
      },
      {
        type: 'media',
        kind: 'photo',
        url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80',
      },
      {
        type: 'media',
        kind: 'photo',
        url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80',
      },
      {
        type: 'media',
        kind: 'photo',
        url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80',
      },
    ],
    prompts: [
      {
        type: 'prompt',
        question: 'Two truths and a lie',
        answer: 'I once DJed a wedding. I hate mangoes. I collect matchboxes.',
      },
      {
        type: 'prompt',
        question: 'Dating me is like…',
        answer: 'A well-curated playlist: loud openers, soft closers.',
      },
      {
        type: 'prompt',
        question: 'My simple pleasure',
        answer: 'Rain on the AC, chai, and zero notifications.',
      },
      {
        type: 'prompt',
        question: 'Green flag I notice first',
        answer: 'They ask about the thrift jacket. And mean it.',
      },
    ],
  },
];

/**
 * Shuffle media + prompts into a face-down hand with session-stable ranks.
 * Typical full hand: 5 photos + 4 prompts → 9 cards (3-3-3).
 */
export function buildShuffledHand(profile: MockProfile, seed?: number): HandCard[] {
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

/** @deprecated use buildShuffledHand — kept for any leftover imports */
export function buildDeckChunks(profile: MockProfile): ProfileCard[][] {
  const hand = buildShuffledHand(profile);
  const chunks: ProfileCard[][] = [];
  for (let i = 0; i < hand.length; i += 3) {
    chunks.push(hand.slice(i, i + 3).map((h) => h.card));
  }
  return chunks.length > 0 ? chunks : [[]];
}
