import { BadgeCheck } from 'lucide-react-native';

/**
 * Verified badge — amber seal with a cream check (house palette: amber is the
 * verified/premium slot; Design.md §6.6). Rendered only when
 * `profiles.is_verified` is true — i.e. the user completed the live face
 * check. Skippers never get it.
 */
export function VerifiedTick({ size = 16 }: { size?: number }) {
  return (
    <BadgeCheck
      size={size}
      fill="#F0A020" // brand amber
      color="#FDF8F6" // cream check
      accessibilityLabel="Face verified"
    />
  );
}
