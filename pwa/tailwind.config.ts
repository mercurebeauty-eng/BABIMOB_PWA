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
        babimob: {
          blue:        '#1746D1',
          'blue-dark': '#12389E',
          'blue-soft': '#2B6CB0',
          orange:      '#EA580C',
          'orange-br': '#F97316',
          ink:         '#0F172A',
          paper:       '#F8FAFC'
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif']
      }
    }
  },
  plugins: []
};
export default config;
