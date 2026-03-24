# Mass Sub-Agent Spawn Plan - Pipeline Completion

[Ver001.000]

**Objective**: Complete mascot generation pipeline with mass agent coordination  
**Strategy**: Async agent waves with token optimization  
**Estimated Agents**: 24-32  
**Estimated Duration**: 48-72 hours  
**Token Budget**: ~2M tokens total

---

## Executive Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    FOREMAN (COORDINATOR)                         │
│                         SATUR (IDE)                              │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  PHASE 1      │    │  PHASE 2      │    │  PHASE 3      │
│  Generation   │    │  Integration  │    │  Verification │
│  (12 agents)  │    │  (8 agents)   │    │  (8 agents)   │
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
                  ┌───────────────────┐
                  │   PHASE 4         │
                  │   Refinement      │
                  │   (4 agents)      │
                  └───────────────────┘
```

---

## Token Budget Allocation

| Phase | Agents | Tokens/Agent | Total Tokens | Purpose |
|-------|--------|--------------|--------------|---------|
| Phase 1: Generation | 12 | ~50K | ~600K | Asset creation |
| Phase 2: Integration | 8 | ~40K | ~320K | Component wiring |
| Phase 3: Testing | 8 | ~60K | ~480K | Validation |
| Phase 4: Refinement | 4 | ~100K | ~400K | Optimization |
| **TOTAL** | **32** | **~62K avg** | **~1.8M** | |

**Token Conservation Strategies**:
- Batch similar tasks (reduces context switching)
- Use shared context files (avoids repetition)
- Progressive refinement (coarse → fine)
- Async result aggregation

---

## PHASE 1: Asset Generation (Wave 1) - 12 Agents

### Wave 1.1: SVG Generation Fleet (4 agents)
**Parallel**: YES | **Async**: YES | **Duration**: 4 hours

| Agent | Task | Mascot | Sizes | Output |
|-------|------|--------|-------|--------|
| GEN-SVG-001 | Generate SVGs | Fox | 32,64,128,256,512 | 5 files |
| GEN-SVG-002 | Generate SVGs | Owl | 32,64,128,256,512 | 5 files |
| GEN-SVG-003 | Generate SVGs | Wolf | 32,64,128,256,512 | 5 files |
| GEN-SVG-004 | Generate SVGs | Hawk | 32,64,128,256,512 | 5 files |

**Instructions per agent**:
```yaml
Task: Generate SVG mascot files
Input: scripts/mascot-generator/config.ts
Output: public/mascots/svg/{mascot}-{size}x{size}.svg
Validation: File exists, valid SVG, viewBox correct
Fine-tuning: Use pixelPerfect preset
```

**Token estimate**: 40K/agent (includes validation)

---

### Wave 1.2: CSS Generation Fleet (4 agents)
**Parallel**: YES | **Async**: YES | **Duration**: 3 hours

| Agent | Task | Mascot | Output |
|-------|------|--------|--------|
| GEN-CSS-001 | Generate CSS | Fox | fox.css + animations |
| GEN-CSS-002 | Generate CSS | Owl | owl.css + animations |
| GEN-CSS-003 | Generate CSS | Wolf | wolf.css + animations |
| GEN-CSS-004 | Generate CSS | Hawk | hawk.css + animations |

**Instructions**:
```yaml
Task: Generate CSS box-shadow pixel art
Include: Base styles, idle animation, wave animation, celebrate animation
Output: public/mascots/css/{mascot}.css
Bonus: Generate React component variant
```

**Token estimate**: 35K/agent

---

### Wave 1.3: PNG Generation Fleet (4 agents) - Optional
**Parallel**: YES | **Async**: YES | **Duration**: 6 hours | **Requires**: canvas

| Agent | Task | Mascot | Sizes |
|-------|------|--------|-------|
| GEN-PNG-001 | Generate PNGs | Fox | 32,64,128,256 |
| GEN-PNG-002 | Generate PNGs | Owl | 32,64,128,256 |
| GEN-PNG-003 | Generate PNGs | Wolf | 32,64,128,256 |
| GEN-PNG-004 | Generate PNGs | Hawk | 32,64,128,256 |

**Instructions**:
```yaml
Task: Generate PNG raster files
Prerequisite: npm install canvas sharp
Optimization: Use aggressive for <64px, basic for >128px
Quality: Pixel-perfect, no anti-alias
Validation: File size <20KB, dimensions exact
```

**Token estimate**: 60K/agent (includes error handling for canvas)

---

### Wave 1 Checkpoint
**Agent**: CHK-001 (Coordinator)  
**Task**: Verify all Wave 1 outputs
**Duration**: 1 hour

```yaml
Validation:
  - SVG: 20 files (4 mascots × 5 sizes)
  - CSS: 4 files + bundle
  - PNG: 16 files (if generated)
  - All files in correct directories
  - No corrupted files
