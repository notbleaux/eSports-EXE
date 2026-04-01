/**
 * Navigation Component - Hub Switcher
 * Fixed glassmorphism header with all 5 hubs
 * [Ver002.000] - Added prefetch on hover for code splitting optimization
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Eye, Activity, Book, Map, Grid3X3, Zap } from 'lucide-react';

// Hub configuration with exact colors
export const HUBS = [
  { id: 'sator', name: 'Analytics', path: '/analytics', color: '#ffd700', icon: Eye, subtitle: 'The Observatory' },
  { id: 'rotas', name: 'Stats', path: '/stats', color: '#00d4ff', icon: Activity, subtitle: 'The Harmonic Layer' },
  { id: 'arepo', name: 'Community', path: '/community', color: '#0066ff', icon: Book, subtitle: 'The Directory' },
  { id: 'opera', name: 'Pro Scene', path: '/pro-scene', color: '#9d4edd', icon: Map, subtitle: 'The Nexus' },
  { id: 'tenet', name: 'Hubs', path: '/hubs', color: '#ffffff', icon: Grid3X3, subtitle: 'The Center' },
];

// Prefetch cache to track loaded modules
const prefetchCache = new Set();

// Prefetch function for route preloading on hover
const prefetchHub = (hubId) => {
  if (prefetchCache.has(hubId)) return;
  
  const prefetchers = {
    sator: () => import('../hub-1-sator/index.tsx'),
    rotas: () => import('../hub-2-rotas/index.tsx'),
    arepo: () => import('../hub-3-arepo/index.ts'),
    opera: () => import('../hub-4-opera/index.ts'),
    tenet: () => import('../hub-5-tenet/index.tsx'),
  };
  
  if (prefetchers[hubId]) {
    prefetchCache.add(hubId);
    // Use requestIdleCallback for non-critical prefetching
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        prefetchers[hubId]();
        console.log(`[Prefetch] ${hubId} hub loaded`);
      }, { timeout: 2000 });
    } else {
      // Fallback for Safari
      setTimeout(() => {
        prefetchers[hubId]();
      }, 100);
    }
  }
};

// HubLink component with prefetch on hover
function HubLink({ hub, isActive }) {
  const Icon = hub.icon;
  const [isHovered, setIsHovered] = useState(false);
  
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    // Prefetch the hub module on hover
    prefetchHub(hub.id);
  }, [hub.id]);
  
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);
  
  return (
    <Link
      to={hub.path}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`
        relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
        flex items-center gap-2 group
        ${isActive 
          ? 'text-white' 
          : 'text-white/60 hover:text-white hover:bg-white/5'
        }
      `}
    >
      <Icon 
        className="w-4 h-4 transition-colors" 
        style={{ color: isActive ? hub.color : undefined }}
      />
      <span>{hub.name}</span>
      
      {/* Prefetch indicator (subtle) */}
      {!isActive && isHovered && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#00ff88]/50"
          title="Prefetching..."
        />
      )}
      
      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="nav-indicator"
          className="absolute inset-0 rounded-xl border-2"
          style={{ borderColor: hub.color }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      
      {/* Glow effect for active hub */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-xl -z-10"
          style={{
            background: `radial-gradient(circle at center, ${hub.color}20 0%, transparent 70%)`,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1.2 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </Link>
  );
}

function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  // Track scroll for glassmorphism effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className={`
          fixed top-0 left-0 right-0 z-50
          transition-all duration-500
          ${isScrolled
            ? 'bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/10'
            : 'bg-transparent'
          }
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00d4ff] to-[#ffd700] flex items-center justify-center"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <Zap className="w-5 h-5 text-[#0a0a0f]" />
              </motion.div>
              <div className="hidden sm:flex flex-col">
                <span className="font-bold text-lg tracking-tight text-white">
                  NJZiteGeisTe
                </span>
                <span className="text-xs text-white/50 font-mono">
                  NJZiteGeisTe Platform
                </span>
              </div>
            </Link>

            {/* Desktop Navigation - Hub Buttons */}
            <div className="hidden md:flex items-center gap-1">
              {HUBS.map((hub) => (
                <HubLink
                  key={hub.id}
                  hub={hub}
                  isActive={isActive(hub.path)}
                />
              ))}
            </div>

            {/* Live Status Indicator */}
            <div className="hidden lg:flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-full">
                <motion.div
                  className="w-2 h-2 bg-[#00ff88] rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-xs font-mono text-[#00ff88]">LIVE</span>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-white/5 transition-colors"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              {isOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden border-t border-white/10 bg-[#0a0a0f]/95 backdrop-blur-xl"
            >
              <div className="px-4 py-6 space-y-2">
                {/* Home Link */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0 }}
                >
                  <Link
                    to="/"
                    onClick={() => setIsOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors
                      ${isActive('/') 
                        ? 'bg-white/10 text-white border border-white/20' 
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <Grid3X3 className="w-5 h-5" />
                    <div className="flex-1">
                      <div>Central Hub</div>
                      <div className="text-xs text-white/40">4-quadrant navigation</div>
                    </div>
                    {isActive('/') && <div className="w-2 h-2 rounded-full bg-white" />}
                  </Link>
                </motion.div>

                {/* Hub Links with prefetch */}
                {HUBS.map((hub, index) => {
                  const Icon = hub.icon;
                  const active = isActive(hub.path);
                  
                  return (
                    <motion.div
                      key={hub.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (index + 1) * 0.05 }}
                    >
                      <Link
                        to={hub.path}
                        onClick={() => setIsOpen(false)}
                        onMouseEnter={() => prefetchHub(hub.id)}
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                          ${active 
                            ? 'bg-white/10 text-white' 
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                          }
                        `}
                        style={active ? { borderLeft: `3px solid ${hub.color}` } : undefined}
                      >
                        <Icon className="w-5 h-5" style={{ color: hub.color }} />
                        <div className="flex-1">
                          <div>{hub.name}</div>
                          <div className="text-xs text-white/40">{hub.subtitle}</div>
                        </div>
                        {active && (
                          <motion.div
                            layoutId="mobile-active-indicator"
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: hub.color }}
                          />
                        )}
                      </Link>
                    </motion.div>
                  );
                })}

                {/* Mobile Status */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="pt-4 mt-4 border-t border-white/10"
                >
                  <div className="flex items-center gap-2 px-4">
                    <motion.div
                      className="w-2 h-2 bg-[#00ff88] rounded-full"
                      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-sm text-white/60">All systems operational</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Spacer for fixed header */}
      <div className="h-16 md:h-20" />
    </>
  );
}

export default Navigation;
