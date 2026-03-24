/** [Ver001.000] */
/**
 * DimensionManager Tests
 * ======================
 * Tests for 4D/3D/2D dimension system.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DimensionManager, DIMENSION_PRESETS } from '../dimension/DimensionManager'
import type { DimensionMode } from '../dimension/types'

describe('DimensionManager', () => {
  let manager: DimensionManager

  beforeEach(() => {
    manager = new DimensionManager('2D')
    vi.useFakeTimers()
  })

  describe('Initialization', () => {
    it('should initialize with default 2D mode', () => {
      expect(manager.getMode()).toBe('2D')
      expect(manager.isTransitioning()).toBe(false)
    })

    it('should initialize with specified mode', () => {
      const manager3D = new DimensionManager('3D')
      expect(manager3D.getMode()).toBe('3D')
    })

    it('should have all dimension presets defined', () => {
      const modes: DimensionMode[] = ['4D', '3.5D', '3D', '2.5D', '2D']
      modes.forEach(mode => {
        expect(DIMENSION_PRESETS[mode]).toBeDefined()
        expect(DIMENSION_PRESETS[mode].mode).toBe(mode)
      })
    })
  })

  describe('Mode Switching', () => {
    it('should switch mode without animation', () => {
      manager.switchMode('3D', false)
      expect(manager.getMode()).toBe('3D')
      expect(manager.isTransitioning()).toBe(false)
    })

    it('should switch mode with animation', () => {
      manager.switchMode('3D', true)
      expect(manager.isTransitioning()).toBe(true)
      
      vi.advanceTimersByTime(600)
      
      expect(manager.getMode()).toBe('3D')
      expect(manager.isTransitioning()).toBe(false)
    })

    it('should not switch to same mode', () => {
      const initialConfig = manager.getConfig()
      manager.switchMode('2D')
      expect(manager.getConfig()).toEqual(initialConfig)
    })

    it('should transition through all modes', () => {
      const modes: DimensionMode[] = ['2D', '2.5D', '3D', '3.5D', '4D']
      
      modes.forEach(mode => {
        manager.switchMode(mode, false)
        expect(manager.getMode()).toBe(mode)
      })
    })
  })

  describe('Camera Control', () => {
    it('should set zoom within bounds', () => {
      manager.setZoom(2.0)
      expect(manager.getConfig().transform.compression).toBe(2.0)
      
      manager.setZoom(5.0)
      expect(manager.getConfig().transform.compression).toBe(3.0)
      
      manager.setZoom(0.05)
      expect(manager.getConfig().transform.compression).toBe(0.1)
    })

    it('should set rotation', () => {
      manager.setRotation(90)
      expect(manager.getConfig().transform.rotation).toBe(90)
      
      manager.setRotation(450)
      expect(manager.getConfig().transform.rotation).toBe(90)
    })

    it('should set elevation within bounds', () => {
      manager.setElevation(0)
      expect(manager.getConfig().transform.elevation).toBe(0)
      
      manager.setElevation(-100)
      expect(manager.getConfig().transform.elevation).toBe(-90)
      
      manager.setElevation(60)
      expect(manager.getConfig().transform.elevation).toBe(45)
    })

    it('should pan', () => {
      manager.pan(10, 20)
      const config = manager.getConfig()
      expect(config.transform.pan.x).toBe(10)
      expect(config.transform.pan.y).toBe(20)
    })
  })

  describe('Matrix Math', () => {
    it('should generate view matrix', () => {
      const viewMatrix = manager.getViewMatrix()
      expect(viewMatrix).toBeInstanceOf(Float32Array)
      expect(viewMatrix.length).toBe(16)
    })

    it('should generate projection matrix', () => {
      const projMatrix = manager.getProjectionMatrix()
      expect(projMatrix).toBeInstanceOf(Float32Array)
      expect(projMatrix.length).toBe(16)
    })
  })
})