```

---

## PHASE 2: Integration (Wave 2) - 8 Agents

### Wave 2.1: Component Integration (4 agents)
**Parallel**: YES | **Depends**: Wave 1 complete | **Duration**: 6 hours

| Agent | Task | Component | Integration |
|-------|------|-----------|-------------|
| INT-001 | HeroMascot | SVG | Replace inline SVG with generated |
| INT-002 | HeroMascot | CSS | Add CSS variant support |
| INT-003 | MascotCard | All formats | Update to use MascotAsset |
| INT-004 | MascotGallery | All formats | Grid with format switching |

**Instructions**:
```yaml
Task: Integrate generated assets into existing components
Input: 
  - src/components/heroes/HeroMascot.tsx
  - src/components/mascots/MascotCard.tsx
  - src/components/mascots/MascotGallery.tsx
  - Generated assets from Phase 1

Requirements:
  - Maintain backward compatibility
  - Add format prop (svg|png|css|auto)
  - Lazy load assets
  - Error boundaries for missing files
  - TypeScript types updated

Testing:
  - Component renders without errors
  - All 4 mascots display correctly
  - Format switching works
```

**Token estimate**: 50K/agent

---

### Wave 2.2: Pipeline Integration (4 agents)
**Parallel**: YES | **Duration**: 4 hours

| Agent | Task | Target | Purpose |
|-------|------|--------|---------|
| INT-005 | Build script | package.json | Add mascot:generate script |
| INT-006 | Pre-commit | .husky/ | Auto-generate on asset change |
| INT-007 | Watch mode | Scripts | File watcher for dev |
| INT-008 | Documentation | README.md | Update with integration |

**Instructions**:
```yaml
INT-005:
  - Add "mascots:generate" to package.json scripts
  - Add "mascots:watch" for development
  - Integrate into build pipeline

INT-006:
  - Create pre-commit hook
  - Check if mascot config changed
  - Regenerate if needed
  - Commit generated assets

INT-007:
  - Use chokidar or fs.watch
  - Watch scripts/mascot-generator/config.ts
  - Auto-regenerate on change
  - Debounce 500ms

INT-008:
  - Update main README.md
  - Add mascot generation section
  - Include usage examples
  - Document all 3 options
```

**Token estimate**: 30K/agent

---

### Wave 2 Checkpoint
**Agent**: CHK-002  
**Task**: Integration validation

```yaml
Checklist:
  - Components compile without errors
  - Build script works
  - Pre-commit hook functional
  - Documentation accurate
  - No breaking changes
```

---

## PHASE 3: Testing & Verification (Wave 3) - 8 Agents

### Wave 3.1: Unit Testing (3 agents)
**Parallel**: YES | **Duration**: 6 hours

| Agent | Task | Coverage |
|-------|------|----------|
| TEST-001 | SVG Generator | Unit tests for generator functions |
| TEST-002 | CSS Generator | Box-shadow validation, size accuracy |
| TEST-003 | PNG Generator | Canvas mocking, buffer validation |

**Instructions**:
```yaml
TEST-001:
  Test cases:
    - SVG structure valid
    - ViewBox correct for each size
    - Colors match config
    - Pixel grid accurate
    - Animation attributes present
  
TEST-002:
  Test cases:
    - Box-shadow syntax valid
    - Pixel positions accurate
    - Animation keyframes valid
    - CSS output parseable
  
