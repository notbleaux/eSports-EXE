/**
 * Data Stream Worker - WebSocket Data Streaming with Circular Buffer
 * Handles real-time data ingestion, validation, and buffering for ML inference
 * 
 * [Ver001.000]
 */

// ============================================================================
// MESSAGE PROTOCOL TYPES
// ============================================================================

export interface StreamData {
  id: string
  features: number[]
  timestamp: number
}

export interface PredictionResult {
  id: string
  input: number[]
  output: number[]
  confidence: number
  modelId: string
  timestamp: Date
  latencyMs: number
}

export type DataStreamCommand =
  | { type: 'CONNECT'; url: string }
  | { type: 'DISCONNECT' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'CLEAR_BUFFER' }

export type DataStreamResponse =
  | { type: 'CONNECTED'; url: string; timestamp: number }
  | { type: 'DISCONNECTED'; timestamp: number }
  | { type: 'DATA'; data: StreamData }
  | { type: 'BUFFER_STATUS'; size: number; maxSize: number }
  | { type: 'PAUSED' }
  | { type: 'RESUMED' }
  | { type: 'ERROR'; error: string; code?: string }
  | { type: 'RECONNECTING'; attempt: number; delayMs: number }
  | { type: 'READY'; timestamp: number }

// ============================================================================
// WORKER STATE
// ============================================================================

interface WorkerState {
  ws: WebSocket | null
  url: string | null
  isConnected: boolean
  isPaused: boolean
  buffer: StreamData[]
  maxBufferSize: number
  reconnectAttempts: number
  reconnectTimeoutId: ReturnType<typeof setTimeout> | null
  maxReconnectDelay: number
  baseReconnectDelay: number
}

const state: WorkerState = {
  ws: null,
  url: null,
  isConnected: false,
  isPaused: false,
  buffer: [],
  maxBufferSize: 100,
  reconnectAttempts: 0,
  reconnectTimeoutId: null,
  maxReconnectDelay: 30000,
  baseReconnectDelay: 1000
}

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

/**
 * Validate incoming data matches StreamData schema
 */
function validateStreamData(data: unknown): data is StreamData {
  if (typeof data !== 'object' || data === null) {
    return false
  }

  const obj = data as Record<string, unknown>

  // Check id: string
  if (typeof obj.id !== 'string' || obj.id.length === 0) {
    return false
  }

  // Check features: number[]
  if (!Array.isArray(obj.features)) {
    return false
  }
  if (!obj.features.every((v) => typeof v === 'number' && !isNaN(v))) {
    return false
  }

  // Check timestamp: number
  if (typeof obj.timestamp !== 'number' || obj.timestamp <= 0) {
    return false
  }

  return true
}

// ============================================================================
// CIRCULAR BUFFER OPERATIONS
// ============================================================================

/**
 * Add data to circular buffer, removing oldest if at capacity
 */
function addToBuffer(data: StreamData): void {
  if (state.buffer.length >= state.maxBufferSize) {
    // Remove oldest item (first in array)
    state.buffer.shift()
  }
  state.buffer.push(data)

  // Notify main thread of buffer status
  postMessage({
    type: 'BUFFER_STATUS',
    size: state.buffer.length,
    maxSize: state.maxBufferSize
  } as DataStreamResponse)
}

/**
 * Clear the circular buffer
 */
function clearBuffer(): void {
  state.buffer = []
  postMessage({
    type: 'BUFFER_STATUS',
    size: 0,
    maxSize: state.maxBufferSize
  } as DataStreamResponse)
}

// ============================================================================
// RECONNECTION LOGIC
// ============================================================================

/**
 * Calculate exponential backoff delay
 * Sequence: 1s, 2s, 4s, 8s, 16s, 30s (max)
 */
function getReconnectDelay(): number {
  const delay = state.baseReconnectDelay * Math.pow(2, state.reconnectAttempts)
  return Math.min(delay, state.maxReconnectDelay)
}

/**
 * Schedule reconnection with exponential backoff
 */
