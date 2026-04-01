/**
 * useMLInference Hook - STUBBED
 * Machine learning inference hook
 * [Ver001.001]
 * 
 * NOTE: ML features temporarily disabled due to dependency issues.
 */

import { useCallback, useState } from 'react';

/** Model information type */
export interface ModelInfo {
  id: string;
  name: string;
  version: string;
  size: number;
  format: 'onnx' | 'tfjs' | 'tflite';
  inputShape: number[];
  outputShape: number[];
  description?: string;
}

export interface InferenceResult {
  result: unknown;
  error?: string;
}

// Return type for useMLInference hook
export interface UseMLInferenceReturn {
  runInference: (input: unknown) => Promise<InferenceResult>;
  isLoading: boolean;
  error: string | null;
}

// Options for useMLInference hook
export interface UseMLInferenceOptions {
  enabled?: boolean;
  timeout?: number;
}

// Circuit breaker types (stubs)
export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
}

export interface CircuitBreakerState {
  failures: number;
  isOpen: boolean;
  lastFailureTime: number | null;
}

// Error types (stubs)
export class MLValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MLValidationError';
  }
}

export class MLTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MLTimeoutError';
  }
}

export class MLCircuitBreakerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MLCircuitBreakerError';
  }
}

export class MLFeatureDisabledError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MLFeatureDisabledError';
  }
}

export function useMLInference(_options?: UseMLInferenceOptions): UseMLInferenceReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runInference = useCallback(async (_input: unknown): Promise<InferenceResult> => {
    console.warn('ML features temporarily disabled');
    return { result: null, error: 'ML features temporarily disabled' };
  }, []);

  return {
    runInference,
    isLoading,
    error,
  };
}

export default useMLInference;
