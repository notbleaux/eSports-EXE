/**
 * DataErrorBoundary - API and Data Fetching Error Handler
 * Handles HTTP errors, network failures, and data parsing errors
 * 
 * [Ver001.000]
 */

import React, { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, WifiOff, ServerCrash, FileJson } from 'lucide-react'
import { logger } from '../../utils/logger'
import { HubErrorFallback, HubErrorCompact } from './HubErrorFallback'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  onRetry?: () => void
  hubName?: 'SATOR' | 'ROTAS' | 'AREPO' | 'OPERA' | 'TENET'
  componentName?: string
  compact?: boolean
  /** Max retry attempts before giving up */
  maxRetries?: number
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  retryCount: number
  isRetrying: boolean
  errorType: 'network' | 'http' | 'timeout' | 'parse' | 'unknown'
}

/**
 * DataErrorBoundary - Handles data fetching and API errors
 * 
 * This boundary catches errors related to:
 * - HTTP requests (4xx, 5xx status codes)
 * - Network failures (offline, DNS errors)
 * - Request timeouts
 * - JSON/data parsing errors
 */
export class DataErrorBoundary extends Component<Props, State> {
  private retryTimeout: NodeJS.Timeout | null = null

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
      errorType: 'unknown'
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorType: DataErrorBoundary.categorizeError(error)
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo })
    
    const errorCategory = DataErrorBoundary.categorizeError(error)
    
    // Log error with context
    logger.error('[DataErrorBoundary] Data error caught:', {
      message: error.message,
      category: errorCategory,
      component: this.props.componentName,
      hub: this.props.hubName,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount
    })
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo)
    
    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.reportToAnalytics(error, errorInfo, errorCategory)
    }
  }

  componentWillUnmount(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
    }
  }

  /**
   * Categorize error type based on error message and properties
   */
  private static categorizeError(error: Error): State['errorType'] {
    const message = error.message.toLowerCase()
    
    // Network errors
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('internet') ||
      message.includes('offline') ||
      message.includes('failed to fetch') ||
      message.includes('networkerror')
    ) {
      return 'network'
    }
    
    // HTTP errors
    if (
      message.includes('http') ||
      message.includes('status') ||
      /\b4\d{2}\b/.test(message) ||
      /\b5\d{2}\b/.test(message)
    ) {
      return 'http'
    }
    
    // Timeout errors
    if (
      message.includes('timeout') ||
      message.includes('timed out') ||
      message.includes('etimedout')
    ) {
      return 'timeout'
    }
    
    // Parse errors
    if (
      message.includes('parse') ||
      message.includes('json') ||
      message.includes('syntax') ||
      message.includes('unexpected token')
    ) {
      return 'parse'
    }
    
    return 'unknown'
  }

  /**
   * Report error to analytics service
   */
  private reportToAnalytics(error: Error, _errorInfo: React.ErrorInfo, category: string): void {
    try {
      // Analytics integration point
      const eventData = {
        type: 'data_error',
        category,
        message: error.message,
        hub: this.props.hubName,
        component: this.props.componentName,
        url: window.location.href,
        timestamp: new Date().toISOString()
      }
      
      // Send to analytics
      if (window.gtag) {
        window.gtag('event', 'data_error', eventData)
      }
      
      // Could also send to Sentry, LogRocket, etc.
      console.info('[DataErrorBoundary] Error reported to analytics:', eventData)
    } catch (e) {
      logger.error('[DataErrorBoundary] Failed to report to analytics:', e)
    }
  }

  /**
   * Handle retry with exponential backoff
   */
  handleRetry = (): void => {
    const { maxRetries = 3 } = this.props
    
    if (this.state.retryCount >= maxRetries) {
      logger.warn('[DataErrorBoundary] Max retries exceeded')
      return
    }
    
    this.setState({ isRetrying: true })
    
    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.pow(2, this.state.retryCount) * 1000
    
    this.retryTimeout = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
        isRetrying: false
      }))
      
      this.props.onRetry?.()
      
      logger.info('[DataErrorBoundary] Retry attempt', {
        attempt: this.state.retryCount + 1,
        maxRetries
      })
    }, delay)
  }

  /**
   * Reset error boundary state
   */
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false
    })
  }

  /**
   * Get error display configuration based on error type
   */
  private getErrorConfig(): {
    title: string
    message: string
    icon: React.ReactNode
    suggestion?: string
  } {
    const { errorType, error, retryCount } = this.state
    const { maxRetries = 3 } = this.props
    
    const configs = {
      network: {
        title: 'Network Error',
        message: 'Unable to connect to the server. Please check your internet connection.',
        icon: <WifiOff className="w-6 h-6" />,
        suggestion: 'Check your internet connection and try again.'
      },
      http: {
        title: 'Server Error',
        message: error?.message || 'The server encountered an error while processing your request.',
        icon: <ServerCrash className="w-6 h-6" />,
        suggestion: 'This may be a temporary issue. Please try again in a moment.'
      },
      timeout: {
        title: 'Request Timeout',
        message: 'The request took too long to complete. The server may be busy.',
        icon: <RefreshCw className="w-6 h-6" />,
        suggestion: 'The server may be experiencing high load. Please try again.'
      },
      parse: {
        title: 'Data Error',
        message: 'Failed to parse the received data. The format may be invalid.',
        icon: <FileJson className="w-6 h-6" />,
        suggestion: 'This may be a temporary data issue. Please try again.'
      },
      unknown: {
        title: 'Data Loading Error',
        message: error?.message || 'An unexpected error occurred while loading data.',
        icon: <AlertTriangle className="w-6 h-6" />
      }
    }
    
    const config = configs[errorType]
    
    // Add retry info if applicable
    if (retryCount > 0 && retryCount < maxRetries) {
      return {
        ...config,
        message: `${config.message} (Retry ${retryCount}/${maxRetries})`
      }
    }
    
    if (retryCount >= maxRetries) {
      return {
        ...config,
        message: `${config.message} Maximum retry attempts reached. Please try again later.`,
        suggestion: 'If this problem persists, please contact support.'
      }
    }
    
    return config
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }
      
      const { hubName = 'GLOBAL', componentName, compact = false } = this.props
      const errorConfig = this.getErrorConfig()
      
      // Use compact mode for inline components
      if (compact) {
        return (
          <HubErrorCompact
            hub={hubName}
            title={errorConfig.title}
            message={errorConfig.message}
            onRetry={this.handleRetry}
            componentName={componentName}
          />
        )
      }
      
      // Full error fallback UI
      return (
        <HubErrorFallback
          hub={hubName}
          title={errorConfig.title}
          message={errorConfig.message}
          error={this.state.error}
          onRetry={this.handleRetry}
          onGoHome={() => window.location.href = '/'}
          onGoBack={() => window.history.back()}
          componentName={componentName}
        />
      )
    }

    return this.props.children
  }
}

/**
 * HOC to wrap components with DataErrorBoundary
 */
export function withDataErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<Props, 'children'>
): React.FC<P> {
  return function WithDataErrorBoundary(props: P) {
    return (
      <DataErrorBoundary {...options}>
        <Component {...props} />
      </DataErrorBoundary>
    )
  }
}

// Type declaration for global gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export default DataErrorBoundary
