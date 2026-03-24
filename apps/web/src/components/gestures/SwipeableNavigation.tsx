/**
 * SwipeableNavigation Component
 * Enhances Navigation with swipe gestures for hub switching
 * [Ver001.000]
 */
import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipe, SwipeDirection } from '@/hooks/gestures/useSwipe';
import { useLongPress } from '@/hooks/gestures/useLongPress';
import { Menu, X, Eye, Activity, Book, Map, Grid3X3, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

// Hub configuration
const HUBS = [
  { id: 'sator', name: 'SATOR', path: '/sator', color: '#ffd700', icon: Eye, subtitle: 'The Observatory' },
  { id: 'rotas', name: 'ROTAS', path: '/rotas', color: '#00d4ff', icon: Activity, subtitle: 'The Harmonic Layer' },
  { id: 'arepo', name: 'AREPO', path: '/arepo', color: '#0066ff', icon: Book, subtitle: 'The Directory' },
  { id: 'opera', name: 'OPERA', path: '/opera', color: '#9d4edd', icon: Map, subtitle: 'The Nexus' },
  { id: 'tenet', name: 'TENET', path: '/tenet', color: '#ffffff', icon: Grid3X3, subtitle: 'The Center' },
];

const ALL_PATHS = ['/', ...HUBS.map(h => h.path)];

export interface SwipeableNavigationProps {
  /** Enable swipe gestures [default: true] */
  enabled?: boolean;
  /** Enable edge swipe to open menu [default: true] */
  edgeSwipeEnabled?: boolean;
  /** Edge swipe threshold in pixels [default: 30] */
  edgeSwipeThreshold?: number;
  /** Visual feedback during swipe [default: true] */
  visualFeedback?: boolean;
  children?: React.ReactNode;
}

export const SwipeableNavigation: React.FC<SwipeableNavigationProps> = ({
  enabled = true,
  edgeSwipeEnabled = true,
  edgeSwipeThreshold = 30,
  visualFeedback = true,
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection | null>(null);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [showEdgeHint, setShowEdgeHint] = useState(false);

  // Get current hub index
  const currentIndex = ALL_PATHS.findIndex(p => p === location.pathname);
  const currentHub = HUBS.find(h => h.path === location.pathname);

  // Handle hub navigation via swipe
  const handleHubSwipe = useCallback((direction: SwipeDirection) => {
    if (!enabled) return;

    const currentHubIndex = HUBS.findIndex(h => h.path === location.pathname);
    
    if (direction === 'left' && currentHubIndex < HUBS.length - 1) {
      // Swipe left = next hub
      navigate(HUBS[currentHubIndex + 1].path);
    } else if (direction === 'right' && currentHubIndex > 0) {
      // Swipe right = previous hub
      navigate(HUBS[currentHubIndex - 1].path);
    }

    setSwipeDirection(null);
    setSwipeProgress(0);
  }, [enabled, location.pathname, navigate]);

  // Configure swipe for hub navigation
  const { bind: hubSwipeBind, state: hubSwipeState } = useSwipe(handleHubSwipe, {
    threshold: 60,
    velocityThreshold: 0.4,
    horizontal: true,
    vertical: false,
    preventDefault: true,
    touchAction: 'pan-y',
  });

  // Handle edge swipe for menu
  const handleEdgeSwipe = useCallback((direction: SwipeDirection, state: { distance: number }) => {
    if (!edgeSwipeEnabled) return;

    // Check if swipe started from left edge
    if (direction === 'right' && state.distance > edgeSwipeThreshold) {
      setIsMenuOpen(true);
    }
  }, [edgeSwipeEnabled, edgeSwipeThreshold]);

  const { bind: edgeSwipeBind } = useSwipe(handleEdgeSwipe, {
    threshold: edgeSwipeThreshold,
    horizontal: true,
    preventDefault: false,
  });

  // Long press on header to open menu
  const { bind: longPressBind } = useLongPress(
    () => setIsMenuOpen(true),
    undefined,
    undefined,
    { duration: 600 }
  );

  // Update swipe progress for visual feedback
  useEffect(() => {
    if (hubSwipeState.isSwiping) {
      setSwipeDirection(hubSwipeState.direction);
      setSwipeProgress(hubSwipeState.progress);
    } else {
      setSwipeDirection(null);
      setSwipeProgress(0);
    }
  }, [hubSwipeState]);

  // Show edge hint after a delay
  useEffect(() => {
    if (edgeSwipeEnabled && !isMenuOpen) {
      const timer = setTimeout(() => setShowEdgeHint(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [edgeSwipeEnabled, isMenuOpen]);

  // Get current hub color for visual feedback
  const currentHubColor = currentHub?.color || '#00d4ff';
  const prevHub = currentIndex > 1 ? HUBS[currentIndex - 2] : null;
  const nextHub = currentIndex > 0 && currentIndex < HUBS.length ? HUBS[currentIndex] : null;

  return (
    <>
      {/* Edge swipe area */}
      {edgeSwipeEnabled && (
        <div
          className="fixed left-0 top-16 bottom-0 w-4 z-40 touch-pan-y"
          {...edgeSwipeBind()}
        />
      )}

      {/* Main content with swipe handler */}
      <div
        className="relative min-h-screen"
        {...hubSwipeBind()}
      >
        {/* Swipe visual feedback overlay */}
        {visualFeedback && swipeDirection && (
          <>
            {/* Left swipe indicator (going to next hub) */}
            {swipeDirection === 'left' && nextHub && (
              <motion.div
                className="fixed inset-y-0 right-0 w-32 bg-gradient-to-l pointer-events-none z-30"
                style={{
                  background: `linear-gradient(to left, ${nextHub.color}20, transparent)`,
                }}
                initial={{ opacity: 0, x: 50 }}
                animate={{ 
                  opacity: swipeProgress * 0.5, 
                  x: 0 
                }}
                exit={{ opacity: 0, x: 50 }}
              >
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                  <nextHub.icon className="w-8 h-8" style={{ color: nextHub.color }} />
                  <span className="text-xs font-medium" style={{ color: nextHub.color }}>
                    {nextHub.name}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Right swipe indicator (going to prev hub) */}
            {swipeDirection === 'right' && prevHub && (
              <motion.div
                className="fixed inset-y-0 left-0 w-32 bg-gradient-to-r pointer-events-none z-30"
                style={{
                  background: `linear-gradient(to right, ${prevHub.color}20, transparent)`,
                }}
                initial={{ opacity: 0, x: -50 }}
                animate={{ 
                  opacity: swipeProgress * 0.5, 
                  x: 0 
                }}
                exit={{ opacity: 0, x: -50 }}
              >
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                  <prevHub.icon className="w-8 h-8" style={{ color: prevHub.color }} />
                  <span className="text-xs font-medium" style={{ color: prevHub.color }}>
                    {prevHub.name}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Swipe progress bar at top */}
            <motion.div
              className="fixed top-16 left-0 right-0 h-1 z-30"
              style={{
                background: `linear-gradient(to right, ${currentHubColor}, ${swipeDirection === 'left' ? nextHub?.color : prevHub?.color})`,
                scaleX: swipeProgress,
                transformOrigin: swipeDirection === 'left' ? 'left' : 'right',
              }}
            />
          </>
        )}

        {/* Edge swipe hint */}
        <AnimatePresence>
          {showEdgeHint && !isMenuOpen && edgeSwipeEnabled && (
            <motion.div
              className="fixed left-2 top-1/2 -translate-y-1/2 z-30 pointer-events-none"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 0.6, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              onAnimationComplete={() => {
                setTimeout(() => setShowEdgeHint(false), 3000);
              }}
            >
              <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-white/50" />
                  <div className="w-1 h-1 rounded-full bg-white/50" />
                  <div className="w-1 h-1 rounded-full bg-white/50" />
                </div>
                <span className="text-xs text-white/50">Swipe</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page content */}
        <motion.div
          animate={{
            x: swipeDirection === 'left' ? -swipeProgress * 20 : swipeDirection === 'right' ? swipeProgress * 20 : 0,
            scale: 1 - swipeProgress * 0.02,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          {children}
        </motion.div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              className="fixed left-0 top-0 bottom-0 w-72 bg-[#0a0a0f]/95 backdrop-blur-xl border-r border-white/10 z-50 overflow-y-auto"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              {...longPressBind()}
            >
              {/* Menu Header */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00d4ff] to-[#ffd700] flex items-center justify-center">
                      <Zap className="w-5 h-5 text-[#0a0a0f]" />
                    </div>
                    <div>
                      <span className="font-bold text-lg text-white">4NJZ4</span>
                      <span className="text-xs text-white/50 block">Swipe to navigate</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <X className="w-5 h-5 text-white/70" />
                  </button>
                </div>
              </div>

              {/* Hub Navigation */}
              <div className="p-4 space-y-1">
                <div className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3 px-3">
                  Hubs
                </div>
                
                {/* Home Link */}
                <MenuItem
                  to="/"
                  icon={Grid3X3}
                  label="Central Hub"
                  subtitle="4-quadrant navigation"
                  color="#ffffff"
                  isActive={location.pathname === '/'}
                  onClick={() => setIsMenuOpen(false)}
                />

                {/* Hub Links */}
                {HUBS.map((hub, index) => (
                  <MenuItem
                    key={hub.id}
                    to={hub.path}
                    icon={hub.icon}
                    label={hub.name}
                    subtitle={hub.subtitle}
                    color={hub.color}
                    isActive={location.pathname === hub.path}
                    onClick={() => setIsMenuOpen(false)}
                    delay={index * 0.05}
                  />
                ))}
              </div>

              {/* Swipe Instructions */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-white/5">
                <div className="flex items-center gap-3 text-white/40 text-sm">
                  <div className="flex gap-1">
                    <span className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-xs">←</span>
                    <span className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-xs">→</span>
                  </div>
                  <span>Swipe to switch hubs</span>
                </div>
                <div className="flex items-center gap-3 text-white/40 text-sm mt-2">
                  <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-xs">☰</div>
                  <span>Edge swipe for menu</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// Menu Item Component
interface MenuItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  subtitle: string;
  color: string;
  isActive: boolean;
  onClick: () => void;
  delay?: number;
}

const MenuItem: React.FC<MenuItemProps> = ({
  to,
  icon: Icon,
  label,
  subtitle,
  color,
  isActive,
  onClick,
  delay = 0,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(to);
    onClick();
  };

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      onClick={handleClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all',
        isActive 
          ? 'bg-white/10' 
          : 'hover:bg-white/5'
      )}
      style={isActive ? { borderLeft: `3px solid ${color}` } : undefined}
    >
      <Icon className="w-5 h-5" style={{ color }} />
      <div className="flex-1 text-left">
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="text-xs text-white/40">{subtitle}</div>
      </div>
      {isActive && (
        <motion.div
          layoutId="menu-active-indicator"
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
    </motion.button>
  );
};

export default SwipeableNavigation;
