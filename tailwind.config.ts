import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        // TreeHub Brand Colors
        'treehub': {
          'forest-green': {
            DEFAULT: '#2E4628',
            50: '#F5F7F4',
            100: '#E8EFDE',
            200: '#D1DFBD',
            300: '#BACF9C',
            400: '#A3BF7B',
            500: '#8CAF5A',
            600: '#759F39',
            700: '#5E8F18',
            800: '#475F11',
            900: '#2E4628',
            950: '#1F2F1B',
          },
          'safety-orange': {
            DEFAULT: '#FF7A00',
            50: '#FFF3E6',
            100: '#FFE6CC',
            200: '#FFCC99',
            300: '#FFB366',
            400: '#FF9933',
            500: '#FF7A00',
            600: '#E56A00',
            700: '#CC5A00',
            800: '#B24A00',
            900: '#993A00',
            950: '#802A00',
          },
          'industrial-gray': {
            DEFAULT: '#F0F2F5',
            50: '#FAFBFC',
            100: '#F0F2F5',
            200: '#E2E5E9',
            300: '#D4D8DD',
            400: '#C6CBD1',
            500: '#B8BEC5',
            600: '#AAB1B9',
            700: '#9CA4AD',
            800: '#8E97A1',
            900: '#808A95',
            950: '#727D89',
          },
        },
        // Standard colors maintained for compatibility
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      fontFamily: {
        'heading': ['Roboto Condensed', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-emergency': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
        'pulse-emergency': 'pulse-emergency 2s infinite',
      },
      minHeight: {
        'touch': '48px', // Work-glove friendly touch targets
      },
      minWidth: {
        'touch': '48px', // Work-glove friendly touch targets
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
