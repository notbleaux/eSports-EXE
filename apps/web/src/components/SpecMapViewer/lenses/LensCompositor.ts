// @ts-nocheck
/** [Ver001.000] */
/**
 * Lens Compositor
 * ===============
 * Handles blending multiple lenses together for composite visualization.
 * Manages render order, blend modes, and performance optimization.
 */

import type { Lens, GameData, LensOptions } from './types'

export interface CompositeConfig {
  /** Lenses to composite, in render order */
  lenses: string[]
  /** Opacity for each lens (overrides lens default) */
  opacities?: Record<string, number>
  /** Global blend mode */
  blendMode?: GlobalCompositeOperation
  /** Performance mode */
  quality: 'low' | 'medium' | 'high'
}

export interface RenderStats {
  frameTime: number
  lensRenderTimes: Record<string, number>
  totalDrawCalls: number
}

export class LensCompositor {
  private lenses: Map<string, Lens> = new Map()
  private activeLenses: Set<string> = new Set()
  private lensOpacities: Map<string, number> = new Map()
  private renderStats: RenderStats = {
    frameTime: 0,
    lensRenderTimes: {},
    totalDrawCalls: 0
  }
  private offscreenCanvas: HTMLCanvasElement | null = null
  private offscreenCtx: CanvasRenderingContext2D | null = null

  constructor() {
    this.initializeOffscreenCanvas()
  }

  /** Register a lens for compositing */
  registerLens(lens: Lens): void {
    this.lenses.set(lens.name, lens)
    this.lensOpacities.set(lens.name, lens.opacity)
  }

  /** Unregister a lens */
  unregisterLens(name: string): void {
    this.lenses.delete(name)
    this.activeLenses.delete(name)
    this.lensOpacities.delete(name)
  }

  /** Activate a lens for rendering */
  activateLens(name: string): boolean {
    if (!this.lenses.has(name)) return false
    this.activeLenses.add(name)
    return true
  }

  /** Deactivate a lens */
  deactivateLens(name: string): void {
    this.activeLenses.delete(name)
  }

  /** Toggle lens activation */
  toggleLens(name: string): boolean {
    if (this.activeLenses.has(name)) {
      this.deactivateLens(name)
      return false
    }
    return this.activateLens(name)
  }

  /** Set lens opacity */
  setLensOpacity(name: string, opacity: number): void {
    this.lensOpacities.set(name, Math.max(0, Math.min(1, opacity)))
  }

  /** Get lens opacity */
  getLensOpacity(name: string): number {
    return this.lensOpacities.get(name) ?? this.lenses.get(name)?.opacity ?? 1
  }

  /** Get all registered lenses */
  getRegisteredLenses(): Lens[] {
    return Array.from(this.lenses.values())
  }

  /** Get active lens names */
  getActiveLenses(): string[] {
    return Array.from(this.activeLenses)
  }

  /** Composite active lenses to context */
  composite(
    ctx: CanvasRenderingContext2D,
    data: GameData,
    config?: Partial<CompositeConfig>
  ): RenderStats {
    const startTime = performance.now()
    const quality = config?.quality ?? 'high'
    
    // Determine render order
    const renderOrder = config?.lenses ?? this.getDefaultRenderOrder()
    const activeRenderOrder = renderOrder.filter(name => this.activeLenses.has(name))

    if (activeRenderOrder.length === 0) return this.renderStats
    if (activeRenderOrder.length === 1) {
      // Single lens - render directly
      return this.renderSingle(ctx, activeRenderOrder[0], data)
    }

    // Multiple lenses - composite
    if (quality === 'high') {
      return this.compositeHighQuality(ctx, activeRenderOrder, data, config)
    } else {
      return this.compositeFast(ctx, activeRenderOrder, data, config)
    }
  }

  /** Render a single lens directly */
  private renderSingle(
    ctx: CanvasRenderingContext2D,
    lensName: string,
    data: GameData
  ): RenderStats {
    const lens = this.lenses.get(lensName)
    if (!lens) return this.renderStats

    const startTime = performance.now()
    const opacity = this.lensOpacities.get(lensName) ?? lens.opacity

    ctx.save()
    lens.render(ctx, data, { ...lens.defaultOptions, opacity })
    ctx.restore()

    const frameTime = performance.now() - startTime
    this.renderStats = {
      frameTime,
      lensRenderTimes: { [lensName]: frameTime },
      totalDrawCalls: 1
    }

    return this.renderStats
  }

  /** High-quality compositing with proper blend modes */
  private compositeHighQuality(
    ctx: CanvasRenderingContext2D,
    lensNames: string[],
    data: GameData,
    config?: Partial<CompositeConfig>
  ): RenderStats {
    const frameStart = performance.now()
    const lensTimes: Record<string, number> = {}
    let totalDrawCalls = 0

    // Ensure offscreen canvas matches size
    this.resizeOffscreenCanvas(ctx.canvas.width, ctx.canvas.height)

    lensNames.forEach((name, index) => {
      const lens = this.lenses.get(name)
      if (!lens || !this.offscreenCtx) return

      const lensStart = performance.now()

      // Clear offscreen canvas
      this.offscreenCtx.clearRect(0, 0, this.offscreenCanvas!.width, this.offscreenCanvas!.height)

      // Render lens to offscreen
      this.offscreenCtx.save()
      const opacity = this.lensOpacities.get(name) ?? lens.opacity
      lens.render(this.offscreenCtx, data, { ...lens.defaultOptions, opacity })
      this.offscreenCtx.restore()

      // Composite to main canvas
      ctx.save()
      if (index === 0) {
        // First lens - draw directly
        ctx.drawImage(this.offscreenCanvas!, 0, 0)
      } else {
        // Subsequent lenses - use blend mode
        ctx.globalCompositeOperation = lens.defaultOptions.blendMode
        ctx.drawImage(this.offscreenCanvas!, 0, 0)
      }
      ctx.restore()

      lensTimes[name] = performance.now() - lensStart
      totalDrawCalls++
    })

    this.renderStats = {
      frameTime: performance.now() - frameStart,
      lensRenderTimes: lensTimes,
      totalDrawCalls
    }

    return this.renderStats
  }

