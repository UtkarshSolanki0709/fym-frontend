/**
 * Local profile cache + optional API sync.
 * UI always updates immediately; network is best-effort.
 */
import {
  getProfileMe,
  updateProfileMe,
  updatePrompts as apiUpdatePrompts,
} from '@/lib/api/client';
import { hasSession } from '@/lib/api/session';
import { storageGet, storageRemove, storageSet } from '@/lib/storage';

const KEY = 'fym.user_profile';
const PREFS_KEY = 'fym.user_prefs';

export type ProfilePhoto = { id: string; url: string };

export type ProfilePrompt = { question: string; answer: string };

export type UserProfile = {
  display_name: string;
  age: number | null;
  bio: string;
  location: string;
  email: string;
  photo_url: string;
  photos: ProfilePhoto[];
  prompts: ProfilePrompt[];
};

export type UserPrefs = {
  notifications: boolean;
  digest: boolean;
  darkMode: boolean;
  /** Hide age on discovery cards (local preference) */
  hideAge: boolean;
  /** Pause being shown in discovery */
  pauseDiscovery: boolean;
  /** Read receipts when chat ships */
  readReceipts: boolean;
};

const DEFAULT_PHOTOS: ProfilePhoto[] = [
  {
    id: 'demo-1',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
  },
  {
    id: 'demo-2',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80',
  },
  {
    id: 'demo-3',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80',
  },
];

const DEFAULT_PROMPTS: ProfilePrompt[] = [
  {
    question: 'Perfect Sunday looks like…',
    answer: 'Bookstore crawl, then momos at 4pm.',
  },
  {
    question: 'Green flag I notice first',
    answer: 'They show up on time and mean it.',
  },
];

const DEFAULT_PROFILE: UserProfile = {
  display_name: 'You',
  age: null,
  bio: '',
  location: 'Delhi NCR',
  email: '',
  photo_url: DEFAULT_PHOTOS[0]!.url,
  photos: DEFAULT_PHOTOS,
  prompts: DEFAULT_PROMPTS,
};

const DEFAULT_PREFS: UserPrefs = {
  notifications: true,
  digest: false,
  darkMode: false,
  hideAge: false,
  pauseDiscovery: false,
  readReceipts: true,
};

let profile: UserProfile = {
  ...DEFAULT_PROFILE,
  photos: [...DEFAULT_PHOTOS],
  prompts: DEFAULT_PROMPTS.map((p) => ({ ...p })),
};
let prefs: UserPrefs = { ...DEFAULT_PREFS };
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

function syncHeadPhoto(p: UserProfile): UserProfile {
  const head = p.photos[0]?.url ?? p.photo_url;
  return { ...p, photo_url: head };
}

function persistProfile() {
  return storageSet(KEY, JSON.stringify(profile));
}

export function getUserProfile(): UserProfile {
  return profile;
}

export function getUserPrefs(): UserPrefs {
  return prefs;
}

export function subscribeUserProfile(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function loadUserProfile(): Promise<UserProfile> {
  try {
    const raw = await storageGet(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<UserProfile>;
      profile = syncHeadPhoto({
        ...DEFAULT_PROFILE,
        ...parsed,
        photos:
          Array.isArray(parsed.photos) && parsed.photos.length
            ? parsed.photos
            : DEFAULT_PHOTOS,
        prompts:
          Array.isArray(parsed.prompts) && parsed.prompts.length
            ? parsed.prompts
            : DEFAULT_PROMPTS,
      });
    }
  } catch {
    /* keep defaults */
  }
  try {
    const pr = await storageGet(PREFS_KEY);
    if (pr) prefs = { ...DEFAULT_PREFS, ...JSON.parse(pr) };
  } catch {
    /* keep defaults */
  }

  if (await hasSession()) {
    try {
      const me = await getProfileMe();
      const rawPhotos = me.photos as { id?: string; url?: string }[] | undefined;
      const photos: ProfilePhoto[] =
        Array.isArray(rawPhotos) && rawPhotos.length
          ? rawPhotos
              .filter((p) => p?.url)
              .map((p, i) => ({
                id: String(p.id ?? `remote-${i}`),
                url: String(p.url),
              }))
          : profile.photos;
      const rawPrompts = me.prompts as ProfilePrompt[] | undefined;
      profile = syncHeadPhoto({
        ...profile,
        display_name: String(me.display_name ?? profile.display_name),
        age: typeof me.age === 'number' ? me.age : profile.age,
        bio: String(me.bio ?? profile.bio ?? ''),
        photos,
        prompts:
          Array.isArray(rawPrompts) && rawPrompts.length
            ? rawPrompts.map((p) => ({
                question: String(p.question ?? ''),
                answer: String(p.answer ?? ''),
              }))
            : profile.prompts,
        email: String((me as { email?: string }).email ?? profile.email),
      });
      await persistProfile();
    } catch {
      // offline / demo
    }
  }
  notify();
  return profile;
}

export async function patchUserProfile(
  partial: Partial<UserProfile>,
): Promise<UserProfile> {
  profile = syncHeadPhoto({ ...profile, ...partial });
  notify();
  await persistProfile();

  if (await hasSession()) {
    const body: Record<string, unknown> = {};
    if (partial.display_name !== undefined) body.display_name = partial.display_name;
    if (partial.bio !== undefined) body.bio = partial.bio;
    if (partial.age !== undefined && partial.age != null) body.age = partial.age;
    if (Object.keys(body).length) {
      try {
        await updateProfileMe(body);
      } catch {
        /* local already ok */
      }
    }
  }
  return profile;
}

export async function setPhotos(photos: ProfilePhoto[]): Promise<UserProfile> {
  profile = syncHeadPhoto({ ...profile, photos: [...photos] });
  notify();
  await persistProfile();
  return profile;
}

export async function setPrompts(prompts: ProfilePrompt[]): Promise<UserProfile> {
  profile = { ...profile, prompts: prompts.map((p) => ({ ...p })) };
  notify();
  await persistProfile();
  if (await hasSession()) {
    try {
      await apiUpdatePrompts(profile.prompts);
    } catch {
      /* local already ok */
    }
  }
  return profile;
}

export async function setUserPrefs(next: Partial<UserPrefs>): Promise<UserPrefs> {
  prefs = { ...prefs, ...next };
  notify();
  await storageSet(PREFS_KEY, JSON.stringify(prefs));
  return prefs;
}

export async function clearUserProfileLocal(): Promise<void> {
  profile = {
    ...DEFAULT_PROFILE,
    photos: [...DEFAULT_PHOTOS],
    prompts: DEFAULT_PROMPTS.map((p) => ({ ...p })),
  };
  prefs = { ...DEFAULT_PREFS };
  await storageRemove(KEY);
  await storageRemove(PREFS_KEY);
  notify();
}

export const PROMPT_SUGGESTIONS = [
  'Perfect Sunday looks like…',
  'Green flag I notice first',
  'I geek out on…',
  'Dating me is like…',
  'My simple pleasure',
  'Two truths and a lie',
  'I will never shut up about…',
  'The way to my heart is…',
] as const;
