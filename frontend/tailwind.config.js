/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3FB68B',      // mint green
        darkbg: '#111418',       // deep charcoal
        cardbg: '#1C2128',       // charcoal
        borderbg: '#30363D',     // charcoal border
        textprimary: '#F0F6FC',  // near white
        textsecondary: '#8B949E',// slate
        success: '#3FB68B',      // mint
        warning: '#E8A838',      // amber
        danger: '#F85149',       // github-style red
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
