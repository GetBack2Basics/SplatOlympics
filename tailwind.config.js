/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        splat: {
          neonCyan: '#00f3ff',
          neonPurple: '#a855f7',
          neonGreen: '#22c55e',
          neonAmber: '#f59e0b',
          neonRose: '#f43f5e',
          darkBg: '#090d16',
          cardBg: '#111827',
          glass: 'rgba(17, 24, 39, 0.85)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
