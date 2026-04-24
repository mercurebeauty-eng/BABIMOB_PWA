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
        // Historique (app map) — on garde pour ne rien casser
        babimob: {
          blue:        '#1746D1',
          'blue-dark': '#12389E',
          'blue-soft': '#2B6CB0',
          orange:      '#EA580C',
          'orange-br': '#F97316',
          ink:         '#0F172A',
          paper:       '#F8FAFC'
        },
        // Nouveau thème dark (landing + futures pages)
        bm: {
          bg:        '#0a0c0f',  // fond principal
          surface:   '#12151a',  // cartes
          'surface-2':'#1a1e26', // surélevé
          border:    '#232832',
          muted:     '#8a93a2',
          text:      '#e8ecf2',
          amber:     '#f5a623',
          coral:     '#ff6b4a',
          green:     '#2edd8b',
          telegram:  '#2aabee'
        }
      },
      fontFamily: {
        sans:    ['var(--font-dm-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['var(--font-syne)', 'system-ui', 'sans-serif']
      },
      backgroundImage: {
        'bm-gradient': 'linear-gradient(135deg, #f5a623 0%, #ff6b4a 100%)'
      },
      animation: {
        'marquee':     'marquee 30s linear infinite',
        'float':       'float 6s ease-in-out infinite',
        'phone-float': 'phoneFloat 7s ease-in-out infinite',
        'shimmer':     'shimmer 2.5s linear infinite',
        'spotlight':   'spotlight 2s ease .75s 1 forwards',
        'aurora':      'aurora 20s linear infinite',
        'pulse-slow':  'pulseSlow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        phoneFloat: {
          '0%, 100%': { transform: 'translateY(0px) rotate(-1deg)' },
          '50%':      { transform: 'translateY(-8px) rotate(0.5deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        spotlight: {
          '0%': { opacity: '0', transform: 'translate(-50%, -50%) scale(0.5)' },
          '100%': { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
        },
        aurora: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        }
      },
    }
  },
  plugins: []
};
export default config;
