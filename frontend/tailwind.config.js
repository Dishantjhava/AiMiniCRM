/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#111418',
        surface: '#1C2128',
        border: '#30363D',
        primary: '#3FB68B',
        accent: '#E8A838',
        success: '#3FB68B',
        danger: '#F85149',
        warning: '#E8A838',
        textPrimary: '#F0F6FC',
        textSecondary: '#8B949E',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
