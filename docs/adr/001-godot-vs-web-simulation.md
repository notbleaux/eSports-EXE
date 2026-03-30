# ADR 001: Godot vs Web-Based Simulation Engine

## Status
✅ **Accepted** (2024-01-15)

## Context

The ROTAS (Return On Tactical Analysis System) simulation engine needed a technology choice for implementing deterministic tactical FPS match simulations. Two primary options were considered:

1. **Godot 4 Game Engine** - Full-featured game engine with GDScript/C#
2. **Web-Based Simulation** - Pure TypeScript/JavaScript implementation running in browser or Node.js

## Decision

**Selected: Godot 4 Game Engine** with planned extraction to separate repository and npm package distribution.

## Consequences

### Positive
- **Determinism**: Godot's fixed timestep physics (20 TPS) ensures reproducible simulations
- **Performance**: Native GDScript/C# execution faster than JavaScript for simulation logic
- **Visualization**: Built-in 3D/2D rendering for match replays and debugging
- **Ecosystem**: Mature game development patterns for entity-component systems
- **Separation**: Clear boundary between simulation logic and web platform

### Negative
- **Distribution**: Requires WebAssembly build for web integration (added complexity)
- **Skill Gap**: Team needs GDScript/C# expertise alongside TypeScript/Python
- **Build Pipeline**: Additional build step for WebAssembly compilation
- **Repository Size**: Godot editor and assets increase repository size

### Neutral
- **Testing**: GUT (Godot Unit Testing) framework available
- **CI/CD**: Godot headless mode enables automated testing

## Alternatives Considered

### Option A: Pure TypeScript Implementation
**Rejected** - While simpler for web integration, deterministic simulation in JavaScript is challenging due to:
- Floating-point inconsistencies across browsers
- Lack of fixed timestep guarantees
- Single-threaded nature complicates batch simulations

### Option B: Python + Pygame
**Rejected** - Python lacks deterministic execution guarantees and web deployment is complex.

### Option C: Unity WebGL
**Rejected** - Licensing costs and larger build sizes compared to Godot.

## Implementation

```
platform/simulation-game/          # Current location (to be extracted)
↓
github.com/njzitegeist/rotas-simulation-engine  # Target repository
↓
npm install @njz/rotas-simulation   # Web integration
```

## References

- [Godot Extraction Plan](../../GODOT_EXTRACTION_PLAN.md)
- [Simulation Validation Framework](../../../tests/simulation/README.md)

---

*Decision Date: 2024-01-15*  
*Decision Maker: Architecture Team*  
*Last Reviewed: 2026-03-30*
