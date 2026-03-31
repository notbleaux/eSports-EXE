/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      /* ============================================
         COLORS - Kunsthalle Basel + Boitano Design System
         ============================================ */
      colors: {
        // Primary Palette
        'boitano-pink': '#FF69B4',
        'boitano-pink-dark': '#E0559F',
        'boitano-pink-light': '#FF8DC7',
        'kunst-green': '#00D26A',
        'kunst-green-dark': '#00B85C',
        'kunst-green-light': '#33E085',
        
        // Neutral Palette
        'off-white': '#FAFAFA',
        'pure-black': '#000000',
        'dark-gray': '#1A1A1A',
        'mid-gray': '#666666',
        'light-gray': '#E5E5E5',
        
        // Functional
        'accent-glow': 'rgba(255, 105, 180, 0.3)',
        'green-glow': 'rgba(0, 210, 106, 0.3)',
        
        // Accent Colors
        'accent-yellow': '#FFE600',
        'accent-cyan': '#00D9FF',
        'accent-purple': '#9D4EDD',
        'accent-orange': '#FF6B35',
        'accent-red': '#FF3366',
        
        // Functional Colors
        'text-primary': '#0A0A0A',
        'text-secondary': '#666666',
        'text-muted': '#999999',
        'text-inverse': '#FFFFFF',
        
        'border-subtle': '#E5E5E5',
        'border-strong': '#CCCCCC',
        
        'surface': '#FFFFFF',
        'surface-elevated': '#FFFFFF',
        'surface-subtle': '#F5F5F5',
        
        // State Colors
        'success': '#00D26A',
        'warning': '#FFE600',
        'error': '#FF3366',
        'info': '#00D9FF',
        
        // Neutral Scale
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        
        // HUB Colors - 5-hub NJZ system
        hub: {
          sator: '#000000',
          rotas: '#FF69B4',
          arepo: '#00D26A',
          opera: '#00D9FF',
          tenet: '#9D4EDD',
        },
        
        // Hub Backgrounds
        'hub-bg': {
          sator: '#0A0A0A',
          rotas: '#FFF0F7',
          arepo: '#F0FFF5',
          opera: '#F0FDFF',
          tenet: '#F5F0FF',
        },
        
        // Hub Accents
        'hub-accent': {
          sator: '#333333',
          rotas: '#FF8DC7',
          arepo: '#33E085',
          opera: '#33E0FF',
          tenet: '#B17AED',
        },
        
        // Legacy hub themes (maintained for compatibility)
        sator: {
          bg: '#000000',
          accent: '#333333',
          text: '#FFFFFF'
        },
        rotas: {
          bg: '#FF69B4',
          accent: '#FF8DC7',
          text: '#000000'
        },
        arepo: {
          bg: '#00D26A',
          accent: '#33E085',
          text: '#000000'
        },
        opera: {
          bg: '#00D9FF',
          accent: '#33E0FF',
          text: '#000000'
        },
        tenet: {
          bg: '#9D4EDD',
          accent: '#B17AED',
          text: '#FFFFFF'
        },
        
        /* ============================================
           VALORANT THEME - Tactical FPS Design System
           ============================================ */
        valorant: {
          // Background hierarchy
          'bg-base': '#0F1923',
          'bg-elevated': '#1F2731',
          'bg-panel': '#2A3241',
          'bg-input': '#1B2129',
          'bg-hover': '#3A4553',
          'bg-active': '#4A5563',
          
          // Text colors
          'text-primary': '#F9FAFB',
          'text-secondary': '#A8B2C1',
          'text-muted': '#6B7280',
          'text-disabled': '#4B5563',
          
          // Accent colors - Valorant signature
          'accent-red': '#FF4655',
          'accent-red-hover': '#FF5C6A',
          'accent-teal': '#0AC8B9',
          'accent-teal-hover': '#0BE0D0',
          'accent-gold': '#FFB800',
          
          // Border colors
          'border-subtle': 'rgba(255, 255, 255, 0.1)',
          'border-medium': 'rgba(255, 255, 255, 0.2)',
          'border-strong': 'rgba(255, 255, 255, 0.3)',
          'border-red': 'rgba(255, 70, 85, 0.5)',
          
          // Status colors
          'status-success': '#00D26A',
          'status-warning': '#FFB800',
          'status-error': '#FF4655',
          'status-info': '#0AC8B9',
        }
      },
      
      /* ============================================
         FONT FAMILY
         ============================================ */
      fontFamily: {
        display: ['Space Grotesk', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', 'monospace'],
      },
      
      /* ============================================
         FONT SIZE - Fluid Typography
         ============================================ */
      fontSize: {
        // Hero Typography - Kunsthalle/Boitano Style
        'hero': ['clamp(48px, 10vw, 120px)', { lineHeight: '0.9', letterSpacing: '-0.04em' }],
        'hero-sub': ['clamp(1.5rem, 4vw, 3rem)', { lineHeight: '1.1', letterSpacing: '0' }],
        'display': ['clamp(32px, 6vw, 64px)', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'title': ['clamp(24px, 4vw, 48px)', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        'headline': ['clamp(1.5rem, 3vw, 2.5rem)', { lineHeight: '1.1', letterSpacing: '-0.04em' }],
        'subtitle': ['clamp(1.125rem, 2vw, 1.5rem)', { lineHeight: '1.5' }],
        'body': ['clamp(1rem, 1.5vw, 1.125rem)', { lineHeight: '1.75' }],
        'body-sm': ['clamp(0.875rem, 1.2vw, 1rem)', { lineHeight: '1.75' }],
        'small': ['clamp(0.75rem, 1vw, 0.875rem)', { lineHeight: '1.5' }],
        'tiny': ['0.625rem', { lineHeight: '1.5' }],
        'label': ['0.75rem', { lineHeight: '1', letterSpacing: '0.08em' }],
      },
      
      /* ============================================
         SPACING - 8px Base Scale + Custom
         ============================================ */
      spacing: {
        'px': '1px',
        '0': '0',
        '1': '0.25rem',    // 4px
        '2': '0.5rem',     // 8px
        '3': '0.75rem',    // 12px
        '4': '1rem',       // 16px
        '5': '1.5rem',     // 24px
        '6': '2rem',       // 32px
        '7': '2.5rem',     // 40px
        '8': '3rem',       // 48px
        '9': '3.5rem',     // 56px
        '10': '4rem',      // 64px
        '11': '5rem',      // 80px
        '12': '6rem',      // 96px
        '14': '7rem',      // 112px
        '16': '8rem',      // 128px
        '18': '4.5rem',    // 72px - Custom
        '20': '10rem',     // 160px
        '22': '5.5rem',    // 88px - Custom
        '24': '12rem',     // 192px
        '28': '14rem',     // 224px
        '30': '7.5rem',    // 120px - Custom
        '32': '16rem',     // 256px
      },
      
      /* ============================================
         BORDER RADIUS - Sharp Aesthetic
         ============================================ */
      borderRadius: {
        'none': '0',
        'sm': '2px',
        'md': '4px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
        'full': '9999px',
      },
      
      /* ============================================
         BOX SHADOW - Colored Shadows (Boitano Style)
         ============================================ */
      boxShadow: {
        // Sharp Shadow (Boitano Style)
        'sharp': '8px 8px 0px 0px rgba(0, 0, 0, 1)',
        'sharp-sm': '4px 4px 0px 0px rgba(0, 0, 0, 1)',
        'sharp-lg': '12px 12px 0px 0px rgba(0, 0, 0, 1)',
        
        // Glow Shadows
        'pink-glow': '0 0 40px rgba(255, 105, 180, 0.3)',
        'green-glow': '0 0 40px rgba(0, 210, 106, 0.3)',
        
        // Colored Shadows
        'pink': '0 8px 32px rgba(255, 105, 180, 0.3)',
        'pink-sm': '0 4px 16px rgba(255, 105, 180, 0.2)',
        'pink-lg': '0 12px 48px rgba(255, 105, 180, 0.4)',
        
        'green': '0 8px 32px rgba(0, 210, 106, 0.3)',
        'green-sm': '0 4px 16px rgba(0, 210, 106, 0.2)',
        'green-lg': '0 12px 48px rgba(0, 210, 106, 0.4)',
        
        'cyan': '0 8px 32px rgba(0, 217, 255, 0.3)',
        'cyan-sm': '0 4px 16px rgba(0, 217, 255, 0.2)',
        
        'purple': '0 8px 32px rgba(157, 78, 221, 0.3)',
        'purple-sm': '0 4px 16px rgba(157, 78, 221, 0.2)',
        
        'yellow': '0 8px 32px rgba(255, 230, 0, 0.3)',
        
        // Neutral Shadows
        'black': '0 4px 24px rgba(0, 0, 0, 0.15)',
        'black-sm': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'black-md': '0 4px 16px rgba(0, 0, 0, 0.12)',
        'black-lg': '0 8px 32px rgba(0, 0, 0, 0.16)',
        'black-xl': '0 16px 48px rgba(0, 0, 0, 0.2)',
        
        // Layered Shadows
        'elevated': '0 1px 2px rgba(0, 0, 0, 0.02), 0 4px 8px rgba(0, 0, 0, 0.04), 0 8px 16px rgba(0, 0, 0, 0.06)',
        'floating': '0 4px 6px rgba(0, 0, 0, 0.04), 0 10px 20px rgba(0, 0, 0, 0.08), 0 24px 48px rgba(0, 0, 0, 0.12)',
        
        // Valorant Tactical Shadows
        'valorant-glow': '0 0 20px rgba(255, 70, 85, 0.4)',
        'valorant-glow-sm': '0 0 10px rgba(255, 70, 85, 0.3)',
        'valorant-glow-lg': '0 0 40px rgba(255, 70, 85, 0.5)',
        'valorant-teal': '0 0 20px rgba(10, 200, 185, 0.4)',
        'valorant-gold': '0 0 20px rgba(255, 184, 0, 0.4)',
        'valorant-panel': '0 4px 6px rgba(0, 0, 0, 0.3), 0 10px 20px rgba(0, 0, 0, 0.4)',
      },
      
      /* ============================================
         TRANSITION TIMING FUNCTIONS
         ============================================ */
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-expo': 'cubic-bezier(0.7, 0, 0.84, 0)',
        'out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      
      /* ============================================
         TRANSITION DURATIONS
         ============================================ */
      transitionDuration: {
        'instant': '50ms',
        'fast': '150ms',
        'normal': '300ms',
        'slow': '500ms',
        'slower': '700ms',
      },
      
      /* ============================================
         LETTER SPACING
         ============================================ */
      letterSpacing: {
        'tighter': '-0.05em',
        'tight': '-0.04em',
        'normal': '0',
        'wide': '0.02em',
        'wider': '0.04em',
        'widest': '0.08em',
      },
      
      /* ============================================
         LINE HEIGHT
         ============================================ */
      lineHeight: {
        'none': '1',
        'tight': '0.9',
        'snug': '1.1',
        'normal': '1.5',
        'relaxed': '1.75',
        'loose': '2',
      },
      
      /* ============================================
         MAX WIDTH - Container Sizes
         ============================================ */
      maxWidth: {
        'container': '1440px',
        'container-narrow': '960px',
        'container-wide': '1600px',
      },
      
      /* ============================================
         Z-INDEX SCALE
         ============================================ */
      zIndex: {
        'dropdown': '100',
        'sticky': '200',
        'fixed': '300',
        'modal-backdrop': '400',
        'modal': '500',
        'popover': '600',
        'tooltip': '700',
        'toast': '800',
        'max': '9999',
      },
      
      /* ============================================
         ANIMATIONS - Kunsthalle/Boitano Style
         ============================================ */
      animation: {
        // Legacy animations
        'waterfall-up': 'waterfallUp 3s linear infinite',
        'waterfall-down': 'waterfallDown 4s linear infinite',
        'grid-spin': 'gridSpin 20s linear infinite',
        'phase-shift': 'phaseShift 2s ease-in-out infinite',
        'projection': 'projection 1.5s cubic-bezier(0.25,0.46,0.45,0.94)',
        
        // New Design System Animations
        'radial-expand': 'radialExpand 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'fade-in-up': 'fadeInUp 500ms cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in-down': 'fadeInDown 500ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-left': 'slideInLeft 500ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 500ms cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-subtle': 'bounce 2s ease-in-out infinite',
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
        },
        // New Design System Keyframes
        radialExpand: {
          '0%': { clipPath: 'circle(0% at 50% 50%)' },
          '100%': { clipPath: 'circle(150% at 50% 50%)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        fadeInDown: {
          from: { opacity: '0', transform: 'translateY(-20px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to: { opacity: '1', transform: 'translateX(0)' }
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' }
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      },
      
      /* ============================================
         BACKGROUND IMAGE
         ============================================ */
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'shimmer': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
      },
      
      /* ============================================
         GRID TEMPLATE COLUMNS
         ============================================ */
      gridTemplateColumns: {
        '12': 'repeat(12, minmax(0, 1fr))',
        '16': 'repeat(16, minmax(0, 1fr))',
        '24': 'repeat(24, minmax(0, 1fr))',
      },
      
      /* ============================================
         ASPECT RATIO
         ============================================ */
      aspectRatio: {
        'square': '1 / 1',
        'video': '16 / 9',
        'cinematic': '21 / 9',
        'portrait': '3 / 4',
        'sator': '1 / 1',
      }
    }
  },
  plugins: [
    /* ============================================
       CUSTOM PLUGIN - Hub color utilities
       ============================================ */
    function({ addUtilities, theme }) {
      const hubColors = theme('colors.hub');
      const hubUtilities = {};
      
      Object.keys(hubColors).forEach(hub => {
        hubUtilities[`.text-hub-${hub}`] = { color: hubColors[hub] };
        hubUtilities[`.bg-hub-${hub}`] = { backgroundColor: hubColors[hub] };
        hubUtilities[`.border-hub-${hub}`] = { borderColor: hubColors[hub] };
        hubUtilities[`.fill-hub-${hub}`] = { fill: hubColors[hub] };
        hubUtilities[`.stroke-hub-${hub}`] = { stroke: hubColors[hub] };
      });
      
      addUtilities(hubUtilities);
    }
  ]
}
