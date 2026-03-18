/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Core Palette
        'prussian-blue': '#001F3F', // #001F3F
        'arctic-frost': '#E8F4FD', // #E8F4FD
        silver: '#C0C0C0', // #C0C0C0
        porcelain: '#F8F1E9', // #F8F1E9

        // Accents
        gold: {
          50: '#FEF7DC',
          500: '#FBBF24',
          900: '#B45309'
        },
        cyan: {
          50: '#ECFEFF',
          500: '#06B6D4',
          900: '#0E4D5B'
        },

        // HUB Themes
        sator: {
          bg: '#001F3F', // Prussian Blue
          accent: '#FBBF24', // Gold
          text: '#F8F1E9' // Porcelain
        },
        rotas: {
          bg: '#0E4D5B', // Deep Cyan
          accent: '#C0C0C0', // Silver
          text: '#E8F4FD' // Arctic Frost
        },
        arepo: {
          bg: '#B45309', // Deep Gold
          accent: '#F8F1E9', // Porcelain
          text: '#C0C0C0' // Silver
        },
        opera: {
          bg: '#001F3F', // Prussian Blue
          accent: '#06B6D4', // Cyan
          text: '#FEF7DC' // Light Gold
        }
      },
      animation: {
        'waterfall-up': 'waterfallUp 3s linear infinite',
        'waterfall-down': 'waterfallDown 4s linear infinite',
        'grid-spin': 'gridSpin 20s linear infinite',
        'phase-shift': 'phaseShift 2s ease-in-out infinite',
        projection: 'projection 1.5s cubic-bezier(0.25,0.46,0.45,0.94)'
      },
      keyframes: {
        waterfallUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(-100%)' }
        },
        waterfallDown: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' }
        },
        gridSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        phaseShift: {
          '0%, 100%': { filter: 'hue-rotate(0deg) brightness(1)' },
          '50%': { filter: 'hue-rotate(90deg) brightness(1.1)' }
        },
        projection: {
          '0%': { transform: 'perspective(1000px) rotateX(90deg)' },
          '50%': { transform: 'perspective(1000px) rotateX(0deg)' },
          '100%': { transform: 'perspective(1000px) rotateX(-90deg)' }
        }
      }
    }
  },
  plugins: []
}
