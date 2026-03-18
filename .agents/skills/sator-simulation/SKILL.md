---
name: sator-simulation
description: "Deterministic tactical FPS simulation for 4NJZ4 TENET Platform. USE FOR: combat resolution, duel mechanics, economy simulation, replay system, 20 TPS fixed timestep. DO NOT USE FOR: real-time multiplayer, non-deterministic games, general FPS mechanics."
license: MIT
metadata:
  author: SATOR Team
  version: "2.0.0"
---

# SATOR Simulation

> **DETERMINISM IS NON-NEGOTIABLE**
>
> Location: `platform/simulation-game/`
> 20 TPS fixed timestep (50ms per tick).
> Seeded RNG for all randomness.
> EventLog for deterministic replay.
> Same seed = identical results, always.

## Triggers

Activate this skill when user wants to:
- Implement deterministic combat resolution
- Create duel mechanics with hit chance calculation
- Build economy system simulation
- Implement replay system functionality
- Work with 20 TPS fixed timestep logic
- Create agent AI with belief systems

## Rules

1. **20 TPS Fixed** — Never use delta-time in simulation logic
2. **Seeded RNG** — Use RandomNumberGenerator, never randf()/randi()
3. **EventLog** — All state changes logged for replay
4. **Consistent Ordering** — Process agents in same order every tick
5. **Deterministic Export** — LiveSeasonModule strips internal state
6. **Replay Verification** — Test: same seed produces same results

## WHEN to Use / DO NOT USE

| USE FOR | DO NOT USE FOR |
|---------|----------------|
| Deterministic simulation | Real-time multiplayer |
| Combat resolution | Physics simulation |
| Duel mechanics | Non-deterministic gameplay |
| Economy simulation | Random loot drops |
| Replay system | Save/load any state |
| Agent AI (belief-based) | Player input handling |

## Project Structure

```
platform/simulation-game/
├── scripts/
│   ├── MatchEngine.gd          # Core simulation loop
│   ├── Agent.gd                # AI agent with beliefs
│   ├── Data/                   # 22 data type definitions
│   │   ├── MatchData.gd
│   │   ├── AgentState.gd
│   │   ├── WeaponData.gd
│   │   └── EconomyData.gd
│   ├── Sim/                    # Combat & simulation
│   │   ├── CombatResolver.gd
│   │   ├── DuelResolver.gd
│   │   ├── Economy.gd
│   │   └── HitCalculator.gd
│   ├── AI/                     # Agent AI
│   │   ├── BeliefSystem.gd
│   │   ├── DecisionTree.gd
│   │   └── Pathfinder.gd
│   └── Export/                 # Data export
│       ├── LiveSeasonModule.gd
│       └── EventLog.gd
└── tests/
    └── test_determinism.gd
```

## MatchEngine (Core Loop)

```gdscript
# scripts/MatchEngine.gd
class_name MatchEngine
extends Node

signal tick_processed(tick_number: int)
signal match_ended(result: MatchResult)

const TICK_RATE: float = 20.0  # 20 TPS
const TICK_INTERVAL: float = 1.0 / TICK_RATE  # 50ms

var current_tick: int = 0
var rng: RandomNumberGenerator
var event_log: EventLog
var agents: Array[Agent] = []
var match_data: MatchData

var is_running: bool = false
var seed_value: int

func initialize(match_config: Dictionary) -> void:
    seed_value = match_config.get("seed", hash(Time.get_unix_time_from_system()))
    rng = RandomNumberGenerator.new()
    rng.seed = seed_value
    
    event_log = EventLog.new()
    match_data = MatchData.new()
    
    # Initialize agents in consistent order
    agents = create_agents(match_config)
    agents.sort_custom(func(a, b): return a.agent_id < b.agent_id)
    
    current_tick = 0
    
    # Log initial state
    event_log.record_event("match_start", {
        "seed": seed_value,
        "map": match_config.map_name,
        "agents": agents.map(func(a): return a.agent_id),
    })

func start_match() -> void:
    is_running = true
    while is_running:
        process_tick()
        await get_tree().create_timer(TICK_INTERVAL).timeout

func process_tick() -> void:
    # NEVER use delta here - fixed timestep only
    
    # Process each agent in consistent order
    for agent in agents:
        if agent.is_alive:
            _process_agent_tick(agent)
    
    # Process combat resolution
    _resolve_combat()
    
    # Update economy
    _update_economy()
    
    # Check round end conditions
    _check_round_end()
    
    event_log.record_event("tick", {
        "tick": current_tick,
        "agent_states": agents.map(func(a): return a.get_state_dict()),
    })
    
    current_tick += 1
    tick_processed.emit(current_tick)
```

## Agent with Belief System

```gdscript
# scripts/Agent.gd
class_name Agent
extends CharacterBody3D

@export var agent_id: String
@export var team_id: String
@export var role: String  # duelist, sentinel, controller, initiator

var health: float = 100.0
var armor: float = 0.0
var is_alive: bool = true

var current_weapon: WeaponData
var utility_remaining: Dictionary = {}
var credits: int = 0

# Belief system (AI knowledge)
var belief_system: BeliefSystem

func _ready() -> void:
    belief_system = BeliefSystem.new(self)

func decide_action(rng: RandomNumberGenerator) -> Dictionary:
    """AI decision making using belief system."""
    
    # Update beliefs based on perception
    belief_system.update_beliefs()
    
    # Get tactical assessment
    var situation = belief_system.assess_situation()
    
    # Decision tree based on situation
    if situation.spike_planted and team_id == "defenders":
        return _decide_defuse_action(situation, rng)
    elif situation.can_plant and team_id == "attackers":
        return _decide_plant_action(situation, rng)
    elif situation.enemy_visible:
        return _decide_combat_action(situation, rng)
    else:
        return _decide_positioning_action(situation, rng)
```

