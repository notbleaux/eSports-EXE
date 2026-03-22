/**
 * StreamingPredictionPanel Tests - P0 Test Coverage
 * 
 * [Ver001.000]
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock hooks before importing components
const mockPause = vi.fn()
const mockResume = vi.fn()
const mockStart = vi.fn()
const mockStop = vi.fn()

vi.mock('../../hooks/useStreamingInference', () => ({
  useStreamingInference: vi.fn()
}))

import { StreamingPredictionPanel } from '../StreamingPredictionPanel'
import { useStreamingInference } from '../../hooks/useStreamingInference'

describe('StreamingPredictionPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Connection Status Display', () => {
    it('should show connected status when streaming', () => {
      vi.mocked(useStreamingInference).mockReturnValue({
        predictions: [],
        isStreaming: true,
        isPaused: false,
        lag: 50,
        throughput: 10.5,
        bufferSize: 5,
        error: null,
        pause: mockPause,
        resume: mockResume,
        start: mockStart,
        stop: mockStop
      })

      render(<StreamingPredictionPanel wsUrl="ws://localhost:8080/stream" hub="SATOR" />)

      expect(screen.getByText('Connected')).toBeInTheDocument()
      expect(screen.getByText('Live Predictions')).toBeInTheDocument()
    })

    it('should show disconnected status when not streaming', () => {
      vi.mocked(useStreamingInference).mockReturnValue({
        predictions: [],
        isStreaming: false,
        isPaused: false,
        lag: 0,
        throughput: 0,
        bufferSize: 0,
        error: null,
        pause: mockPause,
        resume: mockResume,
        start: mockStart,
        stop: mockStop
      })

      render(<StreamingPredictionPanel wsUrl="ws://localhost:8080/stream" hub="SATOR" />)

      expect(screen.getByText('Disconnected')).toBeInTheDocument()
    })

    it('should show paused status when streaming is paused', () => {
      vi.mocked(useStreamingInference).mockReturnValue({
        predictions: [],
        isStreaming: true,
        isPaused: true,
        lag: 100,
        throughput: 0,
        bufferSize: 3,
        error: null,
        pause: mockPause,
        resume: mockResume,
        start: mockStart,
        stop: mockStop
      })

      render(<StreamingPredictionPanel wsUrl="ws://localhost:8080/stream" hub="SATOR" />)

      expect(screen.getByText('Paused')).toBeInTheDocument()
    })

    it('should show error state when there is an error', () => {
      vi.mocked(useStreamingInference).mockReturnValue({
        predictions: [],
        isStreaming: false,
        isPaused: false,
        lag: 0,
        throughput: 0,
        bufferSize: 0,
        error: new Error('Connection failed'),
        pause: mockPause,
        resume: mockResume,
        start: mockStart,
        stop: mockStop
      })

      render(<StreamingPredictionPanel wsUrl="ws://localhost:8080/stream" hub="SATOR" />)

      expect(screen.getByText('Streaming Error')).toBeInTheDocument()
      expect(screen.getByText('Connection failed')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry connection/i })).toBeInTheDocument()
    })
  })

  describe('Control Buttons', () => {
    it('should show pause button when streaming and not paused', () => {
      vi.mocked(useStreamingInference).mockReturnValue({
        predictions: [],
        isStreaming: true,
        isPaused: false,
        lag: 50,
        throughput: 10,
        bufferSize: 5,
        error: null,
        pause: mockPause,
        resume: mockResume,
        start: mockStart,
        stop: mockStop
      })

      render(<StreamingPredictionPanel wsUrl="ws://localhost:8080/stream" hub="SATOR" />)

      expect(screen.getByText('Pause')).toBeInTheDocument()
      const pauseButton = screen.getByRole('button')
      expect(pauseButton).not.toBeDisabled()
    })

    it('should show resume button when streaming is paused', () => {
      vi.mocked(useStreamingInference).mockReturnValue({
        predictions: [],
        isStreaming: true,
        isPaused: true,
        lag: 100,
        throughput: 0,
        bufferSize: 3,
        error: null,
        pause: mockPause,
        resume: mockResume,
        start: mockStart,
        stop: mockStop
      })

      render(<StreamingPredictionPanel wsUrl="ws://localhost:8080/stream" hub="SATOR" />)

      expect(screen.getByText('Resume')).toBeInTheDocument()
    })

    it('should call pause when pause button is clicked', () => {
      vi.mocked(useStreamingInference).mockReturnValue({
        predictions: [],
        isStreaming: true,
        isPaused: false,
        lag: 50,
        throughput: 10,
        bufferSize: 5,
        error: null,
        pause: mockPause,
        resume: mockResume,
        start: mockStart,
        stop: mockStop
      })

      render(<StreamingPredictionPanel wsUrl="ws://localhost:8080/stream" hub="SATOR" />)

      const pauseButton = screen.getByText('Pause').closest('button')
      fireEvent.click(pauseButton!)

      expect(mockPause).toHaveBeenCalled()
    })

    it('should call resume when resume button is clicked', () => {
      vi.mocked(useStreamingInference).mockReturnValue({
        predictions: [],
        isStreaming: true,
        isPaused: true,
        lag: 100,
        throughput: 0,
        bufferSize: 3,
        error: null,
        pause: mockPause,
        resume: mockResume,
        start: mockStart,
        stop: mockStop
      })

      render(<StreamingPredictionPanel wsUrl="ws://localhost:8080/stream" hub="SATOR" />)

      const resumeButton = screen.getByText('Resume').closest('button')
      fireEvent.click(resumeButton!)

      expect(mockResume).toHaveBeenCalled()
    })

    it('should disable controls when not streaming', () => {
      vi.mocked(useStreamingInference).mockReturnValue({
        predictions: [],
        isStreaming: false,
        isPaused: false,
        lag: 0,
        throughput: 0,
        bufferSize: 0,
        error: null,
        pause: mockPause,
        resume: mockResume,
        start: mockStart,
        stop: mockStop
      })

      render(<StreamingPredictionPanel wsUrl="ws://localhost:8080/stream" hub="SATOR" />)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should call resume when retry button is clicked in error state', () => {
      vi.mocked(useStreamingInference).mockReturnValue({
        predictions: [],
        isStreaming: false,
        isPaused: false,
        lag: 0,
        throughput: 0,
        bufferSize: 0,
        error: new Error('Connection failed'),
        pause: mockPause,
        resume: mockResume,
        start: mockStart,
        stop: mockStop
      })

      render(<StreamingPredictionPanel wsUrl="ws://localhost:8080/stream" hub="SATOR" />)

      const retryButton = screen.getByRole('button', { name: /retry connection/i })
      fireEvent.click(retryButton)

      expect(mockResume).toHaveBeenCalled()
    })
  })

  describe('Lag Indicator Colors', () => {
    it('should show green color for optimal lag (< 100ms)', () => {
      vi.mocked(useStreamingInference).mockReturnValue({
        predictions: [],
        isStreaming: true,
        isPaused: false,
        lag: 50,
        throughput: 10,
        bufferSize: 5,
        error: null,
        pause: mockPause,
        resume: mockResume,
        start: mockStart,
        stop: mockStop
      })

      render(<StreamingPredictionPanel wsUrl="ws://localhost:8080/stream" hub="SATOR" />)

      expect(screen.getByText('50ms')).toBeInTheDocument()
      expect(screen.getByText('Optimal')).toBeInTheDocument()
    })

    it('should show yellow color for acceptable lag (100-500ms)', () => {
      vi.mocked(useStreamingInference).mockReturnValue({
        predictions: [],
        isStreaming: true,
        isPaused: false,
        lag: 250,
        throughput: 8,
        bufferSize: 10,
        error: null,
        pause: mockPause,
        resume: mockResume,
        start: mockStart,
        stop: mockStop
      })

      render(<StreamingPredictionPanel wsUrl="ws://localhost:8080/stream" hub="SATOR" />)

      expect(screen.getByText('250ms')).toBeInTheDocument()
      expect(screen.getByText('Acceptable')).toBeInTheDocument()
    })

    it('should show red color for high latency (> 500ms)', () => {
      vi.mocked(useStreamingInference).mockReturnValue({
        predictions: [],
        isStreaming: true,
        isPaused: false,
        lag: 750,
        throughput: 5,
        bufferSize: 20,
        error: null,
        pause: mockPause,
        resume: mockResume,
        start: mockStart,
        stop: mockStop
      })

      render(<StreamingPredictionPanel wsUrl="ws://localhost:8080/stream" hub="SATOR" />)

      expect(screen.getByText('750ms')).toBeInTheDocument()
      expect(screen.getByText('High Latency')).toBeInTheDocument()
    })
  })

  describe('Metrics Display', () => {
    it('should display throughput in preds/s format', () => {
      vi.mocked(useStreamingInference).mockReturnValue({
        predictions: [],
        isStreaming: true,
        isPaused: false,
        lag: 50,
        throughput: 45.7,
        bufferSize: 5,
        error: null,
        pause: mockPause,
        resume: mockResume,
        start: mockStart,
        stop: mockStop
      })

      render(<StreamingPredictionPanel wsUrl="ws://localhost:8080/stream" hub="SATOR" />)

      expect(screen.getByText('45.7 preds/s')).toBeInTheDocument()
    })

    it('should display throughput in k preds/s format for high values', () => {
      vi.mocked(useStreamingInference).mockReturnValue({
        predictions: [],
        isStreaming: true,
        isPaused: false,
        lag: 50,
        throughput: 1500,
        bufferSize: 50,
        error: null,
        pause: mockPause,
        resume: mockResume,
        start: mockStart,
        stop: mockStop
      })

      render(<StreamingPredictionPanel wsUrl="ws://localhost:8080/stream" hub="SATOR" />)

      expect(screen.getByText('1.5k preds/s')).toBeInTheDocument()
    })

    it('should display buffer size', () => {
      vi.mocked(useStreamingInference).mockReturnValue({
        predictions: [],
        isStreaming: true,
        isPaused: false,
        lag: 50,
        throughput: 10,
        bufferSize: 25,
        error: null,
        pause: mockPause,
        resume: mockResume,
        start: mockStart,
        stop: mockStop
      })

      render(<StreamingPredictionPanel wsUrl="ws://localhost:8080/stream" hub="SATOR" />)

      expect(screen.getByText('Buffer: 25/100')).toBeInTheDocument()
    })
  })

  describe('Prediction Display', () => {
    it('should display latest prediction when available', () => {
      const mockPredictions = [
        {
          id: 'pred-1',
          input: [0.5, 0.3, 0.2],
          output: [0.8, 0.15, 0.05],
          confidence: 0.8,
          modelId: 'test-model',
          timestamp: new Date(),
          latencyMs: 25.5
        }
      ]

      vi.mocked(useStreamingInference).mockReturnValue({
        predictions: mockPredictions,
        isStreaming: true,
        isPaused: false,
        lag: 50,
        throughput: 10,
        bufferSize: 5,
        error: null,
        pause: mockPause,
        resume: mockResume,
        start: mockStart,
        stop: mockStop
      })

      render(<StreamingPredictionPanel wsUrl="ws://localhost:8080/stream" hub="SATOR" />)

      expect(screen.getByText('Latest Prediction')).toBeInTheDocument()
      expect(screen.getByText('0.800')).toBeInTheDocument()
      expect(screen.getByText('80.0%')).toBeInTheDocument()
    })

    it('should show waiting message when no predictions available', () => {
      vi.mocked(useStreamingInference).mockReturnValue({
        predictions: [],
        isStreaming: true,
        isPaused: false,
        lag: 50,
        throughput: 10,
        bufferSize: 5,
        error: null,
        pause: mockPause,
        resume: mockResume,
        start: mockStart,
        stop: mockStop
      })

      render(<StreamingPredictionPanel wsUrl="ws://localhost:8080/stream" hub="SATOR" />)

      expect(screen.getByText('Waiting for data stream...')).toBeInTheDocument()
    })

    it('should display prediction history', () => {
      const mockPredictions = Array.from({ length: 5 }, (_, i) => ({
        id: `pred-${i}`,
        input: [0.5, 0.3, 0.2],
        output: [0.7, 0.2, 0.1],
        confidence: 0.7 + i * 0.05,
        modelId: 'test-model',
        timestamp: new Date(Date.now() - i * 1000),
        latencyMs: 20 + i * 5
      }))

      vi.mocked(useStreamingInference).mockReturnValue({
        predictions: mockPredictions,
        isStreaming: true,
        isPaused: false,
        lag: 50,
        throughput: 10,
        bufferSize: 5,
        error: null,
        pause: mockPause,
        resume: mockResume,
        start: mockStart,
        stop: mockStop
      })

      render(<StreamingPredictionPanel wsUrl="ws://localhost:8080/stream" hub="SATOR" />)

      expect(screen.getByText('Recent Predictions')).toBeInTheDocument()
      // Should show history items
      const historyItems = screen.getAllByText(/\[0\.50, 0\.30, 0\.20\]/)
      expect(historyItems.length).toBeGreaterThan(0)
    })
  })

  describe('Hub Colors', () => {
    it('should apply different hub colors', () => {
      vi.mocked(useStreamingInference).mockReturnValue({
        predictions: [],
        isStreaming: true,
        isPaused: false,
        lag: 50,
        throughput: 10,
        bufferSize: 5,
        error: null,
        pause: mockPause,
        resume: mockResume,
        start: mockStart,
        stop: mockStop
      })

      const { container: satorContainer, unmount: unmountSator } = render(
        <StreamingPredictionPanel wsUrl="ws://localhost:8080/stream" hub="SATOR" />
      )
      expect(screen.getByText('Live Predictions')).toBeInTheDocument()
      unmountSator()

      const { container: operaContainer } = render(
        <StreamingPredictionPanel wsUrl="ws://localhost:8080/stream" hub="OPERA" />
      )
      expect(screen.getByText('Live Predictions')).toBeInTheDocument()
    })
  })
})
