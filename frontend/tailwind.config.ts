import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF9F5',
        surface: '#FFFFFF',
        line: '#E9E7E0',
        ink: '#0A0A0A',
        muted: '#7C7C74',
        subtle: '#9C9C94',
        brand: {
          50: '#EEF7F2',
          100: '#D7ECE1',
          200: '#AFD9C4',
          300: '#7FC2A2',
          400: '#5FAE8B',
          500: '#4E9E77',
          600: '#2E7A58',
          700: '#1F5B40',
          800: '#14402D',
          900: '#0C2B1E',
        },
        money: '#2E7A58',
        danger: '#9B2226',
        dangerSoft: '#C0392B',
      },
      fontFamily: {
        sans: ['var(--font-outfit)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.04)',
        panel: '0 18px 44px -18px rgba(12, 43, 30, 0.45)',
        modal: '0 28px 70px -20px rgba(10, 10, 10, 0.35)',
      },
      backgroundImage: {
        'sidebar-veil':
          'radial-gradient(120% 70% at 0% 100%, #1F6B4A 0%, #123B29 38%, #060807 72%, #050505 100%)',
        'balance-veil':
          'radial-gradient(135% 130% at 100% 100%, #1E6B4A 0%, #10462F 40%, #0A1D14 72%, #070707 100%)',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.25' },
        },
      },
      animation: {
        marquee: 'marquee 38s linear infinite',
        'fade-up': 'fade-up 0.35s ease-out both',
        'pulse-dot': 'pulseDot 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
