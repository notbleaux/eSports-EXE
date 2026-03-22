/** [Ver001.000]
 * useFluidResize Hook
 * 
 * RAF-throttled ResizeObserver for smooth, fluid resize handling.
 * Combines ResizeObserver for element size changes with requestAnimationFrame
 * for smooth, non-janky updates.
 * 
 * Features:
 * - ResizeObserver for accurate element size detection
 * - RAF throttling for 60fps updates
 * - Configurable throttle intervals
 * - Leading/trailing edge options
 * - Window resize fallback
 * - SSR-safe
 * 
 * Performance Notes:
 * - Uses ResizeObserver (native, efficient)
 * - Throttles with RAF instead of setTimeout (syncs with refresh rate)
 * - Debounces rapid changes to prevent layout thrashing
 * 
 * @example
 * ```tsx
 * function ResponsiveContainer() {
 *   const { ref, width, height, isResizing } = useFluidResize({
 *     throttleMs: 16, // ~60fps
 *   });
 *   
 *   return (
 *     <div ref={ref} className="container">
 *       <p>Width: {width}px</p>
 *       <p>Height: {height}px</p>
 *       {isResizing && <span>Resizing...</span>}
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { FluidResizeOptions, FluidResizeState, SizeState } from '@/types/animation';

// Default configuration
const DEFAULT_OPTIONS: Required<FluidResizeOptions> = {
  throttleMs: 16, // ~60fps
  leading: true,
  trailing: true,
};

// Minimum time between updates (prevents excessive updates)
const MIN_THROTTLE_MS = 8; // ~120fps max

/**
 * Throttle function using requestAnimationFrame.
 * More performant than setTimeout for visual updates.
 */
function throttleWithRAF<T extends (...args: ResizeObserverEntry[]) => void>(
  fn: T,
  wait: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): { throttled: T; cancel: () => void } {
  const { leading = true, trailing = true } = options;
  
  let rafId: number | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastCallTime: number | null = null;
  
  const invoke = (): void => {
    if (lastArgs) {
      fn(...lastArgs);
      lastCallTime = Date.now();
      lastArgs = null;
    }
  };
  
  const throttled = ((...args: Parameters<T>): void => {
    lastArgs = args;
    const now = Date.now();
    
    // Check if enough time has passed
    const shouldCall = leading && (!lastCallTime || now - lastCallTime >= wait);
    
    if (shouldCall) {
      // Cancel any pending updates
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      invoke();
      
      // Schedule trailing update if needed
      if (trailing && wait > 0) {
        timeoutId = setTimeout(() => {
          if (lastArgs) invoke();
        }, wait);
      }
    } else if (rafId === null && timeoutId === null) {
      // Schedule update via RAF for smooth animation frame sync
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const timeSinceLastCall = Date.now() - (lastCallTime || 0);
        
        if (timeSinceLastCall >= wait) {
          invoke();
        } else {
          // Reschedule if not enough time has passed
          timeoutId = setTimeout(() => {
            timeoutId = null;
            invoke();
          }, wait - timeSinceLastCall);
        }
      });
    }
  }) as T;
  
  const cancel = (): void => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
  };
  
  return { throttled, cancel };
}

/**
 * React hook for fluid, performant resize observation.
 * 
 * @param options - Configuration options
 * @returns Current size state and ref to attach to element
 */
