/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#000000', surface: '#0A0A0A', surface2: '#111111',
        border: '#262626', textmain: '#FFFFFF', textmuted: '#A1A1AA',
        primary: '#2563EB', primaryhover: '#1D4ED8', success: '#16A34A', warning: '#D97706',
      },
      fontFamily: { sans: ['Inter', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] },
    },
  },
  plugins: [],
};
