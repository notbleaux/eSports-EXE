/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dir-bg': '#FFFFFF',
        'dir-text': '#0A0A0A',
        'dir-nav-blue': '#1E90FF',
        'dir-purple': '#9370DB',
        'dir-muted': '#6B7280',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