export function useFluidResize(
  options: FluidResizeOptions = {}
): FluidResizeState & {
  /** Ref to attach to the element being observed */
  ref: React.RefObject<HTMLElement | null>;
  /** Previous size state */
  previousSize: SizeState;
} {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  // Clamp throttleMs to reasonable bounds
  const throttleMs = Math.max(MIN_THROTTLE_MS, config.throttleMs);
  
  const [size, setSize] = useState<SizeState>({
    width: 0,
    height: 0,
  });
  
  const [previousSize, setPreviousSize] = useState<SizeState>({
    width: 0,
    height: 0,
  });
  
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const ref = useRef<HTMLElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const throttleRef = useRef<{ cancel: () => void } | null>(null);
  
  // Handle size update with throttling
  const handleResize = useCallback((entries: ResizeObserverEntry[]): void => {
    const entry = entries[0];
    if (!entry) return;
    
    const { width, height } = entry.contentRect;
    
    // Only update if size actually changed
    if (width === size.width && height === size.height) {
      return;
    }
    
    // Mark as resizing
    setIsResizing(true);
    
    // Clear existing timeout
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    
    // Update previous size
    setPreviousSize({ ...size });
    
    // Update current size
    setSize({ width, height });
    
    // Clear resizing state after delay
    resizeTimeoutRef.current = setTimeout(() => {
      setIsResizing(false);
    }, 150);
  }, [size.width, size.height]);
  
  // Create throttled handler
  useEffect(() => {
    const { throttled, cancel } = throttleWithRAF(handleResize, throttleMs, {
      leading: config.leading,
      trailing: config.trailing,
    });
    
    throttleRef.current = { cancel };
    
    const element = ref.current;
    
    // Use ResizeObserver if available
    if (typeof ResizeObserver !== 'undefined' && element) {
      resizeObserverRef.current = new ResizeObserver(throttled);
      resizeObserverRef.current.observe(element);
    }
    
    // Fallback to window resize
    const handleWindowResize = (): void => {
      if (!element) return;
      
      const rect = element.getBoundingClientRect();
      // Create a minimal ResizeObserverEntry-like object for the fallback
      const entry = {
        contentRect: rect,
        target: element,
        borderBoxSize: [] as ResizeObserverSize[],
        contentBoxSize: [] as ResizeObserverSize[],
        devicePixelContentBoxSize: [] as ResizeObserverSize[],
      } as ResizeObserverEntry;
      throttled([entry]);
    };
    
    window.addEventListener('resize', handleWindowResize);
    
    // Initial measurement
    handleWindowResize();
    
    return () => {
      cancel();
      window.removeEventListener('resize', handleWindowResize);
      
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [handleResize, throttleMs, config.leading, config.trailing]);
  
  return {
    ...size,
    isResizing,
    ref,
    previousSize,
  };
}

/**
 * Hook for responsive breakpoints with fluid resize.
 * 
 * @example
 * ```tsx
 * function ResponsiveComponent() {
 *   const { ref, isMobile, isTablet, isDesktop } = useResponsive({
 *     mobile: 0,
 *     tablet: 768,
 *     desktop: 1024,
 *   });
 *   
 *   return (
 *     <div ref={ref}>
 *       {isMobile && <MobileView />}
 *       {isTablet && <TabletView />}
 *       {isDesktop && <DesktopView />}
 *     </div>
 *   );
 * }
 * ```
 */
export interface BreakpointConfig {
  [name: string]: number;
}

type BreakpointResult<T extends BreakpointConfig> = {
  [K in keyof T as `is${Capitalize<string & K>}`]: boolean;
};

export function useResponsive<T extends BreakpointConfig>(
  breakpoints: T,
  options: FluidResizeOptions = {}
): FluidResizeState & {
  ref: React.RefObject<HTMLElement | null>;
  currentBreakpoint: keyof T | null;
  breakpointValues: T;
} & BreakpointResult<T> {
  const { width, height, isResizing, ref } = useFluidResize(options);
  
  // Sort breakpoints by value
  const sortedBreakpoints = Object.entries(breakpoints).sort((a, b) => a[1] - b[1]);
  
  // Find current breakpoint
  const currentBreakpoint = sortedBreakpoints.reduce<keyof T | null>(
    (acc, [name, value]) => (width >= value ? name : acc),
    null
  );
  
  // Create boolean flags for each breakpoint
  const breakpointBooleans = Object.keys(breakpoints).reduce((acc, key) => {
    const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
    const nextBreakpoint = sortedBreakpoints.find(([name]) => name === key);
    const nextIndex = sortedBreakpoints.findIndex(([name]) => name === key);
    const nextNextBreakpoint = sortedBreakpoints[nextIndex + 1];
    
    const isMatch = width >= (nextBreakpoint?.[1] ?? 0) && 
      (!nextNextBreakpoint || width < nextNextBreakpoint[1]);
    
    return {
      ...acc,
      [`is${capitalizedKey}`]: isMatch,
    };
  }, {} as BreakpointResult<T>);
  
  return {
    width,
    height,
    isResizing,
    ref,
    currentBreakpoint,
    breakpointValues: breakpoints,
    ...breakpointBooleans,
  };
}

/**
 * Hook for maintaining aspect ratio during resize.
 * 
 * @example
 * ```tsx
 * function AspectRatioBox() {
 *   const { ref, wrapperStyle, contentStyle } = useAspectRatio(16 / 9);
 *   
 *   return (
 *     <div ref={ref} style={wrapperStyle}>
 *       <div style={contentStyle}>
 *         Content maintains 16:9 ratio
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
export interface AspectRatioReturn {
  ref: React.RefObject<HTMLElement | null>;
  wrapperStyle: React.CSSProperties;
  contentStyle: React.CSSProperties;
  actualRatio: number;
}

export function useAspectRatio(
  targetRatio: number,
  options: FluidResizeOptions = {}
): AspectRatioReturn {
  const { width, height, ref } = useFluidResize(options);
  
  const actualRatio = width / height || targetRatio;
  
  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: 0,
    paddingBottom: `${(1 / targetRatio) * 100}%`,
  };
  
  const contentStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  };
  
  return {
    ref,
    wrapperStyle,
    contentStyle,
    actualRatio,
  };
}

export default useFluidResize;
