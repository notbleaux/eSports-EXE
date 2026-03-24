[Ver001.000]

# WAVE 1.3 — AGENT 3-A TASK: Lens System Integration
**Priority:** P1  
**Estimated:** 12 hours  
**Due:** +72 hours from Wave 1.2 completion  
**Stream:** Advanced Lens System  
**Dependencies:** Waves 1.1 (Framework) + 1.2 (Rendering)

---

## ASSIGNMENT

Integrate all lens components into a cohesive system, implement lens switching, and ensure 60fps performance with multiple active lenses.

---

## DELIVERABLES

### 1. Lens Manager (lens/LensManager.ts)

```typescript
export class LensManager {
  private gl: WebGL2RenderingContext;
  private registry: LensRegistry;
  private compositor: LensCompositor;
  private activeLenses: Map<string, ActiveLens> = new Map();
  
  private performanceMonitor: PerformanceMonitor;
  private qualityLevel: 'low' | 'medium' | 'high' = 'high';
  
  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.registry = new LensRegistry();
    this.compositor = new LensCompositor(gl);
    this.performanceMonitor = new PerformanceMonitor();
  }
  
  // Register all available lenses
  registerLenses(): void {
    // Tactical lenses
    this.registry.register(new RotationPredictorLens());
    this.registry.register(new TimingWindowLens());
    this.registry.register(new PushProbabilityLens());
    this.registry.register(new ClutchZoneLens());
    this.registry.register(new UtilityCoverageLens());
    this.registry.register(new TradeRouteLens());
    this.registry.register(new InfoGapLens());
    this.registry.register(new EconomyPressureLens());
    
    // Analytical lenses
    this.registry.register(new PerformanceHeatmapLens());
    this.registry.register(new AbilityEfficiencyLens());
    this.registry.register(new DuelHistoryLens());
    this.registry.register(new SiteControlLens());
    this.registry.register(new TrajectoryLens());
    this.registry.register(new DamageLens());
    this.registry.register(new FlashAssistLens());
    this.registry.register(new EntrySuccessLens());
    
    // Broadcast lenses
    this.registry.register(new ObserverOverlayLens());
    this.registry.register(new CasterGraphicsLens());
    this.registry.register(new ReplayMarkerLens());
    this.registry.register(new HighlightZoneLens());
    
    // Creative lenses (existing + new)
    this.registry.register(new TensionLens());
    this.registry.register(new RippleLens());
    this.registry.register(new BloodLens());
    this.registry.register(new WindLens());
    this.registry.register(new DoorsLens());
    this.registry.register(new SecuredLens());
    this.registry.register(new SparksLens());
    this.registry.register(new SmokeTendrilLens());
    this.registry.register(new MuzzleFlashLens());
    this.registry.register(new ClutchGlowLens());
  }
  
  // Activate a lens
  activate(lensId: string, config?: Record<string, unknown>): boolean {
    const lens = this.registry.get(lensId);
    if (!lens) return false;
    
    // Check performance budget
    if (!this.canActivate(lens)) {
      console.warn(`Cannot activate ${lensId}: performance budget exceeded`);
      return false;
    }
    
    // Initialize lens
    lens.initialize({
      gl: this.gl,
      canvas: this.canvas,
      mapData: this.mapData,
      dimensionManager: this.dimensionManager,
      cameraController: this.cameraController,
      eventBus: this.eventBus
    });
    
    if (config) {
      lens.configure(config);
    }
    
    this.activeLenses.set(lensId, {
      lens,
      enabled: true,
      opacity: 1.0,
      zIndex: this.activeLenses.size
    });
    
    this.updateCompositorLayers();
    return true;
  }
  
  // Deactivate a lens
  deactivate(lensId: string): void {
    const active = this.activeLenses.get(lensId);
    if (active) {
      active.lens.dispose();
      this.activeLenses.delete(lensId);
      this.updateCompositorLayers();
    }
  }
  
  // Render all active lenses
  render(params: RenderParams): RenderOutput {
    const startTime = performance.now();
    
    // Update performance monitoring
    this.performanceMonitor.startFrame();
    
    // Render each active lens
    for (const [id, active] of this.activeLenses) {
      if (!active.enabled) continue;
      
      const lensStart = performance.now();
      const output = active.lens.render({
        ...params,
        timestamp: startTime
      });
      
      this.performanceMonitor.recordLensTime(id, performance.now() - lensStart);
    }
    
    // Composite layers
    const compositeStart = performance.now();
    const result = this.compositor.compose(params);
    this.performanceMonitor.recordCompositeTime(performance.now() - compositeStart);
    
    // Auto-adjust quality if needed
    this.autoAdjustQuality();
    
    return result;
  }
  
  private canActivate(lens: LensPlugin): boolean {
    const currentLoad = this.calculateGPULoad();
    return currentLoad + lens.gpuMemoryMB < this.getPerformanceBudget();
  }
  
  private autoAdjustQuality(): void {
    const stats = this.performanceMonitor.getStats();
    
    if (stats.averageFrameTime > 20) { // < 50fps
      this.reduceQuality();
    } else if (stats.averageFrameTime < 12 && this.qualityLevel !== 'high') { // > 80fps
      this.increaseQuality();
    }
  }
}
```

