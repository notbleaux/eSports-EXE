/**
 * 3D Map Renderer for SpecMap
 * 
 * [Ver001.000] - Three.js based tactical map rendering system
 * 
 * Provides:
 * - 3D map model loading (GLTF/GLB, OBJ, FBX)
 * - Tactical view rendering with customizable camera angles
 * - Orbit controls for user navigation
 * - Professional lighting setup for tactical visualization
 * - Fog and post-processing effects
 * 
 * @example
 * ```typescript
 * import { Map3DRenderer } from '@/lib/map3d/renderer';
 * 
 * const renderer = new Map3DRenderer({
 *   container: document.getElementById('map-container'),
 *   mapId: 'ascent',
 * });
 * 
 * await renderer.load();
 * renderer.animate();
 * ```
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';


// ============================================
// Types
// ============================================

export type MapFormat = 'gltf' | 'glb' | 'obj' | 'fbx';

export interface Map3DRendererConfig {
  /** Container element for the renderer */
  container: HTMLElement;
  /** Map identifier (e.g., 'ascent', 'bind', 'haven') */
  mapId: string;
  /** Map model URL or path */
  modelUrl?: string;
  /** Map format */
  format?: MapFormat;
  /** Enable shadows */
  shadows?: boolean;
  /** Enable fog for depth perception */
  fog?: boolean;
  /** Background color */
  backgroundColor?: number;
  /** Initial camera position */
  cameraPosition?: THREE.Vector3;
  /** Camera target */
  cameraTarget?: THREE.Vector3;
  /** Field of view */
  fov?: number;
  /** Enable post-processing */
  postProcessing?: boolean;
  /** Map bounds for tactical reference */
  mapBounds?: {
    min: THREE.Vector3;
    max: THREE.Vector3;
  };
  /** Callback when map is loaded */
  onLoad?: () => void;
  /** Callback for loading progress */
  onProgress?: (progress: number) => void;
  /** Callback for loading errors */
  onError?: (error: Error) => void;
}

export interface TacticalCameraPreset {
  name: string;
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
}

export interface MapRendererStats {
  /** Frame time in milliseconds */
  frameTime: number;
  /** Draw calls per frame */
  drawCalls: number;
  /** Total triangles */
  triangles: number;
  /** Texture memory usage in bytes */
  textureMemory: number;
  /** Geometry memory usage in bytes */
  geometryMemory: number;
  /** Number of meshes */
  meshCount: number;
  /** Renderer FPS */
  fps: number;
}

export interface LightingConfig {
  /** Ambient light intensity */
  ambientIntensity: number;
  /** Directional light intensity */
  directionalIntensity: number;
  /** Directional light color */
  directionalColor: number;
  /** Directional light position */
  directionalPosition: THREE.Vector3;
  /** Hemisphere light intensity */
  hemisphereIntensity: number;
  /** Hemisphere sky color */
  skyColor: number;
  /** Hemisphere ground color */
  groundColor: number;
}

// ============================================
// Default Configurations
// ============================================

export const DEFAULT_TACTICAL_PRESETS: TacticalCameraPreset[] = [
  {
    name: 'overview',
    position: new THREE.Vector3(0, 200, 200),
    target: new THREE.Vector3(0, 0, 0),
    fov: 45,
  },
  {
    name: 'tactical-birdseye',
    position: new THREE.Vector3(0, 150, 0),
    target: new THREE.Vector3(0, 0, 0),
    fov: 60,
  },
  {
    name: 'site-a',
    position: new THREE.Vector3(-50, 30, -50),
    target: new THREE.Vector3(-30, 0, -30),
    fov: 50,
  },
  {
    name: 'site-b',
    position: new THREE.Vector3(50, 30, 50),
    target: new THREE.Vector3(30, 0, 30),
    fov: 50,
  },
  {
    name: 'mid',
    position: new THREE.Vector3(0, 40, 0),
    target: new THREE.Vector3(0, 0, 20),
    fov: 55,
  },
];

