/**
 * PinchZoomContainer Component
 * Wraps content with pinch-to-zoom and double-tap reset functionality
 * [Ver001.000]
 */
import React, { useRef, useCallback, useState } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { usePinch, PinchState } from '@/hooks/gestures/usePinch';
import { useDoubleTap } from '@/hooks/gestures/useLongPress';
import { cn } from '@/lib/utils';

export interface PinchZoomContainerProps {
  /** Child content */
  children: React.ReactNode;
  /** Minimum scale [default: 0.5] */
  minScale?: number;
  /** Maximum scale [default: 3] */
  maxScale?: number;
  /** Initial scale [default: 1] */
  initialScale?: number;
  /** Enable double-tap to reset [default: true] */
  doubleTapReset?: boolean;
  /** Show zoom controls [default: true] */
  showControls?: boolean;
  /** Container className */
  className?: string;
  /** Content className */
  contentClassName?: string;
  /** Callback when scale changes */
  onScaleChange?: (scale: number) => void;
  /** Callback when double-tap occurs */
  onDoubleTap?: () => void;
  /** Hub color for theming */
  hubColor?: string;
}

export const PinchZoomContainer: React.FC<PinchZoomContainerProps> = ({
  children,
  minScale = 0.5,
  maxScale = 3,
  initialScale = 1,
  doubleTapReset = true,
  showControls = true,
  className,
  contentClassName,
  onScaleChange,
  onDoubleTap,
  hubColor = '#00d4ff',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPinching, setIsPinching] = useState(false);
  const [showHint, setShowHint] = useState(true);

  // Motion values for smooth zoom
  const scale = useMotionValue(initialScale);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Spring physics
  const springConfig = { stiffness: 300, damping: 30 };
  const smoothScale = useSpring(scale, springConfig);
  const smoothX = useSpring(x, springConfig);
  const smoothY = useSpring(y, springConfig);

  // Transform for visual feedback
  const brightness = useTransform(smoothScale, [minScale, 1, maxScale], [0.8, 1, 1.1]);

  // Handle pinch events
  const handlePinch = useCallback((state: PinchState) => {
    setIsPinching(!state.isPinching);
    scale.set(state.scale);
    onScaleChange?.(state.scale);

    // Hide hint after first pinch
    if (state.scale !== 1 && showHint) {
      setShowHint(false);
    }
  }, [onScaleChange, scale, showHint]);

  const { bind: pinchBind, reset: resetPinch, scaleTo } = usePinch(handlePinch, {
    minScale,
    maxScale,
    sensitivity: 1,
    doubleTapReset,
    preventDefault: true,
  });

  // Handle double-tap
  const handleDoubleTap = useCallback(() => {
    if (doubleTapReset) {
      scaleTo(1);
      x.set(0);
      y.set(0);
    }
    onDoubleTap?.();
  }, [doubleTapReset, scaleTo, x, y, onDoubleTap]);

  const { bind: tapBind, isDoubleTap } = useDoubleTap(
    handleDoubleTap,
    undefined,
    { delay: 300 }
  );

  // Manual zoom controls
  const zoomIn = useCallback(() => {
    const newScale = Math.min(scale.get() * 1.2, maxScale);
    scaleTo(newScale);
  }, [scale, maxScale, scaleTo]);

  const zoomOut = useCallback(() => {
    const newScale = Math.max(scale.get() / 1.2, minScale);
    scaleTo(newScale);
  }, [scale, minScale, scaleTo]);

  const resetZoom = useCallback(() => {
    scaleTo(1);
    x.set(0);
    y.set(0);
    resetPinch();
  }, [scaleTo, x, y, resetPinch]);

  // Current scale percentage
  const currentScale = Math.round(smoothScale.get() * 100);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden touch-none',
        className
      )}
      {...pinchBind()}
      {...tapBind()}
    >
      {/* Zoomable content */}
      <motion.div
        className={cn(
          'origin-center will-change-transform',
          contentClassName
        )}
        style={{
          scale: smoothScale,
          x: smoothX,
          y: smoothY,
          filter: useTransform(brightness, b => `brightness(${b})`),
        }}
      >
        {children}
      </motion.div>

      {/* Pinch hint overlay */}
      {showHint && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 1 }}
        >
          <motion.div
            className="px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm flex items-center gap-2"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
            <span>Pinch to zoom</span>
          </motion.div>
        </motion.div>
      )}

      {/* Pinching indicator */}
      {isPinching && (
        <motion.div
          className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {currentScale}%
        </motion.div>
      )}

      {/* Double-tap feedback */}
      {isDoubleTap && (
        <motion.div
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 0.3 }}
        >
          <div 
            className="w-32 h-32 rounded-full"
            style={{ backgroundColor: `${hubColor}30` }}
          />
        </motion.div>
      )}

      {/* Zoom controls */}
      {showControls && (
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          {/* Zoom level indicator */}
          <motion.div
            className="px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white text-xs font-mono text-center"
            animate={{ 
              backgroundColor: smoothScale.get() !== 1 ? `${hubColor}30` : 'rgba(0,0,0,0.5)'
            }}
          >
            {currentScale}%
          </motion.div>

          {/* Zoom in */}
          <motion.button
            className="w-10 h-10 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/10 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={zoomIn}
            aria-label="Zoom in"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </motion.button>

          {/* Zoom out */}
          <motion.button
            className="w-10 h-10 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/10 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={zoomOut}
            aria-label="Zoom out"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </motion.button>

          {/* Reset */}
          <motion.button
            className="w-10 h-10 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/10 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={resetZoom}
            aria-label="Reset zoom"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </motion.button>
        </div>
      )}

      {/* Grid lines at different zoom levels (visual feedback) */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <svg className="w-full h-full">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
    </div>
  );
};

export default PinchZoomContainer;
