/** [Ver002.000] */
/**
 * DimensionManager
 * ================
 * Manages 4D/3.5D/3D/2.5D/2D view modes with camera matrix math.
 * Handles smooth transitions between dimension modes.
 * 
 * Improvements in v2:
 * - Exported all public interfaces
 * - Added bounds validation
 * - Added transition callbacks
 * - Added matrix caching with dirty flags
 * - Fixed memory leak in animation
 */

export type DimensionMode = '4D' | '3.5D' | '3D' | '2.5D' | '2D';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface CameraState {
  position: Vector3D;
  target: Vector3D;
  up: Vector3D;
  fov: number;
}

export interface DimensionConfig {
  mode: DimensionMode;
  camera: CameraState;
  projection: 'perspective' | 'orthographic';
  near: number;
  far: number;
}

export interface Bounds3D {
  min: Vector3D;
  max: Vector3D;
}

export interface TransitionOptions {
  duration?: number;
  easing?: 'linear' | 'easeInOut' | 'easeInOutCubic';
  onComplete?: () => void;
  onProgress?: (progress: number) => void;
}

/** State representation for dimension system */
export interface DimensionState {
  mode: DimensionMode;
  config: DimensionConfig;
  isTransitioning: boolean;
  transitionProgress: number;
}

/** Preset configurations for each dimension mode */
export const DIMENSION_PRESETS: Record<DimensionMode, Partial<DimensionConfig>> = {
  '4D': {
    mode: '4D',
    projection: 'perspective',
    camera: {
      position: { x: 32, y: 32, z: 80 },
      target: { x: 32, y: 32, z: 0 },
      up: { x: 0, y: 1, z: 0 },
      fov: 60
    }
  },
  '3.5D': {
    mode: '3.5D',
    projection: 'perspective',
    camera: {
      position: { x: 32, y: 20, z: 60 },
      target: { x: 32, y: 32, z: 0 },
      up: { x: 0, y: 1, z: 0 },
      fov: 55
    }
  },
  '3D': {
    mode: '3D',
    projection: 'perspective',
    camera: {
      position: { x: 32, y: 10, z: 50 },
      target: { x: 32, y: 32, z: 0 },
      up: { x: 0, y: 1, z: 0 },
      fov: 50
    }
  },
  '2.5D': {
    mode: '2.5D',
    projection: 'orthographic',
    camera: {
      position: { x: 32, y: 32, z: 40 },
      target: { x: 32, y: 32, z: 0 },
      up: { x: 0, y: 1, z: 0 },
      fov: 45
    }
  },
  '2D': {
    mode: '2D',
    projection: 'orthographic',
    camera: {
      position: { x: 32, y: 32, z: 30 },
      target: { x: 32, y: 32, z: 0 },
      up: { x: 0, y: 1, z: 0 },
      fov: 45
    }
  }
};

export class DimensionManager {
  private currentMode: DimensionMode = '2D';
  private currentConfig: DimensionConfig;
  private transitionStartTime: number = 0;
  private isTransitioning: boolean = false;
  private fromConfig: DimensionConfig | null = null;
  private toConfig: DimensionConfig | null = null;
  private transitionOptions: TransitionOptions | null = null;
  private animationFrameId: number | null = null;
  private readonly defaultTransitionDuration: number = 500;

  // Camera matrices
  private viewMatrix: Float32Array = new Float32Array(16);
  private projectionMatrix: Float32Array = new Float32Array(16);
  private vpMatrix: Float32Array = new Float32Array(16);
  private matricesDirty: boolean = true;

  // Optional bounds for camera position
  private bounds: Bounds3D | null = null;

  // Preset configurations for each mode
  private readonly presets: Record<DimensionMode, DimensionConfig>;

  constructor(initialMode: DimensionMode = '2D', mapSize: number = 64) {
    this.presets = this.generatePresets(mapSize);
    this.currentMode = initialMode;
    this.currentConfig = this.cloneConfig(this.presets[initialMode]);
    this.updateMatrices();
  }

