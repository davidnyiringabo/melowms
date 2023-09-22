import { colors } from 'tailwindcss';
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        melo: {
          50: '#5CF2E3',
          100: '#1BCBF2',
          200: '#0FB2F2',
          300: '#139DF2',
          400: '#11538C',
        },
        ...colors,
      },
    },
  },
  plugins: [],
};
