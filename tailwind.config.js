const { hairlineWidth } = require('nativewind/theme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        fym: {
          // coral = brand amber (kept key so existing classes still resolve)
          coral: 'hsl(var(--fym-coral))',
          brand: 'hsl(var(--fym-coral))',
          mint: 'hsl(var(--fym-mint))',
          gold: 'hsl(var(--fym-gold))',
          surface: 'hsl(var(--fym-surface))',
          cream: 'hsl(var(--fym-cream))',
          ink: 'hsl(var(--fym-ink))',
          text: 'hsl(var(--fym-text))',
          'text-muted': 'hsl(var(--fym-text-muted))',
          'pastel-pink': 'hsl(var(--fym-pastel-pink))',
          'pastel-blue': 'hsl(var(--fym-pastel-blue))',
          'pastel-lavender': 'hsl(var(--fym-pastel-lavender))',
          'pastel-yellow': 'hsl(var(--fym-pastel-yellow))',
          'pastel-green': 'hsl(var(--fym-pastel-green))',
        },
      },
      fontFamily: {
        // UI body — DM Sans (mapped to legacy jakarta keys for minimal churn)
        jakarta: ['DMSans_500Medium'],
        'jakarta-semibold': ['DMSans_600SemiBold'],
        'jakarta-bold': ['DMSans_700Bold'],
        'jakarta-extrabold': ['DMSans_800ExtraBold'],
        // Display — Fraunces
        display: ['Fraunces_700Bold'],
        'display-extrabold': ['Fraunces_800ExtraBold'],
        sans: ['DMSans_500Medium'],
        'sans-bold': ['DMSans_700Bold'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
        card: '24px',
        container: '40px',
        pill: '9999px',
      },
      borderWidth: {
        hairline: hairlineWidth(),
        brutal: '2px',
        'brutal-md': '2px',
        'brutal-lg': '3px',
      },
      spacing: {
        edge: '16px',
        gutter: '12px',
        container: '20px',
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [require('tailwindcss-animate')],
};
