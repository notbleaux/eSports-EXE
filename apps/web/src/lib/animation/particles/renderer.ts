/**
 * Particle Renderer
 * 
 * [Ver001.000] - WebGL-based particle rendering with GPU instancing
 * 
 * Provides:
 * - GPU-accelerated particle rendering
 * - Instanced mesh rendering for performance
 * - Texture atlasing support
 * - Multiple blend modes
 * - Automatic LOD rendering
 */

import * as THREE from 'three';
import { Particle, ParticleEmitter, ParticleSystem, QualityLevel } from './system';

// ============================================
// Types and Interfaces
// ============================================

export interface RendererConfig {
  /** Maximum number of particles to render */
  maxParticles: number;
  /** Particle texture */
  texture?: THREE.Texture;
  /** Texture atlas configuration */
  atlasConfig?: {
    columns: number;
    rows: number;
    frameCount: number;
  };
  /** Use GPU instancing */
  useInstancing: boolean;
  /** Use vertex colors */
  useVertexColors: boolean;
  /** Depth sorting */
  depthSorting: boolean;
  /** Frustum culling */
  frustumCulled: boolean;
  /** Sort particles by depth (expensive) */
  sortParticles: boolean;
}

export interface RenderStats {
  /** Particles drawn this frame */
  particlesDrawn: number;
  /** Draw calls this frame */
  drawCalls: number;
  /** Triangles rendered */
  triangles: number;
  /** Render time in ms */
  renderTime: number;
  /** Current texture atlas frame */
  currentAtlasFrame: number;
}

// ============================================
// Shader Definitions
// ============================================

const PARTICLE_VERTEX_SHADER = `
  attribute vec3 instancePosition;
  attribute vec4 instanceColor;
  attribute float instanceSize;
  attribute float instanceRotation;
  attribute float instanceTextureIndex;
  
  varying vec4 vColor;
  varying vec2 vUv;
  varying float vTextureIndex;
  
  uniform vec2 uAtlasSize;
  uniform float uTime;
  uniform bool uBillboard;
  
  void main() {
    vColor = instanceColor;
    vTextureIndex = instanceTextureIndex;
    
    // Calculate UV based on texture atlas
    if (uAtlasSize.x > 1.0 || uAtlasSize.y > 1.0) {
      float frame = mod(instanceTextureIndex, uAtlasSize.x * uAtlasSize.y);
      vec2 frameOffset = vec2(
        mod(frame, uAtlasSize.x),
        floor(frame / uAtlasSize.x)
      ) / uAtlasSize;
      vUv = uv / uAtlasSize + frameOffset;
    } else {
      vUv = uv;
    }
    
    // Billboard rotation
    vec3 finalPosition = position;
    if (uBillboard) {
      float c = cos(instanceRotation);
      float s = sin(instanceRotation);
      mat2 rot = mat2(c, -s, s, c);
      finalPosition.xy = rot * finalPosition.xy;
    }
    
    // Scale by instance size
    finalPosition *= instanceSize;
    
    // Billboard to camera
    vec4 worldPosition;
    if (uBillboard) {
      vec4 viewPos = viewMatrix * vec4(instancePosition, 1.0);
      viewPos.xy += finalPosition.xy;
      worldPosition = projectionMatrix * viewPos;
    } else {
      worldPosition = projectionMatrix * modelViewMatrix * vec4(instancePosition + finalPosition, 1.0);
    }
    
    gl_Position = worldPosition;
  }
`;

const PARTICLE_FRAGMENT_SHADER = `
  uniform sampler2D uTexture;
  uniform bool uUseTexture;
  uniform int uBlendMode;
  
  varying vec4 vColor;
  varying vec2 vUv;
  varying float vTextureIndex;
  
  void main() {
    vec4 finalColor = vColor;
    
    // Sample texture if provided
    if (uUseTexture) {
      vec4 texColor = texture2D(uTexture, vUv);
      finalColor *= texColor;
    } else {
      // Default circular particle
      vec2 center = vUv - vec2(0.5);
      float dist = length(center);
      float alpha = 1.0 - smoothstep(0.4, 0.5, dist);
      
      // Soft glow edge
      float glow = exp(-dist * dist * 4.0) * 0.5;
      finalColor.rgb += glow;
      finalColor.a *= alpha;
    }
    
    // Discard fully transparent pixels
    if (finalColor.a < 0.01) discard;
    
    gl_FragColor = finalColor;
  }
`;

// ============================================
// Texture Atlas Generator
// ============================================

