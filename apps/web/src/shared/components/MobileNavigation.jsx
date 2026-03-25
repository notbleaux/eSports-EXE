import { useState, useEffect } from 'react';
import { Home, Orbit, Info, Gamepad2, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * MobileNavigation - Bottom navigation bar for mobile devices
 * Addresses Technical Analysis finding: "No Mobile Strategy"
 * Target: 60% of esports audience on mobile
 */
export const MobileNavigation = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  // Don't render on desktop
  if (!isMobile) return null;

  const navItems = [
    { 
      id: 'home', 
      icon: Home, 
      label: 'Home', 
      path: '/',
      color: 'text-signal-cyan'
    },
    {
      id: 'sator',
      icon: Orbit,
      label: 'Analytics',
      path: '/analytics',
      color: 'text-alert-amber'
    },
    {
      id: 'rotas',
      icon: Orbit,
      label: 'Stats',
      path: '/stats',
      color: 'text-signal-cyan'
    },
    {
      id: 'arepo',
      icon: Info,
      label: 'Community',
      path: '/community',
      color: 'text-porcelain'
    },
    {
      id: 'opera',
      icon: Gamepad2,
      label: 'Pro Scene',
      path: '/pro-scene',
      color: 'text-cobalt'
    }
  ];

  const handleNavClick = (path, id) => {
    setActiveTab(id);
    window.location.href = path;
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-void/95 backdrop-blur-lg border-t border-void-light md:hidden">
        <div className="flex justify-around items-center py-2 px-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => handleNavClick(item.path, item.id)}
                className={`flex flex-col items-center justify-center py-2 px-3 min-w-[60px] rounded-lg transition-colors ${
                  isActive 
                    ? `${item.color} bg-void-light/50` 
                    : 'text-void-light hover:text-porcelain'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={{ 
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -2 : 0
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </motion.div>
                <span className={`text-[10px] mt-1 font-medium ${
                  isActive ? 'opacity-100' : 'opacity-70'
                }`}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-current"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
        
        {/* Safe area padding for iOS */}
        <div className="h-safe-area-inset-bottom bg-void" />
      </nav>

      {/* Quick Actions Menu */}
      <motion.button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="fixed right-4 bottom-24 z-50 w-12 h-12 rounded-full bg-signal-cyan text-void flex items-center justify-center shadow-lg md:hidden"
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: isMenuOpen ? 45 : 0 }}
      >
        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </motion.button>

      {/* Overlay Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed right-4 bottom-40 z-40 bg-void-light/95 backdrop-blur-lg rounded-2xl p-4 border border-porcelain/10 md:hidden"
          >
            <div className="flex flex-col gap-3">
              <QuickActionButton label="Search" icon="🔍" />
              <QuickActionButton label="Settings" icon="⚙️" />
              <QuickActionButton label="Profile" icon="👤" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const QuickActionButton = ({ label, icon }) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    className="flex items-center gap-3 px-4 py-2 rounded-lg bg-void/50 text-porcelain text-sm"
  >
    <span>{icon}</span>
    <span>{label}</span>
  </motion.button>
);

export default MobileNavigation;