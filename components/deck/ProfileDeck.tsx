import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Shadow } from '@/components/ui/shadow';
import { Stamp } from '@/components/ui/stamp';
import { Text } from '@/components/ui/text';
import {
  buildShuffledHand,
  type HandCard,
  type MockProfile,
  type ProfileCard,
} from '@/lib/mock/profiles';
import { playFlipSfx, playShuffleSfx, playSkipRevealSfx } from '@/lib/sfx';
import { cn } from '@/lib/utils';
import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import * as React from 'react';
import {
  Modal,
  Pressable,
  View,
  useWindowDimensions,
  type DimensionValue,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  FadeIn,
  FadeOut,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const SKIP_PULL = 72;
const SKIP_SNAP = 96;

type ProfileDeckProps = {
  profile: MockProfile;
  onPass: () => void;
  onLike: (comment?: string) => void;
  onSuperLike: (comment?: string) => void;
  reviewQueued?: number;
};

function ProfileDeck({
  profile,
  onPass,
  onLike,
  onSuperLike,
  reviewQueued = 0,
}: ProfileDeckProps) {
  const { width } = useWindowDimensions();
  const cardW = Math.min(width - 32, 400);

  const [dealt, setDealt] = React.useState(false);
  const [hand, setHand] = React.useState<HandCard[]>([]);
  const [openCard, setOpenCard] = React.useState<ProfileCard | null>(null);
  const [comment, setComment] = React.useState('');
  const [success, setSuccess] = React.useState<'like' | 'super' | null>(null);
  const [skipArmed, setSkipArmed] = React.useState(false);

  const pullY = useSharedValue(0);
  const dealFlash = useSharedValue(0);
  const dealtSV = useSharedValue(0);
  const skipLive = useSharedValue(0); // 1 when skip control is interactive

  const resetDeck = React.useCallback(() => {
    setDealt(false);
    setHand([]);
    setOpenCard(null);
    setComment('');
    setSuccess(null);
    setSkipArmed(false);
    pullY.value = 0;
    dealFlash.value = 0;
    dealtSV.value = 0;
    skipLive.value = 0;
  }, [pullY, dealFlash, dealtSV, skipLive]);

  React.useEffect(() => {
    resetDeck();
  }, [profile.id, resetDeck]);

  const dealHand = React.useCallback(async () => {
    if (dealt) {
      await playShuffleSfx();
      setHand(buildShuffledHand(profile).map((h) => ({ ...h, revealed: false })));
      dealFlash.value = withSequence(
        withTiming(1, { duration: 80, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 120, easing: Easing.in(Easing.quad) })
      );
      return;
    }
    await playShuffleSfx();
    setHand(buildShuffledHand(profile));
    setDealt(true);
    dealtSV.value = withTiming(1, { duration: 140, easing: Easing.out(Easing.quad) });
    dealFlash.value = withSequence(
      withTiming(1, { duration: 90, easing: Easing.linear }),
      withTiming(0, { duration: 140, easing: Easing.out(Easing.quad) })
    );
  }, [dealt, profile, dealFlash, dealtSV]);

  const revealCard = React.useCallback((id: string) => {
    void playFlipSfx();
    setHand((prev) =>
      prev.map((h) => (h.id === id ? { ...h, revealed: true } : h))
    );
  }, []);

  const armSkip = React.useCallback(() => {
    setSkipArmed(true);
    skipLive.value = 1;
    void playSkipRevealSfx();
  }, [skipLive]);

  const disarmSkip = React.useCallback(() => {
    setSkipArmed(false);
    skipLive.value = 0;
  }, [skipLive]);

  // Swipe up only (inverted pull-to-refresh) — reveals skip under deck.
  // Simultaneous with native scroll so the hand can still scroll.
  const pan = Gesture.Pan()
    .activeOffsetY([-20, 50])
    .failOffsetX([-32, 32])
    .onUpdate((e) => {
      const up = Math.max(0, -e.translationY);
      pullY.value = Math.min(up, SKIP_SNAP + 36);
    })
    .onEnd(() => {
      if (pullY.value >= SKIP_PULL) {
        pullY.value = withTiming(SKIP_SNAP, {
          duration: 140,
          easing: Easing.out(Easing.quad),
        });
        runOnJS(armSkip)();
      } else {
        pullY.value = withTiming(0, { duration: 160, easing: Easing.out(Easing.quad) });
        runOnJS(disarmSkip)();
      }
    });
  const nativeScroll = Gesture.Native();
  const gestures = Gesture.Simultaneous(pan, nativeScroll);

  const deckShiftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -pullY.value * 0.4 }],
  }));

  const skipSlotStyle = useAnimatedStyle(() => {
    const p = interpolate(
      pullY.value,
      [0, SKIP_PULL, SKIP_SNAP],
      [0, 0.9, 1],
      Extrapolation.CLAMP
    );
    const y = interpolate(pullY.value, [0, SKIP_SNAP], [32, 0], Extrapolation.CLAMP);
    return {
      opacity: p,
      transform: [
        { translateY: y },
        { scale: interpolate(p, [0, 1], [0.5, 1], Extrapolation.CLAMP) },
      ],
    };
  });

  const aceStyle = useAnimatedStyle(() => {
    // sharp settle — no spring bounce
    const d = dealtSV.value;
    const flash = dealFlash.value;
    return {
      transform: [
        { translateY: -10 * d },
        { scale: 1 - d * 0.04 + flash * 0.015 },
      ],
    };
  });

  const fireAction = (kind: 'like' | 'super') => {
    setSuccess(kind);
    const text = comment.trim() || undefined;
    setTimeout(() => {
      if (kind === 'like') onLike(text);
      else onSuperLike(text);
      setOpenCard(null);
      setComment('');
      setSuccess(null);
    }, 900);
  };

  const onSkipPress = () => {
    pullY.value = withTiming(0, { duration: 120 });
    setSkipArmed(false);
    onPass();
  };

  // 3-column rows (3-3-3 …)
  const rows: HandCard[][] = [];
  for (let i = 0; i < hand.length; i += 3) {
    rows.push(hand.slice(i, i + 3));
  }
  const gap = 10;
  const cellW = (cardW - gap * 2) / 3;

  return (
    <View className="flex-1">
      <GestureDetector gesture={gestures}>
        <Animated.View className="flex-1">
          <Animated.ScrollView
            className="flex-1"
            contentContainerClassName="items-center px-edge pb-44 pt-2"
            showsVerticalScrollIndicator={false}
            bounces
            alwaysBounceVertical
          >
            <Animated.View style={[{ width: cardW }, deckShiftStyle]}>
              {/* Meta */}
              <View className="mb-3 w-full flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <View className="rounded-pill border border-border bg-white px-2.5 py-1">
                    <Text className="font-jakarta-bold text-[10px] uppercase text-fym-text-muted">
                      {profile.distanceKm.toFixed(1)} km
                    </Text>
                  </View>
                  <Text variant="caption" className="max-w-[160px]" numberOfLines={1}>
                    {profile.vibe}
                  </Text>
                </View>
                {reviewQueued > 0 ? (
                  <View className="rounded-pill border border-border bg-white px-2.5 py-1">
                    <Text className="font-jakarta-bold text-[10px] uppercase text-fym-text-muted">
                      Feedback {reviewQueued}/5
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Ace */}
              <Animated.View style={aceStyle}>
                <Pressable onPress={() => void dealHand()} accessibilityLabel="Tap ace to deal cards">
                  <Shadow offset={6} className="rounded-card">
                    <View className="overflow-hidden rounded-card border border-border bg-white">
                      <View className="relative aspect-[3/4] w-full">
                        <Image
                          source={{ uri: profile.headUrl }}
                          style={{ width: '100%', height: '100%' }}
                          contentFit="cover"
                          transition={120}
                        />
                        <View pointerEvents="none" className="absolute inset-0 bg-[#1A0E05]/5" />
                        {!dealt ? (
                          <View className="absolute bottom-4 left-0 right-0 items-center">
                            <View className="rounded-pill border border-border bg-white/95 px-4 py-2">
                              <Text className="font-jakarta-bold text-xs uppercase text-fym-text">
                                Tap ace to deal
                              </Text>
                            </View>
                          </View>
                        ) : null}
                      </View>
                      <View className="border-t border-border bg-[#FCF9F6] px-4 py-3">
                        <Text variant="h2" className="text-fym-text">
                          {profile.displayName}, {profile.age}
                        </Text>
                        <Text variant="caption" className="mt-0.5 text-fym-text-muted">
                          {dealt
                            ? 'Tap a card to reveal · swipe up to skip'
                            : 'Deal a shuffled hand'}
                        </Text>
                      </View>
                    </View>
                  </Shadow>
                </Pressable>
              </Animated.View>

              {/* Face-down / revealed hand */}
              {dealt && rows.length > 0 ? (
                <View className="mt-4 gap-2.5">
                  {rows.map((row, ri) => (
                    <View key={`row-${ri}`} className="flex-row justify-center gap-2.5">
                      {row.map((h) => (
                        <FlipCard
                          key={h.id}
                          hand={h}
                          width={cellW}
                          height={cellW * 1.28}
                          onReveal={() => revealCard(h.id)}
                          onOpen={() => setOpenCard(h.card)}
                        />
                      ))}
                    </View>
                  ))}
                </View>
              ) : null}

              {/* Swipe-up skip zone — sits under the whole deck */}
              <Animated.View
                style={skipSlotStyle}
                className="mt-5 items-center pb-2"
                pointerEvents={skipArmed ? 'auto' : 'box-none'}
              >
                <Pressable
                  onPress={onSkipPress}
                  accessibilityLabel="Skip profile"
                  accessibilityRole="button"
                  className="h-14 w-14 items-center justify-center rounded-full border-2 border-fym-ink bg-red-600"
                  style={{
                    shadowColor: '#000',
                    shadowOpacity: 0.2,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 3 },
                    elevation: 4,
                  }}
                >
                  <X size={28} color="#0A0A0A" strokeWidth={3} />
                </Pressable>
                {skipArmed ? (
                  <Text className="mt-2 font-jakarta-bold text-[10px] uppercase text-fym-text-muted">
                    Skip
                  </Text>
                ) : null}
              </Animated.View>
            </Animated.View>
          </Animated.ScrollView>
        </Animated.View>
      </GestureDetector>

      {/* Enlarge + comment (after reveal) */}
      <Modal visible={!!openCard && !success} animationType="fade" transparent>
        <View className="flex-1 justify-end bg-fym-ink/40">
          <Pressable className="flex-1" onPress={() => setOpenCard(null)} />
          <View className="rounded-t-container border-t border-border bg-white px-edge pb-10 pt-4">
            <View className="mb-3 h-1.5 w-10 self-center rounded-pill bg-fym-text-muted/30" />
            {openCard ? <EnlargedBody card={openCard} /> : null}
            <Input
              label="Add a note (optional)"
              placeholder="That thrift jacket though…"
              value={comment}
              onChangeText={setComment}
              containerClassName="mt-4"
            />
            <View className="mt-4 flex-row gap-3">
              <View className="flex-1">
                <Button variant="secondary" onPress={() => setOpenCard(null)}>
                  <Text>Cancel</Text>
                </Button>
              </View>
              <View className="flex-1">
                <Button variant="primary" onPress={() => fireAction('like')}>
                  <Text>♥ Heart</Text>
                </Button>
              </View>
              <View className="flex-1">
                <Button variant="gold" onPress={() => fireAction('super')}>
                  <Text>♠ Spade</Text>
                </Button>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!success} animationType="fade" transparent>
        <View className="flex-1 items-center justify-center bg-[#FAF7F4]/95">
          <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut}>
            <Shadow offset={8} className="rounded-card">
              <View
                className={cn(
                  'items-center rounded-card border border-border px-12 py-10',
                  success === 'super' ? 'bg-fym-gold' : 'bg-fym-coral'
                )}
              >
                <Text className="text-6xl">{success === 'super' ? '♠' : '♥'}</Text>
                <Text
                  variant="h2"
                  className={cn(
                    'mt-3 uppercase',
                    success === 'super' ? 'text-fym-ink' : 'text-white'
                  )}
                >
                  {success === 'super' ? 'Spade sent' : 'Heart sent'}
                </Text>
              </View>
            </Shadow>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

