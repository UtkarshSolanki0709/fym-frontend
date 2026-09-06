/**
 * Onboarding resume routing — maps the persisted onboarding_step to the screen
 * the user left off at. Shared by the cold-start gate (app/index.tsx) and
 * post-auth routing (lib/auth/googleOAuth.ts) so closing the app mid-onboarding
 * resumes where the user stopped instead of leaking into discovery with an
 * incomplete profile.
 *
 * Step values are written on EXIT of each screen (setOnboardingStep fires right
 * before router.push of the next screen), so the map routes to the NEXT screen.
 */
import type { Href } from 'expo-router';

export function resumeRouteForStep(step: string | null | undefined): Href {
  switch (step) {
    case 'basic_info':
      return '/(onboarding)/photos' as Href;
    case 'photos':
      return '/(onboarding)/liveness' as Href;
    case 'liveness_done':
    case 'liveness_skipped':
      return '/(onboarding)/interests' as Href;
    case 'interests':
      return '/(onboarding)/quiz' as Href;
    case 'complete':
      return '/(tabs)/discovery' as Href;
    // 'auth_done' | 'quiz' | unknown → the safe restart point
    default:
      return '/(onboarding)/basic-info' as Href;
  }
}
