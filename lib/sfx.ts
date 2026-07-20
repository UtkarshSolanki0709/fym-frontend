import * as Haptics from 'expo-haptics';

/**
 * Shuffle feedback. Real card-shuffle WAV can drop in later via expo-av.
 * ponytail: haptics-only until asset lands in assets/sfx/shuffle.mp3
 */
export async function playShuffleSfx(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((r) => setTimeout(r, 45));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise((r) => setTimeout(r, 40));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // web / simulator without haptics
  }
}

export async function playFlipSfx(): Promise<void> {
  try {
    await Haptics.selectionAsync();
  } catch {
    /* noop */
  }
}

export async function playSkipRevealSfx(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch {
    /* noop */
  }
}