function FlipCard({
  hand,
  width,
  height,
  onReveal,
  onOpen,
}: {
  hand: HandCard;
  width: number;
  height: number;
  onReveal: () => void;
  onOpen: () => void;
}) {
  const flip = useSharedValue(hand.revealed ? 1 : 0);

  React.useEffect(() => {
    if (hand.revealed) {
      flip.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
    } else {
      flip.value = 0;
    }
  }, [hand.revealed, flip]);

  const backStyle = useAnimatedStyle(() => {
    const r = interpolate(flip.value, [0, 0.5, 1], [0, 90, 90]);
    return {
      backfaceVisibility: 'hidden' as const,
      transform: [{ perspective: 800 }, { rotateY: `${r}deg` }],
      opacity: flip.value < 0.5 ? 1 : 0,
      zIndex: flip.value < 0.5 ? 2 : 0,
    };
  });

  const faceStyle = useAnimatedStyle(() => {
    const r = interpolate(flip.value, [0, 0.5, 1], [-90, -90, 0]);
    return {
      backfaceVisibility: 'hidden' as const,
      transform: [{ perspective: 800 }, { rotateY: `${r}deg` }],
      opacity: flip.value >= 0.5 ? 1 : 0,
      zIndex: flip.value >= 0.5 ? 2 : 0,
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    };
  });

  const onPress = () => {
    if (!hand.revealed) onReveal();
    else onOpen();
  };

  return (
    <Pressable onPress={onPress} style={{ width, height }} accessibilityLabel={hand.revealed ? 'Open card' : `Reveal card ${hand.rank}`}>
      <View style={{ width, height }}>
        {/* Back — rank */}
        <Animated.View style={[{ width, height }, backStyle]}>
          <Shadow offset={3} className="h-full w-full rounded-2xl">
            <View className="h-full w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-fym-ink bg-[#1A2744]">
              <View className="absolute inset-2 rounded-xl border border-white/15" />
              <Text className="font-jakarta-extrabold text-3xl text-[#F0A020]">{hand.rank}</Text>
              <Text className="mt-1 font-jakarta-bold text-[9px] uppercase tracking-widest text-white/50">
                FYM
              </Text>
            </View>
          </Shadow>
        </Animated.View>

        {/* Face */}
        <Animated.View style={faceStyle}>
          <CardFace card={hand.card} width={width} height={height} />
        </Animated.View>
      </View>
    </Pressable>
  );
}

