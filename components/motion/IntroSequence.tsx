/**
 * IntroSequence — first-launch brand animation, plays once per device.
 *
 * Continues the dark splash canvas (#1A0A2E) so OS splash → AnimatedSplash →
 * intro reads as one continuous brand moment, then fades out to reveal the app
 * (linen). Choreography: logo mark lands, two heartbeats, FYM wordmark
 * staggers in, tagline fades up, two mini profile cards deal in (the deck,
 * previewed), hold, exit. Any tap skips; reduced motion shows the static
 * composition with an opacity-only exit.
 *
 * Docs: docs/INTRO_SEQUENCE.md
 */
import { Image } from 'expo-image';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Enter, SPRING_CHIP } from '@/lib/motion';
import { BRAND } from '@/lib/theme';
import { storageSet } from '@/lib/storage';

/** Storage flag — written at exit start; app/_layout.tsx checks it before mounting. */
export const INTRO_FLAG_KEY = 'fym.has_seen_intro';

// ─── timing constants (intro-specific, not UI tokens — same approach as AnimatedSplash) ──
const T = {
  markFade: 260,
  markSettle: 380,
  thumpUp1: 110,   // heartbeat: expand
  thumpDown1: 130, // heartbeat: contract
  beatPause: 120,  // gap between the two heartbeats
  thumpUp2: 110,
  thumpDown2: 150,
  wordDelay: 700,
  wordStagger: 60,
  tagDelay: 1120,
  cardADelay: 1360,
  cardBDelay: 1540,
  exitAt: 2600,    // exit fade starts
  exitFade: 360,
  reducedHold: 1000,
} as const;

const EASE_OUT_QUART = Easing.out(Easing.poly(4));
const CREAM = '#FDF8F6'; // warm white on dark — same as AnimatedSplash wordmark

interface Props {
  /** Called after the exit fade finishes — unmount the overlay in the parent. */
  onFinished?: () => void;
}

