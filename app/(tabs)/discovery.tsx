import { ProfileDeck } from '@/components/deck/ProfileDeck';
import { ScreenEnter } from '@/components/motion';
import { Chip } from '@/components/ui/chip';
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

  const onPass = () => {
    if (!profile) return;
    setPassQueue((q) => {
      const next = [...q, { target_id: profile.id, tags: [] as string[] }];
      if (next.length >= 5) {
        setBanner(true);
        return next.slice(0, 5);
      }
      return next;
    });
    advance();
  };

  const submitReviews = async () => {
    if (selectedTags.length === 0) {
      setError('Pick at least one tag');
      return;
    }
    try {
      await swipePassBatch(
        passQueue.map((p) => ({ target_id: p.target_id, tags: selectedTags })),
      );
      setPassQueue([]);
      setBanner(false);
      setSelectedTags([]);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Review submit failed');
    }
  };

  const onLike = async () => {
    if (!profile) return;
    try {
      await swipeLike(profile.id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Like failed');
    }
    advance();
  };

  const onSuperLike = async () => {
    if (!profile) return;
    try {
      await swipeSuperlike(profile.id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Superlike failed');
    }
    advance();
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
    return (
      <View className="flex-1 items-center justify-center bg-fym-surface px-edge">
        <Text variant="h2" className="text-center">
          No more profiles
        </Text>
        <Text variant="lead" className="mt-2 text-center">
          Expand distance later or check back when more people join nearby.
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
                  void swipePassBatch(
                    queued.map((p) => ({ target_id: p.target_id, tags: ['Not my type'] })),
                  ).catch(() => undefined);
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
        reviewQueued={passQueue.length}
        onPass={onPass}
        onLike={() => void onLike()}
        onSuperLike={() => void onSuperLike()}
      />
    </View>
  );
}
