import React, { forwardRef } from 'react';
import './GlassmorphismPanel.css';

/**
 * GlassmorphismPanel - Reusable glass component with backdrop-filter
 * 
 * Features:
 * - 4 depth levels (1-4) for layered glass effects
 * - Cyan/Gold accent variants
 * - Animated border option
 * - Hover morphing effects
 * - Responsive blur adjustments
 */

const depthStyles = {
  1: {
    background: 'rgba(15, 15, 19, 0.4)',
    backdropFilter: 'blur(8px)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  2: {
    background: 'rgba(10, 10, 15, 0.6)',
    backdropFilter: 'blur(12px)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  3: {
    background: 'rgba(10, 10, 15, 0.75)',
    backdropFilter: 'blur(16px)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  4: {
    background: 'rgba(10, 10, 15, 0.85)',
    backdropFilter: 'blur(24px)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
};

const accentStyles = {
  none: {},
  cyan: {
    borderColor: 'rgba(0, 240, 255, 0.3)',
    boxShadow: '0 0 30px rgba(0, 240, 255, 0.1), inset 0 1px 0 rgba(0, 240, 255, 0.1)',
  },
  gold: {
    borderColor: 'rgba(201, 176, 55, 0.3)',
    boxShadow: '0 0 30px rgba(201, 176, 55, 0.1), inset 0 1px 0 rgba(201, 176, 55, 0.1)',
  },
  gradient: {
    borderImage: 'linear-gradient(135deg, rgba(0, 240, 255, 0.5), rgba(201, 176, 55, 0.5)) 1',
    boxShadow: '0 0 30px rgba(0, 240, 255, 0.1), 0 0 30px rgba(201, 176, 55, 0.1)',
  },
};

const GlassmorphismPanel = forwardRef(({
  children,
  depth = 2,
  accent = 'none',
  animated = false,
  hoverable = true,
  className = '',
  style = {},
  onClick,
  onMouseEnter,
  onMouseLeave,
  ...props
}, ref) => {
  const baseDepth = depthStyles[depth] || depthStyles[2];
  const accentStyle = accentStyles[accent] || accentStyles.none;
  
  const combinedStyle = {
    ...baseDepth,
    ...accentStyle,
    ...style,
  };

  const classes = [
    'glass-panel',
    `glass-depth-${depth}`,
    accent !== 'none' && `glass-accent-${accent}`,
    animated && 'glass-animated',
    hoverable && 'glass-hoverable',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={ref}
      className={classes}
      style={combinedStyle}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      {...props}
    >
      {animated && <div className="glass-shimmer" />}
      {children}
    </div>
  );
});

GlassmorphismPanel.displayName = 'GlassmorphismPanel';

/**
 * GlassCard - Pre-configured panel for card-like elements
 */
export const GlassCard = forwardRef(({
  children,
  accent = 'none',
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const sizeClasses = {
    sm: 'glass-card-sm',
    md: 'glass-card-md',
    lg: 'glass-card-lg',
  };

  return (
    <GlassmorphismPanel
      ref={ref}
      depth={3}
      accent={accent}
      hoverable
      className={`${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </GlassmorphismPanel>
  );
});

GlassCard.displayName = 'GlassCard';

/**
 * GlassModal - Full overlay panel
 */
export const GlassModal = forwardRef(({
  children,
  isOpen,
  onClose,
  size = 'md',
  className = '',
  ...props
}, ref) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'glass-modal-sm',
    md: 'glass-modal-md',
    lg: 'glass-modal-lg',
    xl: 'glass-modal-xl',
    full: 'glass-modal-full',
  };

  return (
    <div className="glass-modal-overlay" onClick={onClose}>
      <GlassmorphismPanel
        ref={ref}
        depth={4}
        accent="cyan"
        className={`glass-modal ${sizeClasses[size]} ${className}`}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {children}
      </GlassmorphismPanel>
    </div>
  );
});

GlassModal.displayName = 'GlassModal';

export default GlassmorphismPanel;
