/**
 * AppErrorBoundary - Top-Level Application Error Boundary
 * Cches errors that bubble up to the application level
 * Prevents entire app crashes and provides graceful recovery
 * 
 * [Ver001.000]
 */

import React, { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Activity } from 'lucide-react'
import { createLogger } from '@/utils/logger'

const logger = createLogger('AppErrorBoundary')

interface Props {
  children: ReactNode
  /** Fallback UI when error occurs */
  fallback?: ReactNode
  /** Error reporting callback */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  retryCount: number
}

/**
 * AppErrorBoundary - Top-level error boundary for the entire application
 * 
 * This boundary catches any errors that weren't caught by nested boundaries.
 * It displays a full-screen error page with recovery options.
 */
export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo })
    
    // Log with structured logger
    logger.error('Application error caught', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorName: error.name,
    })
    
    // Report to external service if configured
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = (): void => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }))
  }

  handleReload = (): void => {
    window.location.reload()
  }

  handleGoHome = (): void => {
    window.location.href = '/'
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { error, errorInfo, retryCount } = this.state
      const isDev = process.env.NODE_ENV === 'development'

      return (
        <div 
          className="min-h-screen flex items-center justify-center p-4 bg-[#050508]"
          role="alert"
          aria-live="assertive"
        >
          {/* Background Effects */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div 
              className="absolute w-[800px] h-[800px] rounded-full opacity-20 blur-3xl"
              style={{
                background: 'radial-gradient(circle, #ef4444 0%, transparent 70%)',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            />
          </div>

          {/* Error Card */}
          <div className="relative z-10 w-full max-w-2xl">
            {/* Brand Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 mb-4">
                <Activity className="w-4 h-4 text-red-400" />
                <span className="text-sm font-mono text-red-400">4NJZ4 TENET Platform</span>
              </div>
            </div>

            {/* Main Error Content */}
            <div 
              className="rounded-2xl border p-8 backdrop-blur-sm"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                boxShadow: '0 0 60px rgba(239, 68, 68, 0.2)'
              }}
            >
              {/* Icon */}
              <div className="text-center mb-6">
                <div 
                  className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ 
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    boxShadow: '0 0 40px rgba(239, 68, 68, 0.4)'
                  }}
                >
                  <AlertTriangle className="w-12 h-12 text-red-400" />
                </div>
                
                <h1 className="text-3xl font-bold text-white mb-2">
                  Application Error
                </h1>
                <p className="text-white/60">
                  Something went wrong with the 4NJZ4 platform
                </p>
              </div>

              {/* Error Message */}
              <div className="bg-black/40 rounded-xl p-4 mb-6 border border-red-500/20">
                <p className="text-red-300 text-center font-medium">
                  {error?.message || 'An unexpected error occurred'}
                </p>
                {retryCount > 0 && (
                  <p className="text-white/40 text-xs text-center mt-2">
                    Retry attempt: {retryCount}
                  </p>
                )}
              </div>

              {/* Recovery Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <button
                  onClick={this.handleRetry}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all hover:scale-105 active:scale-95 bg-red-500/20 text-red-300 hover:bg-red-500/30"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
                
                <button
                  onClick={this.handleReload}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all hover:scale-105 active:scale-95 bg-white/10 text-white hover:bg-white/20"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all hover:scale-105 active:scale-95 border border-white/20 text-white/80 hover:bg-white/10"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>
              </div>

              {/* Hub Navigation - Quick Recovery */}
              <div className="border-t border-white/10 pt-6">
                <p className="text-xs text-white/40 text-center mb-4">
                  Or navigate to a specific hub:
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    { name: 'SATOR', color: '#ffd700', path: '/sator' },
                    { name: 'ROTAS', color: '#00d4ff', path: '/rotas' },
                    { name: 'AREPO', color: '#0066ff', path: '/arepo' },
                    { name: 'OPERA', color: '#9d4edd', path: '/opera' },
                    { name: 'TENET', color: '#ffffff', path: '/tenet' }
                  ].map(hub => (
                    <a
                      key={hub.name}
                      href={hub.path}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                      style={{ 
                        backgroundColor: `${hub.color}15`,
                        color: hub.color,
                        border: `1px solid ${hub.color}30`
                      }}
                    >
                      {hub.name}
                    </a>
                  ))}
                </div>
              </div>

              {/* Technical Details (Development) */}
              {isDev && errorInfo && (
                <details className="mt-6">
                  <summary className="text-xs text-red-400/60 cursor-pointer select-none text-center hover:text-red-400">
                    Technical Details (Development Only)
                  </summary>
                  <div className="mt-3 space-y-3">
                    <div className="p-3 rounded-lg bg-black/50 overflow-auto">
                      <p className="text-xs text-red-300 mb-2 font-semibold">Error Stack:</p>
                      <pre className="text-xs text-white/40 whitespace-pre-wrap">
                        {error?.stack}
                      </pre>
                    </div>
                    <div className="p-3 rounded-lg bg-black/50 overflow-auto">
                      <p className="text-xs text-red-300 mb-2 font-semibold">Component Stack:</p>
                      <pre className="text-xs text-white/40 whitespace-pre-wrap">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  </div>
                </details>
              )}

              {/* Graceful Degradation Notice */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <p className="text-xs text-white/30 text-center">
                  Error ID: {Math.random().toString(36).substring(2, 15).toUpperCase()}
                </p>
              </div>
            </div>

            {/* Footer */}
            <p className="text-center text-white/30 text-sm mt-6">
              Libre-X-eSport 4NJZ4 TENET Platform
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * HOC to wrap components with AppErrorBoundary
 */
export function withAppErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
): React.FC<P> {
  return function WithAppErrorBoundary(props: P) {
    return (
      <AppErrorBoundary fallback={fallback}>
        <Component {...props} />
      </AppErrorBoundary>
    )
  }
}

export default AppErrorBoundary
