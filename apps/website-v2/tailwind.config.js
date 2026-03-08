/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./hub-*/**/*.{js,jsx,ts,tsx}",
    "./*.html"
  ],
  theme: {
    extend: {
      colors: {
        // Abyssal Foundation
        'void': {
          DEFAULT: '#0a0a0f',
          deep: '#0f0f13',
          mid: '#1a1a25',
          light: '#2a2a3a'
        },
        // Bioluminescent Accents
        'signal': {
          cyan: '#00f0ff',
          'cyan-glow': 'rgba(0, 240, 255, 0.3)',
          amber: '#ff9f1c',
          'amber-glow': 'rgba(255, 159, 28, 0.3)'
        },
        'aged': {
          gold: '#c9b037',
          'gold-glow': 'rgba(201, 176, 55, 0.3)'
        },
        // Data States
        'porcelain': '#e8e6e3',
        'slate': '#8a8a9a',
        'cobalt': '#1e3a5f',
        // Fluid Effects
        'smoke': 'rgba(245, 245, 245, 0.05)',
        'cloud': 'rgba(138, 138, 154, 0.1)',
        'mist': 'rgba(255, 255, 255, 0.05)'
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        accent: ['Cinzel', 'serif']
      },
      fontSize: {
        'hero': ['clamp(3rem, 12vw, 8rem)', { lineHeight: '1' }],
        'h1': ['clamp(2rem, 5vw, 4rem)', { lineHeight: '1.1' }],
        'h2': ['clamp(1.5rem, 3vw, 2.5rem)', { lineHeight: '1.2' }],
        'data': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.05em' }]
      },
      transitionTimingFunction: {
        'fluid': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'smoke': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'abyss': 'cubic-bezier(0.7, 0, 0.3, 1)'
      },
      transitionDuration: {
        'instant': '150ms',
        'fast': '300ms',
        'normal': '500ms',
        'slow': '800ms',
        'ambient': '20s'
      },
      backdropBlur: {
        'glass': '20px'
      },
      boxShadow: {
        'smoke': '0 4px 30px rgba(0, 0, 0, 0.5)',
        'abyss': '0 20px 60px rgba(0, 0, 0, 0.8)',
        'glow-cyan': '0 0 40px rgba(0, 240, 255, 0.4)',
        'glow-amber': '0 0 40px rgba(255, 159, 28, 0.4)',
        'glow-gold': '0 0 40px rgba(201, 176, 55, 0.4)'
      },
      animation: {
        'orbit': 'orbit 60s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'flow': 'flow 4s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'gradient-shift': 'gradient-shift 3s ease infinite',
        'scanline': 'scanline 8s linear infinite',
        'grid-pulse': 'grid-pulse 4s ease-in-out infinite'
      },
      keyframes: {
        orbit: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.8' }
        },
        flow: {
          '0%': { strokeDashoffset: '0' },
          '100%': { strokeDashoffset: '-24' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' }
        },
        'grid-pulse': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '0.8' }
        }
      }
    }
  },
  plugins: []
}