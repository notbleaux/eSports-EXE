/**
 * SwipeableContainer Component
 * Swipe between hub views with spring animation and edge resistance
 * [Ver001.000]
 */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, useSpring, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useSwipe, SwipeDirection, SwipeState } from '@/hooks/gestures/useSwipe';
import { cn } from '@/lib/utils';

export interface SwipeableContainerProps {
  /** Child elements to swipe between */
  children: React.ReactNode[];
  /** Current active index */
  activeIndex: number;
  /** Callback when swipe changes index */
  onIndexChange: (index: number, direction: SwipeDirection) => void;
  /** Enable swipe navigation [default: true] */
  enabled?: boolean;
  /** Spring stiffness [default: 300] */
  stiffness?: number;
  /** Spring damping [default: 30] */
  damping?: number;
  /** Edge resistance factor [default: 0.5] */
  edgeResistance?: number;
  /** Minimum swipe distance to trigger [default: 50] */
  threshold?: number;
  /** Show visual indicators [default: true] */
  showIndicators?: boolean;
  /** Custom indicator colors */
  indicatorColors?: string[];
  /** Container className */
  className?: string;
  /** Slide className */
  slideClassName?: string;
  /** Enable vertical swipe to dismiss/refresh */
  onVerticalSwipe?: (direction: 'up' | 'down') => void;
  /** Height of container [default: 100%] */
  height?: string | number;
}

const SWIPE_THRESHOLD = 50;
const EDGE_RESISTANCE = 0.5;

