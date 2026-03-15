/** [Ver001.000] */
/**
 * Camera Controller
 * =================
 * Handles camera manipulation: zoom, pan, rotate, animate.
 */

import type { Vector2D } from '../toy-model/types'
import type { DimensionManager } from '../dimension/DimensionManager'

export interface CameraBounds {
  minZoom: number
  maxZoom: number
  minElevation: number
  maxElevation: number
}

export interface AnimationConfig {
  duration: number
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
}

export class CameraController {
  private dimensionManager: DimensionManager
  private bounds: CameraBounds = {
    minZoom: 0.1,
    maxZoom: 3.0,
    minElevation: -90,
    maxElevation: 45
  }
  private isDragging = false
  private lastMousePos: Vector2D = { x: 0, y: 0 }
  private animationId: number | null = null

  constructor(dimensionManager: DimensionManager) {
    this.dimensionManager = dimensionManager
  }

  zoom(factor: number, center?: Vector2D): void {
    const currentZoom = this.dimensionManager.getConfig().transform.compression
    const newZoom = Math.max(
      this.bounds.minZoom,
      Math.min(this.bounds.maxZoom, currentZoom * factor)
    )
    this.dimensionManager.setZoom(newZoom)
    if (center) this.zoomTowards(center, factor)
  }

  setZoom(level: number): void {
    const clamped = Math.max(this.bounds.minZoom, Math.min(this.bounds.maxZoom, level))
    this.dimensionManager.setZoom(clamped)
  }

  rotate(degrees: number): void {
    const current = this.dimensionManager.getConfig().transform.rotation
    this.dimensionManager.setRotation(current + degrees)
  }

  setRotation(degrees: number): void {
    this.dimensionManager.setRotation(degrees)
  }

  changeElevation(delta: number): void {
    const current = this.dimensionManager.getConfig().transform.elevation
    const newElevation = Math.max(this.bounds.minElevation, Math.min(this.bounds.maxElevation, current + delta))
    this.dimensionManager.setElevation(newElevation)
  }

  pan(deltaX: number, deltaY: number): void {
    const zoom = this.dimensionManager.getConfig().transform.compression
    this.dimensionManager.pan(deltaX / zoom, deltaY / zoom)
  }

  reset(animate: boolean = true): void {
    if (animate) {
      this.animateTo({ zoom: 1.0, rotation: 0, elevation: -90, pan: { x: 0, y: 0 } })
    } else {
      this.dimensionManager.setZoom(1.0)
      this.dimensionManager.setRotation(0)
      this.dimensionManager.setElevation(-90)
      const pan = this.dimensionManager.getConfig().transform.pan
      this.dimensionManager.pan(-pan.x, -pan.y)
    }
  }

  animateTo(target: Partial<{ zoom: number; rotation: number; elevation: number; pan: Vector2D }>,
    config: AnimationConfig = { duration: 500, easing: 'easeInOut' }): void {
    if (this.animationId !== null) cancelAnimationFrame(this.animationId)

    const startState = {
      zoom: this.dimensionManager.getConfig().transform.compression,
      rotation: this.dimensionManager.getConfig().transform.rotation,
      elevation: this.dimensionManager.getConfig().transform.elevation,
      pan: { ...this.dimensionManager.getConfig().transform.pan }
    }
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(1, elapsed / config.duration)
      const easedProgress = this.applyEasing(progress, config.easing)

      if (target.zoom !== undefined) this.dimensionManager.setZoom(startState.zoom + (target.zoom - startState.zoom) * easedProgress)
      if (target.rotation !== undefined) this.dimensionManager.setRotation(this.interpolateAngle(startState.rotation, target.rotation, easedProgress))
      if (target.elevation !== undefined) this.dimensionManager.setElevation(startState.elevation + (target.elevation - startState.elevation) * easedProgress)
      if (target.pan !== undefined) {
        const currentPan = this.dimensionManager.getConfig().transform.pan
        this.dimensionManager.pan(
          startState.pan.x + (target.pan.x - startState.pan.x) * easedProgress - currentPan.x,
          startState.pan.y + (target.pan.y - startState.pan.y) * easedProgress - currentPan.y
        )
      }

      if (progress < 1) this.animationId = requestAnimationFrame(animate)
      else this.animationId = null
    }
    this.animationId = requestAnimationFrame(animate)
  }

  focusOn(position: Vector2D, zoomLevel: number = 1.5): void {
    this.animateTo({ zoom: zoomLevel, pan: { x: -position.x, y: -position.y }, rotation: 0 }, { duration: 600, easing: 'easeInOut' })
  }

  focusOnSite(site: 'A' | 'B'): void {
    const sitePositions = { A: { x: 25, y: 25 }, B: { x: 50, y: 45 } }
    this.focusOn(sitePositions[site], 2.0)
  }

  getState() {
    const config = this.dimensionManager.getConfig()
    return { zoom: config.transform.compression, rotation: config.transform.rotation, elevation: config.transform.elevation, pan: config.transform.pan }
  }

  onMouseDown(pos: Vector2D): void { this.isDragging = true; this.lastMousePos = pos }
  onMouseMove(pos: Vector2D): void { if (!this.isDragging) return; this.pan(pos.x - this.lastMousePos.x, pos.y - this.lastMousePos.y); this.lastMousePos = pos }
  onMouseUp(): void { this.isDragging = false }
  onWheel(delta: number, center?: Vector2D): void { this.zoom(delta > 0 ? 0.9 : 1.1, center) }

  private applyEasing(t: number, easing: AnimationConfig['easing']): number {
    switch (easing) {
      case 'linear': return t
      case 'easeIn': return t * t
      case 'easeOut': return 1 - (1 - t) * (1 - t)
      case 'easeInOut': return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      default: return t
    }
  }

  private interpolateAngle(from: number, to: number, t: number): number {
    let diff = to - from
    while (diff > 180) diff -= 360
    while (diff < -180) diff += 360
    return (from + diff * t) % 360
  }

  private zoomTowards(center: Vector2D, factor: number): void {
    this.dimensionManager.pan(center.x * (1 - factor), center.y * (1 - factor))
  }

  destroy(): void { if (this.animationId !== null) cancelAnimationFrame(this.animationId) }
}

export default CameraController