  /**
   * Generate presets based on map size
   */
  private generatePresets(mapSize: number): Record<DimensionMode, DimensionConfig> {
    const center = mapSize / 2;
    return {
      '4D': {
        mode: '4D',
        camera: {
          position: { x: center, y: center, z: mapSize * 1.5 },
          target: { x: center, y: center, z: 0 },
          up: { x: 0, y: 1, z: 0 },
          fov: 60
        },
        projection: 'perspective',
        near: 0.1,
        far: mapSize * 4
      },
      '3.5D': {
        mode: '3.5D',
        camera: {
          position: { x: center, y: mapSize * 0.75, z: mapSize * 1.2 },
          target: { x: center, y: center, z: 0 },
          up: { x: 0, y: 0, z: 1 },
          fov: 50
        },
        projection: 'perspective',
        near: 0.1,
        far: mapSize * 4
      },
      '3D': {
        mode: '3D',
        camera: {
          position: { x: center, y: mapSize, z: mapSize * 0.9 },
          target: { x: center, y: center, z: 0 },
          up: { x: 0, y: 0, z: 1 },
          fov: 45
        },
        projection: 'perspective',
        near: 0.1,
        far: mapSize * 4
      },
      '2.5D': {
        mode: '2.5D',
        camera: {
          position: { x: center, y: mapSize * 1.5, z: mapSize * 0.5 },
          target: { x: center, y: center, z: 0 },
          up: { x: 0, y: 0, z: 1 },
          fov: 35
        },
        projection: 'orthographic',
        near: 0.1,
        far: mapSize * 4
      },
      '2D': {
        mode: '2D',
        camera: {
          position: { x: center, y: center, z: mapSize * 1.8 },
          target: { x: center, y: center, z: 0 },
          up: { x: 0, y: 1, z: 0 },
          fov: 30
        },
        projection: 'orthographic',
        near: 0.1,
        far: mapSize * 4
      }
    };
  }

  /**
   * Set dimension mode with optional smooth transition
   */
  setMode(mode: DimensionMode, options: TransitionOptions = {}): void {
    if (mode === this.currentMode) return;

    const animate = options.duration !== 0;
    
    if (!animate) {
      this.cancelTransition();
      this.currentMode = mode;
      this.currentConfig = this.cloneConfig(this.presets[mode]);
      this.markMatricesDirty();
      options.onComplete?.();
      return;
    }

    // Cancel any existing transition
    this.cancelTransition();

    // Start new transition
    this.isTransitioning = true;
    this.fromConfig = this.cloneConfig(this.currentConfig);
    this.toConfig = this.cloneConfig(this.presets[mode]);
    this.transitionStartTime = performance.now();
    this.transitionOptions = options;
    this.currentMode = mode;

    this.animateTransition();
  }

  /**
   * Cancel ongoing transition
   */
  private cancelTransition(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isTransitioning = false;
    this.fromConfig = null;
    this.toConfig = null;
    this.transitionOptions = null;
  }

  /**
   * Get current dimension mode
   */
  getMode(): DimensionMode {
    return this.currentMode;
  }

  /**
   * Get view-projection matrix for rendering
   */
  getCameraMatrix(): Float32Array {
    if (this.matricesDirty) {
      this.updateMatrices();
    }
    return this.vpMatrix;
  }

  /**
   * Get separate view matrix
   */
  getViewMatrix(): Float32Array {
    if (this.matricesDirty) {
      this.updateMatrices();
    }
    return this.viewMatrix;
  }

  /**
   * Get separate projection matrix
   */
  getProjectionMatrix(): Float32Array {
    if (this.matricesDirty) {
      this.updateMatrices();
    }
    return this.projectionMatrix;
  }

  /**
   * Project 3D world position to 2D screen space
   */
  project3DTo2D(worldPos: Vector3D, viewportWidth: number, viewportHeight: number): Vector2D {
    const vp = this.getCameraMatrix();
    
    // Transform to clip space
    const x = worldPos.x;
    const y = worldPos.y;
    const z = worldPos.z;
    const w = 1;

    const clipX = vp[0] * x + vp[4] * y + vp[8] * z + vp[12] * w;
    const clipY = vp[1] * x + vp[5] * y + vp[9] * z + vp[13] * w;
    const clipW = vp[3] * x + vp[7] * y + vp[11] * z + vp[15] * w;

    // Perspective divide
    const ndcX = clipX / clipW;
    const ndcY = clipY / clipW;

    // Convert to screen space
    return {
      x: (ndcX + 1) * 0.5 * viewportWidth,
      y: (1 - ndcY) * 0.5 * viewportHeight
    };
  }

