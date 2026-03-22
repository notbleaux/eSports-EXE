[Ver001.000]

# WAVE 1.2 — AGENT 2-B TASK: Heatmap & Trajectory Systems
**Priority:** P1  
**Estimated:** 10 hours  
**Due:** +48 hours from Wave 1.1 completion  
**Stream:** Advanced Lens System  
**Dependencies:** Agent 1-A Lens Framework, Agent 2-A WebGL Shaders

---

## ASSIGNMENT

Implement GPU-accelerated heatmap generation and trajectory rendering systems for analytical lenses.

---

## DELIVERABLES

### 1. Heatmap Generator (lens/utils/heatmap.ts)

```typescript
export interface HeatmapConfig {
  width: number;        // Grid resolution (256)
  height: number;
  radius: number;       // Kernel radius in pixels
  intensity: number;    // Global intensity multiplier
  decay: number;        // Temporal decay for animated heatmaps
}

export class HeatmapGenerator {
  private gl: WebGL2RenderingContext;
  private framebuffer: WebGLFramebuffer;
  private dataTexture: WebGLTexture;
  private kernelTexture: WebGLTexture;
  
  constructor(gl: WebGL2RenderingContext, config: HeatmapConfig) {
    this.gl = gl;
    this.setupFramebuffers(config);
    this.generateKernel(config.radius);
  }
  
  // Generate heatmap from event data
  generate(events: HeatmapEvent[]): WebGLTexture {
    // Clear accumulation buffer
    this.clear();
    
    // Accumulate events
    for (const event of events) {
      this.splat(event);
    }
    
    // Apply Gaussian blur
    this.blur();
    
    // Normalize and pack
    return this.pack();
  }
  
  // Real-time update (add single event)
  splat(event: HeatmapEvent): void {
    const gl = this.gl;
    
    // Use point sprite or small quad at event position
    // Add to accumulation texture
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.viewport(0, 0, this.config.width, this.config.height);
    
    // Render kernel splat
    this.renderSplat(event.x, event.y, event.intensity);
  }
  
  private blur(): void {
    // Two-pass Gaussian blur (horizontal then vertical)
    // Uses separable kernel for O(n) vs O(n²) complexity
  }
  
  // Animated heatmap with temporal decay
  updateAnimated(events: HeatmapEvent[], deltaTime: number): WebGLTexture {
    // Apply decay to existing heatmap
    this.applyDecay(deltaTime);
    
    // Add new events
    for (const event of events) {
      this.splat(event);
    }
    
    return this.pack();
  }
}
```

### 2. Trajectory Renderer (lens/utils/trajectory.ts)

```typescript
export interface Trajectory {
  playerId: string;
  points: Vector3D[];      // Position history
  timestamps: number[];    // Corresponding times
  color: [number, number, number];
  opacity: number;
}

export class TrajectoryRenderer {
  private gl: WebGL2RenderingContext;
  private shader: ShaderProgram;
  private maxPoints: number = 1000;
  
  // Render trajectory as fading trail
  render(trajectory: Trajectory, options: RenderOptions): void {
    const gl = this.gl;
    
    // Create vertex buffer from points
    const vertices = this.buildTrailGeometry(trajectory);
    
    // Calculate fade based on age
    const now = performance.now();
    const ageFactors = trajectory.timestamps.map(t => 
      1.0 - Math.min(1.0, (now - t) / options.fadeDuration)
    );
    
    // Render with gradient alpha
    this.renderTrail(vertices, ageFactors, trajectory.color);
  }
  
  // Predictive trajectory (dashed line to predicted position)
  renderPredictive(
    currentPosition: Vector3D,
    predictedPath: Vector3D[],
    confidence: number
  ): void {
    // Solid line for observed path
    // Dashed line for prediction
    // Opacity based on confidence
  }
  
  // Multiple trajectories with LOD
  renderBatch(trajectories: Trajectory[], cameraDistance: number): void {
    // Simplify geometry based on distance
    const lod = this.calculateLOD(cameraDistance);
    
    for (const traj of trajectories) {
      const simplified = this.simplifyTrajectory(traj, lod);
      this.render(simplified, { fadeDuration: 5000 });
    }
  }
  
  private simplifyTrajectory(traj: Trajectory, lod: number): Trajectory {
    // Ramer-Douglas-Peucker algorithm for path simplification
    // Reduces vertices while preserving shape
  }
}
```

### 3. Path Prediction Visualizer

```typescript
export class PredictionVisualizer {
  // Show alternative paths with probability
  renderPredictionCones(
    position: Vector3D,
    predictions: PredictedPath[],
    viewport: Viewport
  ): void {
    // Main path = thickest, highest opacity
    // Alternative paths = thinner, fading
    // Confidence = color intensity
    
    predictions.sort((a, b) => b.confidence - a.confidence);
    
    for (let i = 0; i < predictions.length; i++) {
      const pred = predictions[i];
      const alpha = pred.confidence * (1 - i * 0.2); // Fade lower confidence
      const width = 4 - i; // Thinner for alternatives
      
      this.renderPath(pred.path, { alpha, width });
    }
  }
  
  // Uncertainty visualization (fuzzy region)
  renderUncertaintyRegion(path: Vector3D[], uncertainty: number[]): void {
    // Render as widening cone
    // Based on accumulated uncertainty over time
  }
}
```

### 4. GPU Compute Utilities

```typescript
export class GPUCompute {
  private gl: WebGL2RenderingContext;
  private transformFeedback: WebGLTransformFeedback;
  
  // Compute shader for particle updates
  updateParticles(particles: Particle[], deltaTime: number): Particle[] {
    // Use transform feedback for GPU-side particle updates
    // Position, velocity, lifetime updates
  }
  
  // Parallel reduction for statistics
  reduce(values: Float32Array): { sum: number; min: number; max: number } {
    // Parallel sum/min/max using reduction algorithm
  }
}
```

---

## ACCEPTANCE CRITERIA

- [ ] Heatmap generation <5ms for 1000 events
- [ ] Trajectory rendering 60fps with 20 paths
- [ ] LOD system reduces vertices by 50% at distance
- [ ] Prediction visualization clear and intuitive

---

*Claim by moving to `.job-board/02_CLAIMED/{agent-id}/`*
