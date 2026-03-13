import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// Simple test component
const TestComponent = () => <div data-testid="test">Hello Vitest</div>

describe('Vitest Setup', () => {
  it('should run tests successfully', () => {
    expect(true).toBe(true)
  })

  it('should render React components', () => {
    render(<TestComponent />)
    expect(screen.getByTestId('test')).toHaveTextContent('Hello Vitest')
  })
})