function CardFace({
  card,
  width,
  height,
}: {
  card: ProfileCard;
  width: DimensionValue;
  height: DimensionValue;
}) {
  if (card.type === 'media') {
    return (
      <Shadow offset={3} className="h-full w-full rounded-2xl">
        <View className="h-full w-full overflow-hidden rounded-2xl border border-border bg-white" style={{ width, height }}>
          <Image source={{ uri: card.url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          <View pointerEvents="none" className="absolute inset-0 bg-[#1A0E05]/5" />
          {card.kind === 'video' ? (
            <View className="absolute bottom-1.5 left-1.5 rounded-pill bg-black/60 px-1.5 py-0.5">
              <Text className="font-jakarta-bold text-[8px] text-white">VIDEO</Text>
            </View>
          ) : null}
          {card.stamp ? <Stamp label={card.stamp} tone="gold" /> : null}
        </View>
      </Shadow>
    );
  }

  return (
    <View style={{ width, height }}>
      <Card offset={3} className="h-full w-full" contentClassName="h-full w-full justify-between p-2">
        <Text className="font-jakarta-bold text-[9px] uppercase leading-tight text-fym-coral" numberOfLines={2}>
          {card.question}
        </Text>
        <Text className="mt-1 flex-1 font-jakarta text-[10px] leading-snug text-fym-text" numberOfLines={5}>
          {card.answer}
        </Text>
      </Card>
    </View>
  );
}

function EnlargedBody({ card }: { card: ProfileCard }) {
  if (card.type === 'media') {
    return (
      <View className="overflow-hidden rounded-card border border-border bg-white">
        <Image source={{ uri: card.url }} style={{ width: '100%', height: 280 }} contentFit="cover" />
      </View>
    );
  }
  return (
    <Card contentClassName="p-5">
      <Text variant="label" className="text-fym-coral">
        {card.question}
      </Text>
      <Text variant="body" className="mt-3 text-lg">
        {card.answer}
      </Text>
    </Card>
  );
}

export { ProfileDeck };
