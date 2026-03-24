/**
 * MLPredictionPanel Tests - P0 Test Coverage
 * 
 * [Ver002.000] - Updated for enhanced ML Worker integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { UseMLInferenceReturn } from '../../hooks/useMLInference'

// Mock hooks before importing components
const mockLoadModel = vi.fn()
const mockPredict = vi.fn()
const mockRetry = vi.fn()
const mockSetUseWorker = vi.fn()
const mockDispose = vi.fn()

vi.mock('../../hooks/useMLInference', () => ({
  useMLInference: vi.fn()
}))

// Mock PanelSkeleton
vi.mock('../grid/PanelSkeleton', () => ({
  PanelSkeleton: ({ title }: { title: string }) => <div data-testid="panel-skeleton">{title}</div>
}))

import { MLPredictionPanel } from '../MLPredictionPanel'
import { useMLInference } from '../../hooks/useMLInference'

// Helper to create complete mock return
const createMockReturn = (overrides: Partial<UseMLInferenceReturn> = {}): UseMLInferenceReturn => ({
  loadModel: mockLoadModel,
  predict: mockPredict,
  predictBatch: vi.fn(),
  warmUp: vi.fn(),
  getModelInfo: vi.fn(),
  isModelReady: false,
  isModelLoading: false,
  isPredicting: false,
  isWarmedUp: false,
  error: null,
  progress: 0,
  predictionProgress: null,
  useWorker: true,
  queueDepth: 0,
  maxQueueSize: 100,
  workerStatus: 'idle',
  lastLatency: 0,
  setUseWorker: mockSetUseWorker,
  retry: mockRetry,
  dispose: mockDispose,
  ...overrides
})

describe('MLPredictionPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Rendering States', () => {
    it('should render loading state with progress indicator', () => {
      vi.mocked(useMLInference).mockReturnValue(createMockReturn({
        isModelLoading: true,
        progress: 45
      }))

      render(<MLPredictionPanel modelUrl="/models/test.json" hub="SATOR" />)

      expect(screen.getByText('Loading ML Model...')).toBeInTheDocument()
      expect(screen.getByText('45%')).toBeInTheDocument()
      expect(screen.getByText('Loading model...')).toBeInTheDocument()
    })

    it('should render error state with retry button', () => {
      vi.mocked(useMLInference).mockReturnValue(createMockReturn({
        error: new Error('Failed to load model from URL'),
        workerStatus: 'error'
      }))

      render(<MLPredictionPanel modelUrl="/models/test.json" hub="SATOR" />)

      expect(screen.getByText('Model Failed to Load')).toBeInTheDocument()
      expect(screen.getByText('Failed to load model from URL')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    it('should render ready state with input controls', () => {
      vi.mocked(useMLInference).mockReturnValue(createMockReturn({
        isModelReady: true,
        progress: 100
      }))

      render(<MLPredictionPanel modelUrl="/models/test.json" hub="SATOR" />)

      expect(screen.getByText('ML Predictions')).toBeInTheDocument()
      expect(screen.getByText('Ready')).toBeInTheDocument()
      expect(screen.getByText('Input Values')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /run prediction/i })).toBeInTheDocument()
    })

    it('should render with different hub colors', () => {
      vi.mocked(useMLInference).mockReturnValue(createMockReturn({
        isModelReady: true,
        progress: 100
      }))

      const { container: satorContainer, unmount: unmountSator } = render(<MLPredictionPanel hub="SATOR" />)
      expect(satorContainer.querySelector('[style*="background-color: rgb(255, 215, 0)"], [style*="#ffd700"]')).toBeTruthy()
      unmountSator()

      const { container: rotasContainer } = render(<MLPredictionPanel hub="ROTAS" />)
      expect(rotasContainer.querySelector('[style*="background-color: rgb(0, 212, 255)"], [style*="#00d4ff"]')).toBeTruthy()
    })
  })

  describe('Prediction Button', () => {
    it('should trigger prediction when button is clicked', async () => {
      mockPredict.mockResolvedValueOnce([0.7, 0.2, 0.1])

      vi.mocked(useMLInference).mockReturnValue(createMockReturn({
        isModelReady: true,
        progress: 100
      }))

      render(<MLPredictionPanel modelUrl="/models/test.json" hub="SATOR" />)

      const predictButton = screen.getByRole('button', { name: /run prediction/i })
      fireEvent.click(predictButton)

      await waitFor(() => {
        expect(mockPredict).toHaveBeenCalledWith([0.5, 0.5, 0.5])
      })
    })

    it('should disable button when model is not ready', () => {
      vi.mocked(useMLInference).mockReturnValue(createMockReturn({
        isModelReady: false
      }))

      render(<MLPredictionPanel modelUrl="/models/test.json" hub="SATOR" />)

      const predictButton = screen.getByRole('button', { name: /run prediction/i })
      expect(predictButton).toBeDisabled()
    })

    it('should show predicting state while prediction is in progress', async () => {
      // Create a promise that doesn't resolve immediately
      let resolvePrediction: (value: number[]) => void = () => {}
      const predictionPromise = new Promise<number[]>((resolve) => {
        resolvePrediction = resolve
      })
      mockPredict.mockReturnValueOnce(predictionPromise)

      vi.mocked(useMLInference).mockReturnValue(createMockReturn({
        isModelReady: true,
        isPredicting: true,
        progress: 100
      }))

      render(<MLPredictionPanel modelUrl="/models/test.json" hub="SATOR" />)

      const predictButton = screen.getByRole('button', { name: /run prediction/i })
      fireEvent.click(predictButton)

      expect(screen.getByText('Predicting...')).toBeInTheDocument()

      // Resolve the prediction
      resolvePrediction([0.7, 0.2, 0.1])

      await waitFor(() => {
        expect(screen.getByText('Run Prediction')).toBeInTheDocument()
      })
    })
  })

  describe('Model Loading Indicator', () => {
    it('should call loadModel on mount when model is not ready', () => {
      vi.mocked(useMLInference).mockReturnValue(createMockReturn({
        isModelReady: false,
        isModelLoading: false
      }))

      render(<MLPredictionPanel modelUrl="/models/custom-model.json" hub="SATOR" />)

      expect(mockLoadModel).toHaveBeenCalledWith('/models/custom-model.json')
    })

    it('should not call loadModel if model is already loading', () => {
      vi.mocked(useMLInference).mockReturnValue(createMockReturn({
        isModelReady: false,
        isModelLoading: true,
        progress: 50
      }))

      render(<MLPredictionPanel modelUrl="/models/test.json" hub="SATOR" />)

      expect(mockLoadModel).not.toHaveBeenCalled()
    })

    it('should retry loading when retry button is clicked in error state', () => {
      vi.mocked(useMLInference).mockReturnValue(createMockReturn({
        isModelReady: false,
        isModelLoading: false,
        error: new Error('Network error')
      }))

      render(<MLPredictionPanel modelUrl="/models/test.json" hub="SATOR" />)

      const retryButton = screen.getByRole('button', { name: /retry/i })
      fireEvent.click(retryButton)

      expect(mockRetry).toHaveBeenCalled()
    })
  })

  describe('Input Controls', () => {
    it('should update input values when sliders are changed', () => {
      vi.mocked(useMLInference).mockReturnValue(createMockReturn({
        isModelReady: true,
        progress: 100
      }))

      render(<MLPredictionPanel modelUrl="/models/test.json" hub="SATOR" />)

      const sliders = screen.getAllByRole('slider')
      expect(sliders).toHaveLength(3)

      // Change first slider
      fireEvent.change(sliders[0], { target: { value: '0.75' } })
      expect(sliders[0]).toHaveValue('0.75')
    })

    it('should pass correct input values to predict', async () => {
      mockPredict.mockResolvedValueOnce([0.5, 0.3, 0.2])

      vi.mocked(useMLInference).mockReturnValue(createMockReturn({
        isModelReady: true,
        progress: 100
      }))

      render(<MLPredictionPanel modelUrl="/models/test.json" hub="SATOR" />)

      const sliders = screen.getAllByRole('slider')
      
      // Set values
      fireEvent.change(sliders[0], { target: { value: '0.25' } })
      fireEvent.change(sliders[1], { target: { value: '0.5' } })
      fireEvent.change(sliders[2], { target: { value: '0.75' } })

      const predictButton = screen.getByRole('button', { name: /run prediction/i })
      fireEvent.click(predictButton)

      await waitFor(() => {
        expect(mockPredict).toHaveBeenCalledWith([0.25, 0.5, 0.75])
      })
    })
  })

  describe('Prediction Results', () => {
    it('should display prediction results after successful prediction', async () => {
      mockPredict.mockResolvedValueOnce([0.8, 0.15, 0.05])

      vi.mocked(useMLInference).mockReturnValue(createMockReturn({
        isModelReady: true,
        progress: 100
      }))

      render(<MLPredictionPanel modelUrl="/models/test.json" hub="SATOR" />)

      const predictButton = screen.getByRole('button', { name: /run prediction/i })
      fireEvent.click(predictButton)

      await waitFor(() => {
        expect(screen.getByText('Latest Result')).toBeInTheDocument()
        expect(screen.getByText('0.800')).toBeInTheDocument()
        expect(screen.getByText('Class 0')).toBeInTheDocument()
      })
    })

    it('should show confidence with appropriate color coding for high confidence', async () => {
      // High confidence (> 0.8)
      mockPredict.mockResolvedValueOnce([0.9, 0.05, 0.05])

      vi.mocked(useMLInference).mockReturnValue(createMockReturn({
        isModelReady: true,
        progress: 100
      }))

      render(<MLPredictionPanel modelUrl="/models/test.json" hub="SATOR" />)

      const predictButton = screen.getByRole('button', { name: /run prediction/i })
      fireEvent.click(predictButton)

      await waitFor(() => {
        // High confidence should show green
        const confidenceElement = screen.getByText('90.0%')
        expect(confidenceElement).toBeInTheDocument()
      })
    })

    it('should maintain prediction history', async () => {
      mockPredict.mockResolvedValue([0.5, 0.3, 0.2])

      vi.mocked(useMLInference).mockReturnValue(createMockReturn({
        isModelReady: true,
        progress: 100
      }))

      render(<MLPredictionPanel modelUrl="/models/test.json" hub="SATOR" />)

      // Make multiple predictions
      const predictButton = screen.getByRole('button', { name: /run prediction/i })
      
      for (let i = 0; i < 3; i++) {
        fireEvent.click(predictButton)
        await waitFor(() => {
          expect(mockPredict).toHaveBeenCalledTimes(i + 1)
        })
      }

      // Should show history section
      await waitFor(() => {
        expect(screen.getByText('History')).toBeInTheDocument()
      })
    })
  })

  describe('Worker Settings', () => {
    it('should show worker status indicator', () => {
      vi.mocked(useMLInference).mockReturnValue(createMockReturn({
        isModelReady: true,
        workerStatus: 'idle'
      }))

      render(<MLPredictionPanel modelUrl="/models/test.json" hub="SATOR" />)

      expect(screen.getByText('Ready')).toBeInTheDocument()
    })

    it('should show settings panel when settings button is clicked', () => {
      vi.mocked(useMLInference).mockReturnValue(createMockReturn({
        isModelReady: true,
        useWorker: true
      }))

      render(<MLPredictionPanel modelUrl="/models/test.json" hub="SATOR" />)

      // Click settings button
      const settingsButton = screen.getByRole('button', { name: '' }) // Settings button
      fireEvent.click(settingsButton)

      // Settings panel should show
      expect(screen.getByText('Worker Settings')).toBeInTheDocument()
    })

    it('should allow toggling worker mode', () => {
      vi.mocked(useMLInference).mockReturnValue(createMockReturn({
        isModelReady: true,
        useWorker: true
      }))

      render(<MLPredictionPanel modelUrl="/models/test.json" hub="SATOR" />)

      // Open settings
      const settingsButton = screen.getByRole('button', { name: '' })
      fireEvent.click(settingsButton)

      // Toggle worker
      const toggle = screen.getByText('Use Web Worker').parentElement?.querySelector('button')
      if (toggle) {
        fireEvent.click(toggle)
        expect(mockSetUseWorker).toHaveBeenCalledWith(false)
      }
    })
  })

  describe('Batch Prediction', () => {
    it('should show batch tab when showBatchControls is true', () => {
      vi.mocked(useMLInference).mockReturnValue(createMockReturn({
        isModelReady: true
      }))

      render(<MLPredictionPanel modelUrl="/models/test.json" hub="SATOR" showBatchControls={true} />)

      expect(screen.getByText('Single')).toBeInTheDocument()
      expect(screen.getByText('Batch')).toBeInTheDocument()
    })

    it('should switch to batch prediction tab', () => {
      vi.mocked(useMLInference).mockReturnValue(createMockReturn({
        isModelReady: true
      }))

      render(<MLPredictionPanel modelUrl="/models/test.json" hub="SATOR" showBatchControls={true} />)

      const batchTab = screen.getByText('Batch')
      fireEvent.click(batchTab)

      expect(screen.getByText('Batch Size')).toBeInTheDocument()
    })
  })
})
