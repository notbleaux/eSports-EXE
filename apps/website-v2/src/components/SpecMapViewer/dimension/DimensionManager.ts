/** [Ver001.000] */
/**
 * Dimension Manager
 * =================
 * Manages 4D/3.5D/3D/2.5D/2D view modes for SpecMapViewer.
 * Handles mode switching, camera positioning, and transform matrices.
 */

import type { Vector2D } from '../toy-model/types'
import type { Vector3D, DimensionMode, DimensionConfig, CameraConfig, TransformConfig, ProjectionConfig } from './types'

/** Preset configurations for each dimension mode */
export const DIMENSION_PRESETS: Record<DimensionMode, DimensionConfig> = {
  '4D': {
    mode: '4D',
    camera: {
      position: { x: 32, y: 32, z: 80 },
      target: { x: 32, y: 32, z: 0 },
      up: { x: 0, y: 1, z: 0 },
      fov: 60,
      near: 0.1,
      far: 200
    },
    transform: {
      compression: 1.0,
      rotation: 0,
      elevation: 60,
      pan: { x: 0, y: 0 }
    },
    projection: { type: 'perspective', fov: 60 }
  },
  '3.5D': {
    mode: '3.5D',
    camera: {
      position: { x: 32, y: 48, z: 60 },
      target: { x: 32, y: 32, z: 0 },
      up: { x: 0, y: 0, z: 1 },
      fov: 50,
      near: 0.1,
      far: 200
    },
    transform: {
      compression: 0.8,
      rotation: 0,
      elevation: 45,
      pan: { x: 0, y: 0 }
    },
    projection: { type: 'perspective', fov: 50 }
  },
  '3D': {
    mode: '3D',
    camera: {
      position: { x: 32, y: 64, z: 40 },
      target: { x: 32, y: 32, z: 0 },
      up: { x: 0, y: 0, z: 1 },
      fov: 45,
      near: 0.1,
      far: 200
    },
    transform: {
      compression: 1.0,
      rotation: 0,
      elevation: 30,
      pan: { x: 0, y: 0 }
    },
    projection: { type: 'perspective', fov: 45 }
  },
  '2.5D': {
    mode: '2.5D',
    camera: {
      position: { x: 32, y: 96, z: 20 },
      target: { x: 32, y: 32, z: 0 },
      up: { x: 0, y: 0, z: 1 },
      fov: 35,
      near: 0.1,
      far: 200
    },
    transform: {
      compression: 1.2,
      rotation: 0,
      elevation: 15,
      pan: { x: 0, y: 0 }
    },
    projection: { type: 'orthographic', orthoSize: 80 }
  },
  '2D': {
    mode: '2D',
    camera: {
      position: { x: 32, y: 32, z: 100 },
      target: { x: 32, y: 32, z: 0 },
      up: { x: 0, y: 1, z: 0 },
      fov: 30,
      near: 0.1,
      far: 200
    },
    transform: {
      compression: 1.0,
      rotation: 0,
      elevation: -90,
      pan: { x: 0, y: 0 }
    },
    projection: { type: 'orthographic', orthoSize: 64 }
  }
}

export interface DimensionState {
  config: DimensionConfig
  transitionProgress: number
  targetConfig?: DimensionConfig
  isTransitioning: boolean
}

export class DimensionManager {
  private state: DimensionState
  private transitionDuration: number = 500
  private transitionStartTime: number = 0

  constructor(initialMode: DimensionMode = '2D') {
    this.state = {
      config: this.deepClone(DIMENSION_PRESETS[initialMode]),
      transitionProgress: 1,
      isTransitioning: false
    }
  }

  getConfig(): DimensionConfig {
    if (this.state.isTransitioning && this.state.targetConfig) {
      return this.interpolateConfig(
        this.state.config,
        this.state.targetConfig,
        this.state.transitionProgress
      )
    }
    return this.state.config
  }

  getMode(): DimensionMode {
    return this.getConfig().mode
  }

  switchMode(mode: DimensionMode, animate: boolean = true): void {
    if (mode === this.state.config.mode) return

    const targetConfig = this.deepClone(DIMENSION_PRESETS[mode])

    if (!animate) {
      this.state.config = targetConfig
      this.state.transitionProgress = 1
      this.state.isTransitioning = false
      return
    }

    this.state.targetConfig = targetConfig
    this.state.transitionProgress = 0
    this.state.isTransitioning = true
    this.transitionStartTime = performance.now()
    this.animateTransition()
  }

  setCameraPosition(position: Partial<Vector3D>): void {
    this.state.config.camera = {
      ...this.state.config.camera,
      ...position
    }
  }

  setTransform(transform: Partial<TransformConfig>): void {
    this.state.config.transform = {
      ...this.state.config.transform,
      ...transform
    }
  }

  setRotation(degrees: number): void {
    this.state.config.transform.rotation = degrees % 360
  }

  setZoom(zoom: number): void {
    this.state.config.transform.compression = Math.max(0.1, Math.min(3.0, zoom))
  }

  setElevation(elevation: number): void {
    this.state.config.transform.elevation = Math.max(-90, Math.min(45, elevation))
  }

  pan(deltaX: number, deltaY: number): void {
    this.state.config.transform.pan.x += deltaX
    this.state.config.transform.pan.y += deltaY
  }

