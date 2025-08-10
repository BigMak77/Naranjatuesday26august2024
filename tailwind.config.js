/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enables class-based dark mode via <html class="dark">
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f0f0f',
        card: '#1a1a1a',
        neon: '#2fffd2',
        text: '#d1d5db',
        muted: '#4b5563',
        accent: '#0f766e',
        danger: '#ef4444',
      },
      boxShadow: {
        glow: '0 0 10px #2fffd2, 0 0 20px #2fffd2',
        'glow-sm': '0 0 5px #2fffd2',
        'glow-inset': 'inset 0 0 10px #2fffd2',
      },
      borderColor: {
        neon: '#2fffd2',
      },
    },
  },
  plugins: [
    require('tw-animate-css'), // Optional, only if you're using animation classes
  ],
}
