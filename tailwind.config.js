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
        brightGold: '#ffb950',
        blush: '#ffb59f',
        paleCream: '#efe2c2',
        deepObsidian: '#211b08',
        void: '#130e01',
        mutedCream: '#d6c4af',
        mud: '#3b341f',
        darkMud: '#302915',
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
