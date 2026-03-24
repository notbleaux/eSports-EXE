/** [Ver001.000] */
/**
 * CameraController Tests
 * ======================
 * Tests for camera manipulation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DimensionManager } from '../dimension/DimensionManager'
import { CameraController } from '../camera/CameraController'

describe('CameraController', () => {
  let dimensionManager: DimensionManager
  let controller: CameraController

  beforeEach(() => {
    dimensionManager = new DimensionManager('2D')
    controller = new CameraController(dimensionManager)
    vi.useFakeTimers()
  })

  describe('Zoom', () => {
    it('should zoom in and out', () => {
      controller.setZoom(1.5)
      expect(controller.getState().zoom).toBe(1.5)
    })

    it('should respect zoom bounds', () => {
      controller.setZoom(5.0)
      expect(controller.getState().zoom).toBe(3.0)
      
      controller.setZoom(0.05)
      expect(controller.getState().zoom).toBe(0.1)
    })
  })

  describe('Rotation', () => {
    it('should rotate', () => {
      controller.setRotation(90)
      expect(controller.getState().rotation).toBe(90)
    })

    it('should handle rotation by degrees', () => {
      controller.rotate(45)
      expect(controller.getState().rotation).toBe(45)
      
      controller.rotate(45)
      expect(controller.getState().rotation).toBe(90)
    })
  })

  describe('Elevation', () => {
    it('should change elevation', () => {
      controller.changeElevation(30)
      expect(controller.getState().elevation).toBe(-60) // -90 + 30
    })
  })

  describe('Animation', () => {
    it('should animate to target state', () => {
      controller.animateTo({ zoom: 2.0, rotation: 45 })
      
      vi.advanceTimersByTime(600)
      
      const state = controller.getState()
      expect(state.zoom).toBe(2.0)
      expect(state.rotation).toBe(45)
    })

    it('should focus on position', () => {
      controller.focusOn({ x: 25, y: 25 }, 2.0)
      
      vi.advanceTimersByTime(700)
      
      const state = controller.getState()
      expect(state.zoom).toBe(2.0)
    })
  })

  describe('Reset', () => {
    it('should reset to default state', () => {
      controller.setZoom(2.0)
      controller.setRotation(90)
      controller.reset(false)
      
      const state = controller.getState()
      expect(state.zoom).toBe(1.0)
      expect(state.rotation).toBe(0)
    })
  })
})
