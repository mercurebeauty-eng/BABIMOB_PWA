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
      }
    }
  },
  plugins: []
};
export default config;