export function IntroSequence({ onFinished }: Props) {
  const reduced = useReducedMotion();

  const markOpacity = useSharedValue(0);
  const markScale = useSharedValue(0.92);
  const cardLeft = useSharedValue(0);
  const cardRight = useSharedValue(0);
  const overlayOpacity = useSharedValue(1);

  const doneRef = React.useRef(false);
  const onFinishedRef = React.useRef(onFinished);
  React.useLayoutEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  /** Write the flag, fade the overlay, then hand control back to the parent. */
  const finish = React.useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    void storageSet(INTRO_FLAG_KEY, '1');
    overlayOpacity.value = withTiming(0, { duration: T.exitFade, easing: EASE_OUT_QUART });
    setTimeout(() => onFinishedRef.current?.(), T.exitFade + 40);
  }, [overlayOpacity]);

  React.useEffect(() => {
    if (reduced) {
      // Static composition, opacity-only exit — fewer and gentler, not zero.
      markOpacity.value = 1;
      cardLeft.value = 1;
      cardRight.value = 1;
      const t = setTimeout(finish, T.reducedHold);
      return () => clearTimeout(t);
    }

    markOpacity.value = withTiming(1, { duration: T.markFade, easing: EASE_OUT_QUART });
    markScale.value = withSequence(
      withTiming(1, { duration: T.markSettle, easing: EASE_OUT_QUART }),
      // Two heartbeats — precise timing chain, not springs, so the rhythm stays crisp
      withTiming(1.055, { duration: T.thumpUp1, easing: EASE_OUT_QUART }),
      withTiming(1, { duration: T.thumpDown1, easing: EASE_OUT_QUART }),
      withTiming(1, { duration: T.beatPause }),
      withTiming(1.04, { duration: T.thumpUp2, easing: EASE_OUT_QUART }),
      withTiming(1, { duration: T.thumpDown2, easing: EASE_OUT_QUART }),
    );
    cardLeft.value = withDelay(T.cardADelay, withSpring(1, SPRING_CHIP));
    cardRight.value = withDelay(T.cardBDelay, withSpring(1, SPRING_CHIP));

    const t = setTimeout(finish, T.exitAt);
    return () => clearTimeout(t);
  }, [reduced, finish, markOpacity, markScale, cardLeft, cardRight, overlayOpacity]);

  // ── animated styles ───────────────────────────────────────────────────────
  const markStyle = useAnimatedStyle(() => ({
    opacity: markOpacity.value,
    transform: [{ scale: markScale.value }],
  }));

  const cardLeftStyle = useAnimatedStyle(() => ({
    opacity: cardLeft.value,
    transform: [
      { translateY: interpolate(cardLeft.value, [0, 1], [90, 0]) },
      { rotate: `${interpolate(cardLeft.value, [0, 1], [0, -7])}deg` },
    ],
  }));

  const cardRightStyle = useAnimatedStyle(() => ({
    opacity: cardRight.value,
    transform: [
      { translateY: interpolate(cardRight.value, [0, 1], [90, 0]) },
      { rotate: `${interpolate(cardRight.value, [0, 1], [0, 7])}deg` },
    ],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}>
      {/* Any tap skips — the whole screen is the target, label is the visible affordance */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={finish}
        accessibilityRole="button"
        accessibilityLabel="Skip intro"
      >
        <View style={styles.stage} pointerEvents="none">
          <Animated.View style={markStyle}>
            <Image
              source={require('../../assets/images/fym-logo.png')}
              style={styles.mark}
              contentFit="contain"
            />
          </Animated.View>

          <View style={styles.wordmark}>
            {'FYM'.split('').map((letter, i) => (
              <Animated.Text
                key={letter}
                style={styles.wordmarkText}
                entering={Enter.down(reduced, T.wordDelay + i * T.wordStagger)}
              >
                {letter}
              </Animated.Text>
            ))}
          </View>

          <Animated.Text style={styles.tagline} entering={Enter.up(reduced, T.tagDelay)}>
            FIND YOUR MATE
          </Animated.Text>
        </View>

        {/* The deck, previewed — two mini cards deal in below the wordmark */}
        <View style={styles.cardsRow} pointerEvents="none">
          <Animated.View style={[styles.card, cardLeftStyle]}>
            <Text style={styles.cardHeart}>{'♥'}</Text>
          </Animated.View>
          <Animated.View style={[styles.card, styles.cardOverlap, cardRightStyle]}>
            <View style={[styles.cardLine, styles.cardLineWide]} />
            <View style={styles.cardLine} />
          </Animated.View>
        </View>

        <View style={styles.skipRow} pointerEvents="none">
          <Text style={styles.skipText}>Skip</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: '#1A0A2E', // deep violet-black — matches OS splash + AnimatedSplash
    zIndex: 999,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    width: 132,
    height: 132,
  },
  wordmark: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 20,
  },
  wordmarkText: {
    fontFamily: 'DMSans_800ExtraBold',
    fontSize: 40,
    letterSpacing: 4,
    color: CREAM,
  },
  tagline: {
    marginTop: 12,
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    letterSpacing: 3,
    color: 'rgba(253, 248, 246, 0.45)', // cream at 45% — subtle, mirrors AnimatedSplash
  },
  cardsRow: {
    position: 'absolute',
    bottom: '14%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  card: {
    width: 96,
    height: 124,
    borderRadius: 24, // rounded-card
    backgroundColor: BRAND.surface, // linen — the product stepping into the brand moment
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardOverlap: {
    marginLeft: -16,
    zIndex: 2,
  },
  cardHeart: {
    fontSize: 30,
    color: BRAND.amber,
  },
  cardLine: {
    width: 40,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(20, 33, 61, 0.14)', // ink at 14%
    marginTop: 8,
  },
  cardLineWide: {
    width: 56,
    marginTop: 0,
  },
  skipRow: {
    position: 'absolute',
    bottom: 44, // clears the iOS home indicator
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  skipText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    letterSpacing: 2,
    color: 'rgba(253, 248, 246, 0.6)',
  },
});
