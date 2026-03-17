# 4NJZ4 TEVETS & TENETS CORE GRIDs - 4×(5×5) Latin Square Fluid System

**Latin Square Math:**
- 5×5 = 25 positions per grid
- 4 grids = 100 total cells
- TEVETS/TENETS positions: [4,8,9,6,3] rotated per square
- BASE foundation: [1,2,3,5,6,7,9]

**Position Mapping (3×3 Core → 5×5 Grid):**
```
3×3 Core Grid:
┌───┬───┬───┐
│ 1 │ 2 │ 3 │  ← TEVETS upper (mirrored rotation)
├───┼───┼───┤
│ 4 │ 5 │ 6 │  ← Waterfall/gas transition zone
├───┼───┼───┤
│ 7 │ 8 │ 9 │  ← TENETS lower (cascade rotation)  
└───┴───┴───┘

5×5 Mapping (center 3×3 = core):
  1  2  3  4  5
  6  7  8  9 10
 11 12 13 14 15 ← Core 3×3 starts here
 16 17 18 19 20
 21 22 23 24 25
```

**4 Grids Rotation Schedule:**
```
Grid 1 (SATOR):     CCW 90°     TEVETS upper heavy
Grid 2 (ROTAS):     CW 90°      TENETS lower cascade
Grid 3 (NJZ BASE):  180° flip   Foundation [1,2,3,5,6,7,9]
Grid 4 (EXE):       Mirror X    Cross-connected X pattern
```

**Symmetry Colour Graphing (Fluid Vortex):**
| Position | TEVETS | TENETS | BASE | Fluid Effect | CSS HSL |
|----------|--------|--------|------|--------------|---------|
| 4,8,9,6,3| Cyan   | Blue   | Navy | Waterfall    | 195°    |
| 1,2,3,5 | Purple | Magenta| Gold | Gas drift    | 270°    |
| 7        | Amber  | White  | Smoke| Honey drip   | 45°     |
| Center 5 | NJZ4   | 4NJZ   | X    | Vortex core  | Gradient|

**WebGL Fluid Params (paveldogreat.github.io):**
```
density_dissipation: 0.98  // Slow trails
velocity_dissipation: 0.99 // Smooth flow
pressure_iterations: 20    // Sharp vortex
curl: 30                   // Rotation strength
splat_radius: 0.25         // NJZ4 bloom
```

**CSS Keyframe Template:**
```css
@keyframes tenets_cascade {
  0% { transform: rotate(0deg) translateY(0); opacity: 0.3; }
  25% { transform: rotate(-10deg) translateY(-10px); opacity: 0.8; }
  50% { transform: rotate(0deg) translateY(-20px); opacity: 1; }
  100% { transform: rotate(10deg) translateY(0); opacity: 0.6; }
}
```

**Implementation Priority:**
1. NJZ_BASE foundation grid first
2. TENETS waterfall (positions 4,8,9,6,3)
3. TEVETS gas drift (mirrored)
4. 4×(5×5) compound rotation

