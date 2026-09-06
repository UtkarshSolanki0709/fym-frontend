import { Image, type ImageContentFit, type ImageStyle } from 'expo-image';
import * as React from 'react';
import { StyleProp } from 'react-native';
import { useCachedUri } from '@/hooks/useCachedUri';

type Props = {
  /** Remote (signed) or local url — resolved through the on-device cache */
  url?: string | null;
  className?: string;
  style?: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
  transition?: number;
  accessibilityLabel?: string;
};

/** Drop-in for expo-image `<Image>` on user media — serves from the
 *  on-device cache once downloaded instead of re-fetching signed URLs. */
export function CachedImage({
  url,
  className,
  style,
  contentFit = 'cover',
  transition = 200,
  accessibilityLabel,
}: Props) {
  const uri = useCachedUri(url);

  // expo-image ~57 crashes on the native bridge when source is undefined or
  // uri is empty — render nothing until the cache resolves a valid path.
  if (!uri) return null;

  return (
    <Image
      source={{ uri }}
      className={className}
      style={style}
      contentFit={contentFit}
      transition={transition}
      accessibilityLabel={accessibilityLabel}
    />
  );
}
