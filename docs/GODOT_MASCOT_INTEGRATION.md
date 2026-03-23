[Ver001.000]

# Godot Mascot Integration Guide
## Libre-X-eSport 4NJZ4 TENET Platform

**Agent:** TL-H1-1-D  
**Date:** March 23, 2026  
**Godot Version:** 4.0+  

---

## Overview

This guide documents the integration of 5 mascot characters into the Godot 4 simulation engine at `platform/simulation-game/`. The mascots are visual entities that react to match events and provide spectator engagement.

## Mascot Characters

| Mascot | Type | Theme | Scene Path |
|--------|------|-------|------------|
| **Sol** | SOL | Solar Phoenix | `res://entities/mascots/SolMascot.tscn` |
| **Lun** | LUN | Lunar Owl | `res://entities/mascots/LunMascot.tscn` |
| **Bin** | BIN | Binary Cyber | `res://entities/mascots/BinMascot.tscn` |
| **Fat** | FAT | Phoenix/Mythical | `res://entities/mascots/FatMascot.tscn` |
| **Uni** | UNI | Unicorn/Fantasy | `res://entities/mascots/UniMascot.tscn` |

---

## File Structure

```
platform/simulation-game/
├── entities/
│   └── mascots/
│       ├── Mascot.gd              # Base class
│       ├── MascotCamera.gd        # Spectator camera
│       ├── MascotManager.gd       # Central coordinator
│       ├── SolMascot.gd           # Sol implementation
│       ├── SolMascot.tscn         # Sol scene
│       ├── LunMascot.gd           # Lun implementation
│       ├── LunMascot.tscn         # Lun scene
│       ├── BinMascot.gd           # Bin implementation
│       ├── BinMascot.tscn         # Bin scene
│       ├── FatMascot.gd           # Fat implementation
│       ├── FatMascot.tscn         # Fat scene
│       ├── UniMascot.gd           # Uni implementation
│       └── UniMascot.tscn         # Uni scene
├── tests/
│   └── unit/
│       └── test_mascot_system.gd  # GUT tests
└── scenes/
    └── MascotDemo.tscn            # Demo scene
```

---

## Architecture

### Base Class: Mascot.gd

All mascots extend the `Mascot` base class which provides:

**Animation States:**
```gdscript
enum State {
    IDLE,       # Looping idle animation
    CHEER,      # Triggered celebration
    REACT,      # Contextual reaction
    CELEBRATE,  # Victory celebration
    SAD         # Disappointment
}
```

**Key Features:**
- Performance budget tracking (<2ms per mascot)
- State serialization for save/replay
- Signal-based communication
- Context-aware reactions

**Signals:**
```gdscript
signal state_changed(new_state: State, old_state: State)
signal animation_triggered(anim_name: String)
signal camera_focus_requested(mascot: Mascot)
```

### MascotManager

Central coordinator that manages all mascots:

```gdscript
# Spawn all 5 mascots
var manager = MascotManager.new()
manager.spawn_all_mascots()

# Trigger reactions
manager.trigger_all_cheer(1.0)
manager.celebrate_team_win(0)  # Team A wins

# Get performance report
var report = manager.get_performance_report()
```

### MascotCamera

Spectator camera with smooth follow:

```gdscript
# Setup camera
var camera = MascotCamera.new()
manager.setup_camera(camera)

# Focus on mascot
mascot.focus_camera()  # Or camera.focus_on_mascot(mascot)

# Cycle between mascots
camera.cycle_to_next_mascot()
```

---

## Usage Examples

### Basic Spawning

```gdscript
# Add manager to scene
var manager = MascotManager.new()
manager.auto_spawn_mascots = true
add_child(manager)

# Or manual spawning
var sol = manager.spawn_mascot(Mascot.Type.SOL, Vector2(100, 300))
var lun = manager.spawn_mascot(Mascot.Type.LUN, Vector2(250, 300))
```

### Reacting to Match Events

