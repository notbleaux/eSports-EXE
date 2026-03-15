import React from 'react'
import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with Testing Library matchers
expect.extend(matchers)

// Mock framer-motion globally
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => {
      const { initial, animate, exit, whileHover, whileTap, transition, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
    button: ({ children, ...props }) => {
      const { initial, animate, exit, whileHover, whileTap, transition, ...rest } = props;
      return <button {...rest}>{children}</button>;
    },
    span: ({ children, ...props }) => {
      const { initial, animate, exit, whileHover, whileTap, transition, ...rest } = props;
      return <span {...rest}>{children}</span>;
    },
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Cleanup after each test
afterEach(() => {
  cleanup()
})
