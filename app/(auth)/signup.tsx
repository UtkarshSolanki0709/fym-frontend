import { Redirect, type Href } from 'expo-router';

/** Alias → unified auth screen with signup intent */
export default function SignupRedirect() {
  return <Redirect href={'/(auth)/auth?intent=signup' as Href} />;
}
