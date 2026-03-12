/**
 * Porcelain³ Design System - Enhanced Color Tokens
 * Modernized with richer gradients and depth
 */

export const colors = {
  // Backgrounds - Richer dark tones
  background: {
    primary: '#050508',      // Deeper black
    secondary: '#0a0a0f',    // Original primary
    tertiary: '#12121a',     // Elevated surfaces
    elevated: '#1a1a25',     // Cards on hover
  },
  
  // Borders - More visible
  border: {
    subtle: 'rgba(255, 255, 255, 0.08)',
    default: 'rgba(255, 255, 255, 0.12)',
    hover: 'rgba(255, 255, 255, 0.2)',
    active: 'rgba(255, 255, 255, 0.3)',
  },
  
  // Text - Better contrast
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.7)',
    muted: 'rgba(255, 255, 255, 0.5)',
    disabled: 'rgba(255, 255, 255, 0.3)',
    inverse: '#050508',
  },
  
  // Hub Accent Colors with Gradients
  hub: {
    sator: {
      base: '#ffd700',
      glow: 'rgba(255, 215, 0, 0.5)',
      muted: '#bfa030',
      gradient: 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)',
    },
    rotas: {
      base: '#00d4ff',
      glow: 'rgba(0, 212, 255, 0.5)',
      muted: '#00a0c0',
      gradient: 'linear-gradient(135deg, #00d4ff 0%, #0099ff 100%)',
    },
    arepo: {
      base: '#0066ff',
      glow: 'rgba(0, 102, 255, 0.5)',
      muted: '#0044cc',
      gradient: 'linear-gradient(135deg, #0066ff 0%, #6600ff 100%)',
    },
    opera: {
      base: '#9d4edd',
      glow: 'rgba(157, 78, 221, 0.5)',
      muted: '#7a3aaa',
      gradient: 'linear-gradient(135deg, #9d4edd 0%, #ff00ff 100%)',
    },
    tenet: {
      base: '#ffffff',
      glow: 'rgba(255, 255, 255, 0.4)',
      muted: '#c0c0d0',
      gradient: 'linear-gradient(135deg, #ffffff 0%, #a0a0ff 100%)',
    },
  },
  
  // Status Colors - More vibrant
  status: {
    success: '#00ff88',
    warning: '#ffaa00',
    error: '#ff4655',
    info: '#00d4ff',
    live: '#ff4655',
  },
  
  // Enhanced Glass Effects
  glass: {
    light: 'rgba(255, 255, 255, 0.05)',
    medium: 'rgba(255, 255, 255, 0.08)',
    heavy: 'rgba(255, 255, 255, 0.12)',
    border: 'rgba(255, 255, 255, 0.1)',
  },
};

export default colors;
