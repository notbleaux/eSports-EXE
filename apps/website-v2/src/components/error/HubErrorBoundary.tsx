/**
 * HubErrorBoundary - Hub-Level Error Handler
 * Provides hub-specific error recovery and consistent error UI
 * 
 * [Ver001.000]
 */

import React, { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, ArrowLeft, Layers } from 'lucide-react'
import { logger } from '@/utils/logger'
import { HubErrorFallback } from './HubErrorFallback'

interface Props {
  children: ReactNode
  /** Hub identifier for theming and recovery */
  hubName: 'sator' | 'rotas' | 'arepo' | 'opera' | 'tenet'
  /** Optional fallback component */
  fallback?: ReactNode
  /** Error reporting callback */
  onError?: (error: Error, errorInfo: React.ErrorInfo, hubName: string) => void
  /** Recovery callback */
  onRecover?: () => void
  /** Component name for error context */
  componentName?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  retryCount: number
  lastWorkingState: unknown | null
}

/**
 * Hub configuration for error recovery
 */
const HUB_RECOVERY_CONFIG = {
  sator: {
    displayName: 'SATOR',
    subtitle: 'The Observatory',
    color: '#ffd700',
    path: '/sator',
    resetActions: ['Reset orbital rings', 'Clear search cache', 'Reload player data']
  },
  rotas: {
    displayName: 'ROTAS',
    subtitle: 'The Harmonic Layer',
    color: '#00d4ff',
    path: '/rotas',
    resetActions: ['Reset layer selection', 'Clear predictions', 'Reconnect stream']
  },
  arepo: {
    displayName: 'AREPO',
    subtitle: 'The Control Layer',
    color: '#0066ff',
    path: '/arepo',
    resetActions: ['Clear search', 'Reset directory', 'Reload documentation']
  },
  opera: {
    displayName: 'OPERA',
    subtitle: 'The Action Layer',
    color: '#9d4edd',
    path: '/opera',
    resetActions: ['Reset map view', 'Clear fog settings', 'Reload map data']
  },
  tenet: {
    displayName: 'TENET',
    subtitle: 'The Nexus',
    color: '#ffffff',
    path: '/tenet',
    resetActions: ['Reset view', 'Clear preferences', 'Reload dashboard']
  }
}

/**
 * HubErrorBoundary - Centralized hub-level error handling
 * 
 * This boundary provides:
 * - Hub-specific theming for error UI
 * - Hub-aware recovery actions
 * - State preservation and reset
 * - Navigation to other hubs
 */