export const SwipeableContainer: React.FC<SwipeableContainerProps> = ({
  children,
  activeIndex,
  onIndexChange,
  enabled = true,
  stiffness = 300,
  damping = 30,
  edgeResistance = EDGE_RESISTANCE,
  threshold = SWIPE_THRESHOLD,
  showIndicators = true,
  indicatorColors,
  className,
  slideClassName,
  onVerticalSwipe,
  height = '100%',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragDirection, setDragDirection] = useState<SwipeDirection | null>(null);
  
  // Motion values for smooth animation
  const x = useMotionValue(0);
  
  // Spring physics for smooth transitions
  const springConfig = { stiffness, damping };
  const scale = useSpring(1, springConfig);

  // Transform for visual feedback during swipe
  const backgroundOpacity = useTransform(
    x,
    [-300, -150, 0, 150, 300],
    [0.3, 0.1, 0, 0.1, 0.3]
  );

  const totalSlides = React.Children.count(children);
  
  // Calculate current offset based on active index
  const calculateOffset = useCallback((index: number) => {
    return -index * 100;
  }, []);

  // Spring for the container position
  const containerX = useSpring(calculateOffset(activeIndex), springConfig);

  // Update spring target when activeIndex changes
  useEffect(() => {
    containerX.set(calculateOffset(activeIndex));
  }, [activeIndex, calculateOffset, containerX]);

  // Handle swipe completion
  const handleSwipe = useCallback((_direction: SwipeDirection, _state: SwipeState) => {
    if (!enabled) return;
    setDragDirection(null);
  }, [enabled]);

  // Configure swipe hook
  const { bind, state: swipeState } = useSwipe(handleSwipe, {
    threshold,
    velocityThreshold: 0.3,
    horizontal: true,
    vertical: !!onVerticalSwipe,
    preventDefault: true,
    touchAction: 'pan-y',
  });

  // Handle drag start
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    scale.set(0.98);
  }, [scale]);

  // Handle drag
  const handleDrag = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const dragX = info.offset.x;
    const dragY = info.offset.y;

    // Detect direction
    if (Math.abs(dragX) > Math.abs(dragY)) {
      setDragDirection(dragX > 0 ? 'right' : 'left');
    } else {
      setDragDirection(dragY > 0 ? 'down' : 'up');
    }

    // Apply edge resistance
    const currentOffset = calculateOffset(activeIndex);
    let newOffset = currentOffset + (dragX / window.innerWidth) * 100;

    // Apply resistance at edges
    if (activeIndex === 0 && dragX > 0) {
      newOffset = currentOffset + (dragX / window.innerWidth) * 100 * edgeResistance;
    } else if (activeIndex === totalSlides - 1 && dragX < 0) {
      newOffset = currentOffset + (dragX / window.innerWidth) * 100 * edgeResistance;
    }

    containerX.set(newOffset);
  }, [activeIndex, totalSlides, calculateOffset, containerX, edgeResistance]);

  // Handle drag end
  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    scale.set(1);

    const velocity = info.velocity.x;
    const offset = info.offset.x;
    const swipeThreshold = window.innerWidth * 0.2; // 20% of screen width

    // Determine if we should change slide
    let newIndex = activeIndex;

    if (Math.abs(velocity) > 500 || Math.abs(offset) > swipeThreshold) {
      if (offset > 0 && activeIndex > 0) {
        newIndex = activeIndex - 1;
      } else if (offset < 0 && activeIndex < totalSlides - 1) {
        newIndex = activeIndex + 1;
      }
    }

    // Animate to the target index
    containerX.set(calculateOffset(newIndex));

    // Trigger callback if index changed
    if (newIndex !== activeIndex) {
      onIndexChange(newIndex, offset > 0 ? 'right' : 'left');
    }

    setDragDirection(null);
  }, [activeIndex, totalSlides, calculateOffset, containerX, onIndexChange, scale]);

  // Indicator colors fallback
  const defaultColors = ['#ffd700', '#00d4ff', '#0066ff', '#9d4edd', '#ffffff'];
  const colors = indicatorColors || defaultColors;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden touch-pan-y',
        className
      )}
      style={{ height }}
      {...bind()}
    >
      {/* Swipe container */}
      <motion.div
        className="flex h-full"
        style={{
          x: containerX,
          scale,
        }}
        drag={enabled ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={edgeResistance}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        transition={{ type: 'spring', stiffness, damping }}
      >
        {React.Children.map(children, (child, index) => (
          <motion.div
            key={index}
            className={cn(
              'flex-shrink-0 w-full h-full',
              slideClassName
            )}
            style={{
              opacity: index === activeIndex ? 1 : 0.5,
              scale: index === activeIndex ? 1 : 0.95,
            }}
            animate={{
              opacity: index === activeIndex ? 1 : 0.5,
              scale: index === activeIndex ? 1 : 0.95,
            }}
            transition={{ type: 'spring', stiffness, damping }}
          >
            {child}
          </motion.div>
        ))}
      </motion.div>

      {/* Visual feedback overlay */}
      {isDragging && dragDirection && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(to ${
              dragDirection === 'left' ? 'right' : 'left'
            }, rgba(255,255,255,0.1), transparent)`,
            opacity: backgroundOpacity,
          }}
        />
      )}

      {/* Swipe indicators */}
      {showIndicators && totalSlides > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <motion.button
              key={index}
              className="relative rounded-full transition-all duration-300"
              style={{
                width: index === activeIndex ? 24 : 8,
                height: 8,
                backgroundColor: index === activeIndex 
                  ? colors[index % colors.length] 
                  : 'rgba(255,255,255,0.3)',
              }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onIndexChange(index, index > activeIndex ? 'left' : 'right')}
              aria-label={`Go to slide ${index + 1}`}
            >
              {index === activeIndex && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    backgroundColor: colors[index % colors.length],
                  }}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                  }}
                />
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* Edge swipe hints */}
      {enabled && activeIndex > 0 && (
        <motion.div
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-16 rounded-full bg-white/5 backdrop-blur-sm flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0, x: -10 }}
          animate={{ 
            opacity: isDragging && dragDirection === 'right' ? 0.8 : 0.3,
            x: 0 
          }}
        >
          <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </motion.div>
      )}

      {enabled && activeIndex < totalSlides - 1 && (
        <motion.div
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-16 rounded-full bg-white/5 backdrop-blur-sm flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0, x: 10 }}
          animate={{ 
            opacity: isDragging && dragDirection === 'left' ? 0.8 : 0.3,
            x: 0 
          }}
        >
          <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </motion.div>
      )}

      {/* Swipe progress bar */}
      {isDragging && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
          <motion.div
            className="h-full bg-gradient-to-r from-[#ffd700] via-[#00d4ff] to-[#9d4edd]"
            style={{
              width: `${swipeState.progress * 100}%`,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default SwipeableContainer;
