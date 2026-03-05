import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, X, Zap } from 'lucide-react'

const navItems = [
  { path: '/', label: 'Central', icon: '◎' },
  { path: '/sator', label: 'SATOR', icon: '◎', color: 'text-signal-amber' },
  { path: '/rotas', label: 'ROTAS', icon: '◈', color: 'text-signal-cyan' },
  { path: '/info', label: 'Info', icon: '◉' },
  { path: '/games', label: 'Games', icon: '◆' },
]

function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-mist">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <motion.div 
              className="w-10 h-10 rounded-lg bg-gradient-to-br from-signal-cyan to-aged-gold flex items-center justify-center"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <Zap className="w-5 h-5 text-void-black" />
            </motion.div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg tracking-tight">
                NJZ ¿!?
              </span>
              <span className="text-xs text-slate font-mono">
                4eva and Nvr Die
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2
                  ${location.pathname === item.path 
                    ? 'bg-white/10 text-white' 
                    : 'text-slate hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <span className={item.color || ''}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Status Indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-signal-cyan/10 border border-signal-cyan/30 rounded-full">
            <motion.div 
              className="w-2 h-2 bg-signal-cyan rounded-full"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-xs font-mono text-signal-cyan">LIVE</span>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden py-4 border-t border-mist"
          >
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors
                  ${location.pathname === item.path 
                    ? 'bg-white/10 text-white' 
                    : 'text-slate hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <span className={`mr-3 ${item.color || ''}`}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </motion.div>
        )}
      </div>
    </nav>
  )
}

export default Navigation