---
name: sator-godot-dev
description: "Godot 4 game development for 4NJZ4 TENET Platform tactical FPS simulation. USE FOR: GDScript coding, scene management, deterministic simulation patterns, C# simulation core. Location: platform/simulation-game/. DO NOT USE FOR: general game development, Unity/Unreal, non-deterministic games."
license: MIT
metadata:
  author: SATOR Team
  version: "2.0.0"
---

# SATOR Godot Development

> **DETERMINISM IS MANDATORY**
>
> Location: `platform/simulation-game/`
> All simulation logic must be deterministic. Same seed must produce same results.
> Use seeded RNG only. Never use `randf()` or `randi()` directly.

## Triggers

Activate this skill when user wants to:
- Create or modify Godot 4 scenes/scripts
- Implement deterministic simulation logic
- Work with GDScript or C# simulation core
- Create combat resolution systems
- Implement replay functionality
- Work with 20 TPS fixed timestep system

## Rules

1. **Determinism First** — Same seed must produce identical results
2. **Seeded RNG Only** — Never use `randf()`/`randi()` directly
3. **Fixed Timestep** — 20 TPS (50ms per tick), no delta-time in simulation
4. **Consistent Ordering** — Process agents/actions in same order every tick
5. **Tabs for Indentation** — Not spaces (GDScript convention)
6. **Naming Conventions**:
   - Variables/functions: `snake_case`
   - Classes: `PascalCase`
   - Constants: `UPPER_SNAKE_CASE`

## WHEN to Use / DO NOT USE

| USE FOR | DO NOT USE FOR |
|---------|----------------|
| Godot 4 GDScript development | Unity, Unreal, other engines |
| Deterministic simulation | Non-deterministic gameplay |
| Tactical FPS mechanics | General game development |
| C# simulation core | Non-SATOR projects |
| 20 TPS fixed timestep | Variable timestep games |
| Replay system | Real-time multiplayer |

## Project Structure

```
platform/simulation-game/
├── project.godot                # Godot project config (20 TPS)
├── scenes/                      # .tscn scene files
│   ├── Main.tscn
│   └── Match.tscn
├── scripts/                     # GDScript files
│   ├── Main.gd                 # Entry point
│   ├── MatchEngine.gd          # Core simulation loop
│   ├── Agent.gd                # AI agent behavior
│   ├── Data/                   # Data type definitions
│   │   ├── MatchData.gd
│   │   ├── AgentState.gd
│   │   └── WeaponData.gd
│   ├── Sim/                    # Combat resolution
│   │   ├── CombatResolver.gd
│   │   ├── DuelResolver.gd
│   │   └── Economy.gd
│   ├── AI/                     # Agent AI
│   │   ├── BeliefSystem.gd
│   │   ├── DecisionTree.gd
│   │   └── Pathfinder.gd
│   └── Export/                 # Data export
│       ├── LiveSeasonModule.gd
│       └── EventLog.gd
├── maps/                        # JSON map definitions
├── Defs/                        # Game definitions (JSON)
│   ├── weapons.json
│   ├── agents.json
│   └── utilities.json
└── tests/                       # Godot tests
    └── test_determinism.gd
```

## Key Configuration

### project.godot

```ini
[application]
config/name="RadiantX"
run/main_scene="res://scenes/Main.tscn"

[physics]
common/physics_ticks_per_second=20  ; 20 TPS fixed timestep

[rendering]
renderer/rendering_method="forward_plus"
```

## Deterministic Patterns

### Seeded RNG

```gdscript
class_name MatchEngine

var rng: RandomNumberGenerator
var current_tick: int = 0
const TICK_RATE: float = 20.0

func initialize(seed_value: int) -> void:
    rng = RandomNumberGenerator.new()
    rng.seed = seed_value

func process_tick() -> void:
    # Use rng instead of global randf/randi
    var roll = rng.randf()
    var damage = calculate_damage(roll)
    # ... simulation logic
    current_tick += 1
```

### Fixed Timestep

```gdscript
func _physics_process(_delta: float) -> void:
    # Don't use _delta for simulation logic
    # Process at fixed 20 TPS
    process_tick()
```

### Consistent Agent Ordering

```gdscript
func process_agents(agents: Array[Agent]) -> void:
    # Always process in same order (e.g., by agent_id)
    agents.sort_custom(func(a, b): return a.agent_id < b.agent_id)
    for agent in agents:
        agent.process_tick()
```

## Combat Resolution

```gdscript
class_name CombatResolver

static func resolve_duel(
    attacker: Agent,
    defender: Agent,
    weapon: WeaponData,
    rng: RandomNumberGenerator
) -> DuelResult:
    var hit_chance = calculate_hit_chance(attacker, defender, weapon)
    var roll = rng.randf()
    
    if roll < hit_chance:
        var damage = calculate_damage(weapon, rng)
        return DuelResult.new(true, damage)
    else:
        return DuelResult.new(false, 0)
```

## Event Log for Replay

```gdscript
class_name EventLog

var events: Array[Event] = []

func record_event(type: String, data: Dictionary) -> void:
    events.append(Event.new(current_tick, type, data))

func serialize() -> String:
    return JSON.stringify(events.map(func(e): return e.to_dict()))

func deserialize(json: String) -> void:
    events.clear()
    var data = JSON.parse_string(json)
    for event_data in data:
        events.append(Event.from_dict(event_data))
```

## C# Simulation Core

```csharp
// tactical-fps-sim-core-updated/SimCore/Simulator.cs
using System;
using System.Collections.Generic;

namespace SimCore
{
    public class Simulator
    {
        private readonly Random _rng;
        private int _currentTick;
        private const int TicksPerSecond = 20;
        
        public Simulator(int seed)
        {
            _rng = new Random(seed);
            _currentTick = 0;
        }
        
        public void ProcessTick()
        {
            // Deterministic simulation logic
            _currentTick++;
        }
        
        public double RandomDouble() => _rng.NextDouble();
    }
}
```

## Build Commands

```bash
cd platform/simulation-game

# Open in Godot Editor
godot --editor project.godot

# Run main scene
godot --scene scenes/Main.tscn

# Build C# simulation
dotnet build TacticalFpsSim.sln

# Run console runner
dotnet run --project SimConsoleRunner -- --defs ./Defs --rules rules.cs --engine ttk --rounds 5 --seed 123
```

## Testing

```bash
cd platform/simulation-game

# Run determinism tests in Godot Editor
# Open: tests/test_determinism.tscn
# Press F6 to run

# Verify same seed produces same results
./scripts/verify_determinism.sh
```

## References

- [AGENTS.md](../../../AGENTS.md)
- [docs/map_format.md](../../../docs/map_format.md)
- [docs/replay.md](../../../docs/replay.md)
