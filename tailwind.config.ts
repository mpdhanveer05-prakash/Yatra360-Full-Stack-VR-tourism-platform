import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-base': '#0D0F1A',
        'bg-surface': '#161B2E',
        'bg-card': '#1E2640',
        'bg-elevated': '#243050',
        saffron: '#FF6B1A',
        'saffron-light': '#FF8C42',
        gold: '#D4A017',
        'gold-light': '#F0C040',
        cream: '#F5EDD8',
        terracotta: '#C4622D',
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        proza: ['Proza Libre', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px #FF6B1A, 0 0 10px #FF6B1A' },
          '50%': { boxShadow: '0 0 20px #FF6B1A, 0 0 40px #FF6B1A' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'voice-bar': {
          '0%, 100%': { transform: 'scaleY(0.35)' },
          '50%':       { transform: 'scaleY(1)' },
        },
      },
      animation: {
        'voice-bar': 'voice-bar 0.65s ease-in-out infinite',
        shimmer: 'shimmer 2s infinite linear',
        float: 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
      },
      backgroundImage: {
        'gold-border': 'linear-gradient(90deg, transparent, #D4A017, transparent)',
      },
    },
  },
  plugins: [],
}

export default config
