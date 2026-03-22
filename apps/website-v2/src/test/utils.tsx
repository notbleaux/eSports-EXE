/**
 * Test Utilities - Helper functions for component testing
 * 
 * [Ver001.000]
 */

import React, { ReactElement } from 'react'
import { render as rtlRender, RenderOptions } from '@testing-library/react'
import { vi } from 'vitest'

// ============================================================================
// Custom Render with Providers
// ============================================================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Add any provider-specific options here
  withRouter?: boolean
  withQuery?: boolean
}

/**
 * Custom render function that wraps components with necessary providers
 */
export function render(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { withRouter = false, withQuery = false, ...renderOptions } = options

  function Wrapper({ children }: { children: React.ReactNode }) {
    return <>{children}</>
  }

  return {
    ...rtlRender(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}

// Re-export everything from testing-library
export * from '@testing-library/react'

// ============================================================================
// Animation Testing Utilities
// ============================================================================

/**
 * Mock requestAnimationFrame for animation tests
 */
export function mockRequestAnimationFrame() {
  let id = 0
  const callbacks = new Map<number, FrameRequestCallback>()

  const raf = vi.fn((callback: FrameRequestCallback) => {
    const currentId = ++id
    callbacks.set(currentId, callback)
    return currentId
  })

  const caf = vi.fn((id: number) => {
    callbacks.delete(id)
  })

  const flush = () => {
    callbacks.forEach((callback, id) => {
      callback(Date.now())
      callbacks.delete(id)
    })
  }

  global.requestAnimationFrame = raf as unknown as typeof requestAnimationFrame
  global.cancelAnimationFrame = caf as unknown as typeof cancelAnimationFrame

  return { raf, caf, flush, callbacks }
}

/**
 * Mock IntersectionObserver for scroll reveal tests
 */
export function mockIntersectionObserver() {
  const observers: Array<{
    callback: IntersectionObserverCallback
    elements: Element[]
  }> = []

  class MockIntersectionObserver implements IntersectionObserver {
    root: Element | null = null
    rootMargin: string = '0px'
    thresholds: ReadonlyArray<number> = [0]
    callback: IntersectionObserverCallback
    elements: Element[] = []

    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback
      observers.push({ callback, elements: this.elements })
    }

    observe(element: Element) {
      this.elements.push(element)
    }

    unobserve(element: Element) {
      this.elements = this.elements.filter((el) => el !== element)
    }

    disconnect() {
      this.elements = []
    }

    takeRecords(): IntersectionObserverEntry[] {
      return []
    }
  }

  global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver

  return {
    observers,
    triggerIntersect: (isIntersecting: boolean, element?: Element) => {
      observers.forEach(({ callback, elements }) => {
        const targetElements = element ? [element] : elements
        const entries = targetElements.map((target) => ({
          isIntersecting,
          target,
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRatio: isIntersecting ? 1 : 0,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: Date.now(),
        }))
        callback(entries as IntersectionObserverEntry[], new MockIntersectionObserver(callback))
      })
    },
  }
}

/**
 * Mock matchMedia for reduced motion tests
 */
export function mockMatchMedia(matches: boolean = false) {
  const listeners: Array<(e: MediaQueryListEvent) => void> = []

  const mql = {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addListener: vi.fn((listener: (e: MediaQueryListEvent) => void) => {
      listeners.push(listener)
    }),
    removeListener: vi.fn((listener: (e: MediaQueryListEvent) => void) => {
      const index = listeners.indexOf(listener)
      if (index > -1) listeners.splice(index, 1)
    }),
    addEventListener: vi.fn((event: string, listener: EventListener) => {
      if (event === 'change') listeners.push(listener as (e: MediaQueryListEvent) => void)
    }),
    removeEventListener: vi.fn((event: string, listener: EventListener) => {
      const index = listeners.indexOf(listener as (e: MediaQueryListEvent) => void)
      if (index > -1) listeners.splice(index, 1)
    }),
    dispatchEvent: vi.fn(),
  }

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(() => mql),
  })

  return {
    mql,
    listeners,
    setMatches: (newMatches: boolean) => {
      mql.matches = newMatches
      listeners.forEach((listener) =>
        listener({ matches: newMatches } as MediaQueryListEvent)
      )
    },
  }
}

// ============================================================================
// ResizeObserver Mock
// ============================================================================

/**
 * Mock ResizeObserver for fluid resize tests
 */
export function mockResizeObserver() {
  const observers: Array<{
    callback: ResizeObserverCallback
    elements: Element[]
  }> = []

  class MockResizeObserver implements ResizeObserver {
    callback: ResizeObserverCallback
    elements: Element[] = []

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback
      observers.push({ callback, elements: this.elements })
    }

    observe(element: Element) {
      this.elements.push(element)
    }

    unobserve(element: Element) {
      this.elements = this.elements.filter((el) => el !== element)
    }

    disconnect() {
      this.elements = []
    }
  }

  global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver

  return {
    observers,
    triggerResize: (contentRect: DOMRectReadOnly, element?: Element) => {
      observers.forEach(({ callback, elements }) => {
        const targetElements = element ? [element] : elements
        const entries = targetElements.map((target) => ({
          target,
          contentRect,
          borderBoxSize: [],
          contentBoxSize: [],
          devicePixelContentBoxSize: [],
        }))
        callback(entries as ResizeObserverEntry[], new MockResizeObserver(callback))
      })
    },
  }
}

// ============================================================================
// Store Testing Utilities
// ============================================================================

/**
 * Reset a Zustand store to its initial state
 */
export function resetStore<T extends { getState: () => { clearCache?: () => void; clearHistory?: () => void }; setState: (state: Partial<T>) => void }>(
  store: T,
  initialState?: Partial<T>
) {
  const state = store.getState()
  
  // Try to use built-in clear methods first
  if ('clearCache' in state && typeof state.clearCache === 'function') {
    state.clearCache()
  }
  if ('clearHistory' in state && typeof state.clearHistory === 'function') {
    state.clearHistory()
  }
  
  // Then apply any additional initial state
  if (initialState) {
    store.setState(initialState)
  }
}

// ============================================================================
// Async Testing Utilities
// ============================================================================

/**
 * Wait for a specified amount of time
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Wait for the next tick in the event loop
 */
export function nextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * Wait for all promises to resolve
 */
export function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}
