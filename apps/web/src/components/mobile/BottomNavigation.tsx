/**
 * BottomNavigation Component - Mobile Tab Navigation
 * [Ver001.000] - 5-tab navigation for mobile PWA
 * 
 * Features:
 * - Fixed 64px height at bottom of viewport
 * - 5 tabs: SATOR, ROTAS, AREPO, OPERA, TENET
 * - Active state with icon + label
 * - Smooth Framer Motion transitions
 * - iOS safe area support
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, Activity, BookOpen, Map, Grid3X3 } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'sator',
    label: 'SATOR',
    path: '/sator',
    icon: Eye,
    color: '#ffd700',
    gradient: 'from-yellow-400 to-amber-500',
  },
  {
    id: 'rotas',
    label: 'ROTAS',
    path: '/rotas',
    icon: Activity,
    color: '#00d4ff',
    gradient: 'from-cyan-400 to-blue-500',
  },
  {
    id: 'arepo',
    label: 'AREPO',
    path: '/arepo',
    icon: BookOpen,
    color: '#0066ff',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'opera',
    label: 'OPERA',
    path: '/opera',
    icon: Map,
    color: '#9d4edd',
    gradient: 'from-purple-400 to-violet-600',
  },
  {
    id: 'tenet',
    label: 'TENET',
    path: '/tenet',
    icon: Grid3X3,
    color: '#ffffff',
    gradient: 'from-white to-gray-300',
  },
];

// Prefetch cache to track loaded modules
const prefetchCache = new Set<string>();

const prefetchHub = (hubId: string) => {
  if (prefetchCache.has(hubId)) return;
  
  const prefetchers: Record<string, () => Promise<unknown>> = {
    sator: () => import('../../hub-1-sator/index.jsx'),
    rotas: () => import('../../hub-2-rotas/index.jsx'),
    arepo: () => import('../../hub-3-arepo/index.jsx'),
    opera: () => import('../../hub-4-opera/index.tsx'),
    tenet: () => import('../../hub-5-tenet/index.jsx'),
  };
  
  if (prefetchers[hubId]) {
    prefetchCache.add(hubId);
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        prefetchers[hubId]();
        console.log(`[Prefetch] ${hubId} hub loaded`);
      }, { timeout: 2000 });
    } else {
      setTimeout(() => {
        prefetchers[hubId]();
      }, 100);
    }
  }
};

interface BottomNavigationProps {
  className?: string;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ className = '' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Always show at top
      if (currentScrollY < 50) {
        setIsVisible(true);
        setLastScrollY(currentScrollY);
        return;
      }
      
      // Hide when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Don't render on desktop
  if (!isMobile) return null;

  const isActive = (path: string) => location.pathname === path;

  const handleNavClick = (item: NavItem) => {
    navigate(item.path);
  };

  const handleMouseEnter = (item: NavItem) => {
    prefetchHub(item.id);
  };

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: isVisible ? 0 : 100 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`fixed bottom-0 left-0 right-0 z-50 ${className}`}
    >
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-[#0a0a0f]/90 backdrop-blur-xl border-t border-white/10" />
      
      {/* Navigation items */}
      <div className="relative flex items-center justify-around h-16 px-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => handleNavClick(item)}
              onMouseEnter={() => handleMouseEnter(item)}
              className={`
                relative flex flex-col items-center justify-center 
                min-w-[60px] min-h-[48px] rounded-xl
                transition-colors duration-200
                ${active ? 'text-white' : 'text-white/50 hover:text-white/80'}
              `}
              whileTap={{ scale: 0.9 }}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              {/* Active background glow */}
              {active && (
                <motion.div
                  layoutId="bottomNavGlow"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: `radial-gradient(circle at center, ${item.color}20 0%, transparent 70%)`,
                  }}
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              
              {/* Icon */}
              <motion.div
                animate={{
                  scale: active ? 1.1 : 1,
                  y: active ? -2 : 0,
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <Icon 
                  size={22} 
                  strokeWidth={active ? 2.5 : 2}
                  style={{ color: active ? item.color : undefined }}
                />
              </motion.div>
              
              {/* Label */}
              <motion.span
                className={`
                  text-[10px] font-medium mt-0.5 tracking-wide
                  transition-opacity duration-200
                  ${active ? 'opacity-100' : 'opacity-70'}
                `}
                animate={{
                  opacity: active ? 1 : 0.7,
                }}
              >
                {item.label}
              </motion.span>
              
              {/* Active indicator dot */}
              {active && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -bottom-0.5 w-1 h-1 rounded-full"
                  style={{ backgroundColor: item.color }}
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
      
      {/* iOS Safe area padding */}
      <div 
        className="h-[env(safe-area-inset-bottom,0px)] bg-[#0a0a0f]/90" 
        style={{ backdropFilter: 'blur(20px)' }}
      />
    </motion.nav>
  );
};

export default BottomNavigation;
