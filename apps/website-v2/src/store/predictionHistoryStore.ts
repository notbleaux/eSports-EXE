/**
 * Prediction History Store - Zustand store for ML prediction tracking
 * Manages last 1000 predictions with localStorage backup
 * 
 * [Ver001.000]
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Prediction result interface
 */
export interface PredictionResult {
  id: string;
  input: number[];
  output: number[];
  confidence: number;
  modelId: string;
  timestamp: Date;
  latencyMs: number;
  accuracy?: number;
}

/**
 * Model metadata interface
 */
export interface ModelMetadata {
  id: string;
  version: string;
  url: string;
  checksum: string;
  accuracy: number;
  size: number;
  deployedAt: Date;
}

/**
 * Date range for querying predictions
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Search filters for predictions
 */
export interface PredictionFilters {
  modelId?: string;
  minConfidence?: number;
  startDate?: Date;
  endDate?: Date;
  query?: string;
}

interface PredictionHistoryState {
  predictions: PredictionResult[];
  maxPredictions: number;
}

interface PredictionHistoryActions {
  addPrediction: (prediction: Omit<PredictionResult, 'id' | 'timestamp'>) => PredictionResult;
  getPredictions: (range?: DateRange) => PredictionResult[];
  getPredictionsByModel: (modelId: string) => PredictionResult[];
  getPredictionsByConfidence: (minConfidence: number) => PredictionResult[];
  searchPredictions: (query: string) => PredictionResult[];
  filterPredictions: (filters: PredictionFilters) => PredictionResult[];
  clearHistory: () => void;
  getStats: () => {
    totalPredictions: number;
    avgAccuracy: number | null;
    avgLatency: number;
    activeModels: number;
    predictionsByModel: Record<string, number>;
  };
  exportToCSV: () => string;
  exportToJSON: () => string;
}

const MAX_PREDICTIONS = 1000;

const STORAGE_KEY = 'rotas-prediction-history';

/**
 * Generate unique prediction ID
 */
