/**
 * HubErrorBoundary Component Tests - P0 Test Coverage
 * 
 * Tests for hub-level error handling
 * 
 * [Ver001.000]
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { HubErrorBoundary, withHubErrorBoundary } from '../error/HubErrorBoundary'

// Component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No Error</div>
}

describe('HubErrorBoundary', () => {
  // Suppress console.error for expected errors
  const originalConsoleError = console.error
  
  beforeEach(() => {
    console.error = vi.fn()
  })

  afterEach(() => {
    console.error = originalConsoleError
    vi.restoreAllMocks()
  })

  it('should render children when no error', () => {
    render(
      <HubErrorBoundary hubName="sator">
        <div>Child Content</div>
      </HubErrorBoundary>
    )
    
    expect(screen.getByText('Child Content')).toBeInTheDocument()
  })

  it('should show error UI when child throws', () => {
    render(
      <HubErrorBoundary hubName="sator">
        <ThrowError shouldThrow={true} />
      </HubErrorBoundary>
    )
    
    expect(screen.getByText(/SATOR Hub Error/i)).toBeInTheDocument()
    expect(screen.getByText(/Test error/i)).toBeInTheDocument()
  })

  it('should show hub-specific branding for each hub', () => {
    const hubs = ['sator', 'rotas', 'arepo', 'opera', 'tenet'] as const
    
    hubs.forEach((hub) => {
      const { unmount } = render(
        <HubErrorBoundary hubName={hub}>
          <ThrowError shouldThrow={true} />
        </HubErrorBoundary>
      )
      
      expect(screen.getByText(new RegExp(`${hub.toUpperCase()} Hub`, 'i'))).toBeInTheDocument()
      unmount()
    })
  })

  it('should call onError callback when error occurs', () => {
    const handleError = vi.fn()
    
    render(
      <HubErrorBoundary hubName="sator" onError={handleError}>
        <ThrowError shouldThrow={true} />
      </HubErrorBoundary>
    )
    
    expect(handleError).toHaveBeenCalled()
    expect(handleError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) }),
      'sator'
    )
  })

  it('should retry when retry button is clicked', () => {
    const handleRecover = vi.fn()
    
    render(
      <HubErrorBoundary hubName="sator" onRecover={handleRecover}>
        <ThrowError shouldThrow={true} />
      </HubErrorBoundary>
    )
    
    const retryButton = screen.getByText(/Retry/i)
    fireEvent.click(retryButton)
    
    expect(handleRecover).toHaveBeenCalled()
  })

  it('should navigate home when home button is clicked', () => {
    const originalHref = window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: '/sator' },
      writable: true,
    })
    
    render(
      <HubErrorBoundary hubName="sator">
        <ThrowError shouldThrow={true} />
      </HubErrorBoundary>
    )
    
    const homeButton = screen.getByText(/Go Home/i)
    fireEvent.click(homeButton)
    
    expect(window.location.href).toBe('/')
    
    // Restore
    Object.defineProperty(window, 'location', {
      value: { href: originalHref },
      writable: true,
    })
  })

  it('should show recovery actions specific to hub', () => {
    render(
      <HubErrorBoundary hubName="sator">
        <ThrowError shouldThrow={true} />
      </HubErrorBoundary>
    )
    
    expect(screen.getByText(/Recovery Actions/i)).toBeInTheDocument()
    // SATOR-specific actions
    expect(screen.getByText(/Reset orbital rings/i)).toBeInTheDocument()
  })

  it('should show navigation to other hubs', () => {
    render(
      <HubErrorBoundary hubName="sator">
        <ThrowError shouldThrow={true} />
      </HubErrorBoundary>
    )
    
    expect(screen.getByText(/navigate to another hub/i)).toBeInTheDocument()
    // Other hub buttons
    expect(screen.getByText('ROTAS')).toBeInTheDocument()
    expect(screen.getByText('AREPO')).toBeInTheDocument()
    expect(screen.getByText('OPERA')).toBeInTheDocument()
    expect(screen.getByText('TENET')).toBeInTheDocument()
  })

  it('should not show current hub in navigation', () => {
    render(
      <HubErrorBoundary hubName="sator">
        <ThrowError shouldThrow={true} />
      </HubErrorBoundary>
    )
    
    // SATOR should not appear in navigation
    const hubButtons = screen.getAllByRole('button')
    const satorNavButton = hubButtons.find(
      (btn) => btn.textContent === 'SATOR'
    )
    expect(satorNavButton).toBeUndefined()
  })

  it('should use custom fallback when provided', () => {
    render(
      <HubErrorBoundary 
        hubName="sator" 
        fallback={<div>Custom Fallback</div>}
      >
        <ThrowError shouldThrow={true} />
      </HubErrorBoundary>
    )
    
    expect(screen.getByText('Custom Fallback')).toBeInTheDocument()
  })

  it('should show retry count after multiple attempts', () => {
    const { rerender } = render(
      <HubErrorBoundary hubName="sator">
        <ThrowError shouldThrow={true} />
      </HubErrorBoundary>
    )
    
    // Click retry multiple times
    const retryButton = screen.getByText(/Retry/i)
    fireEvent.click(retryButton)
    
    rerender(
      <HubErrorBoundary hubName="sator">
        <ThrowError shouldThrow={true} />
      </HubErrorBoundary>
    )
  })

  it('should show technical details in development', () => {
    const originalNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    
    render(
      <HubErrorBoundary hubName="sator">
        <ThrowError shouldThrow={true} />
      </HubErrorBoundary>
    )
    
    const details = screen.getByText(/Technical Details/i)
    expect(details).toBeInTheDocument()
    
    // Restore
    process.env.NODE_ENV = originalNodeEnv
  })

  it('should save state before error', () => {
    let saveState: (state: unknown) => void
    
    const TestComponent = () => {
      return (
        <HubErrorBoundary 
          hubName="sator"
          ref={(ref) => {
            if (ref) saveState = ref.saveState
          }}
        >
          <div>Test</div>
        </HubErrorBoundary>
      )
    }
    
    render(<TestComponent />)
    
    // saveState should be available
    expect(saveState!).toBeDefined()
  })
})

describe('withHubErrorBoundary HOC', () => {
  beforeEach(() => {
    console.error = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should wrap component with error boundary', () => {
    const TestComponent = () => <div>Test Component</div>
    const WrappedComponent = withHubErrorBoundary(TestComponent, 'rotas')
    
    render(<WrappedComponent />)
    
    expect(screen.getByText('Test Component')).toBeInTheDocument()
  })

  it('should pass props to wrapped component', () => {
    interface TestProps {
      message: string
    }
    
    const TestComponent = ({ message }: TestProps) => <div>{message}</div>
    const WrappedComponent = withHubErrorBoundary(TestComponent, 'rotas')
    
    render(<WrappedComponent message="Hello World" />)
    
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('should show error UI when wrapped component throws', () => {
    const TestComponent = () => {
      throw new Error('Wrapped error')
    }
    const WrappedComponent = withHubErrorBoundary(TestComponent, 'arepo')
    
    render(<WrappedComponent />)
    
    expect(screen.getByText(/AREPO Hub Error/i)).toBeInTheDocument()
  })

  it('should pass options to error boundary', () => {
    const handleError = vi.fn()
    const TestComponent = () => <div>With Options</div>
    
    const WrappedComponent = withHubErrorBoundary(TestComponent, 'opera', {
      onError: handleError,
      componentName: 'TestComponent',
    })
    
    render(<WrappedComponent />)
    expect(screen.getByText('With Options')).toBeInTheDocument()
  })
})
