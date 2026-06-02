import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#08080c',
        'card-x': '#111114',
        'card-3d': '#13131a',
        accent: '#2563eb',
        'accent-light': '#60a5fa',
        'accent-bright': '#93c5fd',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1.5rem',
        '3xl': '1.75rem',
      },
    },
  },
  plugins: [],
}
export default config
