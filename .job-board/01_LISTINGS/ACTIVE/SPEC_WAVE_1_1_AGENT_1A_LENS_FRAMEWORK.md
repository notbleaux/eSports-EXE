[Ver001.000]

# WAVE 1.1 — AGENT 1-A TASK: Lens Framework Refactor
**Priority:** P0  
**Estimated:** 10 hours  
**Due:** +36 hours from claim  
**Stream:** Advanced Lens System  
**Foundation Dependency:** SpecMapViewer v2 base (commit 7df305d5)

---

## ASSIGNMENT

Transform the existing 6 creative lenses into a **plugin-based architecture** that supports 20+ lenses with hot-swapping, compositing, and performance optimization.

### Current State (Foundation)

```typescript
// Existing (6 creative lenses)
export const SPECMAPVIEWER_INFO = {
  lenses: ['tension', 'ripple', 'blood', 'wind', 'doors', 'secured'],
  // ...
}
```

**Problem:** Hardcoded lens list, no compositing, no performance tiers.

---

## DELIVERABLES

### 1. Lens Plugin Interface (lens/types.ts)

```typescript
/**
 * Lens Plugin Architecture
 * ========================
 * Modular, hot-swappable, compositable lens system
 */

export interface LensPlugin {
  // Identity
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly author: string;
  
  // Categorization
  readonly category: LensCategory;
  readonly tags: string[];
  
  // Capabilities
  readonly capabilities: LensCapabilities;
  
  // Configuration
  readonly configSchema: JSONSchema;
  readonly defaultConfig: Record<string, unknown>;
  
  // Performance
  readonly performanceTier: 'light' | 'medium' | 'heavy';
  readonly targetFps: number;
  readonly gpuMemoryMB: number;
  
  // Lifecycle hooks
  initialize(context: LensContext): void | Promise<void>;
  configure(config: Record<string, unknown>): void;
  render(params: RenderParams): RenderOutput;
  dispose(): void;
  
  // Optional: Animation support
  update?(deltaTime: number): void;
  
  // Optional: Event handling
  onMatchEvent?(event: MatchEvent): void;
  onCameraChange?(camera: CameraState): void;
}

export type LensCategory = 
  | 'tactical'      // Strategy visualization
  | 'analytical'    // Statistics and data
  | 'broadcast'     // Observer/caster tools
  | 'creative'      // Visual effects
  | 'utility';      // Helper tools

export interface LensCapabilities {
  supports3D: boolean;
  supportsWebGL2: boolean;
  requiresDepthBuffer: boolean;
  supportsTransparency: boolean;
  canAnimate: boolean;
  supportsCompositing: boolean;
}

export interface LensContext {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  mapData: MapData;
  dimensionManager: DimensionManager;
  cameraController: CameraController;
  eventBus: EventEmitter;
}

export interface RenderParams {
  timestamp: number;
  deltaTime: number;
  camera: CameraState;
  dimension: DimensionMode;
  viewport: Viewport;
  matchState?: MatchState;
  players?: PlayerState[];
}

export interface RenderOutput {
  texture?: WebGLTexture;
  framebuffer?: WebGLFramebuffer;
  overlay?: HTMLCanvasElement;  // For DOM overlay
  metadata: {
    renderTime: number;
    triangles: number;
    drawCalls: number;
  };
}
```

### 2. Lens Registry System (lens/registry.ts)

