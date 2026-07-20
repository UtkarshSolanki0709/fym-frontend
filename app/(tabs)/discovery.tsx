import { ProfileDeck } from '@/components/deck/ProfileDeck';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import {
  ApiError,
  fetchDiscovery,
  swipeLike,
  swipePassBatch,
  swipeSuperlike,
} from '@/lib/api/client';
import { mapDiscoveryToDeck } from '@/lib/api/mapProfile';
import { MOCK_PROFILES, type MockProfile } from '@/lib/mock/profiles';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
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
  const [profiles, setProfiles] = React.useState<MockProfile[]>([]);
  const [index, setIndex] = React.useState(0);
  const [remaining, setRemaining] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [usingMock, setUsingMock] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [passQueue, setPassQueue] = React.useState<PassQueueItem[]>([]);
  const [banner, setBanner] = React.useState(false);
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDiscovery();
      const mapped = (data.profiles ?? []).map(mapDiscoveryToDeck);
      if (mapped.length === 0) {
        setProfiles(MOCK_PROFILES);
        setUsingMock(true);
        setRemaining(data.remaining_today);
      } else {
        setProfiles(mapped);
        setUsingMock(false);
        setRemaining(data.remaining_today);
      }
      setIndex(0);
    } catch (e) {
      // no auth / empty backend → demo deck
      setProfiles(MOCK_PROFILES);
      setUsingMock(true);
      setError(e instanceof ApiError ? e.message : 'Using demo deck');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const profile = profiles[index % Math.max(profiles.length, 1)];

  const advance = () => {
    setIndex((i) => {
      const next = i + 1;
      if (next >= profiles.length - 2 && !usingMock) {
        // prefetch more when near end
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
    const item: PassQueueItem = { target_id: profile.id, tags: [] };
    setPassQueue((q) => {
      const next = [...q, item];
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
    const items = passQueue.map((p) => ({
      target_id: p.target_id,
      tags: selectedTags,
    }));
    try {
      if (!usingMock) {
        await swipePassBatch(items);
      }
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
      if (!usingMock) await swipeLike(profile.id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Like failed');
    }
    advance();
  };

  const onSuperLike = async () => {
    if (!profile) return;
    try {
      if (!usingMock) await swipeSuperlike(profile.id);
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

  if (!profile) {
    return (
      <View className="flex-1 items-center justify-center bg-fym-surface px-edge">
        <Text variant="h2">No more profiles</Text>
        <Chip label="Refresh" tone="coral" onPress={load} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-fym-surface" style={{ paddingTop: insets.top }}>
      <StatusBar style="dark" />

      <View className="flex-row items-end justify-between px-edge pb-2 pt-1">
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
            {remaining != null ? `${remaining} left today` : usingMock ? 'Demo' : '—'}
          </Text>
        </View>
      </View>

      {error ? (
        <Text className="px-edge pb-1 font-jakarta-bold text-xs text-fym-text-muted">
          {error}
        </Text>
      ) : null}

      {banner ? (
        <Animated.View
          entering={FadeInDown.duration(250)}
          exiting={FadeOutUp.duration(200)}
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
                setBanner(false);
                setPassQueue([]);
              }}
            />
            <Chip label="Submit feedback" tone="coral" onPress={submitReviews} />
          </View>
        </Animated.View>
      ) : null}

      <ProfileDeck
        key={profile.id + index}
        profile={profile}
        reviewQueued={passQueue.length}
        onPass={onPass}
        onLike={onLike}
        onSuperLike={onSuperLike}
      />
    </View>
  );
}