function scheduleReconnect(): void {
  // Clear any existing timeout
  if (state.reconnectTimeoutId) {
    clearTimeout(state.reconnectTimeoutId)
    state.reconnectTimeoutId = null
  }

  const delay = getReconnectDelay()
  state.reconnectAttempts++

  postMessage({
    type: 'RECONNECTING',
    attempt: state.reconnectAttempts,
    delayMs: delay
  } as DataStreamResponse)

  state.reconnectTimeoutId = setTimeout(() => {
    if (state.url && !state.isConnected) {
      connect(state.url)
    }
  }, delay)
}

/**
 * Reset reconnection state on successful connection
 */
function resetReconnectState(): void {
  state.reconnectAttempts = 0
  if (state.reconnectTimeoutId) {
    clearTimeout(state.reconnectTimeoutId)
    state.reconnectTimeoutId = null
  }
}

// ============================================================================
// WEBSOCKET OPERATIONS
// ============================================================================

/**
 * Establish WebSocket connection
 */
function connect(url: string): void {
  // Close existing connection if any
  if (state.ws) {
    state.ws.close()
    state.ws = null
  }

  state.url = url

  try {
    state.ws = new WebSocket(url)

    state.ws.onopen = () => {
      state.isConnected = true
      resetReconnectState()

      postMessage({
        type: 'CONNECTED',
        url,
        timestamp: Date.now()
      } as DataStreamResponse)
    }

    state.ws.onmessage = (event: MessageEvent) => {
      if (state.isPaused) {
        return // Drop data while paused
      }

      try {
        const parsed = JSON.parse(event.data) as unknown

        if (validateStreamData(parsed)) {
          // Add to buffer
          addToBuffer(parsed)

          // Send to main thread for ML prediction
          postMessage({
            type: 'DATA',
            data: parsed
          } as DataStreamResponse)
        } else {
          // Invalid data schema received, dropping
        }
      } catch (err) {
        // Failed to parse message, dropping
      }
    }

    state.ws.onclose = (event: CloseEvent) => {
      state.isConnected = false

      postMessage({
        type: 'DISCONNECTED',
        timestamp: Date.now()
      } as DataStreamResponse)

      // Attempt reconnection unless it was a clean close initiated by us
      if (!event.wasClean && state.url) {
        scheduleReconnect()
      }
    }

    state.ws.onerror = (event: Event) => {
      // WebSocket error handled via ERROR message

      postMessage({
        type: 'ERROR',
        error: 'WebSocket connection error',
        code: 'WS_ERROR'
      } as DataStreamResponse)
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown connection error'

    postMessage({
      type: 'ERROR',
      error: errorMsg,
      code: 'CONNECTION_FAILED'
    } as DataStreamResponse)

    // Schedule reconnection
    scheduleReconnect()
  }
}

/**
 * Disconnect WebSocket and cleanup
 */
function disconnect(): void {
  // Clear any pending reconnection
  if (state.reconnectTimeoutId) {
    clearTimeout(state.reconnectTimeoutId)
    state.reconnectTimeoutId = null
  }

  // Close WebSocket
  if (state.ws) {
    state.ws.close()
    state.ws = null
  }

  state.isConnected = false
  state.url = null
  state.reconnectAttempts = 0

  postMessage({
    type: 'DISCONNECTED',
    timestamp: Date.now()
  } as DataStreamResponse)
}

/**
 * Pause data processing (keep connection alive)
 */
function pause(): void {
  state.isPaused = true
  postMessage({ type: 'PAUSED' } as DataStreamResponse)
}

/**
 * Resume data processing
 */
function resume(): void {
  state.isPaused = false
  postMessage({ type: 'RESUMED' } as DataStreamResponse)
}

// ============================================================================
// MESSAGE HANDLER
// ============================================================================

self.onmessage = (event: MessageEvent<DataStreamCommand>) => {
  const command = event.data

  switch (command.type) {
    case 'CONNECT':
      connect(command.url)
      break

    case 'DISCONNECT':
      disconnect()
      break

    case 'PAUSE':
      pause()
      break

    case 'RESUME':
      resume()
      break

    case 'CLEAR_BUFFER':
      clearBuffer()
      break

    default:
      // Unknown command received
  }
}

// ============================================================================
// WORKER READY SIGNAL
// ============================================================================

postMessage({
  type: 'READY',
  timestamp: Date.now()
} as DataStreamResponse)

// Data Stream Worker initialized
