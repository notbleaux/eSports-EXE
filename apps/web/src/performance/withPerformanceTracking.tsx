/**
 * withPerformanceTracking HOC
 * Wraps components to track their render performance
 * 
 * [Ver001.000]
 */
import React, { useRef, useEffect } from 'react';
import { performanceMonitor } from '../monitoring/PerformanceMonitor';

interface WithPerformanceTrackingOptions {
  threshold?: number;
  trackUpdates?: boolean;
}

export default function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string,
  options: WithPerformanceTrackingOptions = {}
): React.FC<P> {
  const { threshold: _threshold = 16, trackUpdates = false } = options;

  const PerformanceTrackedComponent: React.FC<P> = (props) => {
    const renderStartTime = useRef<number>(0);
    const isFirstRender = useRef(true);

    useEffect(() => {
      if (!isFirstRender.current && !trackUpdates) return;
      
      renderStartTime.current = performance.now();
      
      // Use requestAnimationFrame to measure after paint
      const rafId = requestAnimationFrame(() => {
        performanceMonitor.measureComponentRender(
          componentName,
          renderStartTime.current
        );
      });

      isFirstRender.current = false;

      return () => cancelAnimationFrame(rafId);
    });

    return <WrappedComponent {...props} />;
  };

  PerformanceTrackedComponent.displayName = `withPerformanceTracking(${componentName})`;

  return PerformanceTrackedComponent;
}