TEST-003:
  Test cases:
    - Canvas initialization
    - Pixel placement correct
    - Buffer generation
    - Optimization reduces size
```

**Token estimate**: 55K/agent

---

### Wave 3.2: Integration Testing (3 agents)
**Parallel**: YES | **Duration**: 6 hours

| Agent | Task | Component |
|-------|------|-----------|
| TEST-004 | HeroMascot | Render, props, animations |
| TEST-005 | MascotAsset | Format switching, lazy load |
| TEST-006 | E2E | Visual regression, all browsers |

**Instructions**:
```yaml
TEST-004:
  - Render with each mascot type
  - Test size props
  - Verify animations play
  - Check accessibility
  
TEST-005:
  - Test format="auto" selection
  - Verify lazy loading
  - Error handling for 404s
  - Performance metrics
  
TEST-006:
  - Screenshot comparison
  - Chrome, Firefox, Safari
  - Mobile responsive
  - Dark mode support
```

**Token estimate**: 60K/agent

---

### Wave 3.3: Performance & Quality (2 agents)
**Parallel**: YES | **Duration**: 4 hours

| Agent | Task | Metric |
|-------|------|--------|
| PERF-001 | File size audit | <20KB per asset |
| PERF-002 | Load time | <100ms per mascot |

**Instructions**:
```yaml
PERF-001:
  Audit:
    - SVG: <5KB for 64x64
    - PNG: <10KB for 64x64
    - CSS: <3KB per mascot
  Optimization suggestions
  
PERF-002:
  Measure:
    - Time to first paint
    - Lazy load trigger
    - Animation frame rate
    - Memory usage
```

**Token estimate**: 45K/agent

---

### Wave 3 Checkpoint
**Agent**: CHK-003  
**Task**: Test results aggregation

```yaml
Must pass:
  - 90%+ unit test coverage
  - 0 integration test failures
  - Performance budget met
  - Accessibility checks pass
```

---

## PHASE 4: Refinement (Wave 4) - 4 Agents

### Wave 4.1: Optimization (2 agents)
**Parallel**: YES | **Duration**: 6 hours

| Agent | Task | Target |
|-------|------|--------|
| REF-001 | SVG optimization | Minify, remove redundancy |
| REF-002 | CSS optimization | Reduce box-shadow count |

**Instructions**:
```yaml
REF-001:
  Optimizations:
    - Merge adjacent same-color pixels
    - Simplify path data
    - Remove unused defs
    - Compress decimal precision
  
REF-002:
    - Group repeated patterns
    - Use CSS variables for colors
    - Optimize animation keyframes
    - Remove redundant properties
```

**Token estimate**: 80K/agent (includes iteration)

---

### Wave 4.2: Documentation & Polish (2 agents)
**Parallel**: YES | **Duration**: 4 hours

| Agent | Task | Output |
|-------|------|--------|
| DOC-001 | API docs | Component API reference |
| DOC-002 | Examples | Storybook stories |

**Instructions**:
```yaml
DOC-001:
  Document:
    - All component props
    - MascotConfig interface
    - GenerationOptions
    - Usage patterns
    - Troubleshooting
  
DOC-002:
  Create:
    - Size comparison story
    - Format comparison story
    - Animation showcase
    - All mascots gallery
```

**Token estimate**: 50K/agent

---

## Async Coordination Strategy

### Shared State
```typescript
// .job-board/MASS_SPAWN_STATE.json
{
  "phase": 2,
  "wave": "2.1",
  "agents": {
    "active": ["INT-001", "INT-002", "INT-003", "INT-004"],
    "completed": ["GEN-SVG-001", "GEN-SVG-002", ...],
    "blocked": [],
    "failed": []
  },
  "outputs": {
    "svg": ["fox-32x32.svg", "fox-64x64.svg", ...],
    "css": ["fox.css", "owl.css", ...],
    "png": ["fox-32x32.png", ...]
  },
  "checkpoints": {
    "wave1": "PASSED",
    "wave2": "IN_PROGRESS",
    "wave3": "PENDING",
    "wave4": "PENDING"
  }
}
```

### Communication Protocol
1. **Start**: Agent reads shared state
2. **Work**: Agent performs task
3. **Update**: Agent writes results to state
4. **Signal**: Agent notifies coordinator
5. **Checkpoint**: Coordinator validates, unlocks next wave

---

## Error Handling & Recovery

### Agent Failure Scenarios

| Scenario | Recovery |
|----------|----------|
| Single agent fails | Retry with same context (1x) |
| Wave fails | Pause, alert foreman, manual intervention |
| Token limit | Save state, resume with fresh context |
| Output invalid | Re-queue for refinement agent |

### Rollback Strategy
```yaml
Per-wave snapshots:
  - Before wave: git commit
  - After wave: git commit
  - On failure: git reset --hard WAVE_START
