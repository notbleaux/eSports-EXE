/**
 * useWebSocket - Unified WebSocket Hook with Auto-reconnect and Subscriptions
 * 
 * Features:
 * - Auto-reconnect with exponential backoff
 * - Channel subscription management
 * - Message handling with type safety
 * - Connection status tracking
 * - Token-based authentication
 * - Graceful cleanup on unmount
 * 
 * [Ver001.000] - Initial unified WebSocket hook implementation
 */

// @ts-nocheck
import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { logger } from '../utils/logger'

// Logger for WebSocket operations
const wsLogger = logger.child('WebSocket')

// =============================================================================
// Types
// =============================================================================

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface WebSocketMessage<T = unknown> {
  type: string
  channel?: string
  data: T
  timestamp: string
  error?: string
}

export interface UseWebSocketOptions {
  /** WebSocket URL */
  url: string
  /** Authentication token */
  token?: string
  /** Callback when connection established */
  onConnect?: () => void
  /** Callback when connection closed */
  onDisconnect?: (code?: number, reason?: string) => void
  /** Callback when message received */
  onMessage?: <T>(message: WebSocketMessage<T>) => void
  /** Callback when error occurs */
  onError?: (error: Error) => void
  /** Enable auto-reconnect */
  reconnect?: boolean
  /** Base reconnection interval in ms (default: 1000) */
  reconnectInterval?: number
  /** Maximum reconnection interval in ms (default: 30000) */
  maxReconnectInterval?: number
  /** Maximum reconnection attempts (default: 10, 0 = unlimited) */
  maxReconnectAttempts?: number
  /** Reconnection backoff multiplier (default: 2) */
  reconnectBackoffMultiplier?: number
  /** Heartbeat interval in ms (default: 30000) */
  heartbeatInterval?: number
  /** Connection timeout in ms (default: 10000) */
  connectionTimeout?: number
}

export interface Subscription {
  channel: string
  filters?: Record<string, unknown>
  onMessage?: <T>(data: T) => void
}

export interface UseWebSocketReturn {
  /** Send raw data to server */
  send: (data: unknown) => boolean
  /** Subscribe to a channel */
  subscribe: (channel: string, filters?: Record<string, unknown>, onMessage?: <T>(data: T) => void) => boolean
  /** Unsubscribe from a channel */
  unsubscribe: (channel: string) => boolean
  /** Current connection status */
  status: WebSocketStatus
  /** Whether currently connected */
  isConnected: boolean
  /** Whether currently connecting */
  isConnecting: boolean
  /** Error if connection failed */
  error: Error | null
  /** Active subscriptions */
  subscriptions: string[]
  /** Manually connect */
  connect: () => void
  /** Manually disconnect */
  disconnect: (code?: number, reason?: string) => void
  /** Reconnect manually */
  reconnect: () => void
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_RECONNECT_INTERVAL = 1000
const DEFAULT_MAX_RECONNECT_INTERVAL = 30000
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 10
const DEFAULT_BACKOFF_MULTIPLIER = 2
const DEFAULT_HEARTBEAT_INTERVAL = 30000
const DEFAULT_CONNECTION_TIMEOUT = 10000

// WebSocket close codes
const WS_CLOSE_CODES = {
  NORMAL: 1000,
  GOING_AWAY: 1001,
  PROTOCOL_ERROR: 1002,
  UNSUPPORTED_DATA: 1003,
  NO_STATUS: 1005,
  ABNORMAL: 1006,
  INVALID_DATA: 1007,
  POLICY_VIOLATION: 1008,
  MESSAGE_TOO_BIG: 1009,
  MANDATORY_EXTENSION: 1010,
  INTERNAL_ERROR: 1011,
  SERVICE_RESTART: 1012,
  TRY_AGAIN_LATER: 1013,
  BAD_GATEWAY: 1014
} as const

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Enforce WSS protocol for secure connections
 */
function enforceWss(url: string): string {
  if (typeof window === 'undefined') return url
  
  const isSecureContext = window.location.protocol === 'https:'
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (url.startsWith('ws://') && (isProduction || isSecureContext)) {
    const secureUrl = url.replace('ws://', 'wss://')
    wsLogger.warn(`Insecure WebSocket detected. Forcing WSS: ${secureUrl}`)
    return secureUrl
  }
  
  return url
}

/**
 * Calculate reconnect delay with exponential backoff
 */
function calculateReconnectDelay(
  attempt: number,
  baseInterval: number,
  maxInterval: number,
  multiplier: number
): number {
  const delay = baseInterval * Math.pow(multiplier, attempt)
  return Math.min(delay, maxInterval)
}

/**
 * Add jitter to delay to prevent thundering herd
 */
function addJitter(delay: number): number {
  const jitter = delay * 0.1 * (Math.random() * 2 - 1)
  return Math.max(0, delay + jitter)
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    url,
    token,
    onConnect,
    onDisconnect,
    onMessage,
    onError,
    reconnect = true,
    reconnectInterval = DEFAULT_RECONNECT_INTERVAL,
    maxReconnectInterval = DEFAULT_MAX_RECONNECT_INTERVAL,
    maxReconnectAttempts = DEFAULT_MAX_RECONNECT_ATTEMPTS,
    reconnectBackoffMultiplier = DEFAULT_BACKOFF_MULTIPLIER,
    heartbeatInterval = DEFAULT_HEARTBEAT_INTERVAL,
    connectionTimeout = DEFAULT_CONNECTION_TIMEOUT
  } = options

