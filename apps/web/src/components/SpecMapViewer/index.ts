/** [Ver002.000] */
/**
 * SpecMapViewer
 * =============
 * Tactical map visualization with creative lens system and multi-dimensional views.
 */

// Toy Model
export * from './toy-model'

// Lenses
export * from './lenses'

// Dimension System
export * from './dimension'

// Camera
export * from './camera'

// API
export * from './api'

// Benchmark
export * from './benchmark'

// WebGL
export * from './webgl'

// Version
export const VERSION = '2.1.0'
export const SPECMAPVIEWER_INFO = {
  name: 'SpecMapViewer',
  version: VERSION,
  description: 'Tactical map visualization with creative lens system',
  dimensions: ['4D', '3.5D', '3D', '2.5D', '2D'],
  lenses: ['tension', 'ripple', 'blood', 'wind', 'doors', 'secured'],
  defaultDimension: '2D' as const
}
