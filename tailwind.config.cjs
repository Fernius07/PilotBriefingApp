/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cockpit: {
          950: '#060a0f',
          900: '#0c131d',
          850: '#111b29',
          800: '#162334',
          700: '#203248',
          600: '#2e4562',
          border: '#1f2e42',
          cyan: '#00d2ff',
          green: '#00e676',
          amber: '#ffab00',
          red: '#ff3d71',
          purple: '#b388ff',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Consolas', 'Monaco', 'monospace'],
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
