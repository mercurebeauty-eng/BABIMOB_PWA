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
      },
      fontFamily: {
        sans:    ['var(--font-dm-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['var(--font-archivo-black)', '"Archivo Black"', 'Impact', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-orange': 'linear-gradient(135deg, #F26C1A 0%, #D9510A 100%)',
        'gradient-green':  'linear-gradient(135deg, #0EA85B 0%, #0A8A4A 100%)',
        'gradient-ink':    'linear-gradient(180deg, #1A1410 0%, #3A3128 100%)',
      },
      animation: {
        'marquee':     'marquee 30s linear infinite',
        'float':       'bm-float 5s ease-in-out infinite',
        'pulse-slow':  'bm-pulse-slow 3s ease-in-out infinite',
        'bounce-slow': 'bounce 3s infinite',
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
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
