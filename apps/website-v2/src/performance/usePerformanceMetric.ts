/**
 * usePerformanceMetric Hook
 * Track custom performance metrics in components
 * 
 * [Ver001.000]
 */
import { useCallback, useRef, useEffect } from 'react';
import { performanceMonitor } from '../monitoring/PerformanceMonitor';

interface UsePerformanceMetricReturn {
  start: () => void;
  end: () => number | null;
  measure: <T>(fn: () => T, name: string) => T;
}

export function usePerformanceMetric(metricName: string): UsePerformanceMetricReturn {
  const startTimeRef = useRef<number>(0);
  const isMeasuringRef = useRef(false);

  const start = useCallback(() => {
    if (isMeasuringRef.current) {
      console.warn(`[usePerformanceMetric] ${metricName} already started`);
      return;
    }
    startTimeRef.current = performance.now();
    isMeasuringRef.current = true;
    performanceMonitor.markUserTiming(`${metricName}-start`);
  }, [metricName]);

  const end = useCallback(() => {
    if (!isMeasuringRef.current) {
      console.warn(`[usePerformanceMetric] ${metricName} not started`);
      return null;
    }
    const duration = performance.now() - startTimeRef.current;
    isMeasuringRef.current = false;
    performanceMonitor.markUserTiming(metricName, duration);
    return duration;
  }, [metricName]);

  const measure = useCallback(<T,>(fn: () => T, name: string): T => {
    start();
    try {
      const result = fn();
      end();
      return result;
    } catch (error) {
      end();
      throw error;
    }
  }, [start, end]);

  // Auto-end on unmount if still measuring
  useEffect(() => {
    return () => {
      if (isMeasuringRef.current) {
        end();
      }
    };
  }, [end]);

  return { start, end, measure };
}

// Hook for tracking async operations
export function useAsyncPerformanceMetric(metricName: string) {
  const { start, end } = usePerformanceMetric(metricName);

  const measureAsync = useCallback(async <T,>(
    fn: () => Promise<T>,
    operationName?: string
  ): Promise<T> => {
    const name = operationName || metricName;
    performanceMonitor.markUserTiming(`${name}-start`);
    
    try {
      const result = await fn();
      const duration = performance.now();
      performanceMonitor.markUserTiming(name, duration);
      return result;
    } catch (error) {
      const duration = performance.now();
      performanceMonitor.markUserTiming(`${name}-error`, duration);
      throw error;
    }
  }, [metricName]);

  return { start, end, measureAsync };
}
