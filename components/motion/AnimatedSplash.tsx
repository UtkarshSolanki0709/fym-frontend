/**
 * AnimatedSplash — in-app loading screen shown while fonts/assets load.
 *
 * Dark premium background (#1A0A2E) matches the OS-level native splash so
 * there is no jarring flash. Logo mark animates in, wordmark fades below it,
 * then the whole overlay cross-fades out to the warm app surface once ready.
 *
 * Usage: replace the bare <View> fallback in _layout.tsx with this component.
 */
import { Image } from 'expo-image';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

// ─── timing constants (kept local — these are splash-specific, not UI tokens) ──
const T = {
  logoScale: 420,   // mark scales up from 0.72 → 1.0
  logoFade: 380,    // mark fades in simultaneously
  wordDelay: 280,   // wordmark starts fading after mark lands
  wordFade: 320,    // wordmark opacity ease-in
  holdMs: 240,      // brief hold before exit
  exitFade: 360,    // whole overlay fades to transparent
} as const;

const EASE_OUT_QUART = Easing.out(Easing.poly(4));

interface Props {
  /** Called after the exit animation finishes — hide the overlay in parent. */
  onFinished?: () => void;
  /** Pass true once fonts/assets are ready to trigger the exit sequence. */
  ready: boolean;
}

export function AnimatedSplash({ ready, onFinished }: Props) {
  // ── animated values ──────────────────────────────────────────────────────
  const logoScale   = useSharedValue(0.72);
  const logoOpacity = useSharedValue(0);
  const wordOpacity = useSharedValue(0);
  const overlayOpacity = useSharedValue(1);

  // Stable refs to avoid stale-closure warnings in the exit effect
  const overlayOpacityRef = useRef(overlayOpacity);
  const onFinishedRef = useRef(onFinished);
  useLayoutEffect(() => { onFinishedRef.current = onFinished; }, [onFinished]);

  // ── entrance: fires once synchronously before first paint ─────────────────
  useLayoutEffect(() => {
    logoScale.value = withTiming(1, {
      duration: T.logoScale,
      easing: EASE_OUT_QUART,
    });
    logoOpacity.value = withTiming(1, {
      duration: T.logoFade,
      easing: EASE_OUT_QUART,
    });
    wordOpacity.value = withDelay(
      T.wordDelay,
      withTiming(1, { duration: T.wordFade, easing: EASE_OUT_QUART })
    );
  }, [logoOpacity, logoScale, wordOpacity]);

  // ── exit: fires when parent signals ready ─────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    overlayOpacityRef.current.value = withSequence(
      withDelay(T.holdMs, withTiming(0, { duration: T.exitFade, easing: EASE_OUT_QUART }))
    );
    // notify parent after the full exit duration so it can unmount
    const totalMs = T.holdMs + T.exitFade + 40;
    const timer = setTimeout(() => onFinishedRef.current?.(), totalMs);
    return () => clearTimeout(timer);
  }, [ready]);

  // ── animated styles ───────────────────────────────────────────────────────
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const wordStyle = useAnimatedStyle(() => ({
    opacity: wordOpacity.value,
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}>
      <View style={styles.center}>
        {/* Logo mark — uses the same asset as the OS splash */}
        <Animated.View style={logoStyle}>
          <Image
            source={require('../../assets/images/splash-icon.png')}
            style={styles.mark}
            contentFit="contain"
          />
        </Animated.View>

        {/* Wordmark "FYM" rendered as text so it works before logo.png loads */}
        <Animated.Text style={[styles.wordmark, wordStyle]}>
          FYM
        </Animated.Text>

        <Animated.Text style={[styles.tagline, wordStyle]}>
          Find Your Mate
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: '#1A0A2E', // deep violet-black — matches OS native splash
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  center: {
    alignItems: 'center',
    gap: 16,
  },
  mark: {
    width: 120,
    height: 120,
  },
  wordmark: {
    // Plus Jakarta Sans isn't available until fonts load — system fallback is fine
    // because this text is never seen before fonts finish loading (ready=true fires
    // only after useFonts resolves, by which point Plus Jakarta Sans is available).
    fontFamily: 'DMSans_800ExtraBold',
    fontSize: 36,
    letterSpacing: 6,
    color: '#FDF8F6', // fym-surface — warm white, not cold
    textTransform: 'uppercase',
  },
  tagline: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    letterSpacing: 3,
    color: 'rgba(253, 248, 246, 0.45)', // fym-surface at 45% — subtle
    textTransform: 'uppercase',
  },
});
