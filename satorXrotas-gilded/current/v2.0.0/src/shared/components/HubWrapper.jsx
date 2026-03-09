[Ver002.000]

/**
 * HubWrapper.jsx — Consistent Hub Layout Component
 * NJZ Platform v2.0
 * 
 * Provides unified layout, transitions, and hub-specific styling
 * for all four platform hubs. Implements Framer Motion animations
 * with accessibility-conscious reduced motion support.
 * 
 * @module HubWrapper
 * @version 2.0.0
 * @since 2024-03
 * @partof SATORxROTAS Platform
 */

import React from 'react'
import { motion } from 'framer-motion'
import { useNJZStore, HUBS } from '../store/njzStore'

/**
 * HubWrapper Component
 * Wraps hub content with consistent layout and animations
 * 
 * @param {string} hubId - Hub identifier (sator, rotas, info, games)
 * @param {ReactNode} children - Hub content
 * @param {string} className - Additional CSS classes
 * @param {boolean} showHeader - Whether to show default header
 * @param {ReactNode} customHeader - Custom header component
 */
function HubWrapper({ 
  hubId, 
  children, 
  className = '',
  showHeader = true,
  customHeader = null
}) {
  const hub = HUBS[hubId]
  const { preferences } = useNJZStore()
  
  if (!hub) {
    console.error(`Hub ${hubId} not found in HUBS configuration`)
    return children
  }

  const pageVariants = {
    initial: { 
      opacity: 0, 
      y: preferences.reducedMotion ? 0 : 20 
    },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
    exit: { 
      opacity: 0, 
      y: preferences.reducedMotion ? 0 : -20,
      transition: {
        duration: 0.3
      }
    }
  }

  return (
    <motion.div
      className={`min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 ${className}`}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        '--hub-primary': hub.color,
        '--hub-glow': hub.glowColor
      }}
    >
      {showHeader && !customHeader && <HubHeader hub={hub} />}
      {customHeader}
      
      <div className="relative z-10">
        {children}
      </div>

      {/* Hub-specific background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Primary glow orb */}
        <div 
          className="absolute w-[800px] h-[800px] rounded-full opacity-10 blur-3xl"
          style={{
            background: `radial-gradient(circle, ${hub.color} 0%, transparent 70%)`,
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(${hub.color} 1px, transparent 1px),
              linear-gradient(90deg, ${hub.color} 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>
    </motion.div>
  )
}

/**
 * HubHeader Component
 * Renders standardized hub header with badge, title, and description
 */
function HubHeader({ hub }) {
  const Icon = hub.icon
  
  return (
    <div className="max-w-7xl mx-auto mb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        {/* Hub Badge */}
        <div 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border"
          style={{
            backgroundColor: `${hub.color}10`,
            borderColor: `${hub.color}30`
          }}
        >
          <span style={{ color: hub.color }}>{hub.icon}</span>
          <span className="text-sm font-mono" style={{ color: hub.color }}>
            {hub.name} HUB
          </span>
        </div>

        {/* Title */}
        <h1 className="font-display text-h1 font-bold mb-4" style={{ color: hub.color }}>
          {hub.subtitle}
        </h1>
        
        {/* Description */}
        <p className="text-xl text-slate max-w-2xl mx-auto">
          {hub.description}
          {hub.stats && (
            <span className="text-porcelain">
              {' '}
              {Object.entries(hub.stats).map(([key, value]) => (
                <span key={key} className="capitalize">{value} {key}. </span>
              ))}
            </span>
          )}
        </p>
      </motion.div>
    </div>
  )
}

/**
 * HubCard Component
 * Glassmorphism card with accent color hover effects
 */
export function HubCard({ 
  children, 
  className = '', 
  accent = 'none',
  hover = true,
  onClick
}) {
  const accentStyles = {
    none: '',
    cyan: 'hover:border-signal-cyan hover:shadow-glow-cyan',
    amber: 'hover:border-alert-amber hover:shadow-glow-amber',
    gold: 'hover:border-aged-gold hover:shadow-glow-gold',
    white: 'hover:border-porcelain hover:shadow-[0_0_40px_rgba(232,230,227,0.15)]'
  }

  return (
    <div
      className={`
        glass-panel rounded-xl p-6
        transition-all duration-300
        ${hover ? accentStyles[accent] : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

/**
 * HubStatCard Component
 * Stat display card with color coding
 */
export function HubStatCard({ label, value, change, color = 'cyan', onClick }) {
  const colorClasses = {
    cyan: 'text-signal-cyan bg-signal-cyan/10',
    amber: 'text-alert-amber bg-alert-amber/10',
    gold: 'text-aged-gold bg-aged-gold/10',
    green: 'text-green-400 bg-green-400/10',
    red: 'text-red-400 bg-red-400/10'
  }

  const isPositive = change && change.startsWith('+')
  const isNegative = change && change.startsWith('-')

  return (
    <HubCard accent={color} onClick={onClick} className="flex flex-col">
      <span className="text-sm text-slate mb-2">{label}</span>
      <span className={`text-2xl font-display font-bold ${colorClasses[color].split(' ')[0]}`}>
        {value}
      </span>
      {change && (
        <span className={`text-xs mt-2 ${isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-slate'}`}>
          {change}
        </span>
      )}
    </HubCard>
  )
}

export default HubWrapper