const generateId = (): string => {
  return `pred-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calculate average of array
 */
const calculateAverage = (values: number[]): number | null => {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
};

export const usePredictionHistoryStore = create<PredictionHistoryState & PredictionHistoryActions>()(
  persist(
    (set, get) => ({
      // Initial state
      predictions: [],
      maxPredictions: MAX_PREDICTIONS,

      /**
       * Add a new prediction to history
       */
      addPrediction: (prediction) => {
        const newPrediction: PredictionResult = {
          ...prediction,
          id: generateId(),
          timestamp: new Date(),
        };

        set((state) => {
          const updatedPredictions = [newPrediction, ...state.predictions];
          // Keep only the last maxPredictions
          if (updatedPredictions.length > state.maxPredictions) {
            return { predictions: updatedPredictions.slice(0, state.maxPredictions) };
          }
          return { predictions: updatedPredictions };
        });

        return newPrediction;
      },

      /**
       * Get predictions within a date range
       */
      getPredictions: (range) => {
        const { predictions } = get();
        if (!range) return predictions;

        return predictions.filter((p) => {
          const ts = new Date(p.timestamp).getTime();
          return ts >= range.start.getTime() && ts <= range.end.getTime();
        });
      },

      /**
       * Get predictions by model ID
       */
      getPredictionsByModel: (modelId) => {
        const { predictions } = get();
        return predictions.filter((p) => p.modelId === modelId);
      },

      /**
       * Get predictions with confidence above threshold
       */
      getPredictionsByConfidence: (minConfidence) => {
        const { predictions } = get();
        return predictions.filter((p) => p.confidence >= minConfidence);
      },

      /**
       * Search predictions by input features (partial match)
       */
      searchPredictions: (query) => {
        const { predictions } = get();
        if (!query.trim()) return predictions;

        const lowerQuery = query.toLowerCase();
        return predictions.filter((p) => {
          // Search in input features
          const inputMatch = p.input.some((val) =>
            val.toString().includes(lowerQuery)
          );
          // Search in model ID
          const modelMatch = p.modelId.toLowerCase().includes(lowerQuery);
          // Search in prediction ID
          const idMatch = p.id.toLowerCase().includes(lowerQuery);
          return inputMatch || modelMatch || idMatch;
        });
      },

      /**
       * Filter predictions with multiple criteria
       */
      filterPredictions: (filters) => {
        const { predictions } = get();

        return predictions.filter((p) => {
          // Model filter
          if (filters.modelId && p.modelId !== filters.modelId) return false;

          // Confidence filter
          if (filters.minConfidence !== undefined && p.confidence < filters.minConfidence) {
            return false;
          }

          // Date range filter
          if (filters.startDate || filters.endDate) {
            const ts = new Date(p.timestamp).getTime();
            if (filters.startDate && ts < filters.startDate.getTime()) return false;
            if (filters.endDate && ts > filters.endDate.getTime()) return false;
          }

          // Text search
          if (filters.query) {
            const lowerQuery = filters.query.toLowerCase();
            const inputMatch = p.input.some((val) =>
              val.toString().includes(lowerQuery)
            );
            const modelMatch = p.modelId.toLowerCase().includes(lowerQuery);
            const idMatch = p.id.toLowerCase().includes(lowerQuery);
            if (!inputMatch && !modelMatch && !idMatch) return false;
          }

          return true;
        });
      },

      /**
       * Clear all prediction history
       */
      clearHistory: () => {
        set({ predictions: [] });
      },

      /**
       * Get statistics about predictions
       */
      getStats: () => {
        const { predictions } = get();

        const totalPredictions = predictions.length;

        // Calculate average accuracy (only for predictions with accuracy data)
        const accuracies = predictions
          .map((p) => p.accuracy)
          .filter((a): a is number => a !== undefined);
        const avgAccuracy = calculateAverage(accuracies);

        // Calculate average latency
        const latencies = predictions.map((p) => p.latencyMs);
        const avgLatency = calculateAverage(latencies) || 0;

        // Count unique models
        const modelSet = new Set(predictions.map((p) => p.modelId));
        const activeModels = modelSet.size;

        // Predictions by model
        const predictionsByModel: Record<string, number> = {};
        predictions.forEach((p) => {
          predictionsByModel[p.modelId] = (predictionsByModel[p.modelId] || 0) + 1;
        });

        return {
          totalPredictions,
          avgAccuracy,
          avgLatency,
          activeModels,
          predictionsByModel,
        };
      },

      /**
       * Export predictions to CSV format
       */
      exportToCSV: () => {
        const { predictions } = get();
        
        if (predictions.length === 0) {
          return 'id,timestamp,modelId,confidence,latencyMs,accuracy,input,output\n';
        }

        const headers = ['id', 'timestamp', 'modelId', 'confidence', 'latencyMs', 'accuracy', 'input', 'output'];
        const rows = predictions.map((p) => [
          p.id,
          new Date(p.timestamp).toISOString(),
          p.modelId,
          p.confidence.toFixed(4),
          p.latencyMs,
          p.accuracy !== undefined ? p.accuracy.toFixed(4) : '',
          JSON.stringify(p.input),
          JSON.stringify(p.output),
        ]);

        return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      },

      /**
       * Export predictions to JSON format
       */
      exportToJSON: () => {
        const { predictions } = get();
        return JSON.stringify(predictions, null, 2);
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Only persist predictions array, not actions
      partialize: (state) => ({ predictions: state.predictions }),
      // Handle Date serialization
      serialize: (state) => {
        return JSON.stringify({
          state: {
            predictions: state.state.predictions.map((p) => ({
              ...p,
              timestamp: new Date(p.timestamp).toISOString(),
            })),
          },
          version: state.version,
        });
      },
      deserialize: (str) => {
        const parsed = JSON.parse(str);
        return {
          state: {
            predictions: parsed.state.predictions.map((p: PredictionResult & { timestamp: string }) => ({
              ...p,
              timestamp: new Date(p.timestamp),
            })),
          },
          version: parsed.version,
        };
      },
    }
  )
);

export default usePredictionHistoryStore;
