[Ver001.000]

/**
 * Breakpoint System for Mobile-First Responsive Design
 * 
 * Provides consistent breakpoint values and hooks for the 4NJZ4 TENET Platform.
 * Integrates with Tailwind CSS breakpoints for seamless responsive layouts.
 * 
 * @module mobile/breakpoints
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Standard breakpoint values matching Tailwind CSS defaults
 * Mobile-first approach: base styles apply to all, breakpoints add enhancements
 */
export const BREAKPOINTS = {
  /** Small devices (large phones): 640px */
  sm: 640,
  /** Medium devices (tablets): 768px */
  md: 768,
  /** Large devices (desktops): 1024px */
  lg: 1024,
  /** Extra large devices: 1280px */
  xl: 1280,
  /** 2X large devices: 1536px */
  '2xl': 1536,
} as const;

/**
 * Breakpoint names type
 */
export type BreakpointName = keyof typeof BREAKPOINTS;

/**
 * Breakpoint values type
 */
export type BreakpointValue = typeof BREAKPOINTS[BreakpointName];

/**
 * Current breakpoint state
 */
export interface BreakpointState {
  /** Current viewport width */
  width: number;
  /** Current viewport height */
  height: number;
  /** Current breakpoint name */
  breakpoint: BreakpointName | null;
  /** Whether viewport is at least 'sm' */
  isSm: boolean;
  /** Whether viewport is at least 'md' */
  isMd: boolean;
  /** Whether viewport is at least 'lg' */
  isLg: boolean;
  /** Whether viewport is at least 'xl' */
  isXl: boolean;
  /** Whether viewport is at least '2xl' */
  is2xl: boolean;
  /** Whether viewport is mobile (< md) */
  isMobile: boolean;
  /** Whether viewport is tablet (md - lg) */
  isTablet: boolean;
  /** Whether viewport is desktop (>= lg) */
  isDesktop: boolean;
  /** Whether viewport is in landscape orientation */
  isLandscape: boolean;
  /** Whether viewport is in portrait orientation */
  isPortrait: boolean;
}

/**
 * Default breakpoint state (server-side rendering safe)
 */
export const DEFAULT_BREAKPOINT_STATE: BreakpointState = {
  width: 0,
  height: 0,
  breakpoint: null,
  isSm: false,
  isMd: false,
  isLg: false,
  isXl: false,
  is2xl: false,
  isMobile: true,
  isTablet: false,
  isDesktop: false,
  isLandscape: false,
  isPortrait: true,
};

/**
 * Get current breakpoint name from width
 * @param width - Viewport width in pixels
 * @returns Current breakpoint name or null if below sm
 */
export function getBreakpointFromWidth(width: number): BreakpointName | null {
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return null;
}

/**
 * Check if current width matches or exceeds a breakpoint
 * @param width - Viewport width in pixels
 * @param breakpoint - Breakpoint to check
 * @returns Whether width is at least the breakpoint
 */
export function isAtLeastBreakpoint(
  width: number,
  breakpoint: BreakpointName
): boolean {
  return width >= BREAKPOINTS[breakpoint];
}

/**
 * Check if current width is between two breakpoints
 * @param width - Viewport width in pixels
 * @param min - Minimum breakpoint (inclusive)
 * @param max - Maximum breakpoint (exclusive)
 * @returns Whether width is in range
 */
export function isBetweenBreakpoints(
  width: number,
  min: BreakpointName,
  max: BreakpointName
): boolean {
  return width >= BREAKPOINTS[min] && width < BREAKPOINTS[max];
}

/**
 * Media query string generator for breakpoint
 * @param breakpoint - Breakpoint name
 * @param type - 'min' | 'max' | 'only'
 * @returns Media query string
 */
export function getBreakpointMediaQuery(
  breakpoint: BreakpointName,
  type: 'min' | 'max' | 'only' = 'min'
): string {
  const value = BREAKPOINTS[breakpoint];
  
  switch (type) {
    case 'min':
      return `(min-width: ${value}px)`;
    case 'max':
      return `(max-width: ${value - 1}px)`;
    case 'only': {
      const breakpoints = Object.keys(BREAKPOINTS) as BreakpointName[];
      const index = breakpoints.indexOf(breakpoint);
      const next = breakpoints[index + 1];
      if (next) {
        return `(min-width: ${value}px) and (max-width: ${BREAKPOINTS[next] - 1}px)`;
      }
      return `(min-width: ${value}px)`;
    }
    default:
      return `(min-width: ${value}px)`;
  }
}

/**
 * React hook for responsive breakpoint detection
 * 
 * @param options - Configuration options
 * @returns Current breakpoint state
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isMobile, isDesktop, breakpoint } = useBreakpoint();
 *   
 *   return (
 *     <div>
 *       {isMobile && <MobileView />}
 *       {isDesktop && <DesktopView />}
 *       <p>Current: {breakpoint || 'base'}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export interface UseBreakpointOptions {
  /** Initial state for SSR (defaults to mobile) */
  initialState?: Partial<BreakpointState>;
  /** Debounce delay in ms (default: 100) */
  debounceMs?: number;
  /** Enable orientation detection (default: true) */
  detectOrientation?: boolean;
}