## Combat Resolver

```gdscript
# scripts/Sim/CombatResolver.gd
class_name CombatResolver

static var pending_duels: Array[Duel] = []

static func queue_duel(attacker: Agent, defender: Agent, weapon: WeaponData) -> void:
    pending_duels.append(Duel.new(attacker, defender, weapon))

static func resolve_duel(duel: Duel, rng: RandomNumberGenerator) -> DuelResult:
    var hit_chance = HitCalculator.calculate(duel.attacker, duel.defender, duel.weapon)
    
    var roll = rng.randf()  # Seeded random
    var hit = roll < hit_chance
    
    var damage = 0.0
    if hit:
        # Damage variation based on weapon
        var base_damage = duel.weapon.damage
        var variation = duel.weapon.damage_variation
        damage = base_damage + (rng.randf() * 2 - 1) * variation
        damage = clampf(damage, base_damage - variation, base_damage + variation)
        
        # Apply damage
        duel.defender.take_damage(damage)
    
    return DuelResult.new(hit, damage, hit_chance)
```

## Economy System

```gdscript
# scripts/Sim/Economy.gd
class_name Economy

const STARTING_CREDITS: int = 800
const WIN_BONUS: int = 3000
const LOSS_BONUS_STEPS: Array[int] = [1900, 2400, 2900, 3400]
const PLANT_BONUS: int = 300
const DEFUSE_BONUS: int = 300
const KILL_REWARD: int = 200

var team_economies: Dictionary = {}
var team_loss_streaks: Dictionary = {}

func initialize(teams: Array[String]) -> void:
    for team in teams:
        team_economies[team] = STARTING_CREDITS
        team_loss_streaks[team] = 0

func award_round_win(winner_team: String, loser_team: String) -> void:
    # Winner gets win bonus
    team_economies[winner_team] += WIN_BONUS
    team_loss_streaks[winner_team] = 0
    
    # Loser gets loss bonus based on streak
    var loss_streak = team_loss_streaks[loser_team]
    var loss_bonus = LOSS_BONUS_STEPS[min(loss_streak, LOSS_BONUS_STEPS.size() - 1)]
    team_economies[loser_team] += loss_bonus
    team_loss_streaks[loser_team] += 1
```

## EventLog for Replay

```gdscript
# scripts/Export/EventLog.gd
class_name EventLog

var events: Array[Event] = []
var seed: int

func record_event(type: String, data: Dictionary) -> void:
    var event = Event.new(current_tick if "current_tick" in self else 0, type, data)
    events.append(event)

func serialize() -> String:
    var data = {
        "seed": seed,
        "events": events.map(func(e): return e.to_dict()),
    }
    return JSON.stringify(data)

func deserialize(json_string: String) -> void:
    var data = JSON.parse_string(json_string)
    seed = data.seed
    events.clear()
    
    for event_data in data.events:
        events.append(Event.from_dict(event_data))

func replay(match_engine: MatchEngine) -> void:
    """Replay events deterministically."""
    match_engine.initialize({"seed": seed})
    
    for event in events:
        match_engine.process_event(event)
```

## LiveSeasonModule (Export)

```gdscript
# scripts/Export/LiveSeasonModule.gd
class_name LiveSeasonModule

# CRITICAL: These fields must NEVER reach web
const GAME_ONLY_FIELDS = [
    "internal_agent_state",
    "belief_system",
    "radar_data",
    "detailed_replay_frame_data",
    "simulation_tick",
    "seed_value",
    "vision_cone_data",
    "smoke_tick_data",
    "recoil_pattern",
    "ai_decision_tree",
    "pathfinding_nodes",
]

static func export_match_data(match_data: MatchData, event_log: EventLog) -> Dictionary:
    """Export match data with firewall enforcement."""
    
    var export_data = {
        "match_id": match_data.match_id,
        "map": match_data.map_name,
        "teams": match_data.teams,
        "rounds": match_data.rounds.map(func(r): return sanitize_round(r)),
        "final_score": match_data.final_score,
        "duration_seconds": match_data.duration,
    }
    
    return sanitize_for_web(export_data)

static func sanitize_for_web(data: Dictionary) -> Dictionary:
    """Remove game-only fields recursively."""
    var sanitized = {}
    
    for key in data.keys():
        if key not in GAME_ONLY_FIELDS:
            var value = data[key]
            if value is Dictionary:
                sanitized[key] = sanitize_for_web(value)
            elif value is Array:
                sanitized[key] = value.map(func(item):
                    return item if not (item is Dictionary) else sanitize_for_web(item)
                )
            else:
                sanitized[key] = value
    
    return sanitized
```

## Determinism Test

```gdscript
# tests/test_determinism.gd
extends Node

func test_determinism() -> void:
    var seed = 12345
    var results = []
    
    # Run match 3 times with same seed
    for i in range(3):
        var engine = MatchEngine.new()
        engine.initialize({"seed": seed, "map": "haven"})
        
        # Run for fixed number of ticks
        for tick in range(1000):
            engine.process_tick()
        
        results.append(engine.match_data.to_dict())
    
    # All results should be identical
    assert(results[0] == results[1], "Determinism failed: run 0 != run 1")
    assert(results[1] == results[2], "Determinism failed: run 1 != run 2")
    
    print("Determinism test passed!")
```

## Commands

```bash
cd platform/simulation-game

# Run determinism test
godot --script tests/test_determinism.gd

# Export match data
godot --script scripts/Export/export_match.gd --match-id=123

# Run simulation with specific seed
dotnet run --project SimConsoleRunner -- --seed 12345 --rounds 24
```

## References

- [AGENTS.md](../../../AGENTS.md)
- [docs/replay.md](../../../docs/replay.md)
