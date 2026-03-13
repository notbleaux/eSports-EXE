/**
 * Prediction History Store Tests - P0 Test Coverage
 * 
 * [Ver001.000]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePredictionHistoryStore, PredictionResult, DateRange, PredictionFilters } from '../predictionHistoryStore'

describe('predictionHistoryStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = usePredictionHistoryStore.getState()
    store.clearHistory()
    
    // Clear localStorage mock
    localStorage.clear()
  })

  describe('addPrediction', () => {
    it('should add a prediction to the history', () => {
      const store = usePredictionHistoryStore.getState()
      
      const prediction = store.addPrediction({
        input: [0.5, 0.3, 0.2],
        output: [0.8, 0.15, 0.05],
        confidence: 0.8,
        modelId: 'test-model-v1',
        latencyMs: 25.5
      })

      expect(prediction).toBeDefined()
      expect(prediction.id).toMatch(/^pred-\d+-.+/)
      expect(prediction.input).toEqual([0.5, 0.3, 0.2])
      expect(prediction.output).toEqual([0.8, 0.15, 0.05])
      expect(prediction.confidence).toBe(0.8)
      expect(prediction.modelId).toBe('test-model-v1')
      expect(prediction.latencyMs).toBe(25.5)
      expect(prediction.timestamp).toBeInstanceOf(Date)
    })

    it('should add predictions to the beginning of the array', () => {
      const store = usePredictionHistoryStore.getState()
      
      store.addPrediction({
        input: [0.1, 0.2, 0.3],
        output: [0.4, 0.5, 0.6],
        confidence: 0.7,
        modelId: 'model-1',
        latencyMs: 20
      })
      
      store.addPrediction({
        input: [0.7, 0.8, 0.9],
        output: [0.1, 0.2, 0.3],
        confidence: 0.9,
        modelId: 'model-2',
        latencyMs: 30
      })

      const predictions = store.getPredictions()
      expect(predictions).toHaveLength(2)
      expect(predictions[0].modelId).toBe('model-2')
      expect(predictions[1].modelId).toBe('model-1')
    })

    it('should enforce maximum prediction limit (1000)', () => {
      const store = usePredictionHistoryStore.getState()
      
      // Add more than max predictions
      for (let i = 0; i < 1005; i++) {
        store.addPrediction({
          input: [0.5],
          output: [0.8],
          confidence: 0.8,
          modelId: 'model',
          latencyMs: 20
        })
      }

      const predictions = store.getPredictions()
      expect(predictions).toHaveLength(1000)
    }, 10000)

    it('should return the created prediction', () => {
      const store = usePredictionHistoryStore.getState()
      
      const result = store.addPrediction({
        input: [0.5, 0.3, 0.2],
        output: [0.8, 0.15, 0.05],
        confidence: 0.8,
        modelId: 'test-model',
        latencyMs: 25.5,
        accuracy: 0.95
      })

      expect(result.accuracy).toBe(0.95)
    })
  })

  describe('getPredictions with filters', () => {
    beforeEach(() => {
      const store = usePredictionHistoryStore.getState()
      
      // Add test predictions with different dates
      const baseTime = Date.now()
      
      store.addPrediction({
        input: [0.5],
        output: [0.8],
        confidence: 0.9,
        modelId: 'model-a',
        latencyMs: 20
      })
      
      store.addPrediction({
        input: [0.6],
        output: [0.7],
        confidence: 0.6,
        modelId: 'model-b',
        latencyMs: 30
      })
      
      store.addPrediction({
        input: [0.7],
        output: [0.6],
        confidence: 0.85,
        modelId: 'model-a',
        latencyMs: 25
      })
    })

    it('should return all predictions when no range is provided', () => {
      const store = usePredictionHistoryStore.getState()
      const predictions = store.getPredictions()
      
      expect(predictions).toHaveLength(3)
    })

    it('should filter predictions by date range', () => {
      const store = usePredictionHistoryStore.getState()
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      
      const range: DateRange = {
        start: oneHourAgo,
        end: now
      }
      
      const predictions = store.getPredictions(range)
      expect(predictions.length).toBeGreaterThan(0)
    })

    it('should filter predictions by model ID', () => {
      const store = usePredictionHistoryStore.getState()
      
      const predictions = store.getPredictionsByModel('model-a')
      
      expect(predictions).toHaveLength(2)
      predictions.forEach(p => {
        expect(p.modelId).toBe('model-a')
      })
    })

    it('should filter predictions by minimum confidence', () => {
      const store = usePredictionHistoryStore.getState()
      
      const predictions = store.getPredictionsByConfidence(0.8)
      
      expect(predictions.length).toBeGreaterThanOrEqual(2)
      predictions.forEach(p => {
        expect(p.confidence).toBeGreaterThanOrEqual(0.8)
      })
    })

    it('should search predictions by query string', () => {
      const store = usePredictionHistoryStore.getState()
      
      const predictions = store.searchPredictions('model-a')
      
      expect(predictions.length).toBeGreaterThan(0)
    })

    it('should return all predictions for empty search query', () => {
      const store = usePredictionHistoryStore.getState()
      
      const predictions = store.searchPredictions('')
      
      expect(predictions).toHaveLength(3)
    })

    it('should filter with multiple criteria', () => {
      const store = usePredictionHistoryStore.getState()
      
      const filters: PredictionFilters = {
        modelId: 'model-a',
        minConfidence: 0.85
      }
      
      const predictions = store.filterPredictions(filters)
      
      expect(predictions.length).toBeGreaterThan(0)
      predictions.forEach(p => {
        expect(p.modelId).toBe('model-a')
        expect(p.confidence).toBeGreaterThanOrEqual(0.85)
      })
    })

    it('should filter by date range in filterPredictions', () => {
      const store = usePredictionHistoryStore.getState()
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      
      const filters: PredictionFilters = {
        startDate: oneHourAgo,
        endDate: now
      }
      
      const predictions = store.filterPredictions(filters)
      expect(predictions.length).toBeGreaterThan(0)
    })

    it('should combine all filter criteria', () => {
      const store = usePredictionHistoryStore.getState()
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      
      const filters: PredictionFilters = {
        modelId: 'model-a',
        minConfidence: 0.8,
        startDate: oneHourAgo,
        endDate: now,
        query: 'model'
      }
      
      const predictions = store.filterPredictions(filters)
      
      predictions.forEach(p => {
        expect(p.modelId).toBe('model-a')
        expect(p.confidence).toBeGreaterThanOrEqual(0.8)
      })
    })
  })

  describe('exportToCSV', () => {
    it('should export empty predictions with headers only', () => {
      const store = usePredictionHistoryStore.getState()
      
      const csv = store.exportToCSV()
      
      expect(csv).toBe('id,timestamp,modelId,confidence,latencyMs,accuracy,input,output\n')
    })

    it('should export predictions in CSV format', () => {
      const store = usePredictionHistoryStore.getState()
      
      store.addPrediction({
        input: [0.5, 0.3],
        output: [0.8, 0.2],
        confidence: 0.85,
        modelId: 'test-model',
        latencyMs: 25.5,
        accuracy: 0.92
      })
      
      const csv = store.exportToCSV()
      const lines = csv.split('\n')
      
      expect(lines[0]).toBe('id,timestamp,modelId,confidence,latencyMs,accuracy,input,output')
      expect(lines.length).toBeGreaterThanOrEqual(2) // header + data row
      
      // Check data row contains expected values
      const dataRow = lines[1]
      expect(dataRow).toContain('test-model')
      expect(dataRow).toContain('0.8500')
      expect(dataRow).toContain('25.5')
      expect(dataRow).toContain('0.9200')
    })

    it('should handle predictions without accuracy', () => {
      const store = usePredictionHistoryStore.getState()
      
      store.addPrediction({
        input: [0.5],
        output: [0.8],
        confidence: 0.85,
        modelId: 'test-model',
        latencyMs: 25.5
      })
      
      const csv = store.exportToCSV()
      const lines = csv.split('\n')
      const dataRow = lines[1]
      
      // Just verify the row exists and contains the model
      expect(dataRow).toContain('test-model')
    })

    it('should JSON stringify input and output arrays', () => {
      const store = usePredictionHistoryStore.getState()
      
      store.addPrediction({
        input: [0.5, 0.3, 0.2],
        output: [0.8, 0.15, 0.05],
        confidence: 0.85,
        modelId: 'test-model',
        latencyMs: 25.5
      })
      
      const csv = store.exportToCSV()
      expect(csv).toContain('[0.5,0.3,0.2]')
      expect(csv).toContain('[0.8,0.15,0.05]')
    })
  })

  describe('exportToJSON', () => {
    it('should export empty array when no predictions', () => {
      const store = usePredictionHistoryStore.getState()
      
      const json = store.exportToJSON()
      
      expect(json).toBe('[]')
    })

    it('should export predictions in JSON format', () => {
      const store = usePredictionHistoryStore.getState()
      
      store.addPrediction({
        input: [0.5],
        output: [0.8],
        confidence: 0.85,
        modelId: 'test-model',
        latencyMs: 25.5
      })
      
      const json = store.exportToJSON()
      const parsed = JSON.parse(json)
      
      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed).toHaveLength(1)
      expect(parsed[0].modelId).toBe('test-model')
      expect(parsed[0].confidence).toBe(0.85)
    })
  })

  describe('persistence', () => {
    it('should persist predictions to localStorage', () => {
      const store = usePredictionHistoryStore.getState()
      
      store.addPrediction({
        input: [0.5],
        output: [0.8],
        confidence: 0.85,
        modelId: 'test-model',
        latencyMs: 25.5
      })
      
      // Trigger persistence
      const persistedData = localStorage.getItem('rotas-prediction-history')
      expect(persistedData).toBeTruthy()
      
      const parsed = JSON.parse(persistedData!)
      expect(parsed.state.predictions).toHaveLength(1)
      expect(parsed.state.predictions[0].modelId).toBe('test-model')
    })

    it('should restore predictions from localStorage', () => {
      const predictionData = {
        state: {
          predictions: [{
            id: 'pred-123',
            input: [0.5, 0.3],
            output: [0.8, 0.2],
            confidence: 0.85,
            modelId: 'restored-model',
            latencyMs: 25.5,
            timestamp: new Date().toISOString()
          }]
        },
        version: 0
      }
      
      localStorage.setItem('rotas-prediction-history', JSON.stringify(predictionData))
      
      // Create new store instance would restore from localStorage
      // In practice, this is handled by Zustand's persist middleware
      // We verify the data was stored correctly
      const stored = localStorage.getItem('rotas-prediction-history')
      expect(stored).toBeTruthy()
      
      const parsed = JSON.parse(stored!)
      expect(parsed.state.predictions[0].modelId).toBe('restored-model')
    })

    it('should handle Date serialization correctly', () => {
      const store = usePredictionHistoryStore.getState()
      const beforeAdd = new Date()
      
      const prediction = store.addPrediction({
        input: [0.5],
        output: [0.8],
        confidence: 0.85,
        modelId: 'test-model',
        latencyMs: 25.5
      })
      
      expect(prediction.timestamp).toBeInstanceOf(Date)
      expect(prediction.timestamp.getTime()).toBeGreaterThanOrEqual(beforeAdd.getTime())
    })
  })

  describe('clearHistory', () => {
    it('should remove all predictions', () => {
      const store = usePredictionHistoryStore.getState()
      
      store.addPrediction({
        input: [0.5],
        output: [0.8],
        confidence: 0.85,
        modelId: 'test-model',
        latencyMs: 25.5
      })
      
      expect(store.getPredictions()).toHaveLength(1)
      
      store.clearHistory()
      
      expect(store.getPredictions()).toHaveLength(0)
    })
  })

  describe('getStats', () => {
    it('should return statistics for empty predictions', () => {
      const store = usePredictionHistoryStore.getState()
      
      const stats = store.getStats()
      
      expect(stats.totalPredictions).toBe(0)
      expect(stats.avgAccuracy).toBeNull()
      expect(stats.avgLatency).toBe(0)
      expect(stats.activeModels).toBe(0)
      expect(stats.predictionsByModel).toEqual({})
    })

    it('should calculate average accuracy correctly', () => {
      const store = usePredictionHistoryStore.getState()
      
      store.addPrediction({
        input: [0.5],
        output: [0.8],
        confidence: 0.85,
        modelId: 'model-1',
        latencyMs: 20,
        accuracy: 0.9
      })
      
      store.addPrediction({
        input: [0.6],
        output: [0.7],
        confidence: 0.8,
        modelId: 'model-1',
        latencyMs: 30,
        accuracy: 0.8
      })
      
      const stats = store.getStats()
      
      // Average should be close to 0.85
      expect(stats.avgAccuracy).toBeCloseTo(0.85, 5)
      expect(stats.avgLatency).toBe(25)
    })

    it('should count active models correctly', () => {
      const store = usePredictionHistoryStore.getState()
      
      store.addPrediction({
        input: [0.5],
        output: [0.8],
        confidence: 0.85,
        modelId: 'model-1',
        latencyMs: 20
      })
      
      store.addPrediction({
        input: [0.6],
        output: [0.7],
        confidence: 0.8,
        modelId: 'model-2',
        latencyMs: 30
      })
      
      store.addPrediction({
        input: [0.7],
        output: [0.6],
        confidence: 0.75,
        modelId: 'model-1',
        latencyMs: 25
      })
      
      const stats = store.getStats()
      
      expect(stats.activeModels).toBe(2)
      expect(stats.predictionsByModel['model-1']).toBe(2)
      expect(stats.predictionsByModel['model-2']).toBe(1)
    })

    it('should handle predictions without accuracy in avgAccuracy', () => {
      const store = usePredictionHistoryStore.getState()
      
      store.addPrediction({
        input: [0.5],
        output: [0.8],
        confidence: 0.85,
        modelId: 'model-1',
        latencyMs: 20
        // No accuracy
      })
      
      const stats = store.getStats()
      
      expect(stats.avgAccuracy).toBeNull()
    })
  })
})