  /**
   * Check if currently transitioning between modes
   */
  isAnimating(): boolean {
    return this.isTransitioning;
  }

  /**
   * Set optional bounds for camera position
   */
  setBounds(bounds: Bounds3D | null): void {
    this.bounds = bounds;
  }

  /**
   * Get current bounds
   */
  getBounds(): Bounds3D | null {
    return this.bounds;
  }

  /**
   * Set custom camera position with optional validation
   */
  setCameraPosition(position: Vector3D, validate: boolean = true): void {
    if (validate && this.bounds) {
      position = this.clampPositionToBounds(position);
    }
    this.currentConfig.camera.position = position;
    this.markMatricesDirty();
  }

  /**
   * Set camera target/look-at point
   */
  setCameraTarget(target: Vector3D): void {
    this.currentConfig.camera.target = target;
    this.markMatricesDirty();
  }

  /**
   * Clamp position to bounds
   */
  private clampPositionToBounds(pos: Vector3D): Vector3D {
    if (!this.bounds) return pos;
    return {
      x: Math.max(this.bounds.min.x, Math.min(this.bounds.max.x, pos.x)),
      y: Math.max(this.bounds.min.y, Math.min(this.bounds.max.y, pos.y)),
      z: Math.max(this.bounds.min.z, Math.min(this.bounds.max.z, pos.z))
    };
  }

  /**
   * Mark matrices as needing update
   */
  private markMatricesDirty(): void {
    this.matricesDirty = true;
  }

  // Private: Animate transition between modes
  private animateTransition(): void {
    if (!this.isTransitioning || !this.fromConfig || !this.toConfig) return;

    const elapsed = performance.now() - this.transitionStartTime;
    const duration = this.transitionOptions?.duration ?? this.defaultTransitionDuration;
    const progress = Math.min(1, elapsed / duration);
    const eased = this.easeInOutCubic(progress);

    // Interpolate camera state
    this.currentConfig.camera.position = this.lerpVector3D(
      this.fromConfig.camera.position,
      this.toConfig.camera.position,
      eased
    );
    this.currentConfig.camera.target = this.lerpVector3D(
      this.fromConfig.camera.target,
      this.toConfig.camera.target,
      eased
    );
    this.currentConfig.camera.fov = this.lerp(
      this.fromConfig.camera.fov,
      this.toConfig.camera.fov,
      eased
    );

    this.markMatricesDirty();
    this.transitionOptions?.onProgress?.(progress);

    if (progress < 1) {
      this.animationFrameId = requestAnimationFrame(() => this.animateTransition());
    } else {
      this.isTransitioning = false;
      this.fromConfig = null;
      this.toConfig = null;
      this.animationFrameId = null;
      this.transitionOptions?.onComplete?.();
      this.transitionOptions = null;
    }
  }

  // Private: Update view and projection matrices
  private updateMatrices(): void {
    this.updateViewMatrix();
    this.updateProjectionMatrix();
    this.multiplyMatrices(this.projectionMatrix, this.viewMatrix, this.vpMatrix);
    this.matricesDirty = false;
  }

