/** [Ver002.000] */
import '@testing-library/jest-dom'
import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { server } from '@/mocks/server'

// Extend Vitest's expect with Testing Library matchers
expect.extend(matchers)

// MSW Server Lifecycle
beforeAll(() => {
  // Start MSW server with error handling for unhandled requests
  server.listen({ 
    onUnhandledRequest: 'warn' // Warn instead of error for flexibility
  })
})

afterEach(() => {
  // Cleanup React Testing Library
  cleanup()
  // Reset MSW handlers to initial state
  server.resetHandlers()
  // Clear all mocks
  vi.clearAllMocks()
})

afterAll(() => {
  // Close MSW server
  server.close()
})

// Mock window.matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock requestAnimationFrame for animation tests
global.requestAnimationFrame = vi.fn((callback) => setTimeout(callback, 16))
global.cancelAnimationFrame = vi.fn((id) => clearTimeout(id))

// Mock performance.now for consistent timing
global.performance = {
  ...global.performance,
  now: vi.fn(() => Date.now()),
}
