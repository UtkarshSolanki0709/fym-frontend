import { DefaultTheme, type Theme } from '@react-navigation/native';

/** FYM navigation — linen paper + amber (not coral dating-app palette) */
export const THEME = {
  light: {
    background: 'hsl(40 33% 94%)',
    foreground: 'hsl(220 45% 12%)',
    card: 'hsl(40 40% 98%)',
    cardForeground: 'hsl(220 45% 12%)',
    popover: 'hsl(40 40% 98%)',
    popoverForeground: 'hsl(220 45% 12%)',
    primary: 'hsl(38 88% 52%)',
    primaryForeground: 'hsl(220 45% 10%)',
    secondary: 'hsl(40 25% 92%)',
    secondaryForeground: 'hsl(220 45% 12%)',
    muted: 'hsl(40 18% 90%)',
    mutedForeground: 'hsl(220 12% 42%)',
    accent: 'hsl(174 28% 88%)',
    accentForeground: 'hsl(220 45% 12%)',
    destructive: 'hsl(0 72% 48%)',
    border: 'hsl(40 14% 82%)',
    input: 'hsl(40 14% 82%)',
    ring: 'hsl(38 88% 52%)',
    radius: '1rem',
  },
  dark: {
    background: 'hsl(220 20% 10%)',
    foreground: 'hsl(40 10% 90%)',
    card: 'hsl(220 20% 14%)',
    cardForeground: 'hsl(40 10% 90%)',
    popover: 'hsl(220 20% 14%)',
    popoverForeground: 'hsl(40 10% 90%)',
    primary: 'hsl(38 88% 52%)',
    primaryForeground: 'hsl(220 45% 10%)',
    secondary: 'hsl(220 15% 20%)',
    secondaryForeground: 'hsl(40 10% 90%)',
    muted: 'hsl(220 15% 18%)',
    mutedForeground: 'hsl(40 10% 60%)',
    accent: 'hsl(174 28% 25%)',
    accentForeground: 'hsl(40 10% 90%)',
    destructive: 'hsl(0 72% 48%)',
    border: 'hsl(220 15% 22%)',
    input: 'hsl(220 15% 22%)',
    ring: 'hsl(38 88% 52%)',
    radius: '1rem',
  },
};

export const BRAND = {
  surface: '#F3EFE6',
  ink: '#14213D',
  amber: '#F0A020',
  tealSoft: '#D4EDE9',
} as const;

export const NAV_THEME: Theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    background: THEME.light.background,
    border: THEME.light.border,
    card: THEME.light.card,
    notification: THEME.light.primary,
    primary: THEME.light.primary,
    text: THEME.light.foreground,
  },
};
