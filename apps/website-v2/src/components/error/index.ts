/**
 * Error Boundary Components Index
 * Centralized exports for all error handling components
 * 
 * [Ver002.000] - Added DataErrorBoundary and HubErrorBoundary
 */

// Core Error Boundaries
export { MLInferenceErrorBoundary } from './MLInferenceErrorBoundary'
export { StreamingErrorBoundary } from './StreamingErrorBoundary'
export { PanelErrorBoundary } from '../grid/PanelErrorBoundary'
export { AppErrorBoundary, withAppErrorBoundary } from './AppErrorBoundary'
export { DataErrorBoundary, withDataErrorBoundary } from './DataErrorBoundary'
export { HubErrorBoundary, withHubErrorBoundary } from './HubErrorBoundary'

// Hub-Themed Error UI
export { HubErrorFallback, HubErrorCompact } from './HubErrorFallback'

// ML Feature Wrappers
export { 
  MLFeatureWrapper,
  MLAnalyticsPanel,
  PredictionHistoryWrapper,
  MLPredictionWrapper
} from './MLFeatureWrapper'

// Default exports
export { default as MLInferenceErrorBoundaryDefault } from './MLInferenceErrorBoundary'
export { default as StreamingErrorBoundaryDefault } from './StreamingErrorBoundary'
export { default as AppErrorBoundaryDefault } from './AppErrorBoundary'
export { default as HubErrorFallbackDefault } from './HubErrorFallback'
export { default as MLFeatureWrapperDefault } from './MLFeatureWrapper'
export { default as DataErrorBoundaryDefault } from './DataErrorBoundary'
export { default as HubErrorBoundaryDefault } from './HubErrorBoundary'
