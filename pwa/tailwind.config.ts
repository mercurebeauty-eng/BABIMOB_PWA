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
        },
        beige: {
          50: '#FDFBF7',
          100: '#F7F3E8',
          200: '#EAE1D0',
          300: '#D9C8AC',
          400: '#C6A981',
          500: '#B8925D',
          text: '#2D2721',
          muted: '#6D645A',
        },
        abidjan: {
          orange: '#FF7A00',
          green: '#00A651',
          blue: '#0066CC',
        }
      },
      fontFamily: {
        sans:    ['var(--font-dm-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['var(--font-syne)', 'system-ui', 'sans-serif']
      },
      backgroundImage: {
        'bm-gradient': 'linear-gradient(135deg, #f5a623 0%, #ff6b4a 100%)',
        'abidjan-gradient': 'linear-gradient(135deg, #FF7A00 0%, #EAE1D0 100%)'
      },
      animation: {
        'marquee':     'marquee 30s linear infinite',
        'float':       'float 6s ease-in-out infinite',
        'phone-float': 'phoneFloat 7s ease-in-out infinite',
        'shimmer':     'shimmer 2.5s linear infinite',
        'spotlight':   'spotlight 2s ease .75s 1 forwards',
        'aurora':      'aurora 20s linear infinite',
        'pulse-slow':  'pulseSlow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'drive-fast':  'drive 10s linear infinite',
        'drive-slow':  'drive 18s linear infinite',
        'bounce-slow': 'bounce 3s infinite',
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
        },
        drive: {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        }
      },
    }
  },
  plugins: []
};
export default config;
