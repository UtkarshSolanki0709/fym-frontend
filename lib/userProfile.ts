/**
 * Local profile cache + optional API sync.
 * UI always updates immediately; network is best-effort.
 */
import {
  getProfileMe,
  resolveMediaUrl,
  updateProfileMe,
  updatePrompts as apiUpdatePrompts,
} from '@/lib/api/client';
import { hasSession } from '@/lib/api/session';
import { primeMedia } from '@/lib/media/photoCache';
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
  /** Set only by a passed live face check — drives the verified badge */
  is_verified: boolean;
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

// Defaults are EMPTY on purpose — a fresh install must never render stock
// photos or invented prompts as if they were the user's profile. Empty
// photos render the "Add photo" slots; the real profile fills in from the
// local cache (instant) and then the network.
const DEFAULT_PHOTOS: ProfilePhoto[] = [];

const DEFAULT_PROMPTS: ProfilePrompt[] = [];

const DEFAULT_PROFILE: UserProfile = {
  display_name: 'You',
  age: null,
  bio: '',
  location: '',
  email: '',
  photo_url: '',
  photos: DEFAULT_PHOTOS,
  prompts: DEFAULT_PROMPTS,
  is_verified: false,
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
  const head = resolveMediaUrl(p.photos[0]?.url ?? p.photo_url);
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

/** Cache-only hydration — no network. Runs at module import so the You tab's
 *  first paint is the user's real (cached) profile, never defaults. */
export async function loadUserProfileLocal(): Promise<UserProfile> {
  try {
    const raw = await storageGet(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<UserProfile>;
      profile = syncHeadPhoto({
        ...DEFAULT_PROFILE,
        ...parsed,
        photos: Array.isArray(parsed.photos)
          ? parsed.photos
              .filter(
                (p): p is ProfilePhoto =>
                  !!p && typeof p.url === 'string' && p.url.trim().length > 0,
              )
              .map((p, i) => ({
                id: p.id ? String(p.id) : `photo-${i}`,
                url: String(p.url),
              }))
          : [],
        prompts: Array.isArray(parsed.prompts) ? parsed.prompts : [],
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
  notify();
  return profile;
}

// Hydrate immediately when this module first loads.
void loadUserProfileLocal();

let inflight: Promise<UserProfile> | null = null;

/** Cache hydration + server refresh. Concurrent callers share one request. */
export async function loadUserProfile(): Promise<UserProfile> {
  if (inflight) return inflight;
  inflight = (async () => {
    await loadUserProfileLocal();

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
                  url: resolveMediaUrl(String(p.url)),
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
          is_verified: Boolean((me as { is_verified?: boolean }).is_verified),
        });
        await persistProfile();
        // Warm the on-device media cache in the background — first render of
        // these photos later hits file:// instead of a signed-URL round trip
        primeMedia(photos.map((p) => p.url));
      } catch {
        // offline / demo
      }
    }
    notify();
    return profile;
  })();
  try {
    return await inflight;
  } finally {
    inflight = null;
  }
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
