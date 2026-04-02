// @ts-nocheck
/**
 * Map Zoom Gestures
 * Touch gesture integration for SpecMap with pinch zoom, pan, and double-tap
 * [Ver001.000]
 * 
 * Features:
 * - Pinch zoom with SpecMap CameraController integration
 * - Pan to move map
 * - Double-tap to zoom
 * - Min/max zoom limits
 * - Velocity-based momentum panning
 * - Haptic feedback
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { useTouchGesture, GestureState, Point2D } from '@/hooks/useTouchGesture';
import type { CameraController } from '@/components/SpecMapViewer/camera/CameraController';

// ============================================================================
// TYPES
// ============================================================================

export interface MapGestureConfig {
  /** Minimum zoom level [default: 0.5] */
  minZoom?: number;
  /** Maximum zoom level [default: 5] */
  maxZoom?: number;
  /** Zoom sensitivity [default: 1] */
  zoomSensitivity?: number;
  /** Pan sensitivity [default: 1] */
  panSensitivity?: number;
  /** Enable double-tap zoom [default: true] */
  doubleTapZoom?: boolean;
  /** Double-tap zoom factor [default: 1.5] */
  doubleTapZoomFactor?: number;
  /** Enable momentum panning [default: true] */
  momentumPan?: boolean;
  /** Momentum deceleration [default: 0.95] */
  momentumDeceleration?: number;
  /** Enable haptic feedback [default: true] */
  hapticEnabled?: boolean;
  /** Zoom animation duration (ms) [default: 300] */
  zoomAnimationDuration?: number;
}

export interface MapGestureState {
  /** Current zoom level */
  zoom: number;
  /** Target zoom level (during animation) */
  targetZoom: number;
  /** Current pan position */
  pan: Point2D;
  /** Whether currently pinching */
  isPinching: boolean;
  /** Whether currently panning */
  isPanning: boolean;
  /** Pinch center point */
  pinchCenter: Point2D | null;
  /** Whether gesture is active */
  isActive: boolean;
}

export interface UseMapGesturesReturn {
  /** Bind to map container */
  bind: () => ReturnType<typeof useTouchGesture>['bind'];
  /** Current map gesture state */
  state: MapGestureState;
  /** Set zoom level programmatically */
  setZoom: (zoom: number, animate?: boolean) => void;
  /** Zoom in by factor */
  zoomIn: (factor?: number) => void;
  /** Zoom out by factor */
  zoomOut: (factor?: number) => void;
  /** Reset to default view */
  reset: () => void;
  /** Focus on specific point */
  focusOn: (point: Point2D, zoom?: number) => void;
}

export interface MapGesturesController {
  /** Update camera from gesture state */
  updateCamera: (state: MapGestureState) => void;
  /** Get current camera zoom */
  getZoom: () => number;
  /** Get current camera position */
  getPosition: () => Point2D;
  /** Set camera position */
  setPosition: (position: Point2D) => void;
  /** Smooth zoom to level */
  zoomTo: (zoom: number, duration?: number) => Promise<void>;
  /** Smooth pan to position */
  panTo: (position: Point2D, duration?: number) => Promise<void>;
  /** Focus on point with zoom */
  focusOn: (point: Point2D, zoom?: number, duration?: number) => Promise<void>;
}

// ============================================================================
// HAPTIC PATTERNS
// ============================================================================

const HAPTIC_PATTERNS = {
  zoomLimit: 10,
  doubleTap: 15,
  panStart: 5,
  pinchStart: 5,
} as const;

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
// UTILITY FUNCTIONS
// ============================================================================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Transform screen delta to world delta based on zoom
 */
function screenToWorldDelta(
  screenDelta: Point2D,
  zoom: number,
  canvasWidth: number,
  canvasHeight: number,
  worldWidth: number = 64,
  worldHeight: number = 64
): Point2D {
  const scaleX = worldWidth / canvasWidth / zoom;
  const scaleY = worldHeight / canvasHeight / zoom;
  
  return {
    x: screenDelta.x * scaleX,
    y: screenDelta.y * scaleY,
  };
}

/**
 * Transform world position to screen position
 */
