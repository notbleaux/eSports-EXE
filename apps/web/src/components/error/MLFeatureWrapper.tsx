/**
 * MLFeatureWrapper - Combined Error Boundary Wrapper for ML Features
 * Combines MLInferenceErrorBoundary and StreamingErrorBoundary
 * Provides comprehensive error handling for ML components
 * 
 * [Ver001.000]
 */

import React, { type ReactNode } from 'react'
import { MLInferenceErrorBoundary } from './MLInferenceErrorBoundary'
import { StreamingErrorBoundary } from './StreamingErrorBoundary'
import { HubErrorFallback, HubErrorCompact } from './HubErrorFallback'

interface MLFeatureWrapperProps {
  /** Child components to wrap */
  children: ReactNode
  /** Hub identifier for theming */
  hub?: 'SATOR' | 'ROTAS' | 'AREPO' | 'OPERA' | 'TENET'
  /** Component name for error reporting */
  componentName?: string
  /** Enable streaming error boundary */
  enableStreaming?: boolean
  /** Enable ML inference error boundary */
  enableMLInference?: boolean
  /** Custom fallback UI */
  fallback?: ReactNode
  /** Compact mode for inline components */
  compact?: boolean
  /** Error callback */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  /** Reconnect callback for streaming */
  onReconnect?: () => void
  /** Retry callback */
  onRetry?: () => void
  /** Whether the component uses WebSocket streaming */
  usesStreaming?: boolean
  /** Whether the component uses ML inference */
  usesML?: boolean
}

/**
 * MLFeatureWrapper - Comprehensive error boundary for ML components
 * 
 * Wraps children with both MLInferenceErrorBoundary and StreamingErrorBoundary
 * based on the component's capabilities. Provides hub-themed error UI.
 */
export const MLFeatureWrapper: React.FC<MLFeatureWrapperProps> = ({
  children,
  hub = 'SATOR',
  componentName = 'ML Component',
  enableStreaming = true,
  enableMLInference = true,
  fallback,
  compact = false,
  onError,
  onReconnect,
  onRetry: _onRetry,
  usesStreaming = false,
  usesML = true
}) => {
  // Create the fallback UI based on mode
  const createFallback = (error: Error | null, retryFn: () => void) => {
    if (fallback) return fallback
    
    const FallbackComponent = compact ? HubErrorCompact : HubErrorFallback
    
    return (
      <FallbackComponent
        hub={hub}
        title={usesStreaming ? 'Streaming Error' : 'ML Inference Error'}
        message={error?.message || 'An error occurred with the ML feature'}
        error={error}
        onRetry={retryFn}
        componentName={componentName}
      />
    )
  }

  // Wrap with MLInferenceErrorBoundary if enabled and uses ML
  const wrapWithMLBoundary = (content: ReactNode): ReactNode => {
    if (!enableMLInference || !usesML) return content
    
    return (
      <MLInferenceErrorBoundary
        onError={onError}
        fallback={createFallback(null, () => {})}
      >
        {content}
      </MLInferenceErrorBoundary>
    )
  }

  // Wrap with StreamingErrorBoundary if enabled and uses streaming
  const wrapWithStreamingBoundary = (content: ReactNode): ReactNode => {
    if (!enableStreaming || !usesStreaming) return content
    
    return (
      <StreamingErrorBoundary
        onError={onError}
        onReconnect={onReconnect}
        fallback={createFallback(null, () => {})}
      >
        {content}
      </StreamingErrorBoundary>
    )
  }

  // Apply boundaries from innermost to outermost
  // MLInferenceErrorBoundary (inner) → StreamingErrorBoundary (outer)
  let wrappedContent = children
  
  wrappedContent = wrapWithMLBoundary(wrappedContent)
  wrappedContent = wrapWithStreamingBoundary(wrappedContent)

  return <>{wrappedContent}</>
}

/**
 * MLAnalyticsPanel - Wrapper for analytics panels with ML features
 */
interface MLAnalyticsPanelProps {
  children: ReactNode
  hub?: 'SATOR' | 'ROTAS' | 'AREPO' | 'OPERA' | 'TENET'
  panelTitle?: string
  usesStreaming?: boolean
}

export const MLAnalyticsPanel: React.FC<MLAnalyticsPanelProps> = ({
  children,
  hub = 'ROTAS',
  panelTitle = 'Analytics Panel',
  usesStreaming = false
}) => {
  return (
    <MLFeatureWrapper
      hub={hub}
      componentName={panelTitle}
      usesML={true}
      usesStreaming={usesStreaming}
      enableMLInference={true}
      enableStreaming={usesStreaming}
      compact={true}
    >
      {children}
    </MLFeatureWrapper>
  )
}

/**
 * PredictionHistoryWrapper - Wrapper for prediction history components
 */
interface PredictionHistoryWrapperProps {
  children: ReactNode
  hub?: 'SATOR' | 'ROTAS' | 'AREPO' | 'OPERA' | 'TENET'
  usesStreaming?: boolean
}

export const PredictionHistoryWrapper: React.FC<PredictionHistoryWrapperProps> = ({
  children,
  hub = 'ROTAS',
  usesStreaming = true
}) => {
  return (
    <MLFeatureWrapper
      hub={hub}
      componentName="Prediction History"
      usesML={true}
      usesStreaming={usesStreaming}
      enableMLInference={true}
      enableStreaming={true}
      compact={true}
    >
      {children}
    </MLFeatureWrapper>
  )
}

/**
 * MLPredictionWrapper - Wrapper for ML prediction panels
 */
interface MLPredictionWrapperProps {
  children: ReactNode
  hub?: 'SATOR' | 'ROTAS' | 'AREPO' | 'OPERA' | 'TENET'
  modelName?: string
}

export const MLPredictionWrapper: React.FC<MLPredictionWrapperProps> = ({
  children,
  hub = 'SATOR',
  modelName = 'ML Model'
}) => {
  return (
    <MLFeatureWrapper
      hub={hub}
      componentName={modelName}
      usesML={true}
      usesStreaming={false}
      enableMLInference={true}
      enableStreaming={false}
      compact={false}
    >
      {children}
    </MLFeatureWrapper>
  )
}

export default MLFeatureWrapper
