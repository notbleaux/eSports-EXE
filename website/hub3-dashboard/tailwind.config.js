/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dash-bg': '#0A0A0A',
        'dash-panel': 'rgba(255,255,255,0.05)',
        'dash-teal': '#008080',
        'dash-chart-blue': '#4169E1',
        'dash-border': 'rgba(255,255,255,0.1)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
