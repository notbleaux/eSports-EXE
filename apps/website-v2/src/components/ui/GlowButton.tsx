/**
 * GlowButton - Animated glow button component
 *
 * [Ver001.000]
 */

import React from 'react'
import { cn } from '../../utils/cn'
import { motion } from 'framer-motion'

interface GlowButtonProps {
  children: React.ReactNode
  className?: string
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  glowColor?: string
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const GlowButton = React.forwardRef<HTMLButtonElement, GlowButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      glowColor = '0 0 20px rgba(0,212,255,0.6)',
      onClick,
      disabled = false,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseClasses = cn(
      'glow-button relative overflow-hidden font-medium transition-all duration-300',
      'focus:outline-none focus:ring-4 focus:ring-blue-300',
      'active:scale-95',
      {
        'px-4 py-2 text-sm rounded-lg': size === 'sm',
        'px-6 py-3 text-base rounded-xl': size === 'md',
        'px-8 py-4 text-lg rounded-2xl': size === 'lg',
        'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/75':
          variant === 'primary',
        'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/50 hover:shadow-xl hover:shadow-gray-500/75':
          variant === 'secondary',
        'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/50 hover:shadow-xl hover:shadow-red-500/75':
          variant === 'danger',
        'bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 shadow-lg shadow-white/10 hover:shadow-xl hover:shadow-white/20':
          variant === 'ghost'
      },
      disabled && 'opacity-50 cursor-not-allowed shadow-none',
      className
    )

    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={baseClasses}
        style={{
          boxShadow: glowColor,
          WebkitBoxShadow: glowColor
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        {...props}
      >
        {children}
      </motion.button>
    )
  }
)

GlowButton.displayName = 'GlowButton'

export { GlowButton }