  // State
  const [status, setStatus] = useState<WebSocketStatus>('disconnected')
  const [error, setError] = useState<Error | null>(null)

  // Refs
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isIntentionallyClosedRef = useRef(false)
  const subscriptionsRef = useRef<Map<string, Subscription>>(new Map())
  const messageHandlersRef = useRef<Map<string, Set<<T>(data: T) => void>>>(new Map())
  const isMountedRef = useRef(true)

  // Computed status
  const isConnected = status === 'connected'
  const isConnecting = status === 'connecting'

  // Memoized secure URL
  const secureUrl = useMemo(() => enforceWss(url), [url])

  // =============================================================================
  // Connection Management
  // =============================================================================

  const clearReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }, [])

  const clearConnectionTimeout = useCallback(() => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current)
      connectionTimeoutRef.current = null
    }
  }, [])

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
  }, [])

  const startHeartbeat = useCallback(() => {
    stopHeartbeat()
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: 'ping' }))
      }
    }, heartbeatInterval)
  }, [heartbeatInterval, stopHeartbeat])

  const scheduleReconnect = useCallback(() => {
    if (!reconnect || isIntentionallyClosedRef.current) {
      return
    }

    // Check max attempts
    if (maxReconnectAttempts > 0 && reconnectAttemptsRef.current >= maxReconnectAttempts) {
      wsLogger.error(`Max reconnection attempts (${maxReconnectAttempts}) reached`)
      setStatus('error')
      setError(new Error(`Failed to connect after ${maxReconnectAttempts} attempts`))
      return
    }

    const delay = addJitter(calculateReconnectDelay(
      reconnectAttemptsRef.current,
      reconnectInterval,
      maxReconnectInterval,
      reconnectBackoffMultiplier
    ))

    wsLogger.info(`Reconnecting in ${Math.round(delay)}ms (attempt ${reconnectAttemptsRef.current + 1})`)

    clearReconnect()
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current++
      connectInternal()
    }, delay)
  }, [
    reconnect,
    maxReconnectAttempts,
    reconnectInterval,
    maxReconnectInterval,
    reconnectBackoffMultiplier,
    clearReconnect
  ])

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketMessage<unknown> = JSON.parse(event.data)
      
      // Call global message handler
      onMessage?.(message)

      // Call channel-specific handlers
      if (message.channel) {
        const handlers = messageHandlersRef.current.get(message.channel)
        if (handlers) {
          handlers.forEach(handler => {
            try {
              handler(message.data)
            } catch (err) {
              wsLogger.error(`Error in channel handler for ${message.channel}:`, err)
            }
          })
        }
      }

      // Handle connection confirmation
      if (message.type === 'connection' && message.data?.status === 'connected') {
        // Resubscribe to all channels on reconnect
        subscriptionsRef.current.forEach((sub, channel) => {
          wsRef.current?.send(JSON.stringify({
            action: 'subscribe',
            channel,
            filters: sub.filters
          }))
        })
      }
    } catch (err) {
      wsLogger.error('Failed to parse WebSocket message:', err)
    }
  }, [onMessage])

  const connectInternal = useCallback(() => {
    if (!isMountedRef.current) return

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setStatus('connecting')
    setError(null)
    isIntentionallyClosedRef.current = false

    wsLogger.info(`Connecting to ${secureUrl}`)

    try {
      // Create WebSocket with token in URL if provided
      let wsUrl = secureUrl
      if (token) {
        const separator = wsUrl.includes('?') ? '&' : '?'
        wsUrl = `${wsUrl}${separator}token=${encodeURIComponent(token)}`
      }

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      // Connection timeout
      clearConnectionTimeout()
      connectionTimeoutRef.current = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          wsLogger.warn('Connection timeout')
          ws.close()
          setError(new Error('Connection timeout'))
          scheduleReconnect()
        }
      }, connectionTimeout)

      ws.onopen = () => {
        if (!isMountedRef.current) {
          ws.close()
          return
        }

        clearConnectionTimeout()
        reconnectAttemptsRef.current = 0
        setStatus('connected')
        setError(null)
        startHeartbeat()
        onConnect?.()
        wsLogger.info('WebSocket connected')
      }

      ws.onmessage = handleMessage

      ws.onerror = (event) => {
        wsLogger.error('WebSocket error:', event)
        const error = new Error('WebSocket connection error')
        setError(error)
        onError?.(error)
      }

      ws.onclose = (event) => {
        clearConnectionTimeout()
        stopHeartbeat()
        setStatus('disconnected')
        onDisconnect?.(event.code, event.reason)
        wsLogger.info(`WebSocket closed: ${event.code} - ${event.reason || 'No reason'}`)

        // Don't reconnect if intentionally closed
        if (!isIntentionallyClosedRef.current && event.code !== WS_CLOSE_CODES.NORMAL) {
          scheduleReconnect()
        }
      }
    } catch (err) {
      wsLogger.error('Failed to create WebSocket:', err)
      const error = err instanceof Error ? err : new Error('Failed to create WebSocket')
      setError(error)
      setStatus('error')
      onError?.(error)
      scheduleReconnect()
    }
  }, [
    secureUrl,
    token,
    connectionTimeout,
    onConnect,
    onDisconnect,
    onError,
    handleMessage,
    startHeartbeat,
    stopHeartbeat,
    clearConnectionTimeout,
    scheduleReconnect
  ])

  // =============================================================================
  // Public Methods
  // =============================================================================

  const connect = useCallback(() => {
    if (status === 'connected' || status === 'connecting') {
      wsLogger.warn('Already connected or connecting')
      return
    }
    reconnectAttemptsRef.current = 0
    connectInternal()
  }, [status, connectInternal])

  const disconnect = useCallback((code: number = WS_CLOSE_CODES.NORMAL, reason?: string) => {
    isIntentionallyClosedRef.current = true
    clearReconnect()
    clearConnectionTimeout()
    stopHeartbeat()

    if (wsRef.current) {
      wsRef.current.close(code, reason)
      wsRef.current = null
    }

    setStatus('disconnected')
    wsLogger.info('WebSocket manually disconnected')
  }, [clearReconnect, clearConnectionTimeout, stopHeartbeat])

  const performReconnect = useCallback(() => {
    disconnect()
    reconnectAttemptsRef.current = 0
    setTimeout(connectInternal, 100)
  }, [disconnect, connectInternal])

  const send = useCallback((data: unknown): boolean => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      wsLogger.warn('Cannot send, WebSocket not open')
      return false
    }

    try {
      wsRef.current.send(JSON.stringify(data))
      return true
    } catch (err) {
      wsLogger.error('Failed to send message:', err)
      return false
    }
  }, [])

  const subscribe = useCallback((
    channel: string,
    filters?: Record<string, unknown>,
    onMessageCallback?: <T>(data: T) => void
  ): boolean => {
    // Store subscription
    subscriptionsRef.current.set(channel, { channel, filters, onMessage: onMessageCallback })

    // Register message handler if provided
    if (onMessageCallback) {
      if (!messageHandlersRef.current.has(channel)) {
        messageHandlersRef.current.set(channel, new Set())
      }
      messageHandlersRef.current.get(channel)!.add(onMessageCallback)
    }

    // Send subscribe message if connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return send({ action: 'subscribe', channel, filters })
    }

    return true
  }, [send])

  const unsubscribe = useCallback((channel: string): boolean => {
    // Remove subscription
    subscriptionsRef.current.delete(channel)
    messageHandlersRef.current.delete(channel)

    // Send unsubscribe message if connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return send({ action: 'unsubscribe', channel })
    }

    return true
  }, [send])

  // =============================================================================
  // Lifecycle
  // =============================================================================

  // Auto-connect on mount if URL provided
  useEffect(() => {
    if (secureUrl) {
      connectInternal()
    }

    return () => {
      isMountedRef.current = false
      disconnect(WS_CLOSE_CODES.GOING_AWAY, 'Component unmounted')
      
      // Clear all handlers
      subscriptionsRef.current.clear()
      messageHandlersRef.current.clear()
    }
  }, [secureUrl, connectInternal, disconnect]) // Include all dependencies

  // Reconnect when URL or token changes
  useEffect(() => {
    if (wsRef.current && status !== 'disconnected') {
      wsLogger.info('URL or token changed, reconnecting...')
      performReconnect()
    }
  }, [secureUrl, token])

  // Computed subscriptions list
  const subscriptions = useMemo(() => 
    Array.from(subscriptionsRef.current.keys()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status] // Recompute when status changes (subscriptions may have changed)
  )

  return {
    send,
    subscribe,
    unsubscribe,
    status,
    isConnected,
    isConnecting,
    error,
    subscriptions,
    connect,
    disconnect,
    reconnect: performReconnect
  }
}

export default useWebSocket
