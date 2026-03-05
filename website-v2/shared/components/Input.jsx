/**
 * NJZ Platform v2 - Input Component
 * Glassmorphic form inputs with validation states
 * 
 * @version 2.0.0
 * @requires react, framer-motion
 */

import React, { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Input props
 * @typedef {Object} InputProps
 * @property {string} [type='text'] - Input type
 * @property {string} [label] - Input label
 * @property {string} [placeholder] - Placeholder text
 * @property {string} [value] - Controlled value
 * @property {Function} [onChange] - Change handler
 * @property {Function} [onBlur] - Blur handler
 * @property {Function} [onFocus] - Focus handler
 * @property {React.ReactNode} [icon] - Leading icon
 * @property {React.ReactNode} [iconRight] - Trailing icon
 * @property {string} [error] - Error message
 * @property {string} [hint] - Help text
 * @property {boolean} [disabled=false] - Disabled state
 * @property {boolean} [required=false] - Required field
 * @property {string} [size='md'] - Input size (sm, md, lg)
 * @property {boolean} [fullWidth=false] - Full width input
 */

export const Input = forwardRef(({
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  icon = null,
  iconRight = null,
  error,
  hint,
  disabled = false,
  required = false,
  size = 'md',
  fullWidth = false,
  className = '',
  id,
  name,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isFilled, setIsFilled] = useState(!!value);

  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;
  const hasHint = !!hint && !hasError;

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    setIsFilled(!!e.target.value);
    onBlur?.(e);
  };

  const handleChange = (e) => {
    setIsFilled(!!e.target.value);
    onChange?.(e);
  };

  const sizeClasses = {
    sm: 'njz-input--sm',
    md: 'njz-input--md',
    lg: 'njz-input--lg',
  };

  return (
    <div 
      className={`
        njz-input-wrapper 
        ${fullWidth ? 'njz-input-wrapper--full' : ''} 
        ${className}
      `}
    >
      {/* Label */}
      {label && (
        <motion.label 
          htmlFor={inputId}
          className="njz-input__label"
          animate={{
            color: isFocused ? '#00f0ff' : 'rgba(255, 255, 255, 0.8)',
          }}
        >
          {label}
          {required && <span className="njz-input__required"> *</span>}
        </motion.label>
      )}

      {/* Input container */}
      <motion.div
        className={`
          njz-input 
          ${sizeClasses[size]} 
          ${isFocused ? 'njz-input--focused' : ''} 
          ${hasError ? 'njz-input--error' : ''} 
          ${disabled ? 'njz-input--disabled' : ''}
          ${isFilled ? 'njz-input--filled' : ''}
        `}
        animate={{
          boxShadow: isFocused
            ? '0 0 0 3px rgba(0, 240, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            : hasError
            ? '0 0 0 3px rgba(255, 71, 87, 0.2)'
            : 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Leading icon */}
        {icon && (
          <motion.span 
            className="njz-input__icon njz-input__icon--left"
            animate={{
              color: isFocused ? '#00f0ff' : 'rgba(255, 255, 255, 0.4)',
            }}
          >
            {icon}
          </motion.span>
        )}

        {/* Input element */}
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          className="njz-input__field"
          {...props}
        />

        {/* Trailing icon */}
        {iconRight && (
          <span className="njz-input__icon njz-input__icon--right">
            {iconRight}
          </span>
        )}

        {/* Focus border animation */}
        <motion.span
          className="njz-input__border"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isFocused ? 1 : 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />

        {/* Error indicator */}
        {hasError && (
          <motion.span
            className="njz-input__error-icon"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500 }}
          >
            ⚠
          </motion.span>
        )}
      </motion.div>

      {/* Error message */}
      <AnimatePresence mode="wait">
        {hasError && (
          <motion.span
            className="njz-input__error-message"
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Hint text */}
      {hasHint && (
        <span className="njz-input__hint">{hint}</span>
      )}

      <style jsx>{`
        .njz-input-wrapper {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .njz-input-wrapper--full {
          width: 100%;
        }

        .njz-input__label {
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.8);
          transition: color 0.2s ease;
        }

        .njz-input__required {
          color: #ff4757;
        }

        .njz-input {
          position: relative;
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          transition: all 0.2s ease;
          overflow: hidden;
        }

        .njz-input:hover:not(.njz-input--disabled) {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .njz-input--focused {
          background: rgba(255, 255, 255, 0.07);
          border-color: #00f0ff;
        }

        .njz-input--error {
          border-color: #ff4757;
        }

        .njz-input--error.njz-input--focused {
          border-color: #ff4757;
          box-shadow: 0 0 0 3px rgba(255, 71, 87, 0.2) !important;
        }

        .njz-input--disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .njz-input--sm {
          height: 40px;
          padding: 0 12px;
        }

        .njz-input--md {
          height: 48px;
          padding: 0 16px;
        }

        .njz-input--lg {
          height: 56px;
          padding: 0 20px;
        }

        .njz-input__field {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #ffffff;
          font-family: 'Inter', sans-serif;
          font-size: 1rem;
          padding: 0;
          width: 100%;
        }

        .njz-input__field::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .njz-input__field:disabled {
          cursor: not-allowed;
        }

        .njz-input__icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.4);
          transition: color 0.2s ease;
        }

        .njz-input__icon--left {
          margin-right: 12px;
        }

        .njz-input__icon--right {
          margin-left: 12px;
        }

        .njz-input__border {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #00f0ff, #00c4cc);
          transform-origin: left;
        }

        .njz-input__error-icon {
          position: absolute;
          right: 16px;
          color: #ff4757;
          font-size: 1.125rem;
        }

        .njz-input__error-message {
          font-family: 'Inter', sans-serif;
          font-size: 0.8rem;
          color: #ff4757;
          margin-top: 4px;
        }

        .njz-input__hint {
          font-family: 'Inter', sans-serif;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
