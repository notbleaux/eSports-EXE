/**
 * PullToRefresh Component - Mobile Pull Gesture
 * [Ver001.000] - Pull-to-refresh with gesture detection
 * 
 * Features:
 * - Pull gesture detection with touch events
 * - Visual loading spinner
 * - Callback for refresh action
 * - Smooth animations with Framer Motion
 * - Prevents conflict with horizontal scrolling
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
  /** Callback when refresh is triggered */
  onRefresh: () => Promise<void> | void;
  /** Minimum pull distance to trigger refresh (px) */
  pullThreshold?: number;
  /** Maximum pull distance (px) */
  maxPullDistance?: number;
  /** Children to wrap */
  children: React.ReactNode;
  /** Whether refreshing is disabled */
  disabled?: boolean;
  /** Custom loading spinner */
  spinner?: React.ReactNode;
  /** Refresh indicator text */
  indicatorText?: string;
  /** Class name for container */
  className?: string;
}

interface TouchState {
  startY: number;
  currentY: number;
  isPulling: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  pullThreshold = 80,
  maxPullDistance = 150,
  children,
  disabled = false,
  spinner,
  indicatorText = 'Pull to refresh',
  className = '',
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  const touchState = useRef<TouchState>({ startY: 0, currentY: 0, isPulling: false });
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if at top of scroll
  const isAtTop = useCallback(() => {
    return window.scrollY <= 0;
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    // Only allow pull when at top of page
    if (!isAtTop()) return;

    const touch = e.touches[0];
    touchState.current = {
      startY: touch.clientY,
      currentY: touch.clientY,
      isPulling: true,
    };
    setIsPulling(true);
  }, [disabled, isRefreshing, isAtTop]);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchState.current.isPulling || disabled || isRefreshing) return;

    const touch = e.touches[0];
    const deltaY = touch.clientY - touchState.current.startY;

    // Only allow downward pull
    if (deltaY < 0) {
      touchState.current.isPulling = false;
      setIsPulling(false);
      setPullDistance(0);
      return;
    }

    // Prevent default scrolling when pulling
    if (deltaY > 0 && isAtTop()) {
      e.preventDefault();
    }

    // Apply resistance to pull
    const resistance = 0.5;
    const newPullDistance = Math.min(deltaY * resistance, maxPullDistance);
    
    touchState.current.currentY = touch.clientY;
    setPullDistance(newPullDistance);
    setCanRefresh(newPullDistance >= pullThreshold);
  }, [disabled, isRefreshing, pullThreshold, maxPullDistance, isAtTop]);

  // Handle touch end
  const handleTouchEnd = useCallback(async () => {
    if (!touchState.current.isPulling || disabled) return;

    touchState.current.isPulling = false;
    setIsPulling(false);

    if (pullDistance >= pullThreshold && !isRefreshing) {
      // Trigger refresh
      setIsRefreshing(true);
      setPullDistance(pullThreshold);

      try {
        await onRefresh();
      } catch (error) {
        console.error('[PullToRefresh] Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
        setCanRefresh(false);
      }
    } else {
      // Reset position
      setPullDistance(0);
      setCanRefresh(false);
    }
  }, [pullDistance, pullThreshold, isRefreshing, disabled, onRefresh]);

  // Handle mouse events for desktop testing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled || isRefreshing || !isAtTop()) return;

    touchState.current = {
      startY: e.clientY,
      currentY: e.clientY,
      isPulling: true,
    };
    setIsPulling(true);
  }, [disabled, isRefreshing, isAtTop]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!touchState.current.isPulling || disabled || isRefreshing) return;

    const deltaY = e.clientY - touchState.current.startY;

    if (deltaY < 0) {
      touchState.current.isPulling = false;
      setIsPulling(false);
      setPullDistance(0);
      return;
    }

    const resistance = 0.5;
    const newPullDistance = Math.min(deltaY * resistance, maxPullDistance);
    
    touchState.current.currentY = e.clientY;
    setPullDistance(newPullDistance);
    setCanRefresh(newPullDistance >= pullThreshold);
  }, [disabled, isRefreshing, pullThreshold, maxPullDistance]);

  const handleMouseUp = useCallback(() => {
    handleTouchEnd();
  }, [handleTouchEnd]);

  // Calculate progress (0-1)
  const progress = Math.min(pullDistance / pullThreshold, 1);

  // Spinner rotation based on pull
  const spinnerRotation = progress * 360;

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ touchAction: isPulling ? 'none' : 'auto' }}
    >
      {/* Pull Indicator */}
      <motion.div
        className="absolute left-0 right-0 z-10 flex flex-col items-center justify-end pointer-events-none overflow-hidden"
        style={{
          height: pullDistance,
          top: -pullDistance,
        }}
        initial={false}
      >
        <div className="flex flex-col items-center justify-center h-full pb-2">
          {/* Spinner */}
          <motion.div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              canRefresh ? 'bg-[#00ff88]/20' : 'bg-white/10'
            }`}
            animate={{ rotate: isRefreshing ? 360 : spinnerRotation }}
            transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
          >
            {spinner || (
              <Loader2 
                size={20} 
                className={`${canRefresh ? 'text-[#00ff88]' : 'text-white/50'}`}
              />
            )}
          </motion.div>
          
          {/* Text indicator */}
          <motion.span
            className={`text-xs mt-1 font-medium ${
              canRefresh ? 'text-[#00ff88]' : 'text-white/50'
            }`}
            animate={{ opacity: pullDistance > 20 ? 1 : 0 }}
          >
            {isRefreshing ? 'Refreshing...' : canRefresh ? 'Release to refresh' : indicatorText}
          </motion.span>
        </div>
      </motion.div>

      {/* Content container with pull transform */}
      <motion.div
        animate={{ y: pullDistance }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{ willChange: 'transform' }}
      >
        {children}
      </motion.div>

      {/* Success indicator */}
      <motion.div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#00ff88] text-[#0a0a0f] text-sm font-medium shadow-lg"
        initial={{ opacity: 0, y: -20 }}
        animate={{ 
          opacity: isRefreshing ? 0 : 0,
          y: isRefreshing ? -20 : -20,
        }}
      >
        Updated successfully
      </motion.div>
    </div>
  );
};

/**
 * Simplified PullToRefresh hook for custom implementations
 */
export const usePullToRefresh = (
  onRefresh: () => Promise<void> | void,
  options: {
    pullThreshold?: number;
    disabled?: boolean;
  } = {}
) => {
  const { pullThreshold = 80, disabled = false } = options;
  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (disabled || isRefreshing || window.scrollY > 0) return;

    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    touchStartY.current = clientY;
    setIsPulling(true);
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isPulling || disabled) return;

    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - touchStartY.current;

    if (deltaY < 0) {
      setIsPulling(false);
      setPullProgress(0);
      return;
    }

    const progress = Math.min(deltaY / pullThreshold, 1);
    setPullProgress(progress);
  }, [isPulling, disabled, pullThreshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || disabled) return;

    setIsPulling(false);

    if (pullProgress >= 1 && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullProgress(0);
      }
    } else {
      setPullProgress(0);
    }
  }, [isPulling, disabled, pullProgress, isRefreshing, onRefresh]);

  return {
    isPulling,
    pullProgress,
    isRefreshing,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onMouseDown: handleTouchStart,
      onMouseMove: handleTouchMove,
      onMouseUp: handleTouchEnd,
    },
  };
};

export default PullToRefresh;
