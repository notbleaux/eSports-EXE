// @ts-nocheck
/**
 * Hub Navigation Gestures
 * Swipe navigation between 5 hubs (SATOR, ROTAS, AREPO, OPERA, TENET)
 * [Ver001.000]
 * 
 * Features:
 * - Swipe between 5 hubs
 * - Visual swipe indicator
 * - Haptic feedback on supported devices
 * - Velocity-based animation
 * - Edge swipe detection
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTouchGesture, GestureState, GestureDirection, Point2D } from '@/hooks/useTouchGesture';

// ============================================================================
// TYPES
// ============================================================================

export type HubId = 'sator' | 'rotas' | 'arepo' | 'opera' | 'tenet';

export interface HubConfig {
  id: HubId;
  name: string;
  path: string;
  color: string;
  icon: string;
  subtitle: string;
}

export interface SwipeIndicatorState {
  /** Whether indicator is visible */
  visible: boolean;
  /** Direction of swipe */
  direction: 'left' | 'right' | null;
  /** Progress 0-1 */
  progress: number;
  /** Target hub being swiped to */
  targetHub: HubConfig | null;
  /** Source hub */
  sourceHub: HubConfig | null;
}

export interface HubNavigationConfig {
  /** Enable swipe navigation [default: true] */
  enabled?: boolean;
  /** Swipe threshold (px) [default: 60] */
  threshold?: number;
  /** Velocity threshold (px/ms) [default: 0.4] */
  velocityThreshold?: number;
  /** Enable visual feedback [default: true] */
  visualFeedback?: boolean;
  /** Enable haptic feedback [default: true] */
  hapticEnabled?: boolean;
  /** Edge swipe to open menu [default: true] */
  edgeSwipeEnabled?: boolean;
  /** Edge swipe threshold (px) [default: 30] */
  edgeSwipeThreshold?: number;
  /** Animation duration (ms) [default: 300] */
  animationDuration?: number;
}

export interface UseHubNavigationReturn {
  /** Bind to container element */
  bind: () => ReturnType<typeof useTouchGesture>['bind'];
  /** Current swipe indicator state */
  indicator: SwipeIndicatorState;
  /** Current hub index */
  currentIndex: number;
  /** Navigate to specific hub */
  navigateToHub: (index: number) => void;
  /** Navigate to next hub */
  nextHub: () => void;
  /** Navigate to previous hub */
  prevHub: () => void;
  /** Whether navigation is enabled */
  isEnabled: boolean;
}

// ============================================================================
// HUB CONFIGURATION
// ============================================================================

export const HUBS: HubConfig[] = [
  {
    id: 'sator',
    name: 'Analytics',
    path: '/analytics',
    color: '#ffd700',
    icon: 'Eye',
    subtitle: 'The Observatory',
  },
  {
    id: 'rotas',
    name: 'Stats',
    path: '/stats',
    color: '#00d4ff',
    icon: 'Activity',
    subtitle: 'The Harmonic Layer',
  },
  {
    id: 'arepo',
    name: 'Community',
    path: '/community',
    color: '#0066ff',
    icon: 'BookOpen',
    subtitle: 'The Directory',
  },
  {
    id: 'opera',
    name: 'Pro Scene',
    path: '/pro-scene',
    color: '#9d4edd',
    icon: 'Map',
    subtitle: 'The Nexus',
  },
  {
    id: 'tenet',
    name: 'Hubs',
    path: '/hubs',
    color: '#ffffff',
    icon: 'Grid3X3',
    subtitle: 'The Center',
  },
];

export const HUB_PATHS = HUBS.map(h => h.path);

// ============================================================================
// HAPTIC PATTERNS
// ============================================================================

const HAPTIC_PATTERNS: Record<string, number | number[]> = {
  swipe: 15,
  edge: 10,
  boundary: [10, 5, 10],
};

