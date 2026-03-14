/**
 * Mock WebSocket Server for Testing
 * Provides a controllable WebSocket server for E2E tests
 * 
 * [Ver001.000]
 */

import { WebSocketServer, WebSocket } from 'ws'

export interface MockWebSocketMessage {
  type: string
  data: unknown
  timestamp: number
}

export class MockWebSocketServer {
  private server: WebSocketServer | null = null
  private clients: Set<WebSocket> = new Set()
  private messageHistory: MockWebSocketMessage[] = []
  private port: number

  constructor(port: number = 8080) {
    this.port = port
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = new WebSocketServer({ port: this.port })

      this.server.on('connection', (ws: WebSocket) => {
        this.clients.add(ws)

        ws.on('message', (data: Buffer) => {
          try {
            const message = JSON.parse(data.toString())
            this.messageHistory.push({
              type: message.type || 'unknown',
              data: message,
              timestamp: Date.now()
            })
          } catch (e) {
            // Handle non-JSON messages
            this.messageHistory.push({
              type: 'raw',
              data: data.toString(),
              timestamp: Date.now()
            })
          }
        })

        ws.on('close', () => {
          this.clients.delete(ws)
        })

        // Send initial connection message
        ws.send(JSON.stringify({
          type: 'connected',
          timestamp: Date.now()
        }))
      })

      this.server.on('listening', () => {
        resolve()
      })

      this.server.on('error', (err) => {
        reject(err)
      })
    })
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      this.clients.forEach(client => client.close())
      this.clients.clear()

      if (this.server) {
        this.server.close(() => {
          this.server = null
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  broadcast(message: unknown): void {
    const data = JSON.stringify(message)
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data)
      }
    })
  }

  sendTo(client: WebSocket, message: unknown): void {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message))
    }
  }

  simulateMatchUpdate(matchId: string, data: {
    score?: { teamA: number; teamB: number }
    currentRound?: number
    event?: string
  }): void {
    this.broadcast({
      type: 'match_update',
      matchId,
      data,
      timestamp: Date.now()
    })
  }

  simulatePredictionUpdate(predictionId: string, data: {
    status: 'pending' | 'processing' | 'complete'
    result?: unknown
    confidence?: number
  }): void {
    this.broadcast({
      type: 'prediction_update',
      predictionId,
      data,
      timestamp: Date.now()
    })
  }

  simulateAnalyticsUpdate(metric: string, value: number): void {
    this.broadcast({
      type: 'analytics_update',
      metric,
      value,
      timestamp: Date.now()
    })
  }

  getMessageHistory(): MockWebSocketMessage[] {
    return [...this.messageHistory]
  }

  clearHistory(): void {
    this.messageHistory = []
  }

  getClientCount(): number {
    return this.clients.size
  }

  waitForConnection(timeout: number = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (this.clients.size > 0) {
          clearInterval(checkInterval)
          clearTimeout(timeoutId)
          resolve()
        }
      }, 100)

      const timeoutId = setTimeout(() => {
        clearInterval(checkInterval)
        reject(new Error('Timeout waiting for WebSocket connection'))
      }, timeout)
    })
  }

  waitForMessage(type: string, timeout: number = 5000): Promise<MockWebSocketMessage> {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const message = this.messageHistory.find(m => m.type === type)
        if (message) {
          clearInterval(checkInterval)
          clearTimeout(timeoutId)
          resolve(message)
        }
      }, 100)

      const timeoutId = setTimeout(() => {
        clearInterval(checkInterval)
        reject(new Error(`Timeout waiting for message type: ${type}`))
      }, timeout)
    })
  }
}

// Factory for creating test data
export const createMockMatchUpdate = (overrides?: Partial<{
  matchId: string
  score: { teamA: number; teamB: number }
  currentRound: number
  status: string
}>): unknown => ({
  matchId: overrides?.matchId || `match_${Date.now()}`,
  score: overrides?.score || { teamA: 8, teamB: 7 },
  currentRound: overrides?.currentRound || 16,
  status: overrides?.status || 'live',
  timestamp: Date.now()
})

export const createMockPredictionResult = (overrides?: Partial<{
  predictionId: string
  winner: string
  confidence: number
  features: Record<string, number>
}>): unknown => ({
  predictionId: overrides?.predictionId || `pred_${Date.now()}`,
  winner: overrides?.winner || 'team_a',
  confidence: overrides?.confidence || 0.75,
  features: overrides?.features || {
    winRate: 0.65,
    headToHead: 0.55,
    recentForm: 0.70
  },
  timestamp: Date.now()
})