export const DEFAULT_LIGHTING: LightingConfig = {
  ambientIntensity: 0.4,
  directionalIntensity: 1.0,
  directionalColor: 0xffffff,
  directionalPosition: new THREE.Vector3(100, 200, 100),
  hemisphereIntensity: 0.6,
  skyColor: 0x87ceeb,
  groundColor: 0x362d2d,
};

// ============================================
// Map3DRenderer Class
// ============================================

export class Map3DRenderer {
  private config: Required<Map3DRendererConfig>;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private controls: OrbitControls | null = null;
  private mapGroup: THREE.Group | null = null;
  private animationId: number | null = null;
  private isLoaded = false;
  private stats: MapRendererStats = {
    frameTime: 0,
    drawCalls: 0,
    triangles: 0,
    textureMemory: 0,
    geometryMemory: 0,
    meshCount: 0,
    fps: 0,
  };
  private lastTime = 0;
  private frameCount = 0;
  private fpsUpdateTime = 0;

  // Loaders
  private gltfLoader: GLTFLoader;
  private objLoader: OBJLoader;
  private fbxLoader: FBXLoader;

  // Lights
  private ambientLight: THREE.AmbientLight | null = null;
  private directionalLight: THREE.DirectionalLight | null = null;
  private hemisphereLight: THREE.HemisphereLight | null = null;

  constructor(config: Map3DRendererConfig) {
    this.config = {
      modelUrl: `/maps/${config.mapId}/model.glb`,
      format: 'glb' as MapFormat,
      shadows: true,
      fog: true,
      backgroundColor: 0x1a1a2e,
      cameraPosition: new THREE.Vector3(0, 150, 150),
      cameraTarget: new THREE.Vector3(0, 0, 0),
      fov: 45,
      postProcessing: false,
      mapBounds: {
        min: new THREE.Vector3(-100, 0, -100),
        max: new THREE.Vector3(100, 50, 100),
      },
      onLoad: () => {},
      onProgress: () => {},
      onError: () => {},
      ...config,
    };

    // Initialize loaders with DRACO compression support
    this.gltfLoader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    this.gltfLoader.setDRACOLoader(dracoLoader);

    this.objLoader = new OBJLoader();
    this.fbxLoader = new FBXLoader();
  }

  /**
   * Initialize the renderer
   */
  async initialize(): Promise<void> {
    this.setupRenderer();
    this.setupScene();
    this.setupCamera();
    this.setupControls();
    this.setupLighting();
    this.setupEventListeners();
  }

  /**
   * Load the map model
   */
  async load(): Promise<void> {
    if (!this.renderer) {
      await this.initialize();
    }

    try {
      const model = await this.loadModel();
      this.processModel(model);
      this.isLoaded = true;
      this.config.onLoad();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.config.onError(err);
      throw err;
    }
  }