  getViewMatrix(): Float32Array {
    const config = this.getConfig()
    const { position, target, up } = config.camera
    return this.calculateLookAt(position, target, up)
  }

  getProjectionMatrix(): Float32Array {
    const config = this.getConfig()
    const { projection } = config

    if (projection.type === 'perspective') {
      return this.calculatePerspective(
        projection.fov || 45,
        1,
        config.camera.near,
        config.camera.far
      )
    } else {
      return this.calculateOrthographic(
        projection.orthoSize || 64,
        config.camera.near,
        config.camera.far
      )
    }
  }

  getViewProjectionMatrix(): Float32Array {
    const view = this.getViewMatrix()
    const proj = this.getProjectionMatrix()
    return this.multiplyMatrices(proj, view)
  }

  isTransitioning(): boolean {
    return this.state.isTransitioning
  }

  getTransitionProgress(): number {
    return this.state.transitionProgress
  }

  private animateTransition(): void {
    if (!this.state.isTransitioning || !this.state.targetConfig) return

    const elapsed = performance.now() - this.transitionStartTime
    this.state.transitionProgress = Math.min(1, elapsed / this.transitionDuration)

    if (this.state.transitionProgress < 1) {
      requestAnimationFrame(() => this.animateTransition())
    } else {
      this.state.config = this.state.targetConfig
      this.state.isTransitioning = false
      this.state.targetConfig = undefined
    }
  }

  private interpolateConfig(from: DimensionConfig, to: DimensionConfig, t: number): DimensionConfig {
    const easeT = this.easeInOutCubic(t)

    return {
      mode: to.mode,
      camera: {
        position: this.lerpVector3D(from.camera.position, to.camera.position, easeT),
        target: this.lerpVector3D(from.camera.target, to.camera.target, easeT),
        up: from.camera.up,
        fov: this.lerp(from.camera.fov, to.camera.fov, easeT),
        near: Math.min(from.camera.near, to.camera.near),
        far: Math.max(from.camera.far, to.camera.far)
      },
      transform: {
        compression: this.lerp(from.transform.compression, to.transform.compression, easeT),
        rotation: this.lerpAngle(from.transform.rotation, to.transform.rotation, easeT),
        elevation: this.lerp(from.transform.elevation, to.transform.elevation, easeT),
        pan: this.lerpVector2D(from.transform.pan, to.transform.pan, easeT)
      },
      projection: to.projection
    }
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
  }

  private lerpVector2D(a: Vector2D, b: Vector2D, t: number): Vector2D {
    return {
      x: this.lerp(a.x, b.x, t),
      y: this.lerp(a.y, b.y, t)
    }
  }

  private lerpVector3D(a: Vector3D, b: Vector3D, t: number): Vector3D {
    return {
      x: this.lerp(a.x, b.x, t),
      y: this.lerp(a.y, b.y, t),
      z: this.lerp(a.z, b.z, t)
    }
  }

  private lerpAngle(a: number, b: number, t: number): number {
    let diff = b - a
    while (diff > 180) diff -= 360
    while (diff < -180) diff += 360
    return (a + diff * t) % 360
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  private calculateLookAt(eye: Vector3D, target: Vector3D, up: Vector3D): Float32Array {
    const zAxis = this.normalize(this.subtract(eye, target))
    const xAxis = this.normalize(this.cross(up, zAxis))
    const yAxis = this.cross(zAxis, xAxis)

    return new Float32Array([
      xAxis.x, yAxis.x, zAxis.x, 0,
      xAxis.y, yAxis.y, zAxis.y, 0,
      xAxis.z, yAxis.z, zAxis.z, 0,
      -this.dot(xAxis, eye), -this.dot(yAxis, eye), -this.dot(zAxis, eye), 1
    ])
  }

  private calculatePerspective(fov: number, aspect: number, near: number, far: number): Float32Array {
    const f = 1.0 / Math.tan((fov * Math.PI / 180) / 2)
    const nf = 1 / (near - far)

    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, 2 * far * near * nf, 0
    ])
  }

  private calculateOrthographic(size: number, near: number, far: number): Float32Array {
    const r = size / 2
    const l = -r
    const t = r
    const b = -r

    return new Float32Array([
      2 / (r - l), 0, 0, 0,
      0, 2 / (t - b), 0, 0,
      0, 0, -2 / (far - near), 0,
      -(r + l) / (r - l), -(t + b) / (t - b), -(far + near) / (far - near), 1
    ])
  }

  private multiplyMatrices(a: Float32Array, b: Float32Array): Float32Array {
    const result = new Float32Array(16)
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        result[i * 4 + j] = 0
        for (let k = 0; k < 4; k++) {
          result[i * 4 + j] += a[i * 4 + k] * b[k * 4 + j]
        }
      }
    }
    return result
  }

  private normalize(v: Vector3D): Vector3D {
    const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
    return len > 0 ? { x: v.x / len, y: v.y / len, z: v.z / len } : { x: 0, y: 0, z: 0 }
  }

  private subtract(a: Vector3D, b: Vector3D): Vector3D {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
  }

  private cross(a: Vector3D, b: Vector3D): Vector3D {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x
    }
  }

  private dot(a: Vector3D, b: Vector3D): number {
    return a.x * b.x + a.y * b.y + a.z * b.z
  }

  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj))
  }
}

export default DimensionManager
