/** [Ver001.000] */
/**
 * Dimension System Types
 * ======================
 * Type definitions for 4D/3D/2D dimension management.
 */

import type { Vector2D } from '../toy-model/types'

/** 3D vector for camera and positioning */
export interface Vector3D {
  x: number
  y: number
  z: number
}

/** Available dimension modes */
export type DimensionMode = '4D' | '3.5D' | '3D' | '2.5D' | '2D'

/** Description of each mode */
export const MODE_DESCRIPTIONS: Record<DimensionMode, string> = {
  '4D': 'Predictive lensing showing future state projections and probability fields',
  '3.5D': 'Hybrid view with selective 3D elevation and predictive overlays',
  '3D': 'Full spatial view with cover height and elevation',
  '2.5D': 'Flattened tactical view with grid lines for angle analysis',
  '2D': 'Classic top-down tactical minimap'
}

/** Use case for each mode */
export const MODE_USE_CASES: Record<DimensionMode, string> = {
  '4D': 'Pre-round planning, predictive analysis',
  '3.5D': 'Mid-round decision making with foresight',
  '3D': 'Post-plant positioning, elevation checking',
  '2.5D': 'Kill replay analysis, angle breakdown',
  '2D': 'Real-time tactical awareness'
}

/** Camera configuration for 3D rendering */
export interface CameraConfig {
  position: Vector3D
  target: Vector3D
  up: Vector3D
  fov: number
  near: number
  far: number
}

/** Transform configuration for view manipulation */
export interface TransformConfig {
  compression: number
  rotation: number
  elevation: number
  pan: Vector2D
}

/** Projection type configuration */
export interface ProjectionConfig {
  type: 'perspective' | 'orthographic'
  fov?: number
  orthoSize?: number
}

/** Complete dimension configuration */
export interface DimensionConfig {
  mode: DimensionMode
  camera: CameraConfig
  transform: TransformConfig
  projection: ProjectionConfig
}

/** Animation state for transitions */
export interface TransitionState {
  isActive: boolean
  progress: number
  fromMode: DimensionMode
  toMode: DimensionMode
  startTime: number
  duration: number
}

/** Viewport information */
export interface Viewport {
  width: number
  height: number
  pixelRatio: number
}

/** Render context for dimension system */
export interface DimensionRenderContext {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D | WebGLRenderingContext
  viewport: Viewport
  config: DimensionConfig
}

/** Callback for dimension changes */
export type DimensionChangeCallback = (mode: DimensionMode, config: DimensionConfig) => void

/** Interface for dimension-aware components */
export interface DimensionAware {
  onDimensionChange(mode: DimensionMode, config: DimensionConfig): void
  getDimensionPriority(): number
}

/** Matrix types for 3D math */
export type Mat4 = Float32Array
export type Vec3 = [number, number, number]
export type Vec4 = [number, number, number, number]

/** Grid cell with elevation data */
export interface ElevationCell {
  x: number
  y: number
  elevation: number
  walkable: boolean
  coverHeight: number
}

/** 3D map data for elevation-aware rendering */
export interface Map3DData {
  width: number
  height: number
  cells: ElevationCell[]
  maxElevation: number
}

/** Predictive state for 4D mode */
export interface PredictiveState {
  timestamp: number
  probability: number
  playerPositions: Array<{
    playerId: string
    position: Vector3D
    probability: number
  }>
  expectedEvents: Array<{
    type: string
    position: Vector3D
    probability: number
    timeOffset: number
  }>
}
