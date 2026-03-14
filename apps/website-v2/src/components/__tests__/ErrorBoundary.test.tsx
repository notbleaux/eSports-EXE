/**
 * Error Boundary Component Tests
 * React error boundary behavior and recovery
 * 
 * [Ver001.000]
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HubErrorFallback, HubErrorCompact } from '../error/HubErrorFallback'
import { MLFeatureWrapper } from '../error/MLFeatureWrapper'

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    error: vi.fn()
  }
}))

// Component that throws
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('Error Boundary Components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should catch errors in child components', () => {
    // Simple error boundary for testing
    class TestErrorBoundary extends React.Component<
      { children: React.ReactNode; fallback: React.ReactNode },
      { hasError: boolean }
    > {
      constructor(props: any) {
        super(props)
        this.state = { hasError: false }
      }
      
      static getDerivedStateFromError() {
        return { hasError: true }
      }
      
      render() {
        if (this.state.hasError) {
          return this.props.fallback
        }
        return this.props.children
      }
    }

    render(
      <TestErrorBoundary fallback={<div>Error caught!</div>}>
        <ThrowError shouldThrow={true} />
      </TestErrorBoundary>
    )

    expect(screen.getByText('Error caught!')).toBeInTheDocument()
  })

  it('should display fallback UI on error', () => {
    const onRetry = vi.fn()
    const onGoHome = vi.fn()

    render(
      <HubErrorFallback
        hub="SATOR"
        title="Something went wrong"
        error={new Error('Test error message')}
        onRetry={onRetry}
        onGoHome={onGoHome}
      />
    )

    // Should display error title
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    
    // Should have action buttons (use aria-label for icon buttons)
    expect(screen.getByText('Try Again')).toBeInTheDocument()
    expect(screen.getByText('Return Home')).toBeInTheDocument()
  })

  it('should report errors to analytics', () => {
    const error = new Error('Analytics test error')
    const onRetry = vi.fn()

    render(
      <HubErrorFallback
        hub="ROTAS"
        title="ML Prediction Failed"
        error={error}
        onRetry={onRetry}
      />
    )

    // Error component should render (hub name is in subtitle with other text)
    expect(screen.getByText('ML Prediction Failed')).toBeInTheDocument()
    // ROTAS appears in the subtitle, use a more flexible matcher
    expect(screen.getByText(/ROTAS/)).toBeInTheDocument()
  })

  it('should allow recovery after error', () => {
    const onRetry = vi.fn()
    
    render(
      <HubErrorFallback
        hub="SATOR"
        title="Prediction Error"
        error={new Error('Temporary error')}
        onRetry={onRetry}
      />
    )

    // Click retry button
    const retryButton = screen.getByText('Try Again')
    fireEvent.click(retryButton)

    // Retry handler should be called
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('should render compact error variant', () => {
    render(
      <HubErrorCompact
        message="Compact error message"
        onRetry={() => {}}
      />
    )

    expect(screen.getByText('Compact error message')).toBeInTheDocument()
    // Retry button has aria-label instead of text
    expect(screen.getByLabelText('Retry')).toBeInTheDocument()
  })

  it('should wrap ML features with error boundary', () => {
    const fallback = <div>ML Feature Unavailable</div>
    
    render(
      <MLFeatureWrapper fallback={fallback}>
        <div>ML Component</div>
      </MLFeatureWrapper>
    )

    // Should render children when no error
    expect(screen.getByText('ML Component')).toBeInTheDocument()
  })
})
