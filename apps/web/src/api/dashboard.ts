/**
 * Dashboard API - Real-time analytics WebSocket
 * 
 * [Ver001.000]
 */

import { ANALYTICS_ENDPOINTS } from '../config/analytics'
import { logger } from '../utils/logger'
import type { DashboardData } from './analytics'

const dashboardLogger = logger.child('Dashboard')

export interface DashboardSubscriber {
  onData: (data: DashboardData) => void
  onError?: (error: Error) => void
  onConnect?: () => void
  onDisconnect?: () => void
}

export class DashboardWebSocket {
  private ws: WebSocket | null = null
  private subscribers: Set<DashboardSubscriber> = new Set()
  private reconnectAttempts = 0
  private reconnectTimeout: NodeJS.Timeout | null = null
  private isIntentionallyClosed = false

  /**
   * Connect to dashboard WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      this.isIntentionallyClosed = false
      
      const url = ANALYTICS_ENDPOINTS.dashboard
      dashboardLogger.info(`Connecting to dashboard: ${url}`)

      try {
        this.ws = new WebSocket(url)

        this.ws.onopen = () => {
          dashboardLogger.info('Dashboard connected')
          this.reconnectAttempts = 0
          this.subscribers.forEach(s => s.onConnect?.())
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const data: DashboardData = JSON.parse(event.data)
            this.subscribers.forEach(s => s.onData(data))
          } catch (error) {
            dashboardLogger.error('Failed to parse dashboard data', error)
          }
        }

        this.ws.onerror = (error) => {
          dashboardLogger.error('Dashboard error', error)
          this.subscribers.forEach(s => s.onError?.(new Error('WebSocket error')))
          reject(error)
        }

        this.ws.onclose = () => {
          dashboardLogger.info('Dashboard disconnected')
          this.subscribers.forEach(s => s.onDisconnect?.())

          if (!this.isIntentionallyClosed) {
            this.scheduleReconnect()
          }
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Disconnect from dashboard
   */
  disconnect(): void {
    this.isIntentionallyClosed = true
    this.clearReconnect()

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  /**
   * Subscribe to dashboard updates
   */
  subscribe(subscriber: DashboardSubscriber): () => void {
    this.subscribers.add(subscriber)
    
    // Auto-connect if not connected
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connect().catch(() => {
        // Connection failed, will retry
      })
    }

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(subscriber)
      
      // Disconnect if no more subscribers
      if (this.subscribers.size === 0) {
        this.disconnect()
      }
    }
  }

  /**
   * Check if connected
   */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= 5) {
      dashboardLogger.error('Max reconnection attempts reached')
      return
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
    
    dashboardLogger.info(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`)

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

// Singleton instance
export const dashboardWs = new DashboardWebSocket()

export default dashboardWs
