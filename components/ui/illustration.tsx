import { Image, type ImageContentFit, type ImageStyle } from 'expo-image';
import * as React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

export const ILLUSTRATIONS = {
  heartBannerPole: require('@/assets/images/illustrations/heart-banner-pole--acd2f996.svg'),
  heartPennantFlag: require('@/assets/images/illustrations/heart-pennant-flag--0f0c1137.svg'),
  lockedTreasureChest: require('@/assets/images/illustrations/locked-treasure-chest--d1a58336.svg'),
  heartPoolFloat: require('@/assets/images/illustrations/heart-pool-float--fb5e7f3b.svg'),
  messageInABottle: require('@/assets/images/illustrations/message-in-a-bottle--fde0d817.svg'),
  smilingSunMedallion: require('@/assets/images/illustrations/smiling-sun-medallion--3e525e6a.svg'),
  roseInVase: require('@/assets/images/illustrations/rose-in-vase--66a445cf.svg'),
  brokenPillar: require('@/assets/images/illustrations/broken-pillar--d52cec68.svg'),
  starShield: require('@/assets/images/illustrations/star-shield--78dbfab8.svg'),
  loveseat: require('@/assets/images/illustrations/loveseat--421eb746.svg'),
  bookStack: require('@/assets/images/illustrations/book-stack--99fcb48f.svg'),
  floatingGem: require('@/assets/images/illustrations/floating-gem--1c00caaf.svg'),
  pottedMonsteraPlant: require('@/assets/images/illustrations/potted-monstera-plant--7453374f.svg'),
  loungingCat: require('@/assets/images/illustrations/lounging-cat--fbd31a3c.svg'),
  sprinkledDonut: require('@/assets/images/illustrations/sprinkled-donut--f0c47f67.svg'),
  pineappleUpsideDownCake: require('@/assets/images/illustrations/pineapple-upside-down-cake--f587f2cb.svg'),
  flickeringCandle: require('@/assets/images/illustrations/flickering-candle--4396b11b.svg'),
  brokenRailroadTrack: require('@/assets/images/illustrations/broken-railroad-track--2c5e04e8.svg'),
} as const;

export type IllustrationName = keyof typeof ILLUSTRATIONS;

type Props = {
  name: IllustrationName;
  size?: number;
  width?: number;
  height?: number;
  contentFit?: ImageContentFit;
  framed?: boolean;
  frameBg?: string;
  className?: string;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function Illustration({
  name,
  size = 80,
  width,
  height,
  contentFit = 'contain',
  framed = false,
  frameBg = 'bg-fym-cream',
  className = '',
  style,
  containerStyle,
  accessibilityLabel,
}: Props) {
  const w = width ?? size;
  const h = height ?? size;
  const source = ILLUSTRATIONS[name];

  const img = (
    <Image
      source={source}
      style={[{ width: w, height: h }, style]}
      contentFit={contentFit}
      accessibilityLabel={accessibilityLabel ?? name}
      className={className}
    />
  );

  if (framed) {
    return (
      <View
        className={`items-center justify-center rounded-card border-brutal border-fym-ink p-4 shadow-brutal ${frameBg}`}
        style={containerStyle}
      >
        {img}
      </View>
    );
  }

  return img;
}