export class TextureAtlas {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private columns: number;
  private rows: number;
  private frameSize: number;
  private texture?: THREE.CanvasTexture;

  constructor(columns: number, rows: number, frameSize: number = 128) {
    this.columns = columns;
    this.rows = rows;
    this.frameSize = frameSize;
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = columns * frameSize;
    this.canvas.height = rows * frameSize;
    
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context for texture atlas');
    }
    this.context = ctx;
    
    // Initialize with transparent background
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /** Draw a particle shape at the specified frame index */
  drawParticleShape(frameIndex: number, type: 'circle' | 'star' | 'spark' | 'smoke' | 'fire'): void {
    const col = frameIndex % this.columns;
    const row = Math.floor(frameIndex / this.columns);
    const x = col * this.frameSize;
    const y = row * this.frameSize;
    const centerX = x + this.frameSize / 2;
    const centerY = y + this.frameSize / 2;
    const radius = this.frameSize * 0.4;
    
    this.context.save();
    
    // Create radial gradient for soft edges
    const gradient = this.context.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );
    
    switch (type) {
      case 'circle':
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.context.fillStyle = gradient;
        this.context.beginPath();
        this.context.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.context.fill();
        break;
        
      case 'star':
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.context.fillStyle = gradient;
        this.drawStar(centerX, centerY, 5, radius, radius * 0.4);
        break;
        
      case 'spark':
        // Draw a diamond/spark shape
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.context.fillStyle = gradient;
        this.context.beginPath();
        this.context.moveTo(centerX, centerY - radius);
        this.context.lineTo(centerX + radius * 0.3, centerY);
        this.context.lineTo(centerX, centerY + radius);
        this.context.lineTo(centerX - radius * 0.3, centerY);
        this.context.closePath();
        this.context.fill();
        break;
        
      case 'smoke':
        gradient.addColorStop(0, 'rgba(200, 200, 200, 0.8)');
        gradient.addColorStop(0.6, 'rgba(150, 150, 150, 0.4)');
        gradient.addColorStop(1, 'rgba(100, 100, 100, 0)');
        this.context.fillStyle = gradient;
        // Draw irregular cloud shape
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2;
          const offsetX = Math.cos(angle) * radius * 0.3;
          const offsetY = Math.sin(angle) * radius * 0.3;
          this.context.beginPath();
          this.context.arc(centerX + offsetX, centerY + offsetY, radius * 0.6, 0, Math.PI * 2);
          this.context.fill();
        }
        break;
        
      case 'fire':
        // Fire shape with yellow core and red edges
        const fireGradient = this.context.createRadialGradient(
          centerX, centerY - radius * 0.2, 0,
          centerX, centerY, radius
        );
        fireGradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
        fireGradient.addColorStop(0.3, 'rgba(255, 200, 50, 0.9)');
        fireGradient.addColorStop(0.7, 'rgba(255, 100, 0, 0.6)');
        fireGradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
        this.context.fillStyle = fireGradient;
        this.context.beginPath();
        this.context.moveTo(centerX, centerY - radius);
        this.context.quadraticCurveTo(centerX + radius, centerY, centerX, centerY + radius * 0.5);
        this.context.quadraticCurveTo(centerX - radius, centerY, centerX, centerY - radius);
        this.context.fill();
        break;
    }
    
    this.context.restore();
  }

  /** Draw a star shape */
  private drawStar(cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number): void {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    this.context.beginPath();
    this.context.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      this.context.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      this.context.lineTo(x, y);
      rot += step;
    }
    this.context.lineTo(cx, cy - outerRadius);
    this.context.closePath();
    this.context.fill();
  }

  /** Generate the texture */
  generateTexture(): THREE.CanvasTexture {
    if (!this.texture) {
      this.texture = new THREE.CanvasTexture(this.canvas);
      this.texture.wrapS = THREE.ClampToEdgeWrapping;
      this.texture.wrapT = THREE.ClampToEdgeWrapping;
      this.texture.minFilter = THREE.LinearFilter;
      this.texture.magFilter = THREE.LinearFilter;
    }
    return this.texture;
  }

  /** Dispose of resources */
  dispose(): void {
    if (this.texture) {
      this.texture.dispose();
      this.texture = undefined;
    }
  }
}

