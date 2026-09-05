import { MatchPopup } from '@/components/deck/MatchPopup';
import { ProfileDeck } from '@/components/deck/ProfileDeck';
import { ScreenEnter } from '@/components/motion';
import { Chip } from '@/components/ui/chip';
import { Illustration } from '@/components/ui/illustration';
import { Text } from '@/components/ui/text';
import {
  ApiError,
  fetchDiscovery,
  swipeLike,
  swipePassBatch,
  swipeSuperlike,
} from '@/lib/api/client';
import { hasSession } from '@/lib/api/session';
import { mapDiscoveryToDeck, type DeckProfile } from '@/lib/api/mapProfile';
import { Enter } from '@/lib/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const REVIEW_TAGS = [
  { label: 'Not my type', tone: 'yellow' as const },
  { label: 'Catfish vibes', tone: 'pink' as const },
  { label: 'Low effort', tone: 'blue' as const },
  { label: 'Fake location', tone: 'green' as const },
];

type PassQueueItem = { target_id: string; tags: string[] };

/** Backend /swipe/pass/batch accepts 1–5 items per call */
const PASS_BATCH_SIZE = 5;
/** Auto-flush safety valve if the user keeps passing past the banner */
const PASS_AUTO_FLUSH = 10;

type ActiveMatch = { roomId: string; name: string; photo: string | null };

