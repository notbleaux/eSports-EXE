/**
 * Valorant Design Tokens
 * Tactical FPS-inspired dark theme with red accents
 * 
 * [Ver001.000] - Initial Valorant theme implementation
 */

// Core Valorant Color Palette
export const VALORANT_COLORS = {
  // Background hierarchy - darkest to lightest
  bg: {
    base: '#0F1923',        // Main background - deep blue-gray
    elevated: '#1F2731',    // Cards, panels - slightly lighter
    panel: '#2A3241',       // Interactive panels
    input: '#1B2129',       // Input fields
    hover: '#3A4553',       // Hover states
    active: '#4A5563',      // Active/pressed states
  },
  
  // Text colors - high contrast for readability
  text: {
    primary: '#F9FAFB',     // Headings, important text
    secondary: '#A8B2C1',   // Body text
    muted: '#6B7280',       // Captions, hints
    disabled: '#4B5563',    // Disabled states
    inverse: '#0F1923',     // Text on light backgrounds
  },
  
  // Accent colors - Valorant signature red + complementary
  accent: {
    primary: '#FF4655',     // Valorant red - CTAs, highlights
    primaryHover: '#FF5C6A', // Lighter red for hover
    primaryGlow: 'rgba(255, 70, 85, 0.4)', // Red glow effect
    secondary: '#0AC8B9',   // Teal/cyan - secondary actions
    secondaryHover: '#0BE0D0',
    secondaryGlow: 'rgba(10, 200, 185, 0.4)',
    gold: '#FFB800',        // Rank/achievement gold
    goldGlow: 'rgba(255, 184, 0, 0.4)',
  },
  
  // Border colors - subtle to strong
  border: {
    subtle: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.2)',
    strong: 'rgba(255, 255, 255, 0.3)',
    accent: 'rgba(255, 70, 85, 0.5)',    // Red-tinted border
    accentSubtle: 'rgba(255, 70, 85, 0.2)',
  },
  
  // Status colors
  status: {
    success: '#00D26A',
    warning: '#FFB800',
    error: '#FF4655',
    info: '#0AC8B9',
  },
  
  // Utility colors
  utility: {
    black: '#000000',
    white: '#FFFFFF',
    transparent: 'transparent',
  }
} as const

// Spacing scale - 4px base unit
export const VALORANT_SPACING = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const

// Border radius - sharp tactical aesthetic
export const VALORANT_RADIUS = {
  none: '0',
  sm: '2px',
  md: '4px',
  lg: '6px',
  xl: '8px',
  full: '9999px',
} as const

// Typography scale
export const VALORANT_TYPOGRAPHY = {
  fontFamily: {
    display: ['Tungsten', 'Impact', 'Arial Narrow', 'sans-serif'], // Valorant-style condensed
    body: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
  },
  sizes: {
    hero: 'clamp(48px, 8vw, 96px)',      // Massive hero text
    title: 'clamp(32px, 5vw, 48px)',     // Section titles
    subtitle: 'clamp(20px, 3vw, 28px)',  // Subsection
    body: '16px',
    small: '14px',
    caption: '12px',
  },
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900',
  }
} as const

// Shadows and glows
export const VALORANT_SHADOWS = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  md: '0 4px 6px rgba(0, 0, 0, 0.4)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.5)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.6)',
  glowRed: '0 0 20px rgba(255, 70, 85, 0.4)',
  glowRedSm: '0 0 10px rgba(255, 70, 85, 0.3)',
  glowTeal: '0 0 20px rgba(10, 200, 185, 0.4)',
  glowGold: '0 0 20px rgba(255, 184, 0, 0.4)',
  inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
} as const

// Animation timing - snappy, tactical feel
export const VALORANT_ANIMATION = {
  duration: {
    instant: '50ms',
    fast: '150ms',
    normal: '250ms',
    slow: '400ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    snappy: 'cubic-bezier(0.16, 1, 0.3, 1)',
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  }
} as const

// Z-index scale
export const VALORANT_Z_INDEX = {
  base: '0',
  dropdown: '100',
  sticky: '200',
  fixed: '300',
  modal: '400',
  tooltip: '500',
  toast: '600',
} as const

// Export consolidated theme object
export const valorantTheme = {
  colors: VALORANT_COLORS,
  spacing: VALORANT_SPACING,
  radius: VALORANT_RADIUS,
  typography: VALORANT_TYPOGRAPHY,
  shadows: VALORANT_SHADOWS,
  animation: VALORANT_ANIMATION,
  zIndex: VALORANT_Z_INDEX,
} as const

// Type exports for TypeScript
export type ValorantColors = typeof VALORANT_COLORS
export type ValorantSpacing = typeof VALORANT_SPACING
export type ValorantRadius = typeof VALORANT_RADIUS
export type ValorantTheme = typeof valorantTheme

export default valorantTheme