function worldToScreen(
  worldPos: Point2D,
  cameraPosition: Point2D,
  zoom: number,
  canvasWidth: number,
  canvasHeight: number,
  worldWidth: number = 64,
  worldHeight: number = 64
): Point2D {
  const scaleX = canvasWidth / worldWidth * zoom;
  const scaleY = canvasHeight / worldHeight * zoom;
  
  return {
    x: (worldPos.x - cameraPosition.x) * scaleX + canvasWidth / 2,
    y: (worldPos.y - cameraPosition.y) * scaleY + canvasHeight / 2,
  };
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useMapGestures(
  cameraController: CameraController | null,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  config: MapGestureConfig = {}
): UseMapGesturesReturn {
  const cfg = {
    minZoom: 0.5,
    maxZoom: 5,
    zoomSensitivity: 1,
    panSensitivity: 1,
    doubleTapZoom: true,
    doubleTapZoomFactor: 1.5,
    momentumPan: true,
    momentumDeceleration: 0.95,
    hapticEnabled: true,
    zoomAnimationDuration: 300,
    ...config,
  };

  const [state, setState] = useState<MapGestureState>({
    zoom: 1,
    targetZoom: 1,
    pan: { x: 32, y: 32 },
    isPinching: false,
    isPanning: false,
    pinchCenter: null,
    isActive: false,
  });

  // Refs for animation and tracking
  const animationRef = useRef<number | null>(null);
  const targetZoomRef = useRef(1);
  const targetPanRef = useRef<Point2D>({ x: 32, y: 32 });
  const currentZoomRef = useRef(1);
  const currentPanRef = useRef<Point2D>({ x: 32, y: 32 });
  const isAnimatingRef = useRef(false);

  // Update refs when state changes
  useEffect(() => {
    currentZoomRef.current = state.zoom;
    currentPanRef.current = state.pan;
  }, [state.zoom, state.pan]);

  // Update camera controller when state changes
  useEffect(() => {
    if (cameraController && state.isActive) {
      cameraController.setState({
        zoom: state.zoom,
        target: { x: state.pan.x, y: state.pan.y, z: 0 },
      });
    }
  }, [cameraController, state]);

  /**
   * Animate zoom to target
   */
  const animateZoom = useCallback((targetZoom: number, duration: number = cfg.zoomAnimationDuration) => {
    if (isAnimatingRef.current && animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    isAnimatingRef.current = true;
    targetZoomRef.current = targetZoom;
    const startZoom = currentZoomRef.current;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      const newZoom = lerp(startZoom, targetZoom, eased);
      currentZoomRef.current = newZoom;

      setState(prev => ({
        ...prev,
        zoom: newZoom,
        targetZoom: progress < 1 ? targetZoom : newZoom,
      }));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        isAnimatingRef.current = false;
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [cfg.zoomAnimationDuration]);

  /**
   * Animate pan with momentum
   */
  const animateMomentumPan = useCallback((velocity: Point2D) => {
    if (!cfg.momentumPan) return;

    let currentVelocity = { ...velocity };
    const deceleration = cfg.momentumDeceleration;
    const minVelocity = 0.1;

    const animate = () => {
      const speed = Math.sqrt(currentVelocity.x ** 2 + currentVelocity.y ** 2);
      
      if (speed < minVelocity) {
        return;
      }

      const newPan = {
        x: currentPanRef.current.x - currentVelocity.x * 0.016,
        y: currentPanRef.current.y - currentVelocity.y * 0.016,
      };

      currentPanRef.current = newPan;
      currentVelocity.x *= deceleration;
      currentVelocity.y *= deceleration;

      setState(prev => ({
        ...prev,
        pan: newPan,
      }));

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [cfg.momentumPan, cfg.momentumDeceleration]);

  /**
   * Handle pinch gesture
   */
  const handlePinch = useCallback((scale: number, gestureState: GestureState) => {
    if (!canvasRef.current) return;

    const newZoom = clamp(scale, cfg.minZoom, cfg.maxZoom);
    const isAtLimit = newZoom === cfg.minZoom || newZoom === cfg.maxZoom;

    // Haptic feedback at limits
    if (isAtLimit && cfg.hapticEnabled && newZoom !== currentZoomRef.current) {
      triggerHaptic(HAPTIC_PATTERNS.zoomLimit);
    }

    setState(prev => ({
      ...prev,
      zoom: newZoom,
      isPinching: gestureState.pointerCount === 2,
      pinchCenter: gestureState.currentPosition,
      isActive: true,
    }));

    // Update camera
    if (cameraController) {
      cameraController.setState({ zoom: newZoom });
    }
  }, [cameraController, canvasRef, cfg.minZoom, cfg.maxZoom, cfg.hapticEnabled]);

  /**
   * Handle pan gesture
   */
  const handlePan = useCallback((delta: Point2D, gestureState: GestureState) => {
    if (!canvasRef.current || gestureState.pointerCount !== 1) return;

    const canvas = canvasRef.current;
    const worldDelta = screenToWorldDelta(
      { x: -delta.x * cfg.panSensitivity, y: -delta.y * cfg.panSensitivity },
      currentZoomRef.current,
      canvas.width,
      canvas.height
    );

    const newPan = {
      x: targetPanRef.current.x + worldDelta.x,
      y: targetPanRef.current.y + worldDelta.y,
    };

    currentPanRef.current = newPan;

    setState(prev => ({
      ...prev,
      pan: newPan,
      isPanning: true,
      isActive: true,
    }));

    // Update camera
    if (cameraController) {
      cameraController.setState({
        target: { x: newPan.x, y: newPan.y, z: 0 },
      });
    }
  }, [cameraController, canvasRef, cfg.panSensitivity]);

  /**
   * Handle pan end with momentum
   */
  const handlePanEnd = useCallback((velocity: { x: number; y: number; magnitude: number }) => {
    targetPanRef.current = { ...currentPanRef.current };

    setState(prev => ({
      ...prev,
      isPanning: false,
    }));

    // Apply momentum
    if (cfg.momentumPan && velocity.magnitude > 0.5) {
      const canvas = canvasRef.current;
      if (canvas) {
        const worldVelocity = screenToWorldDelta(
          { x: -velocity.x * 50, y: -velocity.y * 50 },
          currentZoomRef.current,
          canvas.width,
          canvas.height
        );
        animateMomentumPan(worldVelocity);
      }
    }
  }, [canvasRef, cfg.momentumPan, animateMomentumPan]);

  /**
   * Handle double-tap zoom
   */
  const handleDoubleTap = useCallback((_position: Point2D) => {
    if (!cfg.doubleTapZoom) return;

    const currentZoom = currentZoomRef.current;
    const isZoomedIn = currentZoom > (cfg.minZoom + cfg.maxZoom) / 2;
    
    // Toggle between zoomed in and default
    const targetZoom = isZoomedIn 
      ? 1 
      : Math.min(currentZoom * cfg.doubleTapZoomFactor, cfg.maxZoom);

    if (cfg.hapticEnabled) {
      triggerHaptic(HAPTIC_PATTERNS.doubleTap);
    }

    animateZoom(targetZoom);

    // If zooming in, also center on tap point
    if (!isZoomedIn && cameraController && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const relativeX = position.x - rect.left;
      const relativeY = position.y - rect.top;

      // Convert to world coordinates
      const worldPos = {
        x: currentPanRef.current.x + (relativeX - canvas.width / 2) / (canvas.width / 64 * currentZoom),
        y: currentPanRef.current.y + (relativeY - canvas.height / 2) / (canvas.height / 64 * currentZoom),
      };

      cameraController.focusOn(worldPos, targetZoom, cfg.zoomAnimationDuration);
    }
  }, [cameraController, canvasRef, cfg.doubleTapZoom, cfg.doubleTapZoomFactor, cfg.maxZoom, cfg.minZoom, cfg.hapticEnabled, cfg.zoomAnimationDuration, animateZoom]);

  /**
   * Handle gesture start
   */
  const handleGestureStart = useCallback((_gestureState: GestureState) => {
    // Cancel any ongoing momentum animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    targetPanRef.current = { ...currentPanRef.current };

    setState(prev => ({
      ...prev,
      isActive: true,
    }));

    if (cfg.hapticEnabled) {
      triggerHaptic(HAPTIC_PATTERNS.panStart);
    }
  }, [cfg.hapticEnabled]);

  /**
   * Handle gesture end
   */
  const handleGestureEnd = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPinching: false,
      isPanning: false,
      isActive: false,
    }));
  }, []);

  // Use touch gesture hook
  const { bind } = useTouchGesture(
    {
      onPinch: handlePinch,
      onPan: handlePan,
      onPanEnd: handlePanEnd,
      onDoubleTap: handleDoubleTap,
      onGestureStart: handleGestureStart,
      onGestureEnd: handleGestureEnd,
    },
    {
      pinch: {
        minScale: cfg.minZoom,
        maxScale: cfg.maxZoom,
        sensitivity: cfg.zoomSensitivity,
      },
      pan: {
        momentum: cfg.momentumPan,
        deceleration: cfg.momentumDeceleration,
      },
      tap: {
        doubleTapDelay: 300,
      },
      hapticEnabled: false, // We handle haptics manually
      preventDefault: true,
    }
  );

  /**
   * Set zoom level programmatically
   */
  const setZoom = useCallback((zoom: number, animate: boolean = true) => {
    const clampedZoom = clamp(zoom, cfg.minZoom, cfg.maxZoom);
    
    if (animate) {
      animateZoom(clampedZoom);
    } else {
      currentZoomRef.current = clampedZoom;
      setState(prev => ({
        ...prev,
        zoom: clampedZoom,
        targetZoom: clampedZoom,
      }));
      
      if (cameraController) {
        cameraController.setState({ zoom: clampedZoom });
      }
    }
  }, [cameraController, cfg.minZoom, cfg.maxZoom, animateZoom]);

  /**
   * Zoom in
   */
  const zoomIn = useCallback((factor: number = 1.25) => {
    setZoom(currentZoomRef.current * factor);
  }, [setZoom]);

  /**
   * Zoom out
   */
  const zoomOut = useCallback((factor: number = 1.25) => {
    setZoom(currentZoomRef.current / factor);
  }, [setZoom]);

  /**
   * Reset to default view
   */
  const reset = useCallback(() => {
    if (cameraController) {
      cameraController.reset({ duration: cfg.zoomAnimationDuration });
    }
    
    animateZoom(1);
    
    const defaultPan = { x: 32, y: 32 };
    targetPanRef.current = defaultPan;
    currentPanRef.current = defaultPan;
    
    setState(prev => ({
      ...prev,
      zoom: 1,
      targetZoom: 1,
      pan: defaultPan,
    }));
  }, [cameraController, cfg.zoomAnimationDuration, animateZoom]);

  /**
   * Focus on specific point
   */
  const focusOn = useCallback((point: Point2D, zoom: number = 1.5) => {
    const clampedZoom = clamp(zoom, cfg.minZoom, cfg.maxZoom);
    
    if (cameraController) {
      cameraController.focusOn(point, clampedZoom, { duration: cfg.zoomAnimationDuration });
    }
    
    animateZoom(clampedZoom);
    
    targetPanRef.current = { ...point };
    currentPanRef.current = { ...point };
    
    setState(prev => ({
      ...prev,
      targetZoom: clampedZoom,
      pan: point,
    }));
  }, [cameraController, cfg.minZoom, cfg.maxZoom, cfg.zoomAnimationDuration, animateZoom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return {
    bind,
    state,
    setZoom,
    zoomIn,
    zoomOut,
    reset,
    focusOn,
  };
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export {
  clamp,
  lerp,
  easeOutCubic,
  screenToWorldDelta,
  worldToScreen,
};

// ============================================================================
// CONTROLLER ADAPTER
// ============================================================================

/**
 * Create a map gestures controller from a CameraController
 */
export function createMapGesturesController(
  cameraController: CameraController
): MapGesturesController {
  return {
    updateCamera: (state: MapGestureState) => {
      cameraController.setState({
        zoom: state.zoom,
        target: { x: state.pan.x, y: state.pan.y, z: 0 },
      });
    },
    getZoom: () => cameraController.getState().zoom,
    getPosition: () => ({
      x: cameraController.getState().target.x,
      y: cameraController.getState().target.y,
    }),
    setPosition: (position: Point2D) => {
      cameraController.setState({
        target: { x: position.x, y: position.y, z: 0 },
      });
    },
    zoomTo: (zoom: number, duration?: number) => 
      cameraController.zoomTo(zoom, { duration }),
    panTo: (position: Point2D, duration?: number) =>
      cameraController.panTo(position, { duration }),
    focusOn: (point: Point2D, zoom?: number, duration?: number) =>
      cameraController.focusOn(point, zoom, { duration }),
  };
}

export default useMapGestures;
