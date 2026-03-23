/**
 * ML Inference Error Boundary
 * Catches and handles ML-related errors gracefully
 * 
 * [Ver001.000]
 */

import React, { Component, type ReactNode } from 'react'
import { mlLogger } from '@/utils/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * Error boundary specifically for ML inference components
 * Handles:
 * - Model loading failures
 * - Prediction errors
 * - WebWorker errors
 * - TensorFlow.js errors
 */
export class MLInferenceErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo })
    
    // Log with structured logger
    mlLogger.error('ML inference error caught', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorName: error.name,
    })
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }
      
      // Default error UI
      const errorMessage = this.getErrorMessage(this.state.error)
      
      return (
        <div className="p-6 rounded-lg bg-red-500/10 border border-red-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-300">ML Inference Error</h3>
              <p className="text-sm text-red-400/70">Something went wrong with the prediction</p>
            </div>
          </div>
          
          <div className="bg-black/30 rounded p-3 mb-4 font-mono text-sm text-red-300/80">
            {errorMessage}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 rounded transition-colors"
            >
              Reload Page
            </button>
          </div>
          
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details className="mt-4">
              <summary className="text-sm text-white/50 cursor-pointer">Stack Trace</summary>
              <pre className="mt-2 p-3 bg-black/50 rounded text-xs text-white/40 overflow-auto">
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }

  private getErrorMessage(error: Error | null): string {
    if (!error) return 'Unknown error occurred'
    
    // Handle specific ML error types
    if (error.name === 'MLValidationError') {
      return `Invalid input: ${error.message}`
    }
    if (error.name === 'MLTimeoutError') {
      return `Prediction timed out: ${error.message}`
    }
    if (error.name === 'MLCircuitBreakerError') {
      return `Service temporarily unavailable: ${error.message}. Please try again in 30 seconds.`
    }
    if (error.message.includes('tensorflow') || error.message.includes('tfjs')) {
      return `TensorFlow.js error: ${error.message}`
    }
    if (error.message.includes('worker')) {
      return `WebWorker error: ${error.message}`
    }
    
    return error.message
  }
}

export default MLInferenceErrorBoundary
