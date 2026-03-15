/** [Ver001.000] */
/**
 * Map API
 * =======
 * REST API endpoints for SpecMapViewer map data.
 */

import type { MapGridData } from '../toy-model/types'
import bindGridData from '../toy-model/bind-grid.json'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/v1'

export interface MapMetadata {
  id: string
  name: string
  game: string
  dimensions: { width: number; height: number }
  sites: string[]
  features: string[]
}

export interface LensDataRequest {
  mapId: string
  matchId?: string
  lensTypes: string[]
  timeRange?: { start: number; end: number }
}

export interface PathfindingRequest {
  mapId: string
  start: { x: number; y: number }
  end: { x: number; y: number }
}

/**
 * Get list of available maps
 */
export async function getAvailableMaps(): Promise<MapMetadata[]> {
  return [
    { id: 'bind', name: 'Bind', game: 'Valorant', dimensions: { width: 64, height: 64 }, sites: ['A', 'B'], features: ['teleporters'] },
    { id: 'haven', name: 'Haven', game: 'Valorant', dimensions: { width: 80, height: 80 }, sites: ['A', 'B', 'C'], features: ['three-sites'] },
    { id: 'ascent', name: 'Ascent', game: 'Valorant', dimensions: { width: 72, height: 72 }, sites: ['A', 'B'], features: ['doors'] }
  ]
}

/**
 * Get map grid data
 */
export async function getMapGrid(mapId: string): Promise<MapGridData> {
  if (mapId === 'bind') {
    return bindGridData as unknown as MapGridData
  }
  throw new Error(`Map ${mapId} not found`)
}

/**
 * Find path between two points
 */
export async function findPath(request: PathfindingRequest): Promise<{
  path: Array<{ x: number; y: number }>
  distance: number
}> {
  const dx = request.end.x - request.start.x
  const dy = request.end.y - request.start.y
  return {
    path: [request.start, request.end],
    distance: Math.sqrt(dx * dx + dy * dy)
  }
}

export default { getAvailableMaps, getMapGrid, findPath }
