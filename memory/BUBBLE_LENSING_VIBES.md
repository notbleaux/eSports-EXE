# Bubble Lensing Abstract Implementation Vibes

## Core Concepts (Outside-the-Box Abstraction)
```
1. RNG Bubbles: TEVET→TENET variants as particle emitters
   - Triangle states → Spawn/dissolve physics
   - Phasing: transparent→solid→ghost (opacity waves)
   
2. Hex Star Dials: Dual gear clocks (dark/light)
   - Clockwise/CCW + tilt states (4-axis gimbal)
   - Moon/Sun orbs → Ray projection (complementary textures)
   - Lock/Sync: Dial2 responds to Dial1 state
   
3. Grid Overlays: | - + | X | - | x | + | X | - | + 0
   - Crisscross convergence at SATOR center
   - Bubble capture → Tile surround → SFX burst
   
4. Functional Ingenuity:
   - Bubbles = Lensing focus (magnify data on hover)
   - Tiles = Modular services (spawn scrapers/charts)
   - Gears = State machine (chaos/order toggle)
```

**Tech Mapping (Reimagined):**
```
Bubbles → WebGL particles (Three.js InstancedMesh)
Tiles → react-grid-layout cells (dynamic spawn)
Gears → Custom SVG dial (GSAP physics)
SFX → Web Audio API (frequency capture)
```

**Vibes → Tech (Not Literal):**
```
Chaos triangles → Voronoi diagram state switches
Gear tilt → Quaternion rotation (WebGL camera)
Bubble lensing → PostFX displacement map
Tile surround → Marching squares contouring

**npm run dev** – Abstract implementation live.

