import React from 'react'
import { motion } from 'framer-motion'

/**
 * Holographic Card Component
 * Based on Image 7 (holographic interface) and Image 3 (HUD components)
 * Features animated borders, glow effects, and glassmorphism
 */
export function HolographicCard({ 
  children, 
  accent = 'cyan', // 'cyan' | 'amber' | 'gold'
  className = '',
  animate = true,
  ...props 
}) {
  const accentColors = {
    cyan: '#00f0ff',
    amber: '#ff9f1c',
    gold: '#c9b037',
  }

  const color = accentColors[accent] || accentColors.cyan

  return (
    <motion.div
      className={`relative rounded-xl overflow-hidden ${className}`}
      initial={animate ? { opacity: 0, y: 20 } : false}
      animate={animate ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.5 }}
      {...props}
    >
      {/* Glassmorphism base */}
      <div className="relative z-10 backdrop-blur-xl bg-void-deep/80 border border-white/10 rounded-xl p-6">
        {children}
      </div>

      {/* Animated border glow */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}20, transparent)`,
          backgroundSize: '200% 100%',
        }}
        animate={{
          backgroundPosition: ['200% 0%', '-200% 0%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Corner accents */}
      <div 
        className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 rounded-tl-xl pointer-events-none"
        style={{ borderColor: color }}
      />
      <div 
        className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 rounded-tr-xl pointer-events-none"
        style={{ borderColor: color }}
      />
      <div 
        className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 rounded-bl-xl pointer-events-none"
        style={{ borderColor: color }}
      />
      <div 
        className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 rounded-br-xl pointer-events-none"
        style={{ borderColor: color }}
      />

      {/* Hover glow effect */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{
          boxShadow: `inset 0 0 60px ${color}10, 0 0 40px ${color}10`,
        }}
      />
    </motion.div>
  )
}

/**
 * Holographic Button
 * Glowing button with animated border
 */
export function HolographicButton({ 
  children, 
  accent = 'cyan',
  size = 'md', // 'sm' | 'md' | 'lg'
  variant = 'primary', // 'primary' | 'secondary' | 'ghost'
  className = '',
  ...props 
}) {
  const accentColors = {
    cyan: '#00f0ff',
    amber: '#ff9f1c',
    gold: '#c9b037',
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  const color = accentColors[accent] || accentColors.cyan

  const baseStyles = `
    relative rounded-lg font-medium overflow-hidden
    transition-all duration-300 group
    ${sizes[size]}
  `

  const variants = {
    primary: `bg-${accent}/10 text-${accent} border border-${accent}/30 hover:bg-${accent}/20`,
    secondary: 'bg-white/5 text-white border border-white/10 hover:bg-white/10',
    ghost: 'text-white hover:bg-white/5',
  }

  return (
    <motion.button
      className={`${baseStyles} ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{
        borderColor: variant === 'primary' ? `${color}30` : undefined,
        color: variant === 'primary' ? color : undefined,
      }}
      {...props}
    >
      {/* Animated background */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}10, transparent)`,
          backgroundSize: '200% 100%',
        }}
        animate={{
          backgroundPosition: ['200% 0%', '-200% 0%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Glow border on hover */}
      <div 
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          boxShadow: `0 0 20px ${color}30`,
        }}
      />

      {/* Content */}
      <span className="relative z-10">{children}</span>
    </motion.button>
  )
}

/**
 * HUD Gauge Component
 * Based on Image 2 (Sports HUD) and Image 3 (HUD components)
 * Circular progress indicator with glow
 */
export function HUDGauge({ 
  value, 
  max = 100, 
  label,
  size = 120,
  accent = 'cyan',
  showValue = true,
  animate = true,
}) {
  const accentColors = {
    cyan: '#00f0ff',
    amber: '#ff9f1c',
    gold: '#c9b037',
  }

  const color = accentColors[accent] || accentColors.cyan
  const percentage = Math.min((value / max) * 100, 100)
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative flex flex-col items-center">
      <div 
        className="relative"
        style={{ width: size, height: size }}
      >
        {/* Background glow */}
        <div 
          className="absolute inset-0 rounded-full blur-xl opacity-20"
          style={{ backgroundColor: color }}
        />

        {/* SVG Gauge */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background track */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="6"
          />

          {/* Progress arc */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={animate ? { strokeDashoffset: circumference } : false}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{
              filter: `drop-shadow(0 0 6px ${color})`,
            }}
          />

          {/* Inner decorative circle */}
          <circle
            cx="50"
            cy="50"
            r="35"
            fill="none"
            stroke={color}
            strokeWidth="1"
            strokeOpacity="0.3"
            strokeDasharray="4 4"
          />
        </svg>

        {/* Center value */}
        {showValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span 
              className="text-2xl font-display font-bold"
              style={{ color }}
              initial={animate ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {Math.round(percentage)}%
            </motion.span>
          </div>
        )}

        {/* Decorative ticks */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-2 bg-white/20"
            style={{
              top: '4px',
              left: '50%',
              transformOrigin: `50% ${size / 2 - 4}px`,
              transform: `rotate(${i * 30}deg)`,
            }}
          />
        ))}
      </div>

      {/* Label */}
      {label && (
        <span className="mt-2 text-sm text-slate font-medium">{label}</span>
      )}
    </div>
  )
}

/**
 * Data Terminal Component
 * Terminal-style display for logs/data
 */
export function DataTerminal({ 
  lines = [], 
  maxLines = 10,
  className = '',
}) {
  const displayLines = lines.slice(-maxLines)

  return (
    <div className={`font-mono text-sm bg-void-black rounded-lg border border-white/10 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
        <div className="w-3 h-3 rounded-full bg-red-500/50" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
        <div className="w-3 h-3 rounded-full bg-green-500/50" />
        <span className="ml-2 text-xs text-slate">system.log</span>
      </div>

      <div className="space-y-1">
        {displayLines.map((line, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-2"
          >
            <span className="text-slate/50 text-xs">{line.timestamp || '00:00:00'}</span>
            <span 
              className={`
                ${line.type === 'error' ? 'text-red-400' : ''}
                ${line.type === 'success' ? 'text-green-400' : ''}
                ${line.type === 'warning' ? 'text-yellow-400' : ''}
                ${!line.type ? 'text-signal-cyan' : ''}
              `}
            >
              {line.text}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Blinking cursor */}
      <motion.span
        className="inline-block w-2 h-4 bg-signal-cyan mt-1"
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      />
    </div>
  )
}
