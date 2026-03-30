/**
 * NJZiteGeisTe Platform Color Palette
 *
 * [Ver001.000]
 * SATOR (Cyan) | ROTAS (Red) | AREPO (Yellow) | OPERA (Magenta) | TENET (Purple)
 */

// Hub Colors
export const HUB_COLORS = {
  sator: '#00d4ff', // Cyan
  rotas: '#ff4444', // Red
  arepo: '#ffaa00', // Orange/Yellow
  opera: '#ff00ff', // Magenta
  tenet: '#8b5cf6' // Purple
} as const

// Status Colors
export const STATUS_COLORS = {
  healthy: '#10b981', // Green
  degraded: '#f59e0b', // Amber
  critical: '#ef4444', // Red
  warning: '#f59e0b', // Yellow
  info: '#3b82f6', // Blue
  success: '#10b981', // Green
  error: '#ef4444' // Red
} as const

// Grayscale
export const GRAYSCALE = {
  50: '#f9fafb',
  100: '#f3f4f6',
  200: '#e5e7eb',
  300: '#d1d5db',
  400: '#9ca3af',
  500: '#6b7280',
  600: '#4b5563',
  700: '#374151',
  800: '#1f2937',
  900: '#111827',
  950: '#030712'
} as const

// Glow effects
export const GLOW_COLORS = {
  satorGlow: '0 0 20px #00d4ff',
  rotasGlow: '0 0 20px #ff4444',
  arepoGlow: '0 0 20px #ffaa00',
  operaGlow: '0 0 20px #ff00ff',
  tenetGlow: '0 0 20px #8b5cf6'
} as const

// Text Colors (for dark theme)
export const TEXT_COLORS = {
  primary: '#ffffff',
  secondary: 'rgba(255, 255, 255, 0.7)',
  muted: 'rgba(255, 255, 255, 0.5)',
  disabled: 'rgba(255, 255, 255, 0.3)'
} as const

// Chart Colors
export const CHART_COLORS = {
  primary: '#00d4ff',
  secondary: '#0099ff',
  success: '#00ff88',
  warning: '#ffaa00',
  error: '#ff4655',
  grid: 'rgba(255, 255, 255, 0.05)'
} as const

// Background Colors
export const BACKGROUND_COLORS = {
  primary: '#0f172a',    // Dark blue/slate background
  secondary: '#1e293b',  // Slightly lighter
  card: '#1e293b',       // Card backgrounds
  hover: '#334155',      // Hover states
} as const

// Border Colors
export const BORDER_COLORS = {
  subtle: 'rgba(255, 255, 255, 0.1)',  // Subtle borders
  default: 'rgba(255, 255, 255, 0.2)', // Default borders
  strong: 'rgba(255, 255, 255, 0.3)',  // Stronger borders
} as const

// Export all
export const colors = {
  hub: HUB_COLORS,
  status: STATUS_COLORS,
  gray: GRAYSCALE,
  glow: GLOW_COLORS,
  text: TEXT_COLORS,
  chart: CHART_COLORS,
  background: BACKGROUND_COLORS,
  border: BORDER_COLORS,
} as const

export default colors