function triggerHaptic(pattern: number | number[] = 10): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore haptic errors
    }
  }
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useHubNavigation(
  config: HubNavigationConfig = {}
): UseHubNavigationReturn {
  const {
    enabled = true,
    threshold = 60,
    velocityThreshold = 0.4,
    visualFeedback = true,
    hapticEnabled = true,
    edgeSwipeEnabled = true,
    edgeSwipeThreshold = 30,
    animationDuration = 300,
  } = config;

  const navigate = useNavigate();
  const location = useLocation();
  
  const [indicator, setIndicator] = useState<SwipeIndicatorState>({
    visible: false,
    direction: null,
    progress: 0,
    targetHub: null,
    sourceHub: null,
  });

  // Get current hub index
  const currentIndex = HUB_PATHS.findIndex(p => p === location.pathname);
  const currentHub = currentIndex >= 0 ? HUBS[currentIndex] : null;

  // Navigation refs
  const isNavigatingRef = useRef(false);
  const swipeStartXRef = useRef(0);
  const hasTriggeredEdgeRef = useRef(false);

  // Handle swipe gesture
  const handleSwipe = useCallback((direction: GestureDirection, state: GestureState) => {
    if (!enabled || isNavigatingRef.current) return;

    const isFastSwipe = state.velocity.magnitude > velocityThreshold;
    const isLongSwipe = state.distance > threshold;

    if (!isFastSwipe && !isLongSwipe) return;

    // Handle edge swipe for menu
    if (edgeSwipeEnabled && direction === 'right' && swipeStartXRef.current < edgeSwipeThreshold) {
      if (!hasTriggeredEdgeRef.current) {
        hasTriggeredEdgeRef.current = true;
        if (hapticEnabled) triggerHaptic(HAPTIC_PATTERNS.edge);
        // Emit edge swipe event
        window.dispatchEvent(new CustomEvent('hub:edgeSwipe'));
      }
      return;
    }

    // Handle hub navigation
    let targetIndex = currentIndex;
    
    if (direction === 'left' && currentIndex < HUBS.length - 1) {
      targetIndex = currentIndex + 1;
    } else if (direction === 'right' && currentIndex > 0) {
      targetIndex = currentIndex - 1;
    } else {
      // Boundary reached - haptic feedback
      if (hapticEnabled) triggerHaptic(HAPTIC_PATTERNS.boundary);
      return;
    }

    // Trigger haptic
    if (hapticEnabled) triggerHaptic(HAPTIC_PATTERNS.swipe);

    // Navigate
    isNavigatingRef.current = true;
    navigate(HUBS[targetIndex].path);

    // Reset navigation flag after animation
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, animationDuration);
  }, [enabled, currentIndex, navigate, threshold, velocityThreshold, hapticEnabled, edgeSwipeEnabled, edgeSwipeThreshold, animationDuration]);

  // Handle pan for visual feedback
  const handlePan = useCallback((delta: Point2D, _state: GestureState) => {
    if (!visualFeedback || !enabled) return;

    const progress = Math.min(Math.abs(delta.x) / threshold, 1);
    const direction = delta.x > 0 ? 'right' : 'left';

    // Don't show indicator if at boundary
    if (direction === 'left' && currentIndex >= HUBS.length - 1) return;
    if (direction === 'right' && currentIndex <= 0) return;

    const targetHub = direction === 'left' 
      ? HUBS[currentIndex + 1] 
      : HUBS[currentIndex - 1];

    setIndicator({
      visible: true,
      direction,
      progress,
      targetHub,
      sourceHub: currentHub,
    });
  }, [visualFeedback, enabled, threshold, currentIndex, currentHub]);

  // Handle pan end
  const handlePanEnd = useCallback(() => {
    setIndicator(prev => ({ ...prev, visible: false, progress: 0 }));
    hasTriggeredEdgeRef.current = false;
  }, []);

  // Handle gesture start to track swipe origin
  const handleGestureStart = useCallback((state: GestureState) => {
    if (state.startPosition) {
      swipeStartXRef.current = state.startPosition.x;
    }
    hasTriggeredEdgeRef.current = false;
  }, []);

  // Use touch gesture hook
  const { bind } = useTouchGesture(
    {
      onSwipe: handleSwipe,
      onPan: handlePan,
      onPanEnd: handlePanEnd,
      onGestureStart: handleGestureStart,
    },
    {
      swipe: {
        threshold,
        velocityThreshold,
        horizontal: true,
        vertical: false,
      },
      pan: {
        momentum: true,
        minVelocity: velocityThreshold,
      },
      hapticEnabled: false, // We handle haptics manually
      preventDefault: false,
    }
  );

  // Navigate to specific hub
  const navigateToHub = useCallback((index: number) => {
    if (index >= 0 && index < HUBS.length && !isNavigatingRef.current) {
      isNavigatingRef.current = true;
      navigate(HUBS[index].path);
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, animationDuration);
    }
  }, [navigate, animationDuration]);

  // Navigate to next hub
  const nextHub = useCallback(() => {
    navigateToHub(currentIndex + 1);
  }, [currentIndex, navigateToHub]);

  // Navigate to previous hub
  const prevHub = useCallback(() => {
    navigateToHub(currentIndex - 1);
  }, [currentIndex, navigateToHub]);

  // Reset indicator when location changes
  useEffect(() => {
    setIndicator({
      visible: false,
      direction: null,
      progress: 0,
      targetHub: null,
      sourceHub: null,
    });
  }, [location.pathname]);

  return {
    bind,
    indicator,
    currentIndex: Math.max(0, currentIndex),
    navigateToHub,
    nextHub,
    prevHub,
    isEnabled: enabled,
  };
}

// ============================================================================
// VELOCITY-BASED ANIMATION
// ============================================================================

export interface VelocityAnimation {
  /** Initial velocity */
  velocity: number;
  /** Deceleration factor */
  deceleration: number;
  /** Current position */
  position: number;
  /** Whether animation is active */
  isAnimating: boolean;
}