```typescript
/**
 * Lens Registry
 * =============
 * Discovery, loading, and management of lens plugins
 */

export class LensRegistry {
  private lenses: Map<string, LensPlugin> = new Map();
  private categories: Map<LensCategory, string[]> = new Map();
  
  // Register a lens
  register(lens: LensPlugin): void {
    if (this.lenses.has(lens.id)) {
      throw new Error(`Lens ${lens.id} already registered`);
    }
    
    this.lenses.set(lens.id, lens);
    
    // Index by category
    const categoryLenses = this.categories.get(lens.category) || [];
    categoryLenses.push(lens.id);
    this.categories.set(lens.category, categoryLenses);
    
    console.log(`[LensRegistry] Registered: ${lens.name} (${lens.id})`);
  }
  
  // Unregister a lens
  unregister(lensId: string): void {
    const lens = this.lenses.get(lensId);
    if (lens) {
      lens.dispose();
      this.lenses.delete(lensId);
      
      // Remove from category index
      const categoryLenses = this.categories.get(lens.category) || [];
      const index = categoryLenses.indexOf(lensId);
      if (index > -1) categoryLenses.splice(index, 1);
    }
  }
  
  // Get lens by ID
  get(lensId: string): LensPlugin | undefined {
    return this.lenses.get(lensId);
  }
  
  // Get all lenses in category
  getByCategory(category: LensCategory): LensPlugin[] {
    const ids = this.categories.get(category) || [];
    return ids.map(id => this.lenses.get(id)!).filter(Boolean);
  }
  
  // Search lenses
  search(query: string): LensPlugin[] {
    const q = query.toLowerCase();
    return Array.from(this.lenses.values()).filter(lens =>
      lens.name.toLowerCase().includes(q) ||
      lens.description.toLowerCase().includes(q) ||
      lens.tags.some(tag => tag.toLowerCase().includes(q))
    );
  }
  
  // Get performance summary
  getPerformanceSummary(): PerformanceSummary {
    const summary: PerformanceSummary = {
      total: this.lenses.size,
      byTier: { light: 0, medium: 0, heavy: 0 },
      byCategory: {} as Record<LensCategory, number>
    };
    
    for (const lens of this.lenses.values()) {
      summary.byTier[lens.performanceTier]++;
      summary.byCategory[lens.category] = (summary.byCategory[lens.category] || 0) + 1;
    }
    
    return summary;
  }
}

export const globalLensRegistry = new LensRegistry();
```

### 3. Lens Compositor (lens/compositor.ts)

```typescript
/**
 * Lens Compositor
 * ===============
 * Layer multiple lenses with blend modes and masking
 */

export interface LensLayer {
  lens: LensPlugin;
  config: Record<string, unknown>;
  opacity: number;           // 0-1
  blendMode: BlendMode;
  mask?: LensMask;
  zIndex: number;
  enabled: boolean;
}

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'soft-light'
  | 'hard-light'
  | 'color-dodge'
  | 'color-burn'
  | 'difference'
  | 'exclusion'
  | 'custom';

export interface LensMask {
  type: 'circle' | 'rect' | 'polygon' | 'texture';
  data: unknown;
  invert: boolean;
  feather: number;           // Pixels
}

export class LensCompositor {
  private gl: WebGL2RenderingContext;
  private layers: LensLayer[] = [];
  private framebuffers: Map<string, WebGLFramebuffer> = new Map();
  private compositeShader: WebGLProgram;
  
  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.compositeShader = this.createCompositeShader();
  }
  
  // Add a lens layer
  addLayer(layer: Omit<LensLayer, 'zIndex'>): LensLayer {
    const newLayer: LensLayer = {
      ...layer,
      zIndex: this.layers.length
    };
    this.layers.push(newLayer);
    this.sortLayers();
    return newLayer;
  }
  
  // Remove a layer
  removeLayer(index: number): void {
    if (index >= 0 && index < this.layers.length) {
      this.layers.splice(index, 1);
      this.renumberLayers();
    }
  }
  
  // Reorder layers
  moveLayer(fromIndex: number, toIndex: number): void {
    const [layer] = this.layers.splice(fromIndex, 1);
    this.layers.splice(toIndex, 0, layer);
    this.renumberLayers();
  }
  
  // Render all layers
  compose(params: RenderParams): WebGLTexture {
    const gl = this.gl;
    
    // Render each enabled layer to its framebuffer
    for (const layer of this.layers) {
      if (!layer.enabled) continue;
      
      const fb = this.getFramebuffer(layer.lens.id);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      
      layer.lens.render({
        ...params,
        // Apply lens-specific config
      });
    }
    
    // Composite to output
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return this.performCompositePass();
  }
  
  private performCompositePass(): WebGLTexture {
    // Use compositeShader to blend all layer textures
    // Based on layer.blendMode and layer.opacity
    // Apply masks if present
    // ...
  }
  
  // Performance optimization: skip occluded layers
  optimizeForViewport(viewport: Viewport): void {
    // Disable layers fully outside viewport
    // Reduce quality for distant layers
  }
}
```

### 4. Hot-Reload Development System (lens/dev.ts)

