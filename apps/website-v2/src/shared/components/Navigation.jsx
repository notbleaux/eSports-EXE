/**
 * Navigation Component with Hub Switcher
 * Mobile responsive with glassmorphism styling
 */
import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Zap, ChevronDown, Radio, LayoutGrid } from 'lucide-react'
import { useNJZStore, HUBS } from '../store/njzStore'
import { ModeToggle } from '@/components/ModeToggle'

const navItems = [
  { path: '/', label: 'Central', icon: '◎', hubId: 'central' },
  { path: '/dashboard', label: 'Grid', icon: '◈', hubId: 'grid', color: 'text-signal-cyan', borderColor: 'border-signal-cyan' },
  { path: '/sator', label: 'SATOR', icon: '◎', hubId: 'sator', color: 'text-alert-amber', borderColor: 'border-alert-amber' },
  { path: '/rotas', label: 'ROTAS', icon: '◈', hubId: 'rotas', color: 'text-signal-cyan', borderColor: 'border-signal-cyan' },
  { path: '/arepo', label: 'AREPO', icon: '◉', hubId: 'arepo', color: 'text-porcelain', borderColor: 'border-porcelain' },
  { path: '/opera', label: 'OPERA', icon: '◆', hubId: 'opera', color: 'text-cobalt', borderColor: 'border-cobalt' },
]

function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [showHubSwitcher, setShowHubSwitcher] = useState(false)
  const location = useLocation()
  const currentHub = useNJZStore(state => state.currentHub)
  
  // Track scroll for styling changes
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false)
    setShowHubSwitcher(false)
  }, [location])

  const activeNavItem = navItems.find(item => item.path === location.pathname) || navItems[0]
  const hub = HUBS[currentHub] || null

  return (
    <>
      <nav 
        className={`
          fixed top-0 left-0 right-0 z-50 
          transition-all duration-300
          ${isScrolled 
            ? 'bg-void/80 backdrop-blur-glass border-b border-mist' 
            : 'bg-transparent'
          }
        `}
      >
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
              <div className="hidden sm:flex flex-col">
                <span className="font-display font-bold text-lg tracking-tight">
                  NJZ ¿!?
                </span>
                <span className="text-xs text-slate font-mono">
                  4eva and Nvr Die
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 
                    flex items-center gap-2 relative
                    ${location.pathname === item.path 
                      ? 'text-white' 
                      : 'text-slate hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <span className={item.color || ''}>{item.icon}</span>
                  {item.label}
                  {location.pathname === item.path && (
                    <motion.div
                      layoutId="nav-indicator"
                      className={`absolute inset-0 border rounded-lg ${item.borderColor || 'border-white/20'}`}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* Hub Switcher (Desktop) */}
            <div className="hidden lg:flex items-center gap-4">
              {/* Mode Toggle */}
              <ModeToggle />
              
              {/* Grid Link */}
              <Link
                to="/dashboard"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  location.pathname === '/dashboard'
                    ? 'bg-signal-cyan/20 text-signal-cyan'
                    : 'bg-white/5 hover:bg-white/10 text-white/80'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="text-sm">Grid</span>
              </Link>
              
              <div className="relative">
                <button
                  onClick={() => setShowHubSwitcher(!showHubSwitcher)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <Radio className="w-4 h-4 text-signal-cyan" />
                  <span className="text-sm">Hub Switcher</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showHubSwitcher ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showHubSwitcher && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-2 w-64 p-2 rounded-xl glass-panel border border-mist"
                    >
                      <div className="text-xs text-slate px-3 py-2">Quick Navigate</div>
                      {navItems.slice(1).map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`
                            flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                            ${location.pathname === item.path 
                              ? 'bg-white/10' 
                              : 'hover:bg-white/5'
                            }
                          `}
                        >
                          <span className={item.color}>{item.icon}</span>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{item.label}</div>
                            <div className="text-xs text-slate">{HUBS[item.hubId]?.subtitle}</div>
                          </div>
                          {location.pathname === item.path && (
                            <div className="w-1.5 h-1.5 rounded-full bg-signal-cyan" />
                          )}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Live Status */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-signal-cyan/10 border border-signal-cyan/30 rounded-full">
                <motion.div 
                  className="w-2 h-2 bg-signal-cyan rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-xs font-mono text-signal-cyan">LIVE</span>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden overflow-hidden"
              >
                <div className="py-4 border-t border-mist space-y-1">
                  {navItems.map((item, index) => (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                          ${location.pathname === item.path 
                            ? 'bg-white/10 text-white' 
                            : 'text-slate hover:text-white hover:bg-white/5'
                          }
                        `}
                      >
                        <span className={`text-lg ${item.color || ''}`}>{item.icon}</span>
                        <div className="flex-1">
                          <div>{item.label}</div>
                          {item.hubId !== 'central' && (
                            <div className="text-xs text-slate">{HUBS[item.hubId]?.subtitle}</div>
                          )}
                        </div>
                        {location.pathname === item.path && (
                          <div className="w-2 h-2 rounded-full bg-signal-cyan" />
                        )}
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {/* Mobile Status */}
                <div className="py-4 border-t border-mist">
                  <div className="flex items-center gap-2 px-4">
                    <motion.div 
                      className="w-2 h-2 bg-signal-cyan rounded-full"
                      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-sm text-slate">All systems operational</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Hub Switcher Overlay (Mobile) */}
      <AnimatePresence>
        {showHubSwitcher && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-void/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setShowHubSwitcher(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default Navigation
