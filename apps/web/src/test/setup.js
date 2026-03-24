/** [Ver003.000] */
import '@testing-library/jest-dom'
import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest'
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
  // Clear localStorage
  localStorage.clear()
  // Clear sessionStorage
  sessionStorage.clear()
})

afterAll(() => {
  // Close MSW server
  server.close()
})

// ============================================================================
// Window API Mocks
// ============================================================================

// Mock window.matchMedia for responsive components and reduced motion
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
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
  takeRecords: vi.fn(),
  callback,
}))

// Mock requestAnimationFrame for animation tests
global.requestAnimationFrame = vi.fn((callback) => setTimeout(callback, 16))
global.cancelAnimationFrame = vi.fn((id) => clearTimeout(id))

// Mock performance.now for consistent timing
global.performance = {
  ...global.performance,
  now: vi.fn(() => Date.now()),
}

// ============================================================================
// Storage Mocks
// ============================================================================

// localStorage mock
const localStorageMock = {
  getItem: vi.fn((key) => localStorageMock._store[key] || null),
  setItem: vi.fn((key, value) => {
    localStorageMock._store[key] = String(value)
  }),
  removeItem: vi.fn((key) => {
    delete localStorageMock._store[key]
  }),
  clear: vi.fn(() => {
    localStorageMock._store = {}
  }),
  _store: {},
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// sessionStorage mock
const sessionStorageMock = {
  getItem: vi.fn((key) => sessionStorageMock._store[key] || null),
  setItem: vi.fn((key, value) => {
    sessionStorageMock._store[key] = String(value)
  }),
  removeItem: vi.fn((key) => {
    delete sessionStorageMock._store[key]
  }),
  clear: vi.fn(() => {
    sessionStorageMock._store = {}
  }),
  _store: {},
}

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})

// ============================================================================
// Console Mocks (suppress expected warnings)
// ============================================================================

// Suppress specific console warnings during tests
const originalWarn = console.warn
console.warn = (...args) => {
  // Filter out specific warnings
  const warning = args[0]?.toString() || ''
  if (
    warning.includes('React Router') ||
    warning.includes('act') ||
    warning.includes('strict mode')
  ) {
    return
  }
  originalWarn(...args)
}

// ============================================================================
// Import cleanup from testing-library
// ============================================================================

import { cleanup } from '@testing-library/react'

// ============================================================================
// Test Environment Globals
// ============================================================================

// Set test environment flag
global.IS_REACT_ACT_ENVIRONMENT = true

// Mock import.meta.env for Vite
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: {
        VITE_API_URL: 'http://localhost:8000',
        VITE_WS_URL: 'ws://localhost:8000',
        VITE_LOG_LEVEL: 'error',
        MODE: 'test',
        DEV: true,
        PROD: false,
      },
    },
  },
  writable: true,
})

// Mock Vite's import.meta.env
global.import = {
  meta: {
    env: {
      VITE_API_URL: 'http://localhost:8000',
      VITE_WS_URL: 'ws://localhost:8000',
      VITE_LOG_LEVEL: 'error',
      MODE: 'test',
      DEV: true,
      PROD: false,
    },
  },
}

// ============================================================================
// Web Workers Mock
// ============================================================================

class MockWorker {
  constructor(stringUrl) {
    this.url = stringUrl
    this.onmessage = null
    this.onerror = null
  }

  postMessage(msg) {
    if (this.onmessage) {
      this.onmessage({ data: msg })
    }
  }

  terminate() {}
}

global.Worker = MockWorker

// ============================================================================
// WebSocket Mock
// ============================================================================

class MockWebSocket {
  constructor(url) {
    this.url = url
    this.readyState = 0 // CONNECTING
    this.CONNECTING = 0
    this.OPEN = 1
    this.CLOSING = 2
    this.CLOSED = 3
    
    setTimeout(() => {
      this.readyState = 1
      if (this.onopen) this.onopen()
    }, 0)
  }

  send(data) {}
  close() {
    this.readyState = 3
    if (this.onclose) this.onclose()
  }
}

global.WebSocket = MockWebSocket

// ============================================================================
// gtag Mock (Google Analytics)
// ============================================================================

global.gtag = vi.fn()

// ============================================================================
// Fetch Mock (fallback)
// ============================================================================

global.fetch = vi.fn()
