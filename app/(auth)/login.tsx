import { Redirect, type Href } from 'expo-router';

/** Alias → unified auth screen with signin intent */
export default function LoginRedirect() {
  return <Redirect href={'/(auth)/auth?intent=signin' as Href} />;
}
