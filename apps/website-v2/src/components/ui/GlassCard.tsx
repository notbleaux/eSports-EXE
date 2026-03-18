/**
 * GlassCard - Glassmorphism UI Component
 *
 * [Ver001.000]
 */

import React from 'react'
import { cn } from '../../utils/cn'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'subtle'
  size?: 'sm' | 'md' | 'lg'
  as?: React.ElementType
  glow?: keyof typeof import('../../theme/colors').GLOW_COLORS
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    { children, className = '', variant = 'default', size = 'md', glow, as: Tag = 'div', ...props },
    ref
  ) => {
    const baseClasses = cn(
      'glass-card backdrop-blur-xl border border-white/20',
      'shadow-2xl shadow-black/50',
      'transition-all duration-300 hover:shadow-3xl hover:shadow-blue-500/20',
      {
        'p-4 rounded-lg': size === 'sm',
        'p-6 rounded-xl': size === 'md',
        'p-8 rounded-2xl': size === 'lg',
        'bg-white/5': variant === 'default',
        'bg-white/10': variant === 'elevated',
        'bg-white/3': variant === 'subtle'
      },
      className
    )

    return (
      <Tag
        ref={ref}
        className={baseClasses}
        style={glow ? { boxShadow: `0 0 30px ${glow}` } : undefined}
        {...props}
      >
        {children}
      </Tag>
    )
  }
)

GlassCard.displayName = 'GlassCard'

export { GlassCard }