```gdscript
# Round win celebration
func on_round_winner(team: int):
    manager.celebrate_team_win(team)

# First blood reaction
func on_first_blood(player_team: int):
    var reaction = "excited" if player_team == 0 else "shocked"
    manager.trigger_all_reaction(reaction, {"intensity": 1.0})

# Match point
func on_match_point(team: int):
    manager.transition_all_to(Mascot.State.CHEER)
```

### Individual Mascot Control

```gdscript
# Get specific mascot
var sol = manager.get_mascot_by_type(Mascot.Type.SOL)

# Trigger unique abilities
sol.trigger_flame_burst()     # Sol ability
lun.trigger_moon_glow()       # Lun ability
bin.trigger_data_burst()      # Bin ability
fat.trigger_rebirth()         # Fat ability
uni.trigger_rainbow_trail()   # Uni ability
```

---

## Performance Budget

Each mascot has a render budget of **<2ms** (2000 microseconds).

**Monitoring:**
```gdscript
# Check individual mascot
if not mascot.is_within_budget():
    push_warning("Mascot exceeded budget")

# Check all mascots
var report = manager.get_performance_report()
print("Total render time: %d us" % report.current_render_time_us)
print("Within budget: %s" % report.within_budget)
```

**Optimization Strategies:**
1. Reduce animation complexity when >5 mascots visible
2. Use `modulate` instead of shaders for effects
3. Pool particle effects instead of creating/destroying
4. Disable off-screen mascot updates

---

## State Serialization

Mascots support full state serialization for replay system:

```gdscript
# Save states
var states = manager.get_all_states()
# Store states in replay data...

# Restore states
manager.set_all_states(states)
```

State structure:
```json
{
    "mascot_name": "Sol",
    "mascot_type": 0,
    "current_state": 1,
    "state_timer": 0.5,
    "position": {"x": 100, "y": 200},
    "animation_speed": 1.0
}
```

---

## Testing

Run mascot tests using GUT:

```bash
# From project root
godot --headless --script tests/run_tests.gd

# Specific test file
godot --headless tests/unit/test_mascot_system.gd
```

**Test Coverage:**
- State machine transitions
- Individual mascot types
- Manager functionality
- Performance budget compliance
- State serialization
- Signal emission

---

## Integration with Existing Systems

### MatchEngine Integration

```gdscript
# In MatchEngine.gd, add to round end:
func _on_round_end(winner: int):
    var mascot_manager = get_node_or_null("/root/MascotManager")
    if mascot_manager:
        mascot_manager.celebrate_team_win(winner)
```

### Viewer2D/Viewer3D Integration

Mascots are 2D Node2D entities that render in the tactical view:

```gdscript
# Add mascots to viewer
var viewer = $Viewer2D
var manager = MascotManager.new()
viewer.add_child(manager)
manager.spawn_all_mascots()
```

---

## Extension Guide

### Creating a New Mascot Type

1. Create new GDScript extending `Mascot`:
```gdscript
extends Mascot

func _init():
    mascot_name = "NewMascot"
    mascot_type = Type.SOL  # Or new type

func _ready():
    super._ready()
    # Custom initialization
```

2. Create scene file (.tscn) with Sprite2D and AnimationPlayer

3. Add to MASCOT_SCENES in MascotManager:
```gdscript
const MASCOT_SCENES = {
    # ... existing types
    Mascot.Type.NEW: "res://entities/mascots/NewMascot.tscn"
}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Exceeds performance budget | Reduce animation complexity, disable particle effects |
| Signals not connecting | Ensure mascots are added to "mascots" group |
| Camera not following | Verify MascotCamera is properly initialized |
| State not restoring | Check state dictionary format matches expected structure |
| Animations not playing | Ensure AnimationPlayer has required animations (idle, cheer, react, celebrate, sad) |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 001.000 | 2026-03-23 | Initial implementation with 5 mascots, state machine, camera integration |

---

## References

- `platform/simulation-game/scripts/Agent.gd` - Agent entity reference
- `platform/simulation-game/scripts/MatchEngine.gd` - Match integration
- `platform/simulation-game/tests/README.md` - Testing framework
