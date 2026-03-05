/**
 * NJZ Platform v2 - Button Component
 * Multi-variant button with fluid animations
 * 
 * @version 2.0.0
 * @requires react, framer-motion
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Button props
 * @typedef {Object} ButtonProps
 * @property {React.ReactNode} children - Button content
 * @property {'primary'|'secondary'|'ghost'|'danger'|'glass'} [variant='primary'] - Button style
 * @property {'sm'|'md'|'lg'} [size='md'] - Button size
 * @property {boolean} [loading=false] - Loading state
 * @property {boolean} [disabled=false] - Disabled state
 * @property {boolean} [fullWidth=false] - Full width button
 * @property {React.ReactNode} [icon] - Leading icon
 * @property {React.ReactNode} [iconRight] - Trailing icon
 * @property {Function} [onClick] - Click handler
 * @property {string} [type='button'] - Button type
 * @property {string} [href] - If provided, renders as anchor tag
 * @property {boolean} [magnetic=false] - Enable magnetic hover effect
 */

const variants = {
  primary: {
    background: 'linear-gradient(135deg, #00f0ff 0%, #00c4cc 100%)',
    color: '#0a0a0f',
    border: 'none',
    shadow: '0 4px 20px rgba(0, 240, 255, 0.3)',
    hoverShadow: '0 8px 30px rgba(0, 240, 255, 0.5)',
  },
  secondary: {
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    shadow: 'none',
    hoverShadow: '0 4px 20px rgba(255, 255, 255, 0.1)',
  },
  ghost: {
    background: 'transparent',
    color: 'rgba(255, 255, 255, 0.8)',
    border: 'none',
    shadow: 'none',
    hoverShadow: 'none',
  },
  danger: {
    background: 'linear-gradient(135deg, #ff4757 0%, #cc3a47 100%)',
    color: '#ffffff',
    border: 'none',
    shadow: '0 4px 20px rgba(255, 71, 87, 0.3)',
    hoverShadow: '0 8px 30px rgba(255, 71, 87, 0.5)',
  },
  glass: {
    background: 'rgba(26, 26, 36, 0.6)',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    shadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
    hoverShadow: '0 8px 40px rgba(0, 0, 0, 0.4)',
  },
};

const sizes = {
  sm: {
    padding: '8px 16px',
    fontSize: '0.875rem',
    height: '36px',
    iconSize: '16px',
  },
  md: {
    padding: '12px 24px',
    fontSize: '1rem',
    height: '48px',
    iconSize: '20px',
  },
  lg: {
    padding: '16px 32px',
    fontSize: '1.125rem',
    height: '56px',
    iconSize: '24px',
  },
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon = null,
  iconRight = null,
  onClick,
  type = 'button',
  href,
  magnetic = false,
  className = '',
  style = {},
  ...props
}) {
  const [isHovered, setIsHovered] = useState(false);
  const variantStyles = variants[variant] || variants.primary;
  const sizeStyles = sizes[size] || sizes.md;

  const isDisabled = disabled || loading;

  const handleMagneticMove = (e) => {
    if (!magnetic || isDisabled) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    e.currentTarget.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
  };

  const handleMagneticLeave = (e) => {
    e.currentTarget.style.transform = 'translate(0, 0)';
  };

  const buttonContent = (
    <>
      {/* Loading spinner */}
      {loading && (
        <motion.span
          className="njz-button__spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          ⟳
        </motion.span>
      )}

      {/* Leading icon */}
      {icon && !loading && (
        <span className="njz-button__icon njz-button__icon--left">
          {icon}
        </span>
      )}

      {/* Button text */}
      <span className="njz-button__text">{children}</span>

      {/* Trailing icon */}
      {iconRight && (
        <motion.span 
          className="njz-button__icon njz-button__icon--right"
          animate={{ x: isHovered ? 4 : 0 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          {iconRight}
        </motion.span>
      )}

      {/* Ripple effect container */}
      <span className="njz-button__ripple" />

      {/* Gradient overlay for hover */}
      {variant === 'glass' && (
        <motion.span
          className="njz-button__overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%)',
          }}
        />
      )}
    </>
  );

  const commonProps = {
    className: `
      njz-button 
      njz-button--${variant} 
      njz-button--${size}
      ${loading ? 'njz-button--loading' : ''}
      ${isDisabled ? 'njz-button--disabled' : ''}
      ${fullWidth ? 'njz-button--full' : ''}
      ${magnetic ? 'njz-button--magnetic' : ''}
      ${className}
    `,
    style: {
      ...style,
      '--btn-bg': variantStyles.background,
      '--btn-color': variantStyles.color,
      '--btn-border': variantStyles.border,
      '--btn-shadow': variantStyles.shadow,
      '--btn-hover-shadow': variantStyles.hoverShadow,
      '--btn-padding': sizeStyles.padding,
      '--btn-font-size': sizeStyles.fontSize,
      '--btn-height': sizeStyles.height,
      '--btn-icon-size': sizeStyles.iconSize,
    },
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => {
      setIsHovered(false);
      if (magnetic) handleMagneticLeave({ currentTarget: { style: {} } });
    },
    onMouseMove: magnetic ? handleMagneticMove : undefined,
    ...props,
  };

  if (href && !isDisabled) {
    return (
      <motion.a
        href={href}
        {...commonProps}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {buttonContent}
      </motion.a>
    );
  }

  return (
    <motion.button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      {...commonProps}
      whileHover={isDisabled ? {} : { scale: 1.02 }}
      whileTap={isDisabled ? {} : { scale: 0.98 }}
    >
      {buttonContent}
    </motion.button>
  );
}

export default Button;
