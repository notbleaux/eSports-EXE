/**
 * Streaming API - WebSocket client for real-time predictions
 * 
 * [Ver001.001]
 */

import { ML_API } from '../config/api'
import { STREAMING_CONFIG } from '../config/models'
import { streamingLogger } from '../utils/logger'
import { isProduction } from '../config/environment'
import type { StreamDataMessage, StreamPredictionMessage } from './types'

export interface StreamingClientOptions {
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
  onData?: (data: StreamDataMessage) => void
  onPrediction?: (prediction: StreamPredictionMessage) => void
  autoReconnect?: boolean
}

export class StreamingClient {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private reconnectTimeout: NodeJS.Timeout | null = null
  private heartbeatInterval: NodeJS.Timeout | null = null
  private isIntentionallyClosed = false
  private lastUrl: string | null = null
  
  constructor(private options: StreamingClientOptions = {}) {}
  
  /**
   * Enforce WSS protocol for secure connections
   * Forces wss:// in production or when page is served over HTTPS
   */
  private enforceWss(url: string): string {
    const isSecureContext = typeof window !== 'undefined' && window.location.protocol === 'https:'
    const isProd = isProduction()
    
    if (url.startsWith('ws://') && (isProd || isSecureContext)) {
      const secureUrl = url.replace('ws://', 'wss://')
      streamingLogger.warn(`Insecure WebSocket detected. Forcing WSS: ${secureUrl}`)
      return secureUrl
    }
    
    return url
  }
  
  /**
   * Connect to WebSocket
   */
  connect(url?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const rawUrl = url || this.lastUrl || ML_API.streamingLocal
      const wsUrl = this.enforceWss(rawUrl)
      
      // Log warning if still using insecure WebSocket after enforcement
      if (wsUrl.startsWith('ws://')) {
        streamingLogger.warn('Using insecure WebSocket (ws://). Data may be intercepted.')
      }
      
      streamingLogger.info(`Connecting to ${wsUrl}`)
      
      try {
        this.ws = new WebSocket(wsUrl)
        
        // Store URL for potential reconnection with same security enforcement
        this.lastUrl = wsUrl
        
        this.ws.onopen = () => {
          streamingLogger.info('WebSocket connected')
          this.reconnectAttempts = 0
          this.startHeartbeat()
          this.options.onConnect?.()
          resolve()
        }
        
        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            streamingLogger.error('Failed to parse message', error)
          }
        }
        
        this.ws.onerror = (error) => {
          streamingLogger.error('WebSocket error', error)
          this.options.onError?.(new Error('WebSocket error'))
          reject(error)
        }
        
        this.ws.onclose = () => {
          streamingLogger.info('WebSocket closed')
          this.stopHeartbeat()
          this.options.onDisconnect?.()
          
          if (!this.isIntentionallyClosed && this.options.autoReconnect !== false) {
            this.scheduleReconnect()
          }
        }
        
      } catch (error) {
        reject(error)
      }
    })
  }
  
  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.isIntentionallyClosed = true
    this.clearReconnect()
    this.stopHeartbeat()
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
  
  /**
   * Send data to server
   */
  send(data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      streamingLogger.warn('Cannot send, WebSocket not open')
    }
  }
  
  /**
   * Check if connected
   */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
  
  /**
   * Handle incoming message
   */
  private handleMessage(message: unknown): void {
    if (typeof message !== 'object' || message === null) return
    
    const msg = message as Record<string, unknown>
    
    switch (msg.type) {
      case 'data':
        this.options.onData?.(msg.payload as StreamDataMessage)
        break
      case 'prediction':
        this.options.onPrediction?.(msg.payload as StreamPredictionMessage)
        break
      case 'pong':
        // Heartbeat response
        break
      default:
        streamingLogger.debug('Unknown message type', msg.type)
    }
  }
  
  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: 'ping' })
    }, STREAMING_CONFIG.heartbeatIntervalMs)
  }
  
  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }
  
  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= 5) {
      streamingLogger.error('Max reconnection attempts reached')
      return
    }
    
    const delay = Math.min(
      STREAMING_CONFIG.reconnectBaseMs * Math.pow(2, this.reconnectAttempts),
      STREAMING_CONFIG.reconnectMaxMs
    )
    
    streamingLogger.info(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`)
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++
      this.isIntentionallyClosed = false
      this.connect().catch(() => {
        // Reconnection failed, will retry
      })
    }, delay)
  }
  
  /**
   * Clear reconnect timeout
   */
  private clearReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
  }
}

export default StreamingClient
