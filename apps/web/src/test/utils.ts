/**
 * Test Utilities
 * 
 * [Ver001.000] - Mock utilities for testing
 */

/**
 * Mock matchMedia for testing responsive behavior
 */
export function mockMatchMedia(prefersReducedMotion: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: prefersReducedMotion,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

/**
 * Mock IntersectionObserver for testing scroll animations
 */
export function mockIntersectionObserver(): void {
  const mockIntersectionObserver = vi.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  });
  window.IntersectionObserver = mockIntersectionObserver;
}

/**
 * Mock ResizeObserver for testing resize behavior
 */
export function mockResizeObserver(): void {
  const mockResizeObserver = vi.fn();
  mockResizeObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  });
  window.ResizeObserver = mockResizeObserver;
}

/**
 * Mock requestAnimationFrame for testing animations
 */
export function mockRequestAnimationFrame(): void {
  let rafId = 0;
  const callbacks = new Map<number, FrameRequestCallback>();

  global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback): number => {
    rafId++;
    callbacks.set(rafId, callback);
    return rafId;
  });

  global.cancelAnimationFrame = vi.fn((id: number): void => {
    callbacks.delete(id);
  });

  // Helper to flush all pending animations
  (global as typeof globalThis & { flushAnimations: () => void }).flushAnimations = () => {
    callbacks.forEach((callback, id) => {
      callback(performance.now());
      callbacks.delete(id);
    });
  };
}

// Import vi from vitest
import { vi } from 'vitest';