  /**
   * Setup WebGL renderer
   */
  private setupRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });

    this.renderer.setSize(
      this.config.container.clientWidth,
      this.config.container.clientHeight
    );
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(this.config.backgroundColor);

    // Enable shadows
    if (this.config.shadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    // Tone mapping for realistic lighting
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    this.config.container.appendChild(this.renderer.domElement);
  }

  /**
   * Setup Three.js scene
   */
  private setupScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.config.backgroundColor);

    // Add fog for depth perception
    if (this.config.fog) {
      this.scene.fog = new THREE.FogExp2(this.config.backgroundColor, 0.002);
    }

    // Create map group
    this.mapGroup = new THREE.Group();
    this.mapGroup.name = `map-${this.config.mapId}`;
    this.scene.add(this.mapGroup);
  }

  /**
   * Setup perspective camera
   */
  private setupCamera(): void {
    const aspect =
      this.config.container.clientWidth / this.config.container.clientHeight;

    this.camera = new THREE.PerspectiveCamera(
      this.config.fov,
      aspect,
      0.1,
      2000
    );

    this.camera.position.copy(this.config.cameraPosition);
    this.camera.lookAt(this.config.cameraTarget);
  }

  /**
   * Setup orbit controls for camera navigation
   */
  private setupControls(): void {
    if (!this.camera || !this.renderer) return;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 500;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent going under ground
    this.controls.target.copy(this.config.cameraTarget);

    // Tactical view constraints
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };
  }

  /**
   * Setup professional lighting for tactical visualization
   */
  private setupLighting(config: Partial<LightingConfig> = {}): void {
    if (!this.scene) return;

    const lighting = { ...DEFAULT_LIGHTING, ...config };

    // Ambient light for base illumination
    this.ambientLight = new THREE.AmbientLight(
      0xffffff,
      lighting.ambientIntensity
    );
    this.scene.add(this.ambientLight);

    // Hemisphere light for natural outdoor feel
    this.hemisphereLight = new THREE.HemisphereLight(
      lighting.skyColor,
      lighting.groundColor,
      lighting.hemisphereIntensity
    );
    this.scene.add(this.hemisphereLight);

    // Directional light for shadows and highlights
    this.directionalLight = new THREE.DirectionalLight(
      lighting.directionalColor,
      lighting.directionalIntensity
    );
    this.directionalLight.position.copy(lighting.directionalPosition);
    this.directionalLight.castShadow = this.config.shadows;

    // Shadow properties
    if (this.config.shadows) {
      this.directionalLight.shadow.mapSize.width = 2048;
      this.directionalLight.shadow.mapSize.height = 2048;
      this.directionalLight.shadow.camera.near = 0.5;
      this.directionalLight.shadow.camera.far = 500;
      this.directionalLight.shadow.camera.left = -100;
      this.directionalLight.shadow.camera.right = 100;
      this.directionalLight.shadow.camera.top = 100;
      this.directionalLight.shadow.camera.bottom = -100;
      this.directionalLight.shadow.bias = -0.0005;
    }

    this.scene.add(this.directionalLight);
  }

  /**
   * Load 3D model based on format
   */
  private async loadModel(): Promise<THREE.Group | GLTF> {
    const url = this.config.modelUrl;
    const format = this.config.format;

    return new Promise((resolve, reject) => {
      const onProgress = (xhr: ProgressEvent) => {
        if (xhr.lengthComputable) {
          const progress = (xhr.loaded / xhr.total) * 100;
          this.config.onProgress(progress);
        }
      };

      const onError = (error: ErrorEvent | unknown) => {
        reject(error instanceof Error ? error : new Error(String(error)));
      };

      switch (format) {
        case 'gltf':
        case 'glb':
          this.gltfLoader.load(
            url,
            (loadedGltf) => resolve(loadedGltf),
            onProgress,
            onError
          );
          break;
        case 'obj':
          this.objLoader.load(url, resolve, onProgress, onError);
          break;
        case 'fbx':
          this.fbxLoader.load(url, resolve, onProgress, onError);
          break;
        default:
          reject(new Error(`Unsupported format: ${format}`));
      }
    });
  }

  /**
   * Process loaded model
   */
  private processModel(model: THREE.Group | GLTF): void {
    if (!this.mapGroup || !this.scene) return;

    let root: THREE.Group;

    if ('scene' in model) {
      // GLTF result
      root = model.scene;
      
      // Process animations if present
      if (model.animations && model.animations.length > 0) {
        // Store animations for potential playback
        (root as any).animations = model.animations;
      }
    } else {
      // Direct group (OBJ, FBX)
      root = model;
    }

    // Optimize materials and geometry
    root.traverse((mesh) => {
      if (mesh instanceof THREE.Mesh) {
        // Enable shadows
        child.castShadow = this.config.shadows;
        child.receiveShadow = this.config.shadows;

        // Optimize materials
        if (child.material) {
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];

          materials.forEach((material) => {
            if (material instanceof THREE.MeshStandardMaterial) {
              mat.roughness = Math.max(mat.roughness, 0.3);
              mat.metalness = Math.min(mat.metalness, 0.8);
            }
          });
        }

        // Compute bounding sphere for culling
        if (child.geometry) {
          child.geometry.computeBoundingSphere();
          child.geometry.computeBoundingBox();
        }
      }
    });

    // Center and scale the map
    this.centerAndScaleMap(root);

    // Add to scene
    this.mapGroup.clear();
    this.mapGroup.add(root);

    // Add tactical grid overlay
    this.addTacticalGrid();
  }

  /**
   * Center and scale map to fit in view
   */
  private centerAndScaleMap(root: THREE.Group): void {
    const box = new THREE.Box3().setFromObject(root);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Center the map
    root.position.sub(center);
    root.position.y += size.y / 2; // Keep above ground

    // Scale if too large (optional)
    const maxDimension = Math.max(size.x, size.y, size.z);
    if (maxDimension > 200) {
      const scale = 200 / maxDimension;
      root.scale.setScalar(scale);
    }

    // Update config bounds
    this.config.mapBounds = {
      min: new THREE.Vector3(-size.x / 2, 0, -size.z / 2),
      max: new THREE.Vector3(size.x / 2, size.y, size.z / 2),
    };
  }

  /**
   * Add tactical grid overlay
   */
  private addTacticalGrid(): void {
    if (!this.scene) return;

    const { min, max } = this.config.mapBounds;
    const size = Math.max(max.x - min.x, max.z - min.z);
    const divisions = 20;

    const gridHelper = new THREE.GridHelper(size, divisions, 0x444444, 0x222222);
    gridHelper.position.y = 0.1;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.3;

    this.scene.add(gridHelper);
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    window.addEventListener('resize', this.handleResize);
  }

  /**
   * Handle window resize
   */
  private handleResize = (): void => {
    if (!this.camera || !this.renderer || !this.config.container) return;

    const width = this.config.container.clientWidth;
    const height = this.config.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  /**
   * Apply camera preset
   */
  applyCameraPreset(preset: TacticalCameraPreset): void {
    if (!this.camera || !this.controls) return;

    // Animate to new position (simplified)
    this.camera.position.copy(preset.position);
    this.camera.fov = preset.fov;
    this.camera.updateProjectionMatrix();

    this.controls.target.copy(preset.target);
    this.controls.update();
  }

  /**
   * Get current camera preset name
   */
  getCurrentPreset(): string | null {
    if (!this.camera) return null;

    const pos = this.camera.position;
    const target = this.controls?.target ?? new THREE.Vector3();

    // Find closest preset
    let closestPreset: TacticalCameraPreset | null = null;
    let closestDistance = Infinity;

    for (const preset of DEFAULT_TACTICAL_PRESETS) {
      const dist = pos.distanceTo(preset.position) + target.distanceTo(preset.target);
      if (dist < closestDistance) {
        closestDistance = dist;
        closestPreset = preset;
      }
    }

    return closestPreset?.name ?? null;
  }

  /**
   * Focus camera on specific position
   */
  focusOnPosition(position: THREE.Vector3, distance = 50): void {
    if (!this.camera || !this.controls) return;

    const offset = new THREE.Vector3(0, distance, distance);
    this.camera.position.copy(position).add(offset);
    this.controls.target.copy(position);
    this.controls.update();
  }

  /**
   * Start animation loop
   */
  animate(): void {
    if (this.animationId !== null) return;

    const loop = (time: number) => {
      this.updateStats(time);
      this.render();
      this.animationId = requestAnimationFrame(loop);
    };

    this.animationId = requestAnimationFrame(loop);
  }

  /**
   * Render single frame
   */
  render(): void {
    if (!this.renderer || !this.scene || !this.camera) return;

    this.controls?.update();
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Update performance stats
   */
  private updateStats(time: number): void {
    this.frameCount++;

    // Update FPS every second
    if (time - this.fpsUpdateTime >= 1000) {
      this.stats.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = time;
    }

    // Update renderer stats
    if (this.renderer) {
      const info = this.renderer.info;
      this.stats.drawCalls = info.render.calls;
      this.stats.triangles = info.render.triangles;
    }

    // Frame time
    if (this.lastTime > 0) {
      this.stats.frameTime = time - this.lastTime;
    }
    this.lastTime = time;
  }

  /**
   * Get current renderer stats
   */
  getStats(): MapRendererStats {
    return { ...this.stats };
  }

  /**
   * Get scene for adding custom objects
   */
  getScene(): THREE.Scene | null {
    return this.scene;
  }

  /**
   * Get camera
   */
  getCamera(): THREE.PerspectiveCamera | null {
    return this.camera;
  }

  /**
   * Get controls
   */
  getControls(): OrbitControls | null {
    return this.controls;
  }

  /**
   * Get map group
   */
  getMapGroup(): THREE.Group | null {
    return this.mapGroup;
  }

  /**
   * Get renderer
   */
  getRenderer(): THREE.WebGLRenderer | null {
    return this.renderer;
  }

  /**
   * Check if map is loaded
   */
  isMapLoaded(): boolean {
    return this.isLoaded;
  }

  /**
   * Set fog density
   */
  setFogDensity(density: number): void {
    if (this.scene?.fog instanceof THREE.FogExp2) {
      this.scene.fog.density = density;
    }
  }

  /**
   * Update lighting configuration
   */
  updateLighting(config: Partial<LightingConfig>): void {
    const lighting = { ...DEFAULT_LIGHTING, ...config };

    if (this.ambientLight) {
      this.ambientLight.intensity = lighting.ambientIntensity;
    }

    if (this.hemisphereLight) {
      this.hemisphereLight.intensity = lighting.hemisphereIntensity;
      this.hemisphereLight.color.setHex(lighting.skyColor);
      this.hemisphereLight.groundColor.setHex(lighting.groundColor);
    }

    if (this.directionalLight) {
      this.directionalLight.intensity = lighting.directionalIntensity;
      this.directionalLight.color.setHex(lighting.directionalColor);
      this.directionalLight.position.copy(lighting.directionalPosition);
    }
  }

  /**
   * Take screenshot
   */
  takeScreenshot(mimeType = 'image/png'): string {
    if (!this.renderer) return '';

    this.render();
    return this.renderer.domElement.toDataURL(mimeType);
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    // Stop animation
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Remove event listeners
    window.removeEventListener('resize', this.handleResize);

    // Dispose controls
    this.controls?.dispose();
    this.controls = null;

    // Dispose scene objects
    this.scene?.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();

        const mats = Array.isArray(obj.material)
          ? obj.material
          : [obj.material];

        mats.forEach((mat) => {
          mat.dispose();
        });
      }
    });

    // Clear scene
    while (this.scene?.children.length) {
      this.scene.remove(this.scene.children[0]);
    }

    // Dispose renderer
    this.renderer?.dispose();

    // Remove canvas
    if (this.renderer?.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }

    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.mapGroup = null;
    this.isLoaded = false;
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Create tactical camera preset
 */
export function createTacticalPreset(
  name: string,
  position: [number, number, number],
  target: [number, number, number],
  fov = 45
): TacticalCameraPreset {
  return {
    name,
    position: new THREE.Vector3(...position),
    target: new THREE.Vector3(...target),
    fov,
  };
}

/**
 * Get preset by name
 */
export function getPresetByName(name: string): TacticalCameraPreset | undefined {
  return DEFAULT_TACTICAL_PRESETS.find((p) => p.name === name);
}

/**
 * Convert screen coordinates to world coordinates on map plane
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  camera: THREE.Camera,
  container: HTMLElement
): THREE.Vector3 | null {
  const rect = container.getBoundingClientRect();
  const ndc = new THREE.Vector2(
    ((screenX - rect.left) / rect.width) * 2 - 1,
    -((screenY - rect.top) / rect.height) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(ndc, camera);

  // Intersect with ground plane (y = 0)
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const target = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, target);

  return target;
}

export default Map3DRenderer;