### 2. Lens UI Controls

```typescript
export class LensUI {
  // React component for lens panel
  renderLensPanel(): JSX.Element {
    return (
      <div className="lens-panel">
        <h3>Active Lenses</h3>
        {this.renderActiveLenses()}
        
        <h3>Available Lenses</h3>
        <input 
          type="text" 
          placeholder="Search lenses..."
          onChange={(e) => this.filterLenses(e.target.value)}
        />
        {this.renderLensCategories()}
      </div>
    );
  }
  
  private renderLensCategories(): JSX.Element {
    const categories: LensCategory[] = ['tactical', 'analytical', 'broadcast', 'creative'];
    
    return categories.map(cat => (
      <div key={cat} className="lens-category">
        <h4>{cat.charAt(0).toUpperCase() + cat.slice(1)}</h4>
        {this.registry.getByCategory(cat).map(lens => (
          <LensToggle 
            key={lens.id}
            lens={lens}
            active={this.manager.isActive(lens.id)}
            onToggle={() => this.toggleLens(lens.id)}
          />
        ))}
      </div>
    ));
  }
}
```

### 3. Performance Monitor

```typescript
export class PerformanceMonitor {
  private frameTimes: number[] = [];
  private lensTimes: Map<string, number[]> = new Map();
  private compositeTime: number = 0;
  
  startFrame(): void {
    this.currentFrameStart = performance.now();
  }
  
  recordLensTime(lensId: string, time: number): void {
    if (!this.lensTimes.has(lensId)) {
      this.lensTimes.set(lensId, []);
    }
    this.lensTimes.get(lensId)!.push(time);
  }
  
  getStats(): PerformanceStats {
    const frames = this.frameTimes.slice(-60); // Last 60 frames
    const avg = frames.reduce((a, b) => a + b, 0) / frames.length;
    
    const lensStats: Record<string, LensPerfStats> = {};
    for (const [id, times] of this.lensTimes) {
      const recent = times.slice(-60);
      lensStats[id] = {
        averageTime: recent.reduce((a, b) => a + b, 0) / recent.length,
        maxTime: Math.max(...recent),
        impact: (recent.reduce((a, b) => a + b, 0) / recent.length) / avg * 100
      };
    }
    
    return {
      averageFrameTime: avg,
      averageFps: 1000 / avg,
      lensBreakdown: lensStats,
      compositeTime: this.compositeTime,
      recommendedMaxLenses: this.calculateMaxLenses(avg)
    };
  }
}
```

---

## ACCEPTANCE CRITERIA

- [ ] All 30 lenses registered and functional
- [ ] Can activate 5+ lenses simultaneously
- [ ] Maintain 60fps with 3 lenses active
- [ ] Auto quality adjustment works
- [ ] Lens switching <100ms
- [ ] UI controls responsive

---

*Claim by moving to `.job-board/02_CLAIMED/{agent-id}/`*
