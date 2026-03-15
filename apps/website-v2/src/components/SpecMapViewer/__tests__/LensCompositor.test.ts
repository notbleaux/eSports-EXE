/** [Ver001.000] */
/**
 * LensCompositor Tests
 * ====================
 * Tests for multi-lens compositing system.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LensCompositor } from '../lenses/LensCompositor'
import { tensionLens } from '../lenses/tensionLens'
import { rippleLens } from '../lenses/rippleLens'
import type { GameData } from '../lenses/types'

// Mock canvas
describe('LensCompositor', () => {
  let compositor: LensCompositor
  let mockCanvas: HTMLCanvasElement
  let mockCtx: CanvasRenderingContext2D

  const mockGameData: GameData = {
    killEvents: [],
    soundEvents: [],
    damageEvents: [],
    playerPositions: [],
    metadata: { mapName: 'bind', roundNumber: 1, matchTime: 0 }
  }

  beforeEach(() => {
    compositor = new LensCompositor()
    
    // Create mock canvas
    mockCanvas = document.createElement('canvas')
    mockCanvas.width = 512
    mockCanvas.height = 512
    mockCtx = mockCanvas.getContext('2d')!
    
    // Mock context methods
    vi.spyOn(mockCtx, 'save').mockImplementation(() => {})
    vi.spyOn(mockCtx, 'restore').mockImplementation(() => {})
    vi.spyOn(mockCtx, 'drawImage').mockImplementation(() => {})
  })

  describe('Lens Registration', () => {
    it('should register and retrieve lenses', () => {
      compositor.registerLens(tensionLens)
      expect(compositor.getRegisteredLenses()).toContain(tensionLens)
      expect(compositor.getLens('tension')).toBe(tensionLens)
    })

    it('should activate and deactivate lenses', () => {
      compositor.registerLens(tensionLens)
      compositor.activateLens('tension')
      expect(compositor.getActiveLenses()).toContain('tension')
      
      compositor.deactivateLens('tension')
      expect(compositor.getActiveLenses()).not.toContain('tension')
    })
  })

  describe('Presets', () => {
    it('should have preset configurations', () => {
      const presets = compositor.getPresets()
      expect(presets.combat).toBeDefined()
      expect(presets.strategic).toBeDefined()
    })
  })

  describe('Opacity Control', () => {
    it('should set and get lens opacity', () => {
      compositor.registerLens(tensionLens)
      compositor.setLensOpacity('tension', 0.5)
      expect(compositor.getLensOpacity('tension')).toBe(0.5)
    })

    it('should clamp opacity to 0-1 range', () => {
      compositor.registerLens(tensionLens)
      compositor.setLensOpacity('tension', 1.5)
      expect(compositor.getLensOpacity('tension')).toBe(1)
    })
  })
})
