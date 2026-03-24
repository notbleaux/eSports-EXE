/**
 * Mascot Asset Lazy Loading Component
 * 
 * Lazy-loaded wrapper for MascotAssetEnhanced with ErrorBoundary
 * 
 * [Ver001.000] - INT-002 Integration
 */

import React, { Suspense } from 'react';
import { AppErrorBoundary } from '@/components/error';

// Lazy load the enhanced mascot asset
const MascotAssetEnhancedLazy = React.lazy(() => import('./MascotAssetEnhanced'));

// Import types for re-export
export type { MascotType, AssetFormat, LoadingState, MascotAssetProps } from './MascotAssetEnhanced';

export interface LazyMascotAssetProps {
  mascot?: 'fox' | 'owl' | 'wolf' | 'hawk';
  size?: 32 | 64 | 128 | 256 | 512;
  format?: 'svg' | 'png' | 'css' | 'auto';
  animate?: boolean;
  animation?: 'idle' | 'wave' | 'celebrate';
  className?: string;
  alt?: string;
  progressive?: boolean;
  showLoading?: boolean;
  easterEggs?: boolean;
  preferenceKey?: string;
  rotate?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  /** Custom fallback component */
  fallback?: React.ReactNode;
  /** Error boundary fallback */
  errorFallback?: React.ReactNode;
}

/**
 * Simple fallback component for loading state
 */
const DefaultLoadingFallback: React.FC<{ size?: number }> = ({ size = 128 }) => (
  <div
    className="mascot-lazy-loading"
    style={{
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: size * 0.1,
    }}
  >
    <div
      className="loading-spinner"
      style={{
        width: size * 0.3,
        height: size * 0.3,
        border: '2px solid rgba(255, 255, 255, 0.1)',
        borderTop: '2px solid #ffd700',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}
    />
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

/**
 * Error fallback for lazy loading failures
 */
const DefaultErrorFallback: React.FC<{ mascot?: string; size?: number }> = ({ 
  mascot = 'mascot', 
  size = 128 
}) => (
  <div
    className="mascot-lazy-error"
    style={{
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderRadius: size * 0.1,
      color: '#ef4444',
      fontSize: size * 0.2,
    }}
    title={`Failed to load ${mascot}`}
  >
    ⚠
  </div>
);

/**
 * Lazy-loaded MascotAsset with ErrorBoundary
 * 
 * Features:
 * - Lazy loading for code splitting
 * - Error boundary for graceful failures
 * - Suspense fallback for loading state
 * - All props pass-through to MascotAssetEnhanced
 */
export const MascotAssetLazy: React.FC<LazyMascotAssetProps> = ({
  fallback,
  errorFallback,
  ...props
}) => {
  const loadingFallback = fallback ?? <DefaultLoadingFallback size={props.size} />;
  const errorBoundaryFallback = errorFallback ?? (
    <DefaultErrorFallback mascot={props.mascot} size={props.size} />
  );

  return (
    <AppErrorBoundary fallback={errorBoundaryFallback}>
      <Suspense fallback={loadingFallback}>
        <MascotAssetEnhancedLazy {...props} />
      </Suspense>
    </AppErrorBoundary>
  );
};

/**
 * HOC version for wrapping existing components with lazy loading
 */
export function withLazyMascot<P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.FC<P & Partial<LazyMascotAssetProps>> {
  return function WithLazyMascot(props: P & Partial<LazyMascotAssetProps>) {
    const { fallback, errorFallback, ...wrappedProps } = props;
    
    return (
      <AppErrorBoundary fallback={errorFallback}>
        <Suspense fallback={fallback ?? <DefaultLoadingFallback />}>
          <WrappedComponent {...(wrappedProps as P)} />
        </Suspense>
      </AppErrorBoundary>
    );
  };
}

export default MascotAssetLazy;