```typescript
/**
 * Lens Development Tools
 * ======================
 * Hot reload, debugging, and profiling for lens development
 */

export class LensDevTools {
  private registry: LensRegistry;
  private reloadCallbacks: Map<string, () => void> = new Map();
  
  // Watch a lens module for changes
  watch(lensPath: string): void {
    if (typeof window !== 'undefined' && 'WebSocket' in window) {
      const ws = new WebSocket('ws://localhost:3001/lens-dev');
      
      ws.onmessage = (event) => {
        const change = JSON.parse(event.data);
        if (change.lensId) {
          this.hotReload(change.lensId, change.moduleUrl);
        }
      };
    }
  }
  
  // Hot reload a lens without full page refresh
  async hotReload(lensId: string, moduleUrl: string): Promise<void> {
    console.log(`[LensDev] Hot reloading: ${lensId}`);
    
    // Dispose old lens
    const oldLens = this.registry.get(lensId);
    if (oldLens) {
      oldLens.dispose();
      this.registry.unregister(lensId);
    }
    
    // Import new module
    const module = await import(/* @vite-ignore */ moduleUrl + '?t=' + Date.now());
    const NewLensClass = module.default;
    const newLens = new NewLensClass();
    
    // Register new lens
    this.registry.register(newLens);
    
    // Notify UI
    this.reloadCallbacks.get(lensId)?.();
  }
  
  // Performance profiler
  profile(lensId: string, duration: number = 5000): Promise<ProfileResult> {
    const lens = this.registry.get(lensId);
    if (!lens) throw new Error(`Lens ${lensId} not found`);
    
    return new Promise((resolve) => {
      const frames: number[] = [];
      const startTime = performance.now();
      
      const measure = () => {
        const frameStart = performance.now();
        
        // Trigger render
        lens.render({
          timestamp: frameStart,
          deltaTime: 16.67,
          camera: {} as CameraState,
          dimension: '2D',
          viewport: { width: 1920, height: 1080 }
        });
        
        const frameTime = performance.now() - frameStart;
        frames.push(frameTime);
        
        if (performance.now() - startTime < duration) {
          requestAnimationFrame(measure);
        } else {
          resolve(this.analyzeProfile(frames));
        }
      };
      
      requestAnimationFrame(measure);
    });
  }
  
  private analyzeProfile(frames: number[]): ProfileResult {
    const sorted = [...frames].sort((a, b) => a - b);
    const avg = frames.reduce((a, b) => a + b, 0) / frames.length;
    
    return {
      averageFrameTime: avg,
      averageFps: 1000 / avg,
      p95FrameTime: sorted[Math.floor(sorted.length * 0.95)],
      p99FrameTime: sorted[Math.floor(sorted.length * 0.99)],
      droppedFrames: frames.filter(t => t > 16.67).length,
      totalFrames: frames.length
    };
  }
}
```

### 5. Migration Guide (MIGRATION_LENSES.md)

Document how to convert existing 6 lenses to new plugin format:

```markdown
## Migrating Existing Lenses

### Before (Hardcoded)
```typescript
// Old way
const tensionLens = {
  render: (ctx) => { /* ... */ }
};
```

### After (Plugin)
```typescript
// New way
export default class TensionLens implements LensPlugin {
  id = 'tension';
  name = 'Tension Lens';
  category = 'creative';
  // ... implement all interface methods
}
```
```

### 6. Unit Tests (lens/__tests__/framework.test.ts)

- Registry add/remove
- Compositor layer ordering
- Hot reload functionality
- Performance profiling

---

## FOREMAN REVIEW CHECKLIST

- [ ] LensPlugin interface is comprehensive but not bloated
- [ ] Registry handles errors gracefully
- [ ] Compositor supports all planned blend modes
- [ ] Hot reload works in development
- [ ] Performance profiling provides actionable data
- [ ] Migration guide is clear
- [ ] All 6 existing lenses can be migrated

---

## INTEGRATION NOTES

**Receives from:**
- Foundation: DimensionManager, CameraController (use as-is)

**Provides to:**
- Agent 1-B: Analytical Lenses (needs this framework)
- Agent 1-C: Tactical Lenses (needs this framework)
- Agent 2-A: WebGL Shaders (integrates with render)

---

*Claim by moving to `.job-board/02_CLAIMED/{agent-id}/`*
