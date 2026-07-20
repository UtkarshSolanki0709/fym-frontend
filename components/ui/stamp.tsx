import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { View, type ViewProps } from 'react-native';

type StampTone = 'coral' | 'mint' | 'gold' | 'lavender';

const TONE_BG: Record<StampTone, string> = {
  coral: 'bg-fym-coral',
  mint: 'bg-fym-mint',
  gold: 'bg-fym-gold',
  lavender: 'bg-fym-pastel-lavender',
};

type StampProps = ViewProps & {
  label: string;
  tone?: StampTone;
};

/** Refined iOS Sticker Stamp — borderless, soft-rotated badge */
function Stamp({ label, tone = 'coral', className, style, ...props }: StampProps) {
  return (
    <View
      className={cn(
        'absolute right-2.5 top-2.5 z-10 rounded-pill px-2 py-0.5',
        TONE_BG[tone],
        className
      )}
      style={[{ transform: [{ rotate: '-6deg' }] }, style]}
      {...props}
    >
      <Text
        className={cn(
          'text-left font-jakarta-bold text-[9px] uppercase tracking-wider',
          tone === 'coral' ? 'text-white' : 'text-fym-ink'
        )}
      >
        {label}
      </Text>
    </View>
  );
}

export { Stamp };
export type { StampProps };