/** Generate default particle texture atlas */
export function generateDefaultAtlas(): THREE.CanvasTexture {
  const atlas = new TextureAtlas(4, 2, 128);
  
  atlas.drawParticleShape(0, 'circle');   // Generic soft circle
  atlas.drawParticleShape(1, 'star');     // Sparkle star
  atlas.drawParticleShape(2, 'spark');    // Diamond spark
  atlas.drawParticleShape(3, 'smoke');    // Smoke cloud
  atlas.drawParticleShape(4, 'fire');     // Fire flame
  atlas.drawParticleShape(5, 'circle');   // Another soft circle variant
  atlas.drawParticleShape(6, 'star');     // Another star variant
  atlas.drawParticleShape(7, 'spark');    // Another spark variant
  
  return atlas.generateTexture();
}

// ============================================
// Particle Renderer
// ============================================

export class ParticleRenderer {
  private config: RendererConfig;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private material: THREE.ShaderMaterial;
  private geometry: THREE.BufferGeometry;
  private mesh?: THREE.InstancedMesh;
  private dummy: THREE.Object3D;
  private stats: RenderStats;
  private maxParticles: number;
  
  // Instance buffers
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private rotations: Float32Array;
  private textureIndices: Float32Array;
  
  // Attribute buffers for instancing
  private positionAttribute: THREE.InstancedBufferAttribute;
  private colorAttribute: THREE.InstancedBufferAttribute;
  private sizeAttribute: THREE.InstancedBufferAttribute;
  private rotationAttribute: THREE.InstancedBufferAttribute;
  private textureIndexAttribute: THREE.InstancedBufferAttribute;

  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    config: Partial<RendererConfig> = {}
  ) {
    this.scene = scene;
    this.camera = camera;
    this.config = {
      maxParticles: 2000,
      useInstancing: true,
      useVertexColors: true,
      depthSorting: false,
      frustumCulled: true,
      sortParticles: false,
      ...config,
    };
    
    this.maxParticles = this.config.maxParticles;
    this.dummy = new THREE.Object3D();
    this.stats = {
      particlesDrawn: 0,
      drawCalls: 0,
      triangles: 0,
      renderTime: 0,
      currentAtlasFrame: 0,
    };
    
    // Initialize arrays
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 4);
    this.sizes = new Float32Array(this.maxParticles);
    this.rotations = new Float32Array(this.maxParticles);
    this.textureIndices = new Float32Array(this.maxParticles);
    
    // Initialize geometry and material
    this.geometry = this.createGeometry();
    this.material = this.createMaterial();
    this.mesh = this.createMesh();
    
    // Initialize attributes
    this.positionAttribute = new THREE.InstancedBufferAttribute(this.positions, 3);
    this.colorAttribute = new THREE.InstancedBufferAttribute(this.colors, 4);
    this.sizeAttribute = new THREE.InstancedBufferAttribute(this.sizes, 1);
    this.rotationAttribute = new THREE.InstancedBufferAttribute(this.rotations, 1);
    this.textureIndexAttribute = new THREE.InstancedBufferAttribute(this.textureIndices, 1);
    
    this.geometry.setAttribute('instancePosition', this.positionAttribute);
    this.geometry.setAttribute('instanceColor', this.colorAttribute);
    this.geometry.setAttribute('instanceSize', this.sizeAttribute);
    this.geometry.setAttribute('instanceRotation', this.rotationAttribute);
    this.geometry.setAttribute('instanceTextureIndex', this.textureIndexAttribute);
  }

  /** Create the base geometry */
  private createGeometry(): THREE.BufferGeometry {
    // Create a simple quad for each particle
    const geometry = new THREE.PlaneGeometry(1, 1);
    return geometry;
  }

  /** Create the shader material */
  private createMaterial(): THREE.ShaderMaterial {
    const uniforms = {
      uTexture: { value: this.config.texture || generateDefaultAtlas() },
      uUseTexture: { value: !!this.config.texture },
      uAtlasSize: { value: new THREE.Vector2(
        this.config.atlasConfig?.columns || 1,
        this.config.atlasConfig?.rows || 1
      )},
      uTime: { value: 0 },
      uBillboard: { value: true },
    };
    
    return new THREE.ShaderMaterial({
      uniforms,
      vertexShader: PARTICLE_VERTEX_SHADER,
      fragmentShader: PARTICLE_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
  }

  /** Create the instanced mesh */
  private createMesh(): THREE.InstancedMesh {
    const mesh = new THREE.InstancedMesh(
      this.geometry,
      this.material,
      this.maxParticles
    );
    mesh.frustumCulled = this.config.frustumCulled;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(mesh);
    return mesh;
  }

  /** Render particles from an emitter */
  renderEmitter(emitter: ParticleEmitter, quality: QualityLevel = 'high'): void {
    const renderStart = performance.now();
    const particles = emitter.getActiveParticles();
    
    // Sort particles by depth if enabled (expensive)
    if (this.config.sortParticles) {
      this.sortParticlesByDepth(particles);
    }
    
    // Apply LOD based on quality
    let renderCount = particles.length;
    switch (quality) {
      case 'medium':
        renderCount = Math.floor(renderCount * 0.7);
        break;
      case 'low':
        renderCount = Math.floor(renderCount * 0.4);
        break;
    }
    
    // Update instance buffers
    let activeIndex = 0;
    for (let i = 0; i < renderCount && activeIndex < this.maxParticles; i++) {
      const particle = particles[i];
      if (!particle.alive) continue;
      
      // Position
      this.positions[activeIndex * 3] = particle.position.x;
      this.positions[activeIndex * 3 + 1] = particle.position.y;
      this.positions[activeIndex * 3 + 2] = particle.position.z;
      
      // Color
      this.colors[activeIndex * 4] = particle.color.r;
      this.colors[activeIndex * 4 + 1] = particle.color.g;
      this.colors[activeIndex * 4 + 2] = particle.color.b;
      this.colors[activeIndex * 4 + 3] = particle.opacity;
      
      // Size and rotation
      this.sizes[activeIndex] = particle.size;
      this.rotations[activeIndex] = particle.rotation;
      this.textureIndices[activeIndex] = particle.textureIndex;
      
      activeIndex++;
    }
    
    // Update attributes
    this.positionAttribute.needsUpdate = true;
    this.colorAttribute.needsUpdate = true;
    this.sizeAttribute.needsUpdate = true;
    this.rotationAttribute.needsUpdate = true;
    this.textureIndexAttribute.needsUpdate = true;
    
    // Update mesh count
    if (this.mesh) {
      this.mesh.count = activeIndex;
    }
    
    // Update stats
    this.stats.particlesDrawn = activeIndex;
    this.stats.drawCalls = 1;
    this.stats.triangles = activeIndex * 2;
    this.stats.renderTime = performance.now() - renderStart;
  }

  /** Render all particles from a particle system */
  renderSystem(system: ParticleSystem, quality: QualityLevel = 'high'): void {
    const renderStart = performance.now();
    const allParticles = system.getAllParticles();
    
    // Apply LOD
    let step = 1;
    switch (quality) {
      case 'medium':
        step = 2;
        break;
      case 'low':
        step = 3;
        break;
    }
    
    // Update instance buffers
    let activeIndex = 0;
    for (let i = 0; i < allParticles.length && activeIndex < this.maxParticles; i += step) {
      const particle = allParticles[i];
      if (!particle.alive) continue;
      
      // Position
      this.positions[activeIndex * 3] = particle.position.x;
      this.positions[activeIndex * 3 + 1] = particle.position.y;
      this.positions[activeIndex * 3 + 2] = particle.position.z;
      
      // Color
      this.colors[activeIndex * 4] = particle.color.r;
      this.colors[activeIndex * 4 + 1] = particle.color.g;
      this.colors[activeIndex * 4 + 2] = particle.color.b;
      this.colors[activeIndex * 4 + 3] = particle.opacity;
      
      // Size and rotation
      this.sizes[activeIndex] = particle.size;
      this.rotations[activeIndex] = particle.rotation;
      this.textureIndices[activeIndex] = particle.textureIndex;
      
      activeIndex++;
    }
    
    // Update attributes
    this.positionAttribute.needsUpdate = true;
    this.colorAttribute.needsUpdate = true;
    this.sizeAttribute.needsUpdate = true;
    this.rotationAttribute.needsUpdate = true;
    this.textureIndexAttribute.needsUpdate = true;
    
    // Update mesh count
    if (this.mesh) {
      this.mesh.count = activeIndex;
    }
    
    // Update time uniform
    this.material.uniforms.uTime.value = performance.now() / 1000;
    
    // Update stats
    this.stats.particlesDrawn = activeIndex;
    this.stats.drawCalls = 1;
    this.stats.triangles = activeIndex * 2;
    this.stats.renderTime = performance.now() - renderStart;
  }

  /** Sort particles by depth from camera */
  private sortParticlesByDepth(particles: Particle[]): void {
    const cameraPosition = new THREE.Vector3();
    this.camera.getWorldPosition(cameraPosition);
    
    particles.sort((a, b) => {
      const distA = a.position.distanceToSquared(cameraPosition);
      const distB = b.position.distanceToSquared(cameraPosition);
      return distB - distA; // Back to front
    });
  }

  /** Set the texture atlas */
  setTexture(texture: THREE.Texture, atlasConfig?: { columns: number; rows: number }): void {
    this.material.uniforms.uTexture.value = texture;
    this.material.uniforms.uUseTexture.value = true;
    
    if (atlasConfig) {
      this.material.uniforms.uAtlasSize.value.set(atlasConfig.columns, atlasConfig.rows);
    }
  }

  /** Set blend mode */
  setBlendMode(mode: 'additive' | 'normal' | 'multiply'): void {
    switch (mode) {
      case 'additive':
        this.material.blending = THREE.AdditiveBlending;
        break;
      case 'normal':
        this.material.blending = THREE.NormalBlending;
        break;
      case 'multiply':
        this.material.blending = THREE.MultiplyBlending;
        break;
    }
  }

  /** Enable/disable billboarding */
  setBillboard(enabled: boolean): void {
    this.material.uniforms.uBillboard.value = enabled;
  }

  /** Get current render stats */
  getStats(): RenderStats {
    return { ...this.stats };
  }

  /** Resize the renderer (change max particles) */
  resize(newMaxParticles: number): void {
    if (newMaxParticles === this.maxParticles) return;
    
    this.maxParticles = newMaxParticles;
    
    // Resize arrays
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 4);
    this.sizes = new Float32Array(this.maxParticles);
    this.rotations = new Float32Array(this.maxParticles);
    this.textureIndices = new Float32Array(this.maxParticles);
    
    // Recreate attributes with new arrays
    this.positionAttribute = new THREE.InstancedBufferAttribute(this.positions, 3);
    this.colorAttribute = new THREE.InstancedBufferAttribute(this.colors, 4);
    this.sizeAttribute = new THREE.InstancedBufferAttribute(this.sizes, 1);
    this.rotationAttribute = new THREE.InstancedBufferAttribute(this.rotations, 1);
    this.textureIndexAttribute = new THREE.InstancedBufferAttribute(this.textureIndices, 1);
    
    // Update geometry with new attributes
    this.geometry.setAttribute('instancePosition', this.positionAttribute);
    this.geometry.setAttribute('instanceColor', this.colorAttribute);
    this.geometry.setAttribute('instanceSize', this.sizeAttribute);
    this.geometry.setAttribute('instanceRotation', this.rotationAttribute);
    this.geometry.setAttribute('instanceTextureIndex', this.textureIndexAttribute);
    
    // Recreate mesh with new size
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.dispose();
    }
    this.mesh = this.createMesh();
  }

  /** Clear all particles */
  clear(): void {
    if (this.mesh) {
      this.mesh.count = 0;
    }
    this.stats.particlesDrawn = 0;
  }

  /** Dispose of all resources */
  dispose(): void {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.dispose();
      this.mesh = undefined;
    }
    
    this.geometry.dispose();
    this.material.dispose();
    
    if (this.config.texture) {
      this.config.texture.dispose();
    }
  }
}

