/**
 * HubErrorFallback - Consistent Error UI Across All Hubs
 * Provides a unified error display with hub-specific theming
 * 
 * [Ver001.000]
 */

import React from 'react'
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'

interface HubErrorFallbackProps {
  /** Hub identifier for theming */
  hub?: 'SATOR' | 'ROTAS' | 'AREPO' | 'OPERA' | 'TENET' | 'GLOBAL'
  /** Error title */
  title?: string
  /** Error message */
  message?: string
  /** Error object for details */
  error?: Error | null
  /** Retry callback */
  onRetry?: () => void
  /** Go back callback */
  onGoBack?: () => void
  /** Go home callback */
  onGoHome?: () => void
  /** Show technical details */
  showDetails?: boolean
  /** Component that failed */
  componentName?: string
}

const HUB_CONFIG = {
  SATOR: {
    name: 'SATOR',
    subtitle: 'The Observatory',
    color: '#ffd700',
    glow: 'rgba(255, 215, 0, 0.4)',
    bgColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: 'rgba(255, 215, 0, 0.3)'
  },
  ROTAS: {
    name: 'ROTAS',
    subtitle: 'The Harmonic Layer',
    color: '#00d4ff',
    glow: 'rgba(0, 212, 255, 0.4)',
    bgColor: 'rgba(0, 212, 255, 0.1)',
    borderColor: 'rgba(0, 212, 255, 0.3)'
  },
  AREPO: {
    name: 'AREPO',
    subtitle: 'The Control Layer',
    color: '#0066ff',
    glow: 'rgba(0, 102, 255, 0.4)',
    bgColor: 'rgba(0, 102, 255, 0.1)',
    borderColor: 'rgba(0, 102, 255, 0.3)'
  },
  OPERA: {
    name: 'OPERA',
    subtitle: 'The Action Layer',
    color: '#9d4edd',
    glow: 'rgba(157, 78, 221, 0.4)',
    bgColor: 'rgba(157, 78, 221, 0.1)',
    borderColor: 'rgba(157, 78, 221, 0.3)'
  },
  TENET: {
    name: 'TENET',
    subtitle: 'The Nexus',
    color: '#ffffff',
    glow: 'rgba(255, 255, 255, 0.4)',
    bgColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.3)'
  },
  GLOBAL: {
    name: 'NJZiteGeisTe',
    subtitle: 'NJZiteGeisTe Platform',
    color: '#9d4edd',
    glow: 'rgba(157, 78, 221, 0.4)',
    bgColor: 'rgba(157, 78, 221, 0.1)',
    borderColor: 'rgba(157, 78, 221, 0.3)'
  }
}

/**
 * HubErrorFallback - Consistent error UI for all hubs
 */
export const HubErrorFallback: React.FC<HubErrorFallbackProps> = ({
  hub = 'GLOBAL',
  title = 'Something Went Wrong',
  message = 'An unexpected error occurred. Please try again.',
  error = null,
  onRetry,
  onGoBack,
  onGoHome,
  showDetails = process.env.NODE_ENV === 'development',
  componentName
}) => {
  const config = HUB_CONFIG[hub]
  const [isRetrying, setIsRetrying] = React.useState(false)

  const handleRetry = () => {
    if (onRetry) {
      setIsRetrying(true)
      // Reset retrying state after a short delay
      setTimeout(() => setIsRetrying(false), 1000)
      onRetry()
    }
  }

  return (
    <div 
      className="min-h-[400px] flex items-center justify-center p-6"
      role="alert"
      aria-live="polite"
    >
      <div 
        className="w-full max-w-lg rounded-2xl border p-8 backdrop-blur-sm"
        style={{
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
          boxShadow: `0 0 40px ${config.glow}`
        }}
      >
        {/* Icon and Title */}
        <div className="text-center mb-6">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ 
              backgroundColor: `${config.color}20`,
              boxShadow: `0 0 30px ${config.glow}`
            }}
          >
            <AlertTriangle 
              className="w-10 h-10" 
              style={{ color: config.color }}
              aria-hidden="true"
            />
          </div>
          
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ color: config.color }}
          >
            {title}
          </h2>
          
          <p className="text-white/60 text-sm">
            {config.name} • {config.subtitle}
          </p>
        </div>

        {/* Error Message */}
        <div className="bg-black/30 rounded-xl p-4 mb-6">
          <p className="text-white/80 text-center">
            {message}
          </p>
          {componentName && (
            <p className="text-white/40 text-xs text-center mt-2 font-mono">
              Component: {componentName}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center">
          {onRetry && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 hover:scale-105 active:scale-95"
              style={{ 
                backgroundColor: config.color,
                color: '#0a0a0f'
              }}
            >
              <RefreshCw 
                className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`}
              />
              {isRetrying ? 'Retrying...' : 'Try Again'}
            </button>
          )}
          
          {onGoBack && (
            <button
              onClick={onGoBack}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all hover:scale-105 active:scale-95 border"
              style={{ 
                borderColor: config.borderColor,
                color: config.color
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          )}
          
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all hover:scale-105 active:scale-95 bg-white/5 text-white/70 hover:bg-white/10"
            >
              <Home className="w-4 h-4" />
              Return Home
            </button>
          )}
        </div>

        {/* Technical Details (Development Only) */}
        {showDetails && error && (
          <details className="mt-6">
            <summary 
              className="text-xs cursor-pointer select-none text-center"
              style={{ color: `${config.color}80` }}
            >
              Technical Details
            </summary>
            <div className="mt-3 p-3 rounded-lg bg-black/50 overflow-auto">
              <p 
                className="text-xs font-mono mb-2"
                style={{ color: config.color }}
              >
                {error.name}: {error.message}
              </p>
              {error.stack && (
                <pre className="text-xs text-white/40 whitespace-pre-wrap">
                  {error.stack}
                </pre>
              )}
            </div>
          </details>
        )}

        {/* Graceful Degradation Notice */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-xs text-white/40 text-center">
            This error is isolated. The rest of the application continues to function normally.
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Compact version for inline error display
 */
export const HubErrorCompact: React.FC<Omit<HubErrorFallbackProps, 'showDetails' | 'onGoBack' | 'onGoHome'>> = ({
  hub = 'GLOBAL',
  title = 'Error',
  message = 'Something went wrong',
  onRetry,
  componentName: _componentName
}) => {
  const config = HUB_CONFIG[hub]

  return (
    <div 
      className="rounded-xl border p-4 backdrop-blur-sm"
      style={{
        backgroundColor: config.bgColor,
        borderColor: config.borderColor
      }}
      role="alert"
    >
      <div className="flex items-center gap-3">
        <AlertTriangle 
          className="w-5 h-5 flex-shrink-0" 
          style={{ color: config.color }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/90">
            {title}
          </p>
          <p className="text-xs text-white/60 truncate">
            {message}
          </p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="p-2 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: config.color }}
            aria-label="Retry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export default HubErrorFallback
