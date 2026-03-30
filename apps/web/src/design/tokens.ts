/**
 * Valorant-Style Design Tokens
 * 
 * References:
 * - Valorant UI: Sharp corners, tactical aesthetic, neon accents on dark
 * - Dark base: #050817 (deep navy-black)
 * - Primary accent: #F43F5E (rose/red - kill feed, highlights)
 * - Secondary accent: #22D3EE (cyan - intel, info)
 * - Typography: Wide tracking, bold uppercase for labels
 */

// ============================================
// COLOR PALETTE
// ============================================

export const colors = {
  // Base/Dark Scale (Valorant's deep navy-black)
  base: {
    50: '#E8E9EC',
    100: '#B8BAC4',
    200: '#8A8E9E',
    300: '#5C6278',
    400: '#2E3652',
    500: '#050817', // Primary dark base
    600: '#040614',
    700: '#030510',
    800: '#02030C',
    900: '#010208',
  },

  // Primary Accent - Rose/Red (Kill feed, danger, highlights)
  primary: {
    50: '#FEF2F4',
    100: '#FCE7EB',
    200: '#F9CFD7',
    300: '#F5A7B7',
    400: '#F43F5E', // Main accent
    500: '#E11D48',
    600: '#BE123C',
    700: '#9F1239',
    800: '#881337',
    900: '#4C0519',
  },

  // Secondary Accent - Cyan (Intel, info, tech)
  secondary: {
    50: '#ECFEFF',
    100: '#CFFAFE',
    200: '#A5F3FC',
    300: '#67E8F9',
    400: '#22D3EE', // Main cyan
    500: '#06B6D4',
    600: '#0891B2',
    700: '#0E7490',
    800: '#155E75',
    900: '#164E63',
  },

  // Semantic Colors
  success: '#10B981', // Emerald for success states
  warning: '#F59E0B', // Amber for warnings
  error: '#EF4444',   // Red for errors
  info: '#22D3EE',    // Cyan for info

  // Utility Colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Neon Glow Colors (for shadows/borders)
  neon: {
    red: '#F43F5E',
    cyan: '#22D3EE',
    purple: '#A855F7',
    green: '#22C55E',
  },
} as const;

// ============================================
// SPACING SCALE (4px grid)
// ============================================

export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px
} as const;

// ============================================
// TYPOGRAPHY
// ============================================

export const typography = {
  // Font Families
  fontFamily: {
    display: ['"Rajdhani"', '"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
    body: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['"JetBrains Mono"', 'Fira Code', 'SF Mono', 'Consolas', 'monospace'],
  },

  // Font Sizes (rem-based)
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    '5xl': ['3rem', { lineHeight: '1' }],         // 48px
    '6xl': ['3.75rem', { lineHeight: '1' }],      // 60px
    '7xl': ['4.5rem', { lineHeight: '1' }],       // 72px
    '8xl': ['6rem', { lineHeight: '1' }],         // 96px
    '9xl': ['8rem', { lineHeight: '1' }],         // 128px
  },

  // Font Weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // Letter Spacing (Valorant uses wide tracking for labels)
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',    // For uppercase labels
    label: '0.15em',    // Special for tactical labels
  },

  // Line Heights
  lineHeight: {
    none: '1',
    tight: '1.1',
    snug: '1.25',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
} as const;

// ============================================
// BORDER RADIUS (Sharp corners for Valorant aesthetic)
// ============================================

export const borderRadius = {
  none: '0',
  sm: '2px',
  DEFAULT: '4px',
  md: '4px',
  lg: '6px',
  xl: '8px',
  '2xl': '10px',
  full: '9999px',
} as const;

// ============================================
// SHADOWS (Neon glow effects)
// ============================================

export const shadows = {
  // Standard shadows
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',

  // Neon glow shadows (Valorant-style)
  'neon-red': '0 0 5px #F43F5E, 0 0 20px rgba(244, 63, 94, 0.5)',
  'neon-red-sm': '0 0 2px #F43F5E, 0 0 10px rgba(244, 63, 94, 0.4)',
  'neon-red-lg': '0 0 10px #F43F5E, 0 0 40px rgba(244, 63, 94, 0.6)',
  
  'neon-cyan': '0 0 5px #22D3EE, 0 0 20px rgba(34, 211, 238, 0.5)',
  'neon-cyan-sm': '0 0 2px #22D3EE, 0 0 10px rgba(34, 211, 238, 0.4)',
  'neon-cyan-lg': '0 0 10px #22D3EE, 0 0 40px rgba(34, 211, 238, 0.6)',
  
  'neon-purple': '0 0 5px #A855F7, 0 0 20px rgba(168, 85, 247, 0.5)',
  
  // Panel shadows
  panel: '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
  'panel-elevated': '0 8px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
} as const;

// ============================================
// TRANSITIONS
// ============================================

export const transitions = {
  // Durations
  duration: {
    instant: '50ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },

  // Timing functions
  timing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
    // Valorant-style snappy transitions
    snappy: 'cubic-bezier(0.16, 1, 0.3, 1)',
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    tactical: 'cubic-bezier(0.7, 0, 0.3, 1)',
  },
} as const;

// ============================================
// Z-INDEX SCALE
// ============================================

export const zIndex = {
  hide: -1,
  base: 0,
  docked: 10,
  dropdown: 100,
  sticky: 200,
  banner: 300,
  overlay: 400,
  modal: 500,
  popover: 600,
  skipLink: 700,
  toast: 800,
  tooltip: 900,
  max: 9999,
} as const;

// ============================================
// BREAKPOINTS
// ============================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================
// VALORANT-SPECIFIC TOKENS
// ============================================

export const valorant = {
  // Panel styles
  panel: {
    background: `linear-gradient(135deg, ${colors.base[500]} 0%, ${colors.base[600]} 100%)`,
    border: `1px solid ${colors.base[400]}`,
    borderAccent: `1px solid ${colors.primary[400]}`,
    borderCyan: `1px solid ${colors.secondary[400]}`,
  },

  // Button styles
  button: {
    primary: {
      background: colors.primary[400],
      hover: colors.primary[500],
      active: colors.primary[600],
      text: colors.white,
    },
    secondary: {
      background: 'transparent',
      border: `2px solid ${colors.primary[400]}`,
      hover: `rgba(244, 63, 94, 0.1)`,
      text: colors.primary[400],
    },
    ghost: {
      background: 'transparent',
      hover: colors.base[400],
      text: colors.base[100],
    },
  },

  // Tactical label style
  label: {
    fontSize: typography.fontSize.xs[0],
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.label,
    textTransform: 'uppercase' as const,
  },

  // Neon edge accent (for panels/cards)
  edgeAccent: {
    red: `linear-gradient(180deg, ${colors.primary[400]} 0%, transparent 100%)`,
    cyan: `linear-gradient(180deg, ${colors.secondary[400]} 0%, transparent 100%)`,
  },
} as const;

// ============================================
// EXPORT ALL TOKENS
// ============================================

export const tokens = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  breakpoints,
  valorant,
} as const;

export default tokens;