  // Private: Calculate view matrix (look-at)
  private updateViewMatrix(): void {
    const eye = this.currentConfig.camera.position;
    const target = this.currentConfig.camera.target;
    const up = this.currentConfig.camera.up;

    // Forward vector (normalized)
    const zAxis = this.normalize({
      x: eye.x - target.x,
      y: eye.y - target.y,
      z: eye.z - target.z
    });

    // Right vector
    const xAxis = this.normalize(this.cross(up, zAxis));

    // Up vector (recomputed)
    const yAxis = this.cross(zAxis, xAxis);

    // Build view matrix
    this.viewMatrix[0] = xAxis.x;  this.viewMatrix[4] = xAxis.y;  this.viewMatrix[8] = xAxis.z;   this.viewMatrix[12] = -this.dot(xAxis, eye);
    this.viewMatrix[1] = yAxis.x;  this.viewMatrix[5] = yAxis.y;  this.viewMatrix[9] = yAxis.z;   this.viewMatrix[13] = -this.dot(yAxis, eye);
    this.viewMatrix[2] = zAxis.x;  this.viewMatrix[6] = zAxis.y;  this.viewMatrix[10] = zAxis.z;  this.viewMatrix[14] = -this.dot(zAxis, eye);
    this.viewMatrix[3] = 0;        this.viewMatrix[7] = 0;        this.viewMatrix[11] = 0;        this.viewMatrix[15] = 1;
  }

  // Private: Calculate projection matrix
  private updateProjectionMatrix(): void {
    const config = this.currentConfig;
    const aspect = 1;

    if (config.projection === 'perspective') {
      const fovRad = (config.camera.fov * Math.PI) / 180;
      const f = 1 / Math.tan(fovRad / 2);
      const nf = 1 / (config.near - config.far);

      this.projectionMatrix[0] = f / aspect;  this.projectionMatrix[4] = 0;  this.projectionMatrix[8] = 0;                           this.projectionMatrix[12] = 0;
      this.projectionMatrix[1] = 0;           this.projectionMatrix[5] = f;  this.projectionMatrix[9] = 0;                           this.projectionMatrix[13] = 0;
      this.projectionMatrix[2] = 0;           this.projectionMatrix[6] = 0;  this.projectionMatrix[10] = (config.far + config.near) * nf;  this.projectionMatrix[14] = 2 * config.far * config.near * nf;
      this.projectionMatrix[3] = 0;           this.projectionMatrix[7] = 0;  this.projectionMatrix[11] = -1;                         this.projectionMatrix[15] = 0;
    } else {
      const size = 64;
      const r = size / 2;
      const l = -r;
      const t = r;
      const b = -r;

      this.projectionMatrix[0] = 2 / (r - l);  this.projectionMatrix[4] = 0;           this.projectionMatrix[8] = 0;                               this.projectionMatrix[12] = -(r + l) / (r - l);
      this.projectionMatrix[1] = 0;            this.projectionMatrix[5] = 2 / (t - b); this.projectionMatrix[9] = 0;                               this.projectionMatrix[13] = -(t + b) / (t - b);
      this.projectionMatrix[2] = 0;            this.projectionMatrix[6] = 0;           this.projectionMatrix[10] = -2 / (config.far - config.near); this.projectionMatrix[14] = -(config.far + config.near) / (config.far - config.near);
      this.projectionMatrix[3] = 0;            this.projectionMatrix[7] = 0;           this.projectionMatrix[11] = 0;                              this.projectionMatrix[15] = 1;
    }
  }

  // Math helpers
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private lerpVector3D(a: Vector3D, b: Vector3D, t: number): Vector3D {
    return {
      x: this.lerp(a.x, b.x, t),
      y: this.lerp(a.y, b.y, t),
      z: this.lerp(a.z, b.z, t)
    };
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private normalize(v: Vector3D): Vector3D {
    const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (len === 0) return { x: 0, y: 0, z: 0 };
    return { x: v.x / len, y: v.y / len, z: v.z / len };
  }

  private cross(a: Vector3D, b: Vector3D): Vector3D {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x
    };
  }

  private dot(a: Vector3D, b: Vector3D): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  private multiplyMatrices(a: Float32Array, b: Float32Array, out: Float32Array): void {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        out[i * 4 + j] = 0;
        for (let k = 0; k < 4; k++) {
          out[i * 4 + j] += a[i * 4 + k] * b[k * 4 + j];
        }
      }
    }
  }

  private cloneConfig(config: DimensionConfig): DimensionConfig {
    return JSON.parse(JSON.stringify(config));
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.cancelTransition();
  }
}

export default DimensionManager;