// ============================================
// Multi-Renderer Manager
// ============================================

export class ParticleRendererManager {
  private renderers: Map<string, ParticleRenderer> = new Map();
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private defaultConfig: Partial<RendererConfig>;

  constructor(scene: THREE.Scene, camera: THREE.Camera, defaultConfig?: Partial<RendererConfig>) {
    this.scene = scene;
    this.camera = camera;
    this.defaultConfig = defaultConfig || {};
  }

  /** Create a new renderer */
  createRenderer(id: string, config?: Partial<RendererConfig>): ParticleRenderer {
    const mergedConfig = { ...this.defaultConfig, ...config };
    const renderer = new ParticleRenderer(this.scene, this.camera, mergedConfig);
    this.renderers.set(id, renderer);
    return renderer;
  }

  /** Get an existing renderer */
  getRenderer(id: string): ParticleRenderer | undefined {
    return this.renderers.get(id);
  }

  /** Remove a renderer */
  removeRenderer(id: string): boolean {
    const renderer = this.renderers.get(id);
    if (renderer) {
      renderer.dispose();
      this.renderers.delete(id);
      return true;
    }
    return false;
  }

  /** Render all systems */
  renderAll(quality: QualityLevel = 'high'): void {
    this.renderers.forEach(renderer => {
      // Each renderer handles its own rendering
      // This is called once per frame
    });
  }

  /** Get all renderer IDs */
  getRendererIds(): string[] {
    return Array.from(this.renderers.keys());
  }

  /** Clear all renderers */
  clearAll(): void {
    this.renderers.forEach(renderer => renderer.clear());
  }

  /** Dispose of all renderers */
  dispose(): void {
    this.renderers.forEach(renderer => renderer.dispose());
    this.renderers.clear();
  }
}