export function useBreakpoint(
  options: UseBreakpointOptions = {}
): BreakpointState {
  const {
    initialState,
    debounceMs = 100,
    detectOrientation = true,
  } = options;

  const [state, setState] = useState<BreakpointState>({
    ...DEFAULT_BREAKPOINT_STATE,
    ...initialState,
  });

  const calculateState = useCallback((): BreakpointState => {
    if (typeof window === 'undefined') {
      return DEFAULT_BREAKPOINT_STATE;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const breakpoint = getBreakpointFromWidth(width);
    const isLandscape = detectOrientation ? width > height : false;

    return {
      width,
      height,
      breakpoint,
      isSm: isAtLeastBreakpoint(width, 'sm'),
      isMd: isAtLeastBreakpoint(width, 'md'),
      isLg: isAtLeastBreakpoint(width, 'lg'),
      isXl: isAtLeastBreakpoint(width, 'xl'),
      is2xl: isAtLeastBreakpoint(width, '2xl'),
      isMobile: !isAtLeastBreakpoint(width, 'md'),
      isTablet: isBetweenBreakpoints(width, 'md', 'lg'),
      isDesktop: isAtLeastBreakpoint(width, 'lg'),
      isLandscape,
      isPortrait: !isLandscape,
    };
  }, [detectOrientation]);

  useEffect(() => {
    // Calculate initial state
    setState(calculateState());

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleResize = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        setState(calculateState());
      }, debounceMs);
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [calculateState, debounceMs]);

  return state;
}

/**
 * Hook for listening to a specific breakpoint
 * 
 * @param breakpoint - Breakpoint to listen for
 * @param type - 'min' | 'max' | 'only' | 'between'
 * @param options - Additional options for 'between' type
 * @returns Whether the breakpoint matches
 * 
 * @example
 * ```tsx
 * const isLargeScreen = useBreakpointMatch('lg', 'min');
 * const isTabletOnly = useBreakpointMatch('md', 'only');
 * const isMobileOnly = useBreakpointMatch('sm', 'max');
 * ```
 */
export function useBreakpointMatch(
  breakpoint: BreakpointName,
  type: 'min' | 'max' | 'only' = 'min'
): boolean {
  const { width } = useBreakpoint();
  
  if (width === 0) return false;

  const bpValue = BREAKPOINTS[breakpoint];
  
  switch (type) {
    case 'min':
      return width >= bpValue;
    case 'max':
      return width < bpValue;
    case 'only': {
      const breakpoints = Object.keys(BREAKPOINTS) as BreakpointName[];
      const index = breakpoints.indexOf(breakpoint);
      const next = breakpoints[index + 1];
      if (next) {
        return width >= bpValue && width < BREAKPOINTS[next];
      }
      return width >= bpValue;
    }
    default:
      return false;
  }
}

/**
 * Hook for conditional rendering based on breakpoints
 * 
 * @param config - Configuration mapping breakpoints to values
 * @returns Value for current breakpoint
 * 
 * @example
 * ```tsx
 * const columns = useResponsiveValue({
 *   default: 1,
 *   sm: 2,
 *   md: 3,
 *   lg: 4,
 *   xl: 5,
 * });
 * ```
 */
export interface ResponsiveValueConfig<T> {
  default: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}

export function useResponsiveValue<T>(
  config: ResponsiveValueConfig<T>
): T {
  const { breakpoint } = useBreakpoint();
  
  return useMemo(() => {
    if (!breakpoint) return config.default;
    if (breakpoint === '2xl' && config['2xl'] !== undefined) return config['2xl'];
    if ((breakpoint === '2xl' || breakpoint === 'xl') && config.xl !== undefined) return config.xl;
    if ((breakpoint === '2xl' || breakpoint === 'xl' || breakpoint === 'lg') && config.lg !== undefined) return config.lg;
    if ((breakpoint === '2xl' || breakpoint === 'xl' || breakpoint === 'lg' || breakpoint === 'md') && config.md !== undefined) return config.md;
    if (config.sm !== undefined) return config.sm;
    return config.default;
  }, [breakpoint, config]);
}

/**
 * CSS-in-JS breakpoint helper
 * Generates responsive CSS object from breakpoint config
 * 
 * @example
 * ```tsx
 * const styles = useResponsiveStyles({
 *   padding: { default: '1rem', md: '2rem', lg: '3rem' },
 *   fontSize: { default: '14px', md: '16px' },
 * });
 * ```
 */
export type ResponsiveStyleValue = string | number;

export interface ResponsiveStyleConfig {
  [property: string]: ResponsiveValueConfig<ResponsiveStyleValue>;
}

export function useResponsiveStyles(
  config: ResponsiveStyleConfig
): React.CSSProperties {
  const breakpointState = useBreakpoint();
  
  return useMemo(() => {
    const styles: React.CSSProperties = {};
    
    for (const [property, valueConfig] of Object.entries(config)) {
      const value = (() => {
        const { breakpoint } = breakpointState;
        if (!breakpoint) return valueConfig.default;
        
        const breakpoints: BreakpointName[] = ['2xl', 'xl', 'lg', 'md', 'sm'];
        const currentIndex = breakpoints.indexOf(breakpoint);
        
        for (let i = currentIndex; i < breakpoints.length; i++) {
          const bp = breakpoints[i];
          if (valueConfig[bp] !== undefined) {
            return valueConfig[bp];
          }
        }
        
        return valueConfig.default;
      })();
      
      (styles as Record<string, ResponsiveStyleValue>)[property] = value;
    }
    
    return styles;
  }, [breakpointState, config]);
}

export default useBreakpoint;