export default function DiscoveryScreen() {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [profiles, setProfiles] = React.useState<DeckProfile[]>([]);
  const [index, setIndex] = React.useState(0);
  const [remaining, setRemaining] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [needAuth, setNeedAuth] = React.useState(false);

  const [passQueue, setPassQueue] = React.useState<PassQueueItem[]>([]);
  const [banner, setBanner] = React.useState(false);
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [activeMatch, setActiveMatch] = React.useState<ActiveMatch | null>(null);
  const [likeBusy, setLikeBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    setNeedAuth(false);
    try {
      const authed = await hasSession();
      if (!authed) {
        setProfiles([]);
        setNeedAuth(true);
        setError('Sign in to see real profiles nearby.');
        return;
      }
      const data = await fetchDiscovery();
      const mapped = (data.profiles ?? []).map(mapDiscoveryToDeck);
      setProfiles(mapped);
      setRemaining(data.remaining_today);
      setIndex(0);
      if (mapped.length === 0) {
        setError(null);
      }
    } catch (e) {
      setProfiles([]);
      if (e instanceof ApiError && (e.status === 401 || e.code === 'INVALID_TOKEN')) {
        setNeedAuth(true);
        setError('Session expired — sign in again.');
      } else {
        setError(e instanceof ApiError ? e.message : 'Could not load profiles');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const profile = profiles[index];

  const advance = () => {
    setIndex((i) => {
      const next = i + 1;
      if (next >= profiles.length - 2) {
        void fetchDiscovery()
          .then((data) => {
            const mapped = (data.profiles ?? []).map(mapDiscoveryToDeck);
            if (mapped.length) {
              setProfiles((prev) => {
                const seen = new Set(prev.map((p) => p.id));
                return [...prev, ...mapped.filter((p) => !seen.has(p.id))];
              });
              setRemaining(data.remaining_today);
            }
          })
          .catch(() => undefined);
      }
      return next;
    });
  };

  const flushPasses = React.useCallback(
    async (items: PassQueueItem[], defaultTags: string[]): Promise<PassQueueItem[]> => {
      // Returns whatever failed so the caller can put it back — no silent loss.
      const failed: PassQueueItem[] = [];
      for (let i = 0; i < items.length; i += PASS_BATCH_SIZE) {
        const slice = items.slice(i, i + PASS_BATCH_SIZE);
        try {
          await swipePassBatch(
            slice.map((p) => ({
              target_id: p.target_id,
              tags: p.tags.length ? p.tags : defaultTags,
            })),
          );
        } catch {
          failed.push(...slice);
        }
      }
      return failed;
    },
    [],
  );

  const onPass = () => {
    if (!profile) return;
    setPassQueue((q) => {
      const next = [...q, { target_id: profile.id, tags: [] as string[] }];
      if (next.length >= PASS_BATCH_SIZE) setBanner(true);
      return next;
    });
    advance();
  };

  // Safety valve: if the user keeps passing past the banner, flush the queue
  // as "Not my type" so passes never pile up unsubmitted.
  const flushingRef = React.useRef(false);
  React.useEffect(() => {
    if (passQueue.length < PASS_AUTO_FLUSH || flushingRef.current) return;
    flushingRef.current = true;
    const queued = [...passQueue];
    setPassQueue([]);
    void flushPasses(queued, ['Not my type'])
      .then((failed) => {
        if (failed.length) setPassQueue((prev) => [...failed, ...prev]);
      })
      .finally(() => {
        flushingRef.current = false;
      });
  }, [passQueue, flushPasses]);

  const submitReviews = async () => {
    if (selectedTags.length === 0) {
      setError('Pick at least one tag');
      return;
    }
    const queued = [...passQueue];
    setPassQueue([]);
    const failed = await flushPasses(queued, selectedTags);
    if (failed.length) {
      setPassQueue((prev) => [...failed, ...prev]);
      setError('Some reviews failed to submit — try again');
      return;
    }
    setBanner(false);
    setSelectedTags([]);
    setError(null);
  };

  const onLike = async (comment?: string) => {
    if (!profile || likeBusy) return;
    setLikeBusy(true);
    try {
      const res = await swipeLike(profile.id, comment);
      if (res.matched && res.roomId) {
        setActiveMatch({
          roomId: res.roomId,
          name: profile.displayName,
          photo: profile.headUrl,
        });
      }
      advance();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Like failed — try again');
      // Swipe didn't land — keep the card so nothing is silently lost.
    } finally {
      setLikeBusy(false);
    }
  };

  const onSuperLike = async (comment?: string) => {
    if (!profile || likeBusy) return;
    setLikeBusy(true);
    try {
      const res = await swipeSuperlike(profile.id, comment);
      if (res.matched && res.roomId) {
        setActiveMatch({
          roomId: res.roomId,
          name: profile.displayName,
          photo: profile.headUrl,
        });
      }
      advance();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Superlike failed — try again');
    } finally {
      setLikeBusy(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-fym-surface">
        <ActivityIndicator color="#F0A020" />
      </View>
    );
  }

  if (needAuth) {
    return (
      <View className="flex-1 items-center justify-center bg-fym-surface px-edge">
        <Text variant="h2" className="text-center">
          Sign in to discover
        </Text>
        <Text variant="lead" className="mt-2 text-center">
          Real profiles only — no demo deck.
        </Text>
        <View className="mt-6">
          <Chip
            label="Sign in"
            tone="coral"
            onPress={() => router.push('/(auth)/auth?intent=signin' as Href)}
          />
        </View>
      </View>
    );
  }

  if (!profile || index >= profiles.length) {
    const isError = Boolean(error);
    return (
      <View className="flex-1 items-center justify-center bg-fym-surface px-edge">
        <View className="mb-6 items-center justify-center rounded-card border-brutal border-fym-ink bg-white p-6 shadow-brutal">
          <Illustration
            name={isError ? 'brokenRailroadTrack' : 'smilingSunMedallion'}
            size={110}
          />
        </View>
        <Text variant="h2" className="text-center">
          {isError ? 'Deck stalled' : 'No more profiles'}
        </Text>
        <Text variant="lead" className="mt-2 text-center">
          {isError
            ? 'Connection track stalled — check your network and tap reload.'
            : 'Expand distance later or check back when more people join nearby.'}
        </Text>
        {error ? (
          <Text className="mt-2 text-center font-jakarta-bold text-xs text-fym-text-muted">
            {error}
          </Text>
        ) : null}
        <View className="mt-6">
          <Chip label="Refresh" tone="coral" onPress={() => void load()} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-fym-surface" style={{ paddingTop: insets.top }}>
      <StatusBar style="dark" />

      <ScreenEnter
        variant="down"
        className="flex-row items-end justify-between px-edge pb-2 pt-1"
      >
        <View>
          <Text className="font-jakarta-extrabold text-[11px] uppercase tracking-[2px] text-fym-brand">
            Discover
          </Text>
          <Text variant="h1" className="text-fym-ink">
            People nearby
          </Text>
        </View>
        <View className="rounded-pill border border-border bg-white px-3 py-1.5">
          <Text className="font-jakarta-bold text-xs text-fym-text">
            {remaining != null ? `${remaining} left today` : '—'}
          </Text>
        </View>
      </ScreenEnter>

      {error ? (
        <Text className="px-edge pb-1 font-jakarta-bold text-xs text-fym-text-muted">
          {error}
        </Text>
      ) : null}

      {banner ? (
        <Animated.View
          entering={Enter.banner(reduced)}
          exiting={Enter.bannerOut(reduced)}
          className="mx-edge mb-2 rounded-b-card border-x-brutal border-b-brutal border-fym-ink bg-fym-cream px-4 py-3"
        >
          <Text className="font-jakarta-bold text-sm text-fym-ink">
            A quick note on who you passed helps us improve suggestions
          </Text>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {REVIEW_TAGS.map((t) => {
              const on = selectedTags.includes(t.label);
              return (
                <Chip
                  key={t.label}
                  label={t.label}
                  tone={on ? 'coral' : t.tone}
                  active
                  onPress={() =>
                    setSelectedTags((prev) =>
                      on ? prev.filter((x) => x !== t.label) : [...prev, t.label],
                    )
                  }
                />
              );
            })}
          </View>
          <View className="mt-3 flex-row gap-3">
            <Chip
              label="Skip"
              tone="cream"
              onPress={() => {
                const queued = [...passQueue];
                setBanner(false);
                setPassQueue([]);
                setSelectedTags([]);
                if (queued.length > 0) {
                  void flushPasses(queued, ['Not my type']).then((failed) => {
                    if (failed.length) setPassQueue((prev) => [...failed, ...prev]);
                  });
                }
              }}
            />
            <Chip label="Submit feedback" tone="coral" onPress={() => void submitReviews()} />
          </View>
        </Animated.View>
      ) : null}

      <ProfileDeck
        key={profile.id + index}
        profile={profile}
        reviewQueued={Math.min(passQueue.length, PASS_BATCH_SIZE)}
        onPass={onPass}
        onLike={(comment) => void onLike(comment)}
        onSuperLike={(comment) => void onSuperLike(comment)}
      />

      {activeMatch ? (
        <MatchPopup
          matchName={activeMatch.name}
          matchPhoto={activeMatch.photo}
          onSayHi={() => {
            const m = activeMatch;
            setActiveMatch(null);
            router.push({
              pathname: '/chat/[roomId]',
              params: { roomId: m.roomId, name: m.name, photo: m.photo ?? '' },
            });
          }}
          onKeepSwiping={() => setActiveMatch(null)}
        />
      ) : null}
    </View>
  );
}
