[Ver001.000]

/**
 * Viewport Adapter for Mobile Devices
 * 
 * Manages viewport meta tag, orientation changes, and safe area insets
 * for modern mobile devices including notch/cutout support.
 * 
 * @module mobile/viewport
 */

import { useEffect, useState, useCallback } from 'react';

/**
 * Viewport meta tag content options
 */
export interface ViewportOptions {
  /** Width of the viewport (default: device-width) */
  width?: string | number;
  /** Initial zoom level (default: 1) */
  initialScale?: number;
  /** Minimum zoom level (default: 1) */
  minimumScale?: number;
  /** Maximum zoom level (default: 5) */
  maximumScale?: number;
  /** Allow user scaling (default: yes) */
  userScalable?: boolean;
  /** Fit to screen (iOS Safari) */
  viewportFit?: 'auto' | 'contain' | 'cover';
}

/**
 * Default viewport configuration optimized for mobile apps
 */
export const DEFAULT_VIEWPORT: Required<ViewportOptions> = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

/**
 * Viewport configuration for standalone/PWA mode
 * Prevents zooming for app-like experience
 */
export const STANDALONE_VIEWPORT: Required<ViewportOptions> = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

/**
 * Generate viewport meta tag content string
 * @param options - Viewport configuration options
 * @returns Meta tag content string
 */
export function generateViewportContent(
  options: Partial<ViewportOptions> = {}
): string {
  const config = { ...DEFAULT_VIEWPORT, ...options };
  
  const parts: string[] = [
    `width=${config.width}`,
    `initial-scale=${config.initialScale}`,
    `minimum-scale=${config.minimumScale}`,
    `maximum-scale=${config.maximumScale}`,
    `user-scalable=${config.userScalable ? 'yes' : 'no'}`,
    `viewport-fit=${config.viewportFit}`,
  ];
  
  return parts.join(', ');
}

/**
 * Safe area insets for notch devices
 */
export interface SafeAreaInsets {
  /** Top safe area (status bar, notch) */
  top: number;
  /** Right safe area */
  right: number;
  /** Bottom safe area (home indicator) */
  bottom: number;
  /** Left safe area */
  left: number;
}

/**
 * CSS environment variable fallback values
 */
export const SAFE_AREA_FALLBACKS: SafeAreaInsets = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

/**
 * iOS dynamic island / notch heights
 */
export const NOTCH_HEIGHTS = {
  /** Standard status bar */
  standard: 20,
  /** Notch devices (iPhone X - 13) */
  notch: 44,
  /** Dynamic Island devices (iPhone 14 Pro+) */
  dynamicIsland: 59,
} as const;

/**
 * Android status bar heights
 */
export const ANDROID_STATUS_BAR_HEIGHTS = {
  /** Standard */
  standard: 24,
  /** High density */
  highDensity: 32,
} as const;

/**
 * Check if device has a notch or dynamic island
 * Uses user agent and screen dimensions heuristics
 */
export function hasNotch(): boolean {
  if (typeof window === 'undefined') return false;
  
  const { screen, navigator } = window;
  const screenRatio = screen.width / screen.height;
  const isIPhone = /iPhone/.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  // iPhone X and later have aspect ratio >= 2.0 (or close)
  if (isIPhone) {
    const ratio = Math.max(screenRatio, 1 / screenRatio);
    return ratio >= 2.0;
  }
  
  // Check for CSS env variables support
  if (isIOS && CSS.supports('padding-top: env(safe-area-inset-top)')) {
    return true;
  }
  
  return false;
}

/**
 * Get estimated safe area insets
 * Falls back to CSS env() variables when available
 */
export function getSafeAreaInsets(): SafeAreaInsets {
  if (typeof window === 'undefined') {
    return SAFE_AREA_FALLBACKS;
  }
  
  // Try to use CSS environment variables
  if (CSS.supports('padding-top: env(safe-area-inset-top)')) {
    const styles = getComputedStyle(document.documentElement);
    
    return {
      top: parseFloat(styles.getPropertyValue('--sat') || '0') || 
           parseInt(styles.paddingTop || '0', 10) || 0,
      right: parseFloat(styles.getPropertyValue('--sar') || '0') || 0,
      bottom: parseFloat(styles.getPropertyValue('--sab') || '0') || 0,
      left: parseFloat(styles.getPropertyValue('--sal') || '0') || 0,
    };
  }
  
  // Estimate based on device type
  if (hasNotch()) {
    const isDynamicIsland = /iPhone1[456]|iPhone1[5-9]/.test(navigator.userAgent);
    return {
      top: isDynamicIsland ? NOTCH_HEIGHTS.dynamicIsland : NOTCH_HEIGHTS.notch,
      right: 0,
      bottom: 34, // Home indicator
      left: 0,
    };
  }
  
  return SAFE_AREA_FALLBACKS;
}

/**
 * CSS custom properties for safe areas
 * Inject these into your global CSS
 */
export const SAFE_AREA_CSS = `
:root {
  --sat: env(safe-area-inset-top, 0px);
  --sar: env(safe-area-inset-right, 0px);
  --sab: env(safe-area-inset-bottom, 0px);
  --sal: env(safe-area-inset-left, 0px);
  --safe-area-top: var(--sat);
  --safe-area-right: var(--sar);
  --safe-area-bottom: var(--sab);
  --safe-area-left: var(--sal);
}
`;

/**
 * Device orientation types
 */
export type Orientation = 'portrait' | 'landscape' | 'portrait-primary' | 
                         'portrait-secondary' | 'landscape-primary' | 
                         'landscape-secondary' | 'unknown';

