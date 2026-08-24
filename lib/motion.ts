/**
 * FYM motion tokens — product register (150–250ms UI, one long success mask).
 * Sharp ease-out, not springy bounce (except controlled chip select).
 */
import {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  FadeOutUp,
  LinearTransition,
  SlideInDown,
  SlideInRight,
  ZoomIn,
  type BaseAnimationBuilder,
  type ComplexAnimationBuilder,
  type EntryExitAnimationFunction,
} from 'react-native-reanimated';


export const MS = {
  press: 100,
  ui: 200,
  screen: 240,
  banner: 250,
  success: 900,
  stagger: 45,
} as const;

export const EASE = {
  out: Easing.out(Easing.cubic),
  outQuad: Easing.out(Easing.quad),
  inOut: Easing.inOut(Easing.cubic),
  linear: Easing.linear,
} as const;

/** Snappy deal / settle — no overshoot */
export const TIMING_SHARP = { duration: MS.ui, easing: EASE.out } as const;
export const TIMING_PRESS = { duration: MS.press, easing: EASE.outQuad } as const;
export const TIMING_SCREEN = { duration: MS.screen, easing: EASE.out } as const;

/** Chip select only — slight overshoot */
export const SPRING_CHIP = { damping: 14, stiffness: 220, mass: 0.6 } as const;
/** Heart success */
export const SPRING_HEART = { damping: 12, stiffness: 180 } as const;
/** Spade — heavier */
export const SPRING_SPADE = { damping: 10, stiffness: 150 } as const;

export type Entering =
  | BaseAnimationBuilder
  | typeof BaseAnimationBuilder
  | EntryExitAnimationFunction
  | ComplexAnimationBuilder;

/** Instant when reduced motion is on */
export function enter(
  reduced: boolean,
  builder: () => ComplexAnimationBuilder,
  duration = MS.ui
): Entering | undefined {
  if (reduced) return undefined;
  return builder().duration(duration);
}

export const Enter = {
  screen: (reduced: boolean) =>
    reduced ? undefined : FadeInDown.duration(MS.screen).easing(EASE.out),
  screenFade: (reduced: boolean) =>
    reduced ? undefined : FadeIn.duration(MS.ui).easing(EASE.out),
  up: (reduced: boolean, delay = 0) =>
    reduced
      ? undefined
      : FadeInUp.duration(MS.ui)
          .delay(delay)
          .easing(EASE.out),
  down: (reduced: boolean, delay = 0) =>
    reduced
      ? undefined
      : FadeInDown.duration(MS.ui)
          .delay(delay)
          .easing(EASE.out),
  right: (reduced: boolean) =>
    reduced ? undefined : SlideInRight.duration(MS.screen).easing(EASE.out),
  banner: (reduced: boolean) =>
    reduced ? undefined : SlideInDown.duration(MS.banner).springify().damping(18),
  bannerOut: (reduced: boolean) =>
    reduced ? undefined : FadeOutUp.duration(MS.ui),
  zoom: (reduced: boolean) =>
    reduced ? undefined : ZoomIn.duration(MS.ui).easing(EASE.out),
  fadeOut: (reduced: boolean) => (reduced ? undefined : FadeOut.duration(MS.press)),
  layout: (reduced: boolean) =>
    reduced ? undefined : LinearTransition.duration(MS.ui).easing(EASE.inOut),
  stagger: (reduced: boolean, index: number) =>
    reduced
      ? undefined
      : FadeInDown.duration(MS.ui)
          .delay(Math.min(index, 8) * MS.stagger)
          .easing(EASE.out),
} as const;

/** Expo Router / native-stack animation names */
export const NAV = {
  auth: {
    animation: 'slide_from_right' as const,
    animationDuration: MS.screen,
  },
  onboarding: {
    animation: 'slide_from_right' as const,
    animationDuration: MS.screen,
  },
  root: {
    animation: 'fade' as const,
    animationDuration: MS.ui,
  },
  modal: {
    animation: 'fade_from_bottom' as const,
    animationDuration: MS.ui,
  },
} as const;
