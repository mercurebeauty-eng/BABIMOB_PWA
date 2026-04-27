import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        // Legacy palette
        orange:       '#F26C1A',
        'orange-deep':'#D9510A',
        green:        '#0EA85B',
        'green-deep': '#0A8A4A',
        cream:        '#F7F1E6',
        'cream-2':    '#FBF6EC',
        ink:          '#1A1410',
        'ink-2':      '#3A3128',
        muted:        '#8B7E6E',
        gold:         '#E8B23C',
        blue:         '#1E5BFF',
        // Semantic aliases used in components
        'abidjan-orange': '#F26C1A',
        'abidjan-blue':   '#1E5BFF',
        'abidjan-green':  '#0EA85B',
        beige: {
          '50':   '#FDFBF7',
          '100':  '#F0E8D8',
          '200':  '#DDD4C5',
          text:   '#1A1410',
          muted:  '#8B7E6E',
        },
      },
      fontFamily: {
        sans:    ['var(--font-dm-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['var(--font-archivo-black)', '"Archivo Black"', 'Impact', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-orange': 'linear-gradient(135deg, #F26C1A 0%, #D9510A 100%)',
        'gradient-green':  'linear-gradient(135deg, #0EA85B 0%, #0A8A4A 100%)',
        'gradient-ink':    'linear-gradient(180deg, #1A1410 0%, #3A3128 100%)',
        'bm-gradient':     'linear-gradient(135deg, #F7F1E6 0%, #F0E8D8 100%)',
      },
      animation: {
        'marquee':     'marquee 30s linear infinite',
        'float':       'bm-float 5s ease-in-out infinite',
        'pulse-slow':  'bm-pulse-slow 3s ease-in-out infinite',
        'bounce-slow': 'bounce 3s infinite',
        'slide-up':    'slide-up 0.35s ease-out both',
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      borderRadius: {
        '2xl':  '1rem',
        '3xl':  '1.5rem',
        '4xl':  '2rem',
        '5xl':  '2.5rem',
      },
    }
  },
  plugins: []
};
export default config;
