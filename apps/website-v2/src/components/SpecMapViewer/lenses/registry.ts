/** [Ver001.000] */
/**
 * Lens Registry
 * =============
 * Central registry for managing lens activation, opacity, and composition.
 * Provides a unified API for the SpecMapViewer to control lens overlays.
 */

import type { Lens, GameData, LensRegistry } from './types'

/** Active lens state */
interface ActiveLensState {
  lens: Lens
  opacity: number
  isActive: boolean
}

/** Create a new lens registry */
export const createLensRegistry = (): LensRegistry => {
  const lenses = new Map<string, Lens>()
  const activeStates = new Map<string, ActiveLensState>()
  
  const registry: LensRegistry = {
    /** Register a new lens */
    register: (lens: Lens): void => {
      lenses.set(lens.name, lens)
      activeStates.set(lens.name, {
        lens,
        opacity: lens.opacity,
        isActive: false
      })
    },
    
    /** Get a lens by name */
    get: (name: string): Lens | undefined => {
      return lenses.get(name)
    },
    
    /** Get all registered lenses */
    getAll: (): Lens[] => {
      return Array.from(lenses.values())
    },
    
    /** Get names of active lenses */
    getActive: (): string[] => {
      return Array.from(activeStates.entries())
        .filter(([_, state]) => state.isActive)
        .map(([name, _]) => name)
    },
    
    /** Toggle lens activation */
    toggle: (name: string): void => {
      const state = activeStates.get(name)
      if (state) {
        state.isActive = !state.isActive
      }
    },
    
    /** Set lens opacity */
    setOpacity: (name: string, opacity: number): void => {
      const state = activeStates.get(name)
      if (state) {
        state.opacity = Math.max(0, Math.min(1, opacity))
      }
    },
    
    /** Composite multiple lenses onto canvas */
    composite: (ctx: CanvasRenderingContext2D, data: GameData, lensNames: string[]): void => {
      // Sort by blend mode for proper layering
      const activeLenses = lensNames
        .map((name) => activeStates.get(name))
        .filter((state): state is ActiveLensState => 
          state !== undefined && state.isActive
        )
      
      // Group by blend mode
      const screenLenses = activeLenses.filter(
        (s) => s.lens.defaultOptions.blendMode === 'screen'
      )
      const multiplyLenses = activeLenses.filter(
        (s) => s.lens.defaultOptions.blendMode === 'multiply'
      )
      const normalLenses = activeLenses.filter(
        (s) => s.lens.defaultOptions.blendMode === 'source-over'
      )
      
      // Render in order: multiply -> normal -> screen
      multiplyLenses.forEach((state) => {
        state.lens.render(ctx, data, { opacity: state.opacity })
      })
      
      normalLenses.forEach((state) => {
        state.lens.render(ctx, data, { opacity: state.opacity })
      })
      
      screenLenses.forEach((state) => {
        state.lens.render(ctx, data, { opacity: state.opacity })
      })
    }
  }
  
  return registry
}

/** Global lens registry instance */
let globalRegistry: LensRegistry | null = null

/** Get or create global registry */
export const getGlobalLensRegistry = (): LensRegistry => {
  if (!globalRegistry) {
    globalRegistry = createLensRegistry()
  }
  return globalRegistry
}

/** Reset global registry (useful for testing) */
export const resetGlobalLensRegistry = (): void => {
  globalRegistry = null
}

export default createLensRegistry
