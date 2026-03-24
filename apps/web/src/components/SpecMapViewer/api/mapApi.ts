/** [Ver002.000] - Connected to backend API */
/**
 * Map API
 * =======
 * REST API endpoints for SpecMapViewer map data.
 * 
 * Base URL: VITE_API_URL or http://localhost:8000/api
 */

import type { MapGridData } from '../toy-model/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// HTTP client with error handling
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

export interface MapMetadata {
  id: string
  name: string
  dimensions: { width: number; height: number }
  sites: Array<{ name: string; x: number; y: number; type?: string }>
  callouts: Array<{ name: string; region: string }>
  thumbnail_url?: string
}

export interface LensDataRequest {
  lens_types: string[]
  region?: { x: number; y: number; width: number; height: number }
  timestamp?: number
}

export interface LensDataResponse {
  map_id: string
  lens_types: string[]
  lens_data: Record<string, unknown>
  timestamp: string
  update_interval: number
}

export interface PathfindingRequest {
  map_id: string
  start: { x: number; y: number }
  end: { x: number; y: number }
  avoid_chokepoints?: boolean
  team?: 'attack' | 'defend'
}

export interface PathfindingResponse {
  path: Array<{ x: number; y: number }>
  distance: number
  estimated_time: number
  difficulty: 'easy' | 'medium' | 'hard'
  alternative_paths?: Array<Array<{ x: number; y: number }>>
}

/**
 * Get list of available maps
 */
export async function getAvailableMaps(): Promise<MapMetadata[]> {
  return apiFetch<MapMetadata[]>('/maps')
}

/**
 * Get metadata for a specific map
 */
export async function getMap(mapId: string): Promise<MapMetadata> {
  return apiFetch<MapMetadata>(`/maps/${mapId}`)
}

/**
 * Get map grid data for rendering
 */
export async function getMapGrid(mapId: string): Promise<MapGridData> {
  return apiFetch<MapGridData>(`/maps/${mapId}/grid`)
}

/**
 * Get lens overlay data for a map
 */
export async function getLensData(
  mapId: string, 
  request: LensDataRequest
): Promise<LensDataResponse> {
  return apiFetch<LensDataResponse>(`/maps/${mapId}/lens-data`, {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

/**
 * Find path between two points on a map
 */
export async function findPath(request: PathfindingRequest): Promise<PathfindingResponse> {
  return apiFetch<PathfindingResponse>('/maps/pathfind', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

// ============================================================================
// WebSocket Client
// ============================================================================

export type LensUpdateCallback = (update: {
  type: string
  map_id: string
  lens_type?: string
  data: unknown
  timestamp: string
}) => void

export class LensWebSocketClient {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private messageHandlers: Map<string, LensUpdateCallback[]> = new Map()
  private onConnectCallbacks: (() => void)[] = []
  private onDisconnectCallbacks: (() => void)[] = []

  constructor(private url: string = 'ws://localhost:8000/ws/lens-updates') {}

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    this.ws = new WebSocket(this.url)

    this.ws.onopen = () => {
      console.log('[LensWebSocket] Connected')
      this.reconnectAttempts = 0
      this.onConnectCallbacks.forEach(cb => cb())
    }

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        this.handleMessage(message)
      } catch (e) {
        console.error('[LensWebSocket] Failed to parse message:', e)
      }
    }

    this.ws.onclose = () => {
      console.log('[LensWebSocket] Disconnected')
      this.onDisconnectCallbacks.forEach(cb => cb())
      this.attemptReconnect()
    }

    this.ws.onerror = (error) => {
      console.error('[LensWebSocket] Error:', error)
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[LensWebSocket] Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`[LensWebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
    
    setTimeout(() => {
      this.connect()
    }, delay)
  }

  private handleMessage(message: unknown): void {
    if (typeof message !== 'object' || message === null) return
    
    const msg = message as Record<string, unknown>
    const type = msg.type as string
    
    if (type === 'lens_update') {
      const mapId = msg.map_id as string
      const handlers = this.messageHandlers.get(mapId) || []
      handlers.forEach(cb => cb(msg as Parameters<LensUpdateCallback>[0]))
    }
  }

  subscribe(mapId: string, lensTypes: string[], onUpdate: LensUpdateCallback): void {
    // Register handler
    if (!this.messageHandlers.has(mapId)) {
      this.messageHandlers.set(mapId, [])
    }
    this.messageHandlers.get(mapId)!.push(onUpdate)

    // Send subscribe message
    this.send({
      action: 'subscribe',
      map_id: mapId,
      lens_types: lensTypes,
    })
  }

  unsubscribe(mapId: string, onUpdate?: LensUpdateCallback): void {
    if (onUpdate) {
      const handlers = this.messageHandlers.get(mapId) || []
      const index = handlers.indexOf(onUpdate)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    } else {
      this.messageHandlers.delete(mapId)
    }

    this.send({
      action: 'unsubscribe',
      map_id: mapId,
    })
  }

  onConnect(callback: () => void): void {
    this.onConnectCallbacks.push(callback)
  }

  onDisconnect(callback: () => void): void {
    this.onDisconnectCallbacks.push(callback)
  }

  private send(data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  disconnect(): void {
    this.ws?.close()
    this.ws = null
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// Singleton instance for app-wide use
export const lensWebSocket = new LensWebSocketClient()

export default {
  getAvailableMaps,
  getMap,
  getMapGrid,
  getLensData,
  findPath,
  LensWebSocketClient,
  lensWebSocket,
}