/**
 * Get current device orientation
 */
export function getOrientation(): Orientation {
  if (typeof window === 'undefined') return 'unknown';
  
  // Use Screen Orientation API if available
  if (screen.orientation) {
    return screen.orientation.type as Orientation;
  }
  
  // Fallback to window orientation or dimensions
  const angle = (window.orientation as number) || 0;
  const isLandscape = Math.abs(angle) === 90 || 
                      window.innerWidth > window.innerHeight;
  
  return isLandscape ? 'landscape' : 'portrait';
}

/**
 * Check if orientation is landscape
 */
export function isLandscape(): boolean {
  const orientation = getOrientation();
  return orientation.startsWith('landscape');
}

/**
 * Check if orientation is portrait
 */
export function isPortrait(): boolean {
  const orientation = getOrientation();
  return orientation.startsWith('portrait');
}

/**
 * React hook for viewport management
 */
export interface UseViewportOptions {
  /** Update viewport meta tag on mount */
  updateMetaTag?: boolean;
  /** Viewport configuration */
  viewportConfig?: Partial<ViewportOptions>;
  /** Listen for orientation changes */
  trackOrientation?: boolean;
  /** Listen for safe area changes */
  trackSafeAreas?: boolean;
}

export interface ViewportState {
  /** Current orientation */
  orientation: Orientation;
  /** Safe area insets */
  safeArea: SafeAreaInsets;
  /** Whether viewport has been initialized */
  isInitialized: boolean;
  /** Viewport width */
  width: number;
  /** Viewport height */
  height: number;
  /** Device pixel ratio */
  dpr: number;
}

/**
 * Hook for managing viewport state and updates
 */
export function useViewport(
  options: UseViewportOptions = {}
): ViewportState {
  const {
    updateMetaTag = true,
    viewportConfig,
    trackOrientation = true,
    trackSafeAreas = true,
  } = options;

  const [state, setState] = useState<ViewportState>({
    orientation: 'unknown',
    safeArea: SAFE_AREA_FALLBACKS,
    isInitialized: false,
    width: 0,
    height: 0,
    dpr: 1,
  });

  const updateState = useCallback(() => {
    setState({
      orientation: getOrientation(),
      safeArea: getSafeAreaInsets(),
      isInitialized: true,
      width: window.innerWidth,
      height: window.innerHeight,
      dpr: window.devicePixelRatio || 1,
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Update viewport meta tag if requested
    if (updateMetaTag) {
      let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
      
      if (!viewportMeta) {
        viewportMeta = document.createElement('meta');
        viewportMeta.name = 'viewport';
        document.head.appendChild(viewportMeta);
      }
      
      viewportMeta.content = generateViewportContent(viewportConfig);
    }

    // Initial state
    updateState();

    // Orientation change handler
    const handleOrientationChange = () => {
      updateState();
    };

    // Resize handler (for safe area changes)
    const handleResize = () => {
      if (trackSafeAreas) {
        updateState();
      }
    };

    if (trackOrientation) {
      if (screen.orientation) {
        screen.orientation.addEventListener('change', handleOrientationChange);
      } else {
        window.addEventListener('orientationchange', handleOrientationChange);
      }
    }

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      if (trackOrientation) {
        if (screen.orientation) {
          screen.orientation.removeEventListener('change', handleOrientationChange);
        } else {
          window.removeEventListener('orientationchange', handleOrientationChange);
        }
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [updateMetaTag, viewportConfig, trackOrientation, trackSafeAreas, updateState]);

  return state;
}

/**
 * Hook for locking/unlocking orientation
 * Note: Requires screen orientation API permission on some devices
 */
export function useOrientationLock() {
  const [isLocked, setIsLocked] = useState(false);

  const lock = useCallback(async (
    orientation: 'portrait' | 'landscape' | 'any'
  ): Promise<boolean> => {
    if (typeof window === 'undefined' || !screen.orientation?.lock) {
      return false;
    }

    try {
      await screen.orientation.lock(orientation);
      setIsLocked(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  const unlock = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !screen.orientation?.unlock) {
      return false;
    }

    try {
      await screen.orientation.unlock();
      setIsLocked(false);
      return true;
    } catch {
      return false;
    }
  }, []);

  return { isLocked, lock, unlock };
}

/**
 * Hook for detecting virtual keyboard visibility
 * Useful for adjusting layouts when keyboard opens
 */
export function useVirtualKeyboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !('visualViewport' in window)) {
      return;
    }

    const visualViewport = window.visualViewport;
    if (!visualViewport) return;

    const handleResize = () => {
      const windowHeight = window.innerHeight;
      const viewportHeight = visualViewport.height;
      const keyboardHeight = windowHeight - viewportHeight;
      
      setIsOpen(keyboardHeight > 150); // Threshold for keyboard detection
      setHeight(Math.max(0, keyboardHeight));
    };

    visualViewport.addEventListener('resize', handleResize);
    visualViewport.addEventListener('scroll', handleResize);

    return () => {
      visualViewport.removeEventListener('resize', handleResize);
      visualViewport.removeEventListener('scroll', handleResize);
    };
  }, []);

  return { isOpen, height };
}

/**
 * Utility to prevent elastic/bounce scrolling on iOS
 * Add this to container elements that need fixed scrolling
 */
export const PREVENT_BOUNCE_CSS = `
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
`;

/**
 * CSS for full-height containers accounting for mobile browsers
 * Uses -webkit-fill-available for iOS Safari dynamic toolbars
 */
export const FULL_HEIGHT_CSS = `
  min-height: 100vh;
  min-height: -webkit-fill-available;
`;

export default useViewport;
