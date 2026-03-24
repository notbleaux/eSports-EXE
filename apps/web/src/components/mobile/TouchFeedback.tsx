/**
 * TouchFeedback Component - Touch Ripple Effect
 * [Ver001.000] - Framer Motion powered ripple feedback
 * 
 * Features:
 * - Ripple effect on touch/click
 * - Framer Motion animations
 * - 48px minimum touch target enforcement
 * - Accessible focus states
 * - Configurable ripple color and duration
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface TouchFeedbackProps {
  /** Child element(s) to wrap */
  children: React.ReactNode;
  /** Minimum touch target size (default: 48px) */
  minTouchSize?: number;
  /** Ripple color (default: rgba(255,255,255,0.3)) */
  rippleColor?: string;
  /** Ripple duration in ms (default: 600) */
  rippleDuration?: number;
  /** Class name for wrapper */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Click handler */
  onClick?: (e: React.MouseEvent | React.TouchEvent) => void;
  /** Whether to center ripple (default: false = touch position) */
  centered?: boolean;
  /** Border radius for ripple containment */
  borderRadius?: string;
  /** Full width button style */
  fullWidth?: boolean;
}

export const TouchFeedback: React.FC<TouchFeedbackProps> = ({
  children,
  minTouchSize = 48,
  rippleColor = 'rgba(255, 255, 255, 0.3)',
  rippleDuration = 600,
  className = '',
  disabled = false,
  onClick,
  centered = false,
  borderRadius = 'inherit',
  fullWidth = false,
}) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const rippleIdRef = useRef(0);

  const addRipple = useCallback((x: number, y: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const rippleX = x - rect.left;
    const rippleY = y - rect.top;

    // Calculate ripple size to cover entire element
    const size = Math.max(rect.width, rect.height) * 2;

    const newRipple: Ripple = {
      id: rippleIdRef.current++,
      x: centered ? rect.width / 2 : rippleX,
      y: centered ? rect.height / 2 : rippleY,
      size,
    };

    setRipples((prev) => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, rippleDuration);
  }, [centered, rippleDuration]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (disabled) return;

    addRipple(e.clientX, e.clientY);
    onClick?.(e);
  }, [disabled, addRipple, onClick]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;

    const touch = e.touches[0];
    addRipple(touch.clientX, touch.clientY);
  }, [disabled, addRipple]);

  return (
    <div
      ref={containerRef}
      className={`
        relative overflow-hidden
        ${fullWidth ? 'w-full' : 'inline-flex'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      style={{
        minWidth: minTouchSize,
        minHeight: minTouchSize,
        borderRadius,
        WebkitTapHighlightColor: 'transparent',
      }}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
    >
      {children}

      {/* Ripple container */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            initial={{ 
              scale: 0, 
              opacity: 0.5,
              x: ripple.x - ripple.size / 2,
              y: ripple.y - ripple.size / 2,
            }}
            animate={{ 
              scale: 1, 
              opacity: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: rippleDuration / 1000, 
              ease: 'easeOut',
            }}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: ripple.size,
              height: ripple.size,
              backgroundColor: rippleColor,
              willChange: 'transform, opacity',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

/**
 * TouchFeedbackButton - Pre-styled button with touch feedback
 */
interface TouchFeedbackButtonProps extends Omit<TouchFeedbackProps, 'children'> {
  /** Button label */
  label: string;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Icon to display */
  icon?: React.ReactNode;
  /** Icon position */
  iconPosition?: 'left' | 'right';
  /** Loading state */
  loading?: boolean;
  /** Type attribute */
  type?: 'button' | 'submit' | 'reset';
}

export const TouchFeedbackButton: React.FC<TouchFeedbackButtonProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  onClick,
  ...touchProps
}) => {
  const baseClasses = 'flex items-center justify-center gap-2 font-medium transition-colors';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-[#00d4ff] to-[#ffd700] text-[#0a0a0f] hover:opacity-90',
    secondary: 'bg-white/10 text-white hover:bg-white/20',
    ghost: 'text-white/70 hover:text-white hover:bg-white/5',
    danger: 'bg-red-500/20 text-red-400 hover:bg-red-500/30',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2.5 text-sm rounded-xl',
    lg: 'px-6 py-3 text-base rounded-xl',
  };

  return (
    <TouchFeedback
      onClick={onClick}
      disabled={disabled || loading}
      centered
      className={fullWidth ? 'w-full' : ''}
      {...touchProps}
    >
      <button
        type={type}
        disabled={disabled || loading}
        className={`
          ${baseClasses}
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
        style={{ minHeight: 48, minWidth: 48 }}
      >
        {loading ? (
          <motion.div
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        ) : (
          <>
            {icon && iconPosition === 'left' && <span>{icon}</span>}
            <span>{label}</span>
            {icon && iconPosition === 'right' && <span>{icon}</span>}
          </>
        )}
      </button>
    </TouchFeedback>
  );
};

/**
 * TouchFeedbackCard - Card component with touch feedback
 */
interface TouchFeedbackCardProps extends Omit<TouchFeedbackProps, 'children'> {
  /** Card content */
  children: React.ReactNode;
  /** Card title */
  title?: string;
  /** Card subtitle */
  subtitle?: string;
  /** Accent color */
  accentColor?: string;
}

export const TouchFeedbackCard: React.FC<TouchFeedbackCardProps> = ({
  children,
  title,
  subtitle,
  accentColor = '#00d4ff',
  className = '',
  ...touchProps
}) => {
  return (
    <TouchFeedback
      className={className}
      borderRadius="1rem"
      {...touchProps}
    >
      <div 
        className="p-4 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        style={{ 
          minHeight: 80,
          borderRadius: '1rem',
          borderLeft: `3px solid ${accentColor}`,
        }}
      >
        {title && (
          <h4 className="text-white font-medium mb-1">{title}</h4>
        )}
        {subtitle && (
          <p className="text-white/60 text-sm">{subtitle}</p>
        )}
        {children}
      </div>
    </TouchFeedback>
  );
};

export default TouchFeedback;
