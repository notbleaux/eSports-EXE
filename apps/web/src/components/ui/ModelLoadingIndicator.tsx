/**
 * ModelLoadingIndicator - ML Model Download Progress
 * Minimal footprint loading indicator with cache awareness
 * 
 * [Ver001.000]
 */

import React from 'react'
import { Download, Database, RefreshCw, AlertCircle } from 'lucide-react'

interface ModelLoadingIndicatorProps {
  progress: number
  isLoading: boolean
  error: Error | null
  isCached?: boolean
  onRetry?: () => void
  modelName?: string
}

export const ModelLoadingIndicator: React.FC<ModelLoadingIndicatorProps> = ({
  progress,
  isLoading,
  error,
  isCached = false,
  onRetry,
  modelName = 'ML Model'
}) => {
  // Error state
  if (error) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-red-400">Load Failed</div>
          <div className="text-xs text-red-400/70 truncate">{error.message}</div>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        )}
      </div>
    )
  }

  // Not loading and no error = ready (don't show anything)
  if (!isLoading) {
    return null
  }

  // Determine status text and icon based on progress
  const getStatus = () => {
    if (isCached) {
      return {
        icon: <Database className="w-4 h-4 text-cyan-400" />,
        text: 'Loading from cache...',
        color: '#22d3ee'
      }
    }
    if (progress < 30) {
      return {
        icon: <Download className="w-4 h-4 text-amber-400" />,
        text: 'Downloading...',
        color: '#fbbf24'
      }
    }
    if (progress < 90) {
      return {
        icon: <Download className="w-4 h-4 text-blue-400" />,
        text: 'Downloading...',
        color: '#60a5fa'
      }
    }
    return {
      icon: <Database className="w-4 h-4 text-green-400" />,
      text: 'Initializing...',
      color: '#4ade80'
    }
  }

  const status = getStatus()

  return (
    <div className="w-full p-3 rounded-lg bg-white/5 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {status.icon}
          <span className="text-sm font-medium text-white">{modelName}</span>
        </div>
        <span className="text-sm text-gray-400">{progress}%</span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
        <div
          className="h-full transition-all duration-300 ease-out rounded-full"
          style={{
            width: `${progress}%`,
            backgroundColor: status.color,
            boxShadow: `0 0 10px ${status.color}40`
          }}
        />
      </div>

      {/* Status Text */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">{status.text}</span>
        {isCached && (
          <span className="text-cyan-400 flex items-center gap-1">
            <Database className="w-3 h-3" />
            Cached
          </span>
        )}
      </div>

      {/* File size estimate (educational) */}
      {!isCached && progress > 0 && progress < 100 && (
        <div className="mt-2 text-xs text-gray-500">
          Estimated: {(progress * 0.5).toFixed(1)}MB / ~50MB
        </div>
      )}
    </div>
  )
}

/**
 * Compact version for inline use (e.g., in toolbar)
 */
export const ModelLoadingIndicatorCompact: React.FC<{
  isLoading: boolean
  progress: number
  error: Error | null
}> = ({ isLoading, progress, error }) => {
  if (error) {
    return (
      <div className="flex items-center gap-1.5 text-red-400 text-xs">
        <AlertCircle className="w-3.5 h-3.5" />
        <span>Failed</span>
      </div>
    )
  }

  if (!isLoading) {
    return (
      <div className="flex items-center gap-1.5 text-green-400 text-xs">
        <Database className="w-3.5 h-3.5" />
        <span>Ready</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-400 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 w-8">{progress}%</span>
    </div>
  )
}

export default ModelLoadingIndicator
