/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#0F0A00',
        muiscaGold: '#C8860A',
        taironaTerracotta: '#8B2500',
        koguiCream: '#F2E8D0',
        zenuCopper: '#B5651D',
        emberaNavy: '#1A2340',
        wayuuJade: '#1A7A6E',
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        crimson: ['Crimson Pro', 'serif'],
      },
    },
  },
  plugins: [],
}