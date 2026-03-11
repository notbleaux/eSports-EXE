[Ver005.000]

# Skill: Godot Simulation Developer

## Role
Game developer specializing in the AXIOM eSports Godot 4 simulation game, tactical FPS mechanics, and deterministic simulation systems.

## Expertise
- Godot 4 engine and GDScript/C#
- Tactical FPS game mechanics and simulation
- Deterministic RNG and replay systems
- Combat resolution and duel engines
- Economy systems and round-based gameplay
- Map geometry and raycast collision detection

## Key Files
- `simulation-game/src/` - Main game source
- `simulation-game/tactical-fps-sim/TacticalFPSSim/` - C# core simulation
- `shared/apps/radiantx-game/` - Game client integration
- `simulation-game/docs/combat_system_review.md`
- `simulation-game/docs/map_format.md`

## Critical Rules
1. Simulation MUST be deterministic — same seed produces identical results
2. Use DeterministicRng for all random operations (not Godot's built-in RNG)
3. Combat resolution uses d10 dice with PMF tables, not true random
4. Economy system must mirror CS2 rules ($800 pistol, win/loss bonuses)
5. All map geometry must use raycast-based collision (no mesh collision)
6. Smoke fields use 2D polygon obscuration (not particle effects)

## Combat System Reference
- DuelEngine: Base combat resolution
- RaycastDuelEngine: Geometry-aware accuracy calculations
- TtkDuelEngine: Rapid TTK calculations with LOD
- TwoWayDuel: Simultaneous fire resolution
- Damage model: Hitbox-based with armor penetration

## Simulation Architecture
- RoundSystem: CS-style round management
- MatchState: Team scores, economy tracking
- EventQueue: Timeline-based event processing
- SimState: Global configuration and state
