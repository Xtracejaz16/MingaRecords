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
        surface: '#0F0A00',
        primary: '#C8860A',
        secondary: '#8B2500',
        'on-background': '#F2E8D0',
        outline: '#514535',
      },
      fontFamily: {
        headline: ['Cinzel', 'serif'],
        body: ['Crimson Pro', 'serif'],
        label: ['Crimson Pro', 'serif'],
        cinzel: ['Cinzel', 'serif'],
        crimson: ['Crimson Pro', 'serif'],
      },
    },
  },
  plugins: [],
}
