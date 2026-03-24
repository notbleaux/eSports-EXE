/** [Ver001.000] */
/**
 * Timeline Performance Utilities
 * ==============================
 * Performance-optimized utilities for smooth timeline scrubbing.
 * Target: <100ms response time for scrub interactions.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// ============================================================================
// Throttling & Debouncing
// ============================================================================

export interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  limit: number,
  options: ThrottleOptions = {}
): T {
  const { leading = true, trailing = false } = options;
  let inThrottle = false;
  let lastFunc: ReturnType<typeof setTimeout> | null = null;
  let lastRan: number | null = null;

  return ((...args: Parameters<T>) => {
    const now = Date.now();

    if (!lastRan && !leading) {
      lastRan = now;
    }

    if (lastRan && now - lastRan >= limit) {
      if (lastFunc) {
        clearTimeout(lastFunc);
        lastFunc = null;
      }
      func(...args);
      lastRan = now;
    } else if (!inThrottle) {
      inThrottle = true;
      
      if (trailing) {
        lastFunc = setTimeout(() => {
          func(...args);
          lastRan = Date.now();
          inThrottle = false;
        }, limit - (now - (lastRan || 0)));
      } else {
        setTimeout(() => {
          inThrottle = false;
        }, limit - (now - (lastRan || 0)));
      }
    }
  }) as T;
}

export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number,
  immediate = false
): T & { cancel: () => void } {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}

// ============================================================================
// RAF-based Animation Loop
// ============================================================================

export interface RAFLoopOptions {
  targetFPS?: number;
  onFrame: (deltaMs: number, elapsedMs: number) => void;
  onError?: (error: Error) => void;
}

export class RAFLoop {
  private rafId: number | null = null;
  private lastTime = 0;
  private elapsed = 0;
  private isRunning = false;
  private frameInterval: number;
  private frameCount = 0;
  private lastFpsTime = 0;
  private currentFps = 0;

  constructor(private options: RAFLoopOptions) {
    this.frameInterval = 1000 / (options.targetFPS || 60);
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.lastFpsTime = this.lastTime;
    this.tick();
  }

  stop(): void {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  pause(): void {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  resume(): void {
    if (!this.isRunning) {
      this.start();
    }
  }

  getFPS(): number {
    return this.currentFps;
  }

  private tick = (): void => {
    if (!this.isRunning) return;

    this.rafId = requestAnimationFrame(this.tick);

    const now = performance.now();
    const delta = now - this.lastTime;

    // FPS calculation
    this.frameCount++;
    if (now - this.lastFpsTime >= 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsTime = now;
    }

    // Throttle to target FPS
    if (delta >= this.frameInterval) {
      this.lastTime = now - (delta % this.frameInterval);
      this.elapsed += delta;

      try {
        this.options.onFrame(delta, this.elapsed);
      } catch (error) {
        this.options.onError?.(error as Error);
      }
    }
  };
}

// ============================================================================
// Smooth Scrubbing Hook
// ============================================================================

export interface UseSmoothScrubOptions {
  onScrub: (progress: number) => void;
  onScrubStart?: () => void;
  onScrubEnd?: () => void;
  throttleMs?: number;
  smoothingFactor?: number;
}

export function useSmoothScrub(options: UseSmoothScrubOptions) {
  const {
    onScrub,
    onScrubStart,
    onScrubEnd,
    throttleMs = 16, // ~60fps
    smoothingFactor = 0.3,
  } = options;

  const isDraggingRef = useRef(false);
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  // Smooth interpolation loop
  const smoothLoop = useCallback(() => {
    if (!isDraggingRef.current) return;

    // Linear interpolation for smoothness
    const diff = targetProgressRef.current - currentProgressRef.current;
    
    if (Math.abs(diff) > 0.0001) {
      currentProgressRef.current += diff * smoothingFactor;
      onScrub(currentProgressRef.current);
    }

    rafRef.current = requestAnimationFrame(smoothLoop);
  }, [onScrub, smoothingFactor]);

  const handleMouseDown = useCallback((e: React.MouseEvent | MouseEvent) => {
    isDraggingRef.current = true;
    onScrubStart?.();

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const progress = (e.clientX - rect.left) / rect.width;
    targetProgressRef.current = Math.max(0, Math.min(1, progress));
    currentProgressRef.current = targetProgressRef.current;
    onScrub(targetProgressRef.current);

    rafRef.current = requestAnimationFrame(smoothLoop);
  }, [onScrub, onScrubStart, smoothLoop]);

  const handleMouseMove = useCallback(throttle((e: MouseEvent) => {
    if (!isDraggingRef.current) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const progress = (e.clientX - rect.left) / rect.width;
    targetProgressRef.current = Math.max(0, Math.min(1, progress));
  }, throttleMs), [throttleMs]);

  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    
    isDraggingRef.current = false;
    onScrubEnd?.();

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, [onScrubEnd]);

  const handleTouchStart = useCallback((e: React.TouchEvent | TouchEvent) => {
    isDraggingRef.current = true;
    onScrubStart?.();

    const container = containerRef.current;
    if (!container) return;

    const touch = 'touches' in e ? e.touches[0] : e.changedTouches[0];
    const rect = container.getBoundingClientRect();
    const progress = (touch.clientX - rect.left) / rect.width;
    targetProgressRef.current = Math.max(0, Math.min(1, progress));
    currentProgressRef.current = targetProgressRef.current;
    onScrub(targetProgressRef.current);

    rafRef.current = requestAnimationFrame(smoothLoop);
  }, [onScrub, onScrubStart, smoothLoop]);

  const handleTouchMove = useCallback(throttle((e: TouchEvent) => {
    if (!isDraggingRef.current) return;

    const container = containerRef.current;
    if (!container) return;

    const touch = e.touches[0];
    const rect = container.getBoundingClientRect();
    const progress = (touch.clientX - rect.left) / rect.width;
    targetProgressRef.current = Math.max(0, Math.min(1, progress));
  }, throttleMs), [throttleMs]);

  const handleTouchEnd = useCallback(() => {
    handleMouseUp();
  }, [handleMouseUp]);

  // Global event listeners
  useEffect(() => {
    const handleMouseMoveGlobal = (e: MouseEvent) => handleMouseMove(e);
    const handleMouseUpGlobal = () => handleMouseUp();
    const handleTouchMoveGlobal = (e: TouchEvent) => handleTouchMove(e);
    const handleTouchEndGlobal = () => handleTouchEnd();

    window.addEventListener('mousemove', handleMouseMoveGlobal);
    window.addEventListener('mouseup', handleMouseUpGlobal);
    window.addEventListener('touchmove', handleTouchMoveGlobal, { passive: true });
    window.addEventListener('touchend', handleTouchEndGlobal);

    return () => {
      window.removeEventListener('mousemove', handleMouseMoveGlobal);
      window.removeEventListener('mouseup', handleMouseUpGlobal);
      window.removeEventListener('touchmove', handleTouchMoveGlobal);
      window.removeEventListener('touchend', handleTouchEndGlobal);

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return {
    containerRef,
    handlers: {
      onMouseDown: handleMouseDown,
      onTouchStart: handleTouchStart,
    },
    isDragging: () => isDraggingRef.current,
  };
}

// ============================================================================
// Performance Metrics
// ============================================================================

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  scrubLatency: number;
  memoryUsage?: number;
}

export function usePerformanceMetrics(): PerformanceMetrics {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    frameTime: 16.67,
    scrubLatency: 0,
  });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const frameTimesRef = useRef<number[]>([]);

  useEffect(() => {
    let rafId: number;

    const measure = () => {
      const now = performance.now();
      const delta = now - lastTimeRef.current;
      frameCountRef.current++;
      frameTimesRef.current.push(delta);

      // Keep last 60 frame times
      if (frameTimesRef.current.length > 60) {
        frameTimesRef.current.shift();
      }

      // Update metrics every 500ms
      if (frameCountRef.current % 30 === 0) {
        const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
        const fps = Math.round(1000 / avgFrameTime);
        
        setMetrics(prev => ({
          ...prev,
          fps,
          frameTime: avgFrameTime,
          memoryUsage: (performance as typeof performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize,
        }));
      }

      lastTimeRef.current = now;
      rafId = requestAnimationFrame(measure);
    };

    rafId = requestAnimationFrame(measure);

    return () => cancelAnimationFrame(rafId);
  }, []);

  const recordScrubLatency = useCallback((latencyMs: number) => {
    setMetrics(prev => ({
      ...prev,
      scrubLatency: latencyMs,
    }));
  }, []);

  return { ...metrics, recordScrubLatency };
}

// ============================================================================
// Virtual Time Hook
// ============================================================================

export interface UseVirtualTimeOptions {
  isPlaying: boolean;
  speed: number;
  onTick: (deltaMs: number) => void;
  targetFPS?: number;
}

export function useVirtualTime(options: UseVirtualTimeOptions) {
  const { isPlaying, speed, onTick, targetFPS = 60 } = options;
  const loopRef = useRef<RAFLoop | null>(null);
  const lastTickRef = useRef(0);

  useEffect(() => {
    if (!loopRef.current) {
      loopRef.current = new RAFLoop({
        targetFPS,
        onFrame: (deltaMs) => {
          if (isPlaying) {
            // Accumulate time for consistent playback at any FPS
            const adjustedDelta = deltaMs * speed;
            onTick(adjustedDelta);
          }
        },
      });
    }

    if (isPlaying) {
      loopRef.current.start();
    } else {
      loopRef.current.stop();
    }

    return () => {
      loopRef.current?.stop();
    };
  }, [isPlaying, speed, onTick, targetFPS]);

  const getCurrentFPS = useCallback(() => {
    return loopRef.current?.getFPS() || 0;
  }, []);

  return { getCurrentFPS };
}

// ============================================================================
// Visibility-based Pause
// ============================================================================

export function useVisibilityPause(onVisibilityChange?: (isVisible: boolean) => void) {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsVisible(visible);
      onVisibilityChange?.(visible);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [onVisibilityChange]);

  return isVisible;
}

// ============================================================================
// Prefetch/Buffer Management
// ============================================================================

export class FrameBuffer<T> {
  private buffer = new Map<number, T>();
  private maxSize: number;

  constructor(maxSize = 300) {
    // Default: 15 seconds at 20 TPS
    this.maxSize = maxSize;
  }

  get(tick: number): T | undefined {
    return this.buffer.get(tick);
  }

  set(tick: number, frame: T): void {
    if (this.buffer.size >= this.maxSize) {
      // Remove oldest entries
      const oldestKey = this.buffer.keys().next().value;
      if (oldestKey !== undefined) {
        this.buffer.delete(oldestKey);
      }
    }
    this.buffer.set(tick, frame);
  }

  has(tick: number): boolean {
    return this.buffer.has(tick);
  }

  clear(): void {
    this.buffer.clear();
  }

  prefetchRange(startTick: number, endTick: number, fetcher: (tick: number) => Promise<T>): void {
    for (let tick = startTick; tick <= endTick; tick++) {
      if (!this.has(tick)) {
        fetcher(tick).then(frame => this.set(tick, frame));
      }
    }
  }

  get size(): number {
    return this.buffer.size;
  }
}

// ============================================================================
// Export
// ============================================================================

export default {
  throttle,
  debounce,
  RAFLoop,
  useSmoothScrub,
  usePerformanceMetrics,
  useVirtualTime,
  useVisibilityPause,
  FrameBuffer,
};