export class HubErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      lastWorkingState: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo })
    
    const { hubName } = this.props
    const config = HUB_RECOVERY_CONFIG[hubName]
    
    // Log error with hub context
    logger.error(`[HubErrorBoundary:${config.displayName}] Hub error caught:`, {
      message: error.message,
      hub: hubName,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount
    })
    
    // Report to parent if callback provided
    this.props.onError?.(error, errorInfo, hubName)
    
    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.reportToAnalytics(error, errorInfo)
    }
  }
  
  /**
   * Report error to analytics
   */
  private reportToAnalytics(error: Error, errorInfo: React.ErrorInfo): void {
    try {
      const eventData = {
        type: 'hub_error',
        hub: this.props.hubName,
        message: error.message,
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        timestamp: new Date().toISOString()
      }
      
      if (window.gtag) {
        window.gtag('event', 'hub_error', eventData)
      }
    } catch (e) {
      logger.error('[HubErrorBoundary] Failed to report to analytics:', e)
    }
  }

  /**
   * Save current state before error
   */
  saveState = (state: unknown): void => {
    if (!this.state.hasError) {
      this.setState({ lastWorkingState: state })
    }
  }

  /**
   * Handle retry - attempts to recover the hub
   */
  handleRetry = (): void => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }))
    
    this.props.onRecover?.()
    
    logger.info(`[HubErrorBoundary:${this.props.hubName}] Retry attempt`, {
      attempt: this.state.retryCount + 1
    })
  }

  /**
   * Handle full hub reset
   */
  handleReset = (): void => {
    // Clear hub-specific state from storage
    const { hubName } = this.props
    try {
      localStorage.removeItem(`njz_${hubName}_state`)
      sessionStorage.removeItem(`njz_${hubName}_session`)
    } catch (e) {
      logger.warn(`[HubErrorBoundary:${hubName}] Failed to clear storage:`, e)
    }
    
    this.handleRetry()
    
    logger.info(`[HubErrorBoundary:${hubName}] Hub state reset`)
  }

  /**
   * Navigate to a different hub
   */
  navigateToHub = (targetHub: keyof typeof HUB_RECOVERY_CONFIG): void => {
    window.location.href = HUB_RECOVERY_CONFIG[targetHub].path
  }

  /**
   * Render hub-specific error UI
   */
  private renderErrorUI(): ReactNode {
    const { hubName, fallback, componentName } = this.props
    const { error, errorInfo, retryCount } = this.state
    const config = HUB_RECOVERY_CONFIG[hubName]
    
    // Use custom fallback if provided
    if (fallback) {
      return fallback
    }
    
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center p-4">
        {/* Background glow */}
        <div 
          className="fixed inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${config.color}10 0%, transparent 70%)`
          }}
        />
        
        <div className="relative z-10 w-full max-w-4xl">
          {/* Hub Header */}
          <div className="text-center mb-8">
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-4"
              style={{
                backgroundColor: `${config.color}15`,
                borderColor: `${config.color}40`,
                boxShadow: `0 0 20px ${config.color}20`
              }}
            >
              <Layers className="w-4 h-4" style={{ color: config.color }} />
              <span className="text-sm font-mono" style={{ color: config.color }}>
                {config.displayName} Hub
              </span>
            </div>
          </div>
          
          {/* Main Error Card */}
          <HubErrorFallback
            hub={config.displayName as 'SATOR' | 'ROTAS' | 'AREPO' | 'OPERA' | 'TENET'}
            title={`${config.displayName} Hub Error`}
            message={error?.message || `Something went wrong in ${config.displayName}`}
            error={error}
            onRetry={this.handleRetry}
            onGoHome={() => window.location.href = '/'}
            onGoBack={() => window.history.back()}
            componentName={componentName}
          />
          
          {/* Hub-Specific Recovery Actions */}
          <div 
            className="mt-6 p-6 rounded-2xl border backdrop-blur-sm"
            style={{
              backgroundColor: `${config.color}08`,
              borderColor: `${config.color}20`
            }}
          >
            <h3 
              className="text-sm font-semibold mb-4 flex items-center gap-2"
              style={{ color: config.color }}
            >
              <RefreshCw className="w-4 h-4" />
              Recovery Actions
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {config.resetActions.map((action, index) => (
                <button
                  key={index}
                  onClick={this.handleReset}
                  className="px-4 py-3 rounded-xl text-sm font-medium transition-all hover:scale-105 text-left"
                  style={{
                    backgroundColor: `${config.color}10`,
                    color: config.color,
                    border: `1px solid ${config.color}30`
                  }}
                >
                  {action}
                </button>
              ))}
            </div>
            
            {retryCount > 0 && (
              <p className="mt-4 text-xs text-center text-white/40">
                Retry attempt: {retryCount}
              </p>
            )}
          </div>
          
          {/* Navigation to Other Hubs */}
          <div className="mt-6">
            <p className="text-xs text-white/40 text-center mb-4">
              Or navigate to another hub:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {(Object.keys(HUB_RECOVERY_CONFIG) as Array<keyof typeof HUB_RECOVERY_CONFIG>)
                .filter(h => h !== hubName)
                .map(hub => (
                  <button
                    key={hub}
                    onClick={() => this.navigateToHub(hub)}
                    className="px-4 py-2 rounded-lg text-xs font-medium transition-all hover:scale-105"
                    style={{
                      backgroundColor: `${HUB_RECOVERY_CONFIG[hub].color}15`,
                      color: HUB_RECOVERY_CONFIG[hub].color,
                      border: `1px solid ${HUB_RECOVERY_CONFIG[hub].color}30`
                    }}
                  >
                    {HUB_RECOVERY_CONFIG[hub].displayName}
                  </button>
                ))
              }
            </div>
          </div>
          
          {/* Technical Details */}
          {process.env.NODE_ENV === 'development' && errorInfo && (
            <details className="mt-6">
              <summary className="text-xs text-white/40 cursor-pointer text-center hover:text-white/60">
                Technical Details
              </summary>
              <div 
                className="mt-3 p-4 rounded-xl border overflow-auto max-h-64"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  borderColor: `${config.color}20`
                }}
              >
                <p className="text-xs mb-2" style={{ color: config.color }}>
                  Error: {error?.name}: {error?.message}
                </p>
                <pre className="text-xs text-white/40 whitespace-pre-wrap">
                  {errorInfo.componentStack}
                </pre>
              </div>
            </details>
          )}
        </div>
      </div>
    )
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.renderErrorUI()
    }

    return this.props.children
  }
}

/**
 * HOC to wrap components with HubErrorBoundary
 */
export function withHubErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  hubName: Props['hubName'],
  options?: Omit<Props, 'children' | 'hubName'>
): React.FC<P> {
  return function WithHubErrorBoundary(props: P) {
    return (
      <HubErrorBoundary hubName={hubName} {...options}>
        <Component {...props} />
      </HubErrorBoundary>
    )
  }
}

// Type declaration for global gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export default HubErrorBoundary
