/* Test setup for Vitest + React Testing Library */
/* Fixes TypeScript errors for DOM matchers */

import '@testing-library/jest-dom'

/* Global mocks */
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

/* Mock IntersectionObserver for virtualized lists */
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

/* Silence React warnings in tests */
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (/Warning:/.test(args[0])) return
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