```

---

## Final Review Checklist

### Pre-Spawn
- [ ] All config files validated
- [ ] Token budget approved
- [ ] Agent pool available
- [ ] Shared state initialized
- [ ] Rollback points set

### During Execution
- [ ] Checkpoint validation every 4 hours
- [ ] Token usage monitoring
- [ ] Agent health checks
- [ ] Output quality sampling

### Post-Completion
- [ ] All assets generated
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Performance budget met
- [ ] Ready for production

---

## 10 Recommendations for Pipeline Enhancement

### 1. AI-Powered Style Transfer (HIGH)
**Action**: Integrate Stable Diffusion for style variations
**Implementation**: Local SD WebUI API endpoint
**Benefit**: Unlimited mascot style variations
**Cost**: $0 (local GPU)

### 2. Animation Frame Generation (HIGH)
**Action**: Generate sprite sheets for all animations
**Implementation**: Extend CSS generator to output sprite coordinates
**Benefit**: Smooth 60fps animations
**Cost**: Already implemented

### 3. Multi-Resolution Pipeline (MEDIUM)
**Action**: Auto-generate responsive srcset
**Implementation**: Build script generates sizes attribute
**Benefit**: Optimized loading across devices
**Cost**: 2 hours dev time

### 4. Dark Mode Variants (MEDIUM)
**Action**: Generate inverted color variants
**Implementation**: Color palette transforms in config
**Benefit**: Native dark mode support
**Cost**: 4 hours dev time

### 5. Accessibility Enhancements (HIGH)
**Action**: Add ARIA labels, reduced motion
**Implementation**: Component props + media queries
**Benefit**: WCAG 2.1 AA compliance
**Cost**: 3 hours dev time

### 6. Compression Pipeline (MEDIUM)
**Action**: Auto-optimize with SVGO, pngquant
**Implementation**: Post-generation hooks
**Benefit**: 50-70% file size reduction
**Cost**: 2 hours dev time

### 7. CDN Integration (LOW)
**Action**: Upload to CloudFront/S3 on build
**Implementation**: AWS CLI in CI/CD
**Benefit**: Global edge caching
**Cost**: AWS fees (~$1/month)

### 8. A/B Testing Support (MEDIUM)
**Action**: Feature flags for mascot variants
**Implementation**: LaunchDarkly or config-based
**Benefit**: Data-driven mascot selection
**Cost**: 4 hours dev time

### 9. Community Contributions (LOW)
**Action**: Document mascot creation guide
**Implementation**: CONTRIBUTING.md section
**Benefit**: Community-created mascots
**Cost**: 2 hours documentation

### 10. Analytics Integration (MEDIUM)
**Action**: Track mascot engagement
**Implementation**: GA4 custom events
**Benefit**: Understand user preferences
**Cost**: 3 hours dev time

---

## Timeline

| Day | Activity | Agents | Output |
|-----|----------|--------|--------|
| 1 | Phase 1: Generation | 12 | All assets |
| 2 | Phase 2: Integration | 8 | Components wired |
| 3 | Phase 3: Testing | 8 | Validated system |
| 4 | Phase 4: Refinement | 4 | Production ready |
| 5 | Final review & docs | 2 | Ship ready |

**Total**: 5 days, 34 agents, ~1.8M tokens

---

*Plan Version: 001.000*  
*Optimized for: Token efficiency, parallel execution, fault tolerance*  
*Ready for: Mass spawn execution*