  /** Fast compositing for performance-critical scenarios */
  private compositeFast(
    ctx: CanvasRenderingContext2D,
    lensNames: string[],
    data: GameData,
    config?: Partial<CompositeConfig>
  ): RenderStats {
    const frameStart = performance.now()
    const lensTimes: Record<string, number> = {}

    // Render all lenses directly with simplified blending
    ctx.save()
    
    lensNames.forEach(name => {
      const lens = this.lenses.get(name)
      if (!lens) return

      const lensStart = performance.now()
      const opacity = this.lensOpacities.get(name) ?? lens.opacity

      ctx.globalAlpha = opacity
      ctx.globalCompositeOperation = lens.defaultOptions.blendMode
      lens.render(ctx, data, { ...lens.defaultOptions, opacity })

      lensTimes[name] = performance.now() - lensStart
    })

    ctx.restore()

    this.renderStats = {
      frameTime: performance.now() - frameStart,
      lensRenderTimes: lensTimes,
      totalDrawCalls: lensNames.length
    }

    return this.renderStats
  }

  /** Get default render order based on lens types */
  private getDefaultRenderOrder(): string[] {
    // Order: base → tactical status → predictive → overlays → effects → indicators
    const orderPriority: Record<string, number> = {
      // Base layers
      'secured': 1,           // Base control layer
      'eco-pressure': 2,      // Economy status
      'wind': 3,             // Movement patterns
      'doors': 4,            // Rotation patterns
      'rotation-predictor': 5, // Rotation predictions
      // Tactical mid layers
      'utility-coverage': 10,  // Active utility
      'info-gaps': 11,         // Intel gaps
      'clutch-zones': 12,      // Clutch positions
      'trade-routes': 13,      // Support paths
      // Analysis layers
      'tension': 20,          // Combat heatmap
      'blood': 21,            // Combat aftermath
      // Predictive top layers
      'push-probability': 30,  // Site predictions
      'timing-windows': 31,    // Timing analysis
      // Effects
      'ripple': 40            // Sound effects (top)
    }

    return Array.from(this.lenses.keys())
      .sort((a, b) => (orderPriority[a] ?? 99) - (orderPriority[b] ?? 99))
  }

  /** Get last render stats */
  getRenderStats(): RenderStats {
    return { ...this.renderStats }
  }

  /** Preset composite configurations */
  getPresets(): Record<string, string[]> {
    return {
      // Base presets
      'combat': ['tension', 'blood', 'ripple'],
      'strategic': ['secured', 'doors', 'wind'],
      'full': [
        'secured', 'eco-pressure', 'wind', 'doors',
        'rotation-predictor', 'utility-coverage', 'info-gaps',
        'clutch-zones', 'trade-routes',
        'tension', 'blood',
        'push-probability', 'timing-windows',
        'ripple'
      ],
      'minimal': ['tension', 'secured'],
      'stealth': ['ripple', 'wind'],
      'postplant': ['secured', 'tension', 'doors'],

      // Tactical presets
      'tactical': ['push-probability', 'utility-coverage', 'timing-windows', 'rotation-predictor'],
      'predictive': ['rotation-predictor', 'push-probability', 'timing-windows', 'info-gaps'],
      'attack': ['push-probability', 'timing-windows', 'trade-routes', 'eco-pressure'],
      'defense': ['clutch-zones', 'utility-coverage', 'info-gaps', 'doors'],
      'pre-round': ['push-probability', 'timing-windows', 'eco-pressure', 'trade-routes'],
      'post-plant': ['clutch-zones', 'utility-coverage', 'rotation-predictor', 'info-gaps']
    }
  }

  /** Apply a preset configuration */
  applyPreset(presetName: string): boolean {
    const preset = this.getPresets()[presetName]
    if (!preset) return false

    this.activeLenses.clear()
    preset.forEach(name => this.activateLens(name))
    return true
  }

  /** Update animation state for all lenses */
  update(deltaTime: number): void {
    this.lenses.forEach(lens => {
      if (lens.update) {
        lens.update(deltaTime)
      }
    })
  }

  /** Reset all lens states */
  reset(): void {
    this.lenses.forEach(lens => {
      if (lens.reset) {
        lens.reset()
      }
    })
    this.activeLenses.clear()
  }

  private initializeOffscreenCanvas(): void {
    if (typeof document !== 'undefined') {
      this.offscreenCanvas = document.createElement('canvas')
      this.offscreenCtx = this.offscreenCanvas.getContext('2d')
    }
  }

  private resizeOffscreenCanvas(width: number, height: number): void {
    if (this.offscreenCanvas && (this.offscreenCanvas.width !== width || this.offscreenCanvas.height !== height)) {
      this.offscreenCanvas.width = width
      this.offscreenCanvas.height = height
    }
  }
}

export default LensCompositor
