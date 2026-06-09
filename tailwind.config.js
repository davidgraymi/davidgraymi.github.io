/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ice: '#00d4ff',
        ember: '#ff4d1c',
        steel: '#0a0e14',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        display: ['"Archivo"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
