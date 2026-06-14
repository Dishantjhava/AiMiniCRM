/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6C63FF',
        darkbg: '#0F0F1A',
        cardbg: '#1A1A2E',
        borderbg: '#2A2A4A',
        textprimary: '#FFFFFF',
        textsecondary: '#8888AA',
        success: '#00D9A3',
        warning: '#FFB347',
        danger: '#FF6B6B',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
