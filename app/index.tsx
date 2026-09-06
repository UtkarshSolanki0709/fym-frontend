import { getOnboardingStatus } from '@/lib/api/client';
import { hasSession } from '@/lib/api/session';
import { resumeRouteForStep } from '@/lib/onboarding';
import * as React from 'react';
import { Redirect, type Href } from 'expo-router';

export default function Index() {
  const [route, setRoute] = React.useState<Href | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const authed = await hasSession();
      if (!authed) {
        if (alive) setRoute('/(auth)/welcome' as Href);
        return;
      }
      // Session alone is not enough — an incomplete onboarding must resume
      // where the user left off, never leak into discovery half-built
      let step: string | undefined;
      try {
        step = (await getOnboardingStatus()).onboarding_step;
      } catch {
        step = undefined; // backend unreachable → basic-info is the safe restart
      }
      if (alive) setRoute(resumeRouteForStep(step));
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!route) return null;

  return <Redirect href={route} />;
}
