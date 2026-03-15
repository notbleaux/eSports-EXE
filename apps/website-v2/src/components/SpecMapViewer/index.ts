/** [Ver001.000] */
/**
 * SpecMapViewer
 * =============
 * Tactical map visualization with creative lens system and multi-dimensional views.
 * 
 * Features:
 * - 64x64 toy model grid representation
 * - 6 creative lenses (Tension, Ripple, Blood, Wind, Doors, Secured)
 * - 5 dimension modes (4D, 3.5D, 3D, 2.5D, 2D)
 * - Camera manipulation (zoom, rotate, pan, animate)
 * - Lens compositing system
 */

// Toy Model
export * from './toy-model'

// Lenses
export * from './lenses'

// Dimension System
export * from './dimension'

// Camera
export * from './camera'

// Version
export const VERSION = '2.0.0'
export const SPECMAPVIEWER_INFO = {
  name: 'SpecMapViewer',
  version: VERSION,
  description: 'Tactical map visualization with creative lens system',
  dimensions: ['4D', '3.5D', '3D', '2.5D', '2D'],
  lenses: ['tension', 'ripple', 'blood', 'wind', 'doors', 'secured'],
  defaultDimension: '2D' as const
}