/**
 * Calculate spring animation based on velocity
 */
export function calculateVelocityAnimation(
  velocity: number,
  deceleration: number = 0.95,
  minVelocity: number = 0.1
): VelocityAnimation {
  let currentVelocity = Math.abs(velocity);
  let position = 0;
  let isAnimating = true;
  
  // Simulate animation to find final position
  while (currentVelocity > minVelocity) {
    position += currentVelocity;
    currentVelocity *= deceleration;
  }
  
  return {
    velocity,
    deceleration,
    position: velocity > 0 ? position : -position,
    isAnimating,
  };
}

/**
 * Get animation duration based on velocity
 */
export function getAnimationDuration(velocity: number, deceleration: number = 0.95): number {
  let currentVelocity = Math.abs(velocity);
  let frames = 0;
  const minVelocity = 0.1;
  
  while (currentVelocity > minVelocity) {
    frames++;
    currentVelocity *= deceleration;
  }
  
  // Convert frames to ms (assuming 60fps)
  return Math.min(frames * 16.67, 500);
}

/**
 * Calculate swipe progress for visual indicator
 */
export function calculateSwipeProgress(
  distance: number,
  threshold: number,
  velocity: number
): number {
  // Base progress from distance
  let progress = Math.min(distance / threshold, 1);
  
  // Boost progress for fast swipes
  if (velocity > 1) {
    progress = Math.min(progress * 1.2, 1);
  }
  
  return progress;
}

// ============================================================================
// VISUAL INDICATOR UTILS
// ============================================================================

export interface IndicatorStyle {
  /** CSS transform */
  transform: string;
  /** CSS opacity */
  opacity: number;
  /** CSS transition */
  transition?: string;
}

/**
 * Get indicator styles for left swipe (next hub)
 */
export function getLeftSwipeIndicatorStyles(
  progress: number,
  _hubColor: string
): IndicatorStyle {
  const easedProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
  
  return {
    transform: `translateX(${-50 + easedProgress * 50}%)`,
    opacity: progress * 0.5,
  };
}

/**
 * Get indicator styles for right swipe (prev hub)
 */
export function getRightSwipeIndicatorStyles(
  progress: number,
  _hubColor: string
): IndicatorStyle {
  const easedProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
  
  return {
    transform: `translateX(${50 - easedProgress * 50}%)`,
    opacity: progress * 0.5,
  };
}

/**
 * Get content shift styles during swipe
 */
export function getContentShiftStyles(
  progress: number,
  direction: 'left' | 'right'
): IndicatorStyle {
  const shift = direction === 'left' ? -progress * 30 : progress * 30;
  const scale = 1 - progress * 0.02;
  
  return {
    transform: `translateX(${shift}px) scale(${scale})`,
    opacity: 1,
    transition: 'transform 0.1s ease-out',
  };
}

// ============================================================================
// COMPOSED HOOK FOR REACT COMPONENTS
// ============================================================================

export interface HubNavigationGestureProps {
  /** Visual feedback enabled */
  visualFeedback?: boolean;
  /** Haptic feedback enabled */
  hapticEnabled?: boolean;
  /** Called when swipe indicator updates */
  onIndicatorChange?: (indicator: SwipeIndicatorState) => void;
  /** Called when hub changes */
  onHubChange?: (from: HubConfig, to: HubConfig) => void;
}

export function useHubNavigationGestures(
  props: HubNavigationGestureProps = {}
): UseHubNavigationReturn & {
  /** Indicator styles for React */
  indicatorStyles: {
    left: IndicatorStyle;
    right: IndicatorStyle;
    content: IndicatorStyle;
  } | null;
} {
  const { visualFeedback = true, hapticEnabled = true, onIndicatorChange, onHubChange: _onHubChange } = props;
  
  const navigation = useHubNavigation({
    visualFeedback,
    hapticEnabled,
  });

  // Notify on indicator change
  useEffect(() => {
    onIndicatorChange?.(navigation.indicator);
  }, [navigation.indicator, onIndicatorChange]);

  // Calculate indicator styles
  const indicatorStyles = navigation.indicator.visible && navigation.indicator.direction
    ? {
        left: navigation.indicator.direction === 'left'
          ? getLeftSwipeIndicatorStyles(navigation.indicator.progress, navigation.indicator.targetHub?.color || '#00d4ff')
          : { transform: 'translateX(-100%)', opacity: 0 },
        right: navigation.indicator.direction === 'right'
          ? getRightSwipeIndicatorStyles(navigation.indicator.progress, navigation.indicator.targetHub?.color || '#00d4ff')
          : { transform: 'translateX(100%)', opacity: 0 },
        content: navigation.indicator.direction
          ? getContentShiftStyles(navigation.indicator.progress, navigation.indicator.direction)
          : { transform: 'none', opacity: 1 },
      }
    : null;

  return {
    ...navigation,
    indicatorStyles,
  };
}

export default useHubNavigation;
