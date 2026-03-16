[Ver001.000]

# CS2 Simulation Design Document

**Date:** 2026-03-16  
**Component:** ROTAS Engine - CS2 Adaptation  
**Status:** Design Phase

---

## Overview

This document details the adaptation of the ROTAS deterministic simulation engine from Valorant to Counter-Strike 2. The core challenge is replacing Valorant's ability-based tactical gameplay with CS2's pure gunplay and economy-driven strategy.

---

## Core Mechanics Differences

### Valorant → CS2 Mapping

| Valorant Mechanic | CS2 Equivalent | Implementation |
|-------------------|----------------|----------------|
| Agent Abilities | Utility (smokes, flashes, molotovs) | Limited use, budget-constrained |
| Ultimate Orbs | None | Removed |
| Agent Roles | Buy roles (AWPer, Entry, Support) | Economy-dependent |
| Shields (50/100) | Kevlar + Helmet (100/100) | Binary armor system |
| Bloom/RNG | Deterministic recoil | Recoil patterns |
| Wallbangs | Penetration system | Material-based |

---

## CS2 Simulation Architecture

### Class Hierarchy

```gdscript
# Base classes (existing)
MatchSimulator
├── ValorantMatchSimulator (existing)
└── CS2MatchSimulator (NEW)
    ├── CS2WeaponSystem
    ├── CS2EconomySystem
    ├── CS2UtilitySystem
    └── CS2MovementSystem
```

### CS2MatchSimulator Implementation

```gdscript
# platform/simulation-game/cs2/CS2MatchSimulator.gd
class_name CS2MatchSimulator extends MatchSimulator

# CS2-specific constants
const ROUND_TIME: float = 115.0  # 1:55 minutes
const FREEZE_TIME: float = 15.0   # 0:15 buy time
const BOMB_TIMER: float = 40.0    # C4 explode time
const DEFUSE_TIME: float = 10.0   # 5.0 with kit

# CS2 systems
var weapon_system: CS2WeaponSystem
var economy_system: CS2EconomySystem
var utility_system: CS2UtilitySystem

func _init(match_config: CS2MatchConfig):
    super._init(match_config)
    
    weapon_system = CS2WeaponSystem.new()
    economy_system = CS2EconomySystem.new()
    utility_system = CS2UtilitySystem.new()

func process_tick(delta: float) -> void:
    match_state.time_remaining -= delta
    
    # Phase-based processing
    if match_state.phase == RoundPhase.FREEZE_TIME:
        process_freeze_time(delta)
    elif match_state.phase == RoundPhase.LIVE:
        process_live_round(delta)
    
    # Always process player actions
    for player in all_players:
        process_player_action(player, delta)

func process_freeze_time(_delta: float) -> void:
    # Players can only buy during freeze time
    for player in all_players:
        if not player.has_moved:
            economy_system.process_purchase(player)

func process_live_round(delta: float) -> void:
    # Process utility first (affects visibility/movement)
    utility_system.process_active_utilities(delta)
    
    # Process movement and engagements
    for player in all_players:
        if player.is_alive:
            process_movement(player, delta)
            check_engagements(player)
    
    # Process bomb objective
    process_bomb(delta)
    
    # Check round end conditions
    check_round_end()
```

---

## Weapon System

### Recoil Pattern Simulation

```gdscript
# platform/simulation-game/cs2/weapons/RecoilPattern.gd
class_name RecoilPattern

var pattern: Array[Vector2]  # 30-shot pattern
var recovery_rate: float     # How fast recoil resets

func get_recoil_offset(shot_number: int, compensation: float) -> Vector2:
    """Get recoil offset for specific shot."""
    if shot_number >= pattern.size():
        shot_number = pattern.size() - 1
    
    var base_offset = pattern[shot_number]
    
    # Apply player compensation skill
    var compensated = base_offset * (1.0 - compensation)
    
    return compensated

# AK-47 Pattern (simplified first 10 shots)
const AK47_PATTERN: Array[Vector2] = [
    Vector2(0, 0),      # Shot 1: No recoil
    Vector2(0, -1),     # Shot 2
    Vector2(1, -2),     # Shot 3
    Vector2(-1, -3),    # Shot 4
    Vector2(-2, -4),    # Shot 5
    Vector2(-1, -5),    # Shot 6
    Vector2(1, -6),     # Shot 7
    Vector2(3, -6),     # Shot 8
    Vector2(4, -5),     # Shot 9
    Vector2(4, -4),     # Shot 10
    # ... continues to 30
]
```

### Weapon Database

```gdscript
# platform/simulation-game/cs2/weapons/CS2WeaponDatabase.gd
const WEAPONS: Dictionary = {
    "ak47": {
        "name": "AK-47",
        "cost": 2700,
        "kill_reward": 300,
        "damage": 36,
        "armor_penetration": 0.775,
        "fire_rate": 600,  # RPM
        "magazine": 30,
        "recoil_pattern": AK47_PATTERN,
        "range_modifier": 0.98,  # Damage falloff
    },
    "m4a4": {
        "name": "M4A4",
        "cost": 3100,
        "kill_reward": 300,
        "damage": 33,
        "armor_penetration": 0.70,
        "fire_rate": 666,
        "magazine": 30,
        "recoil_pattern": M4A4_PATTERN,
        "range_modifier": 0.97,
    },
    "awp": {
        "name": "AWP",
        "cost": 4750,
        "kill_reward": 100,
        "damage": 115,  # One-shot chest to unarmored
        "armor_penetration": 0.975,
        "fire_rate": 41,
        "magazine": 5,
        "recoil_pattern": [],  # Single shot
        "range_modifier": 0.99,
        "is_sniper": true,
        "scoped": true,
    },
    # ... more weapons
}
```

---

## Economy System

### CS2 Economy Model

```gdscript
# platform/simulation-game/cs2/economy/CS2EconomySystem.gd
class_name CS2EconomySystem

# Starting money
const STARTING_MONEY: int = 150
const MAX_MONEY: int = 16000

# Win/loss bonuses
const WIN_BONUS: int = 3250
const LOSS_BONUS_TIERS: Array[int] = [1400, 1900, 2400, 2900, 3400]

# Kill rewards (vary by weapon)
const KILL_REWARDS: Dictionary = {
    "rifle": 300,
    "smg": 600,
    "shotgun": 900,
    "awp": 100,
    "knife": 1500,
}

func calculate_round_end_economy(winner: Team, round_history: Array) -> void:
    """Calculate money changes at round end."""
    
    var loss_streak: int = get_loss_streak(winner, round_history)
    
    for team in [Team.CT, Team.T]:
        for player in team.players:
            if team == winner:
                # Winner gets win bonus
                player.money += WIN_BONUS
            else:
                # Loser gets loss bonus based on streak
                var bonus_index = min(loss_streak, LOSS_BONUS_TIERS.size() - 1)
                player.money += LOSS_BONUS_TIERS[bonus_index]
            
            # Cap at max
            player.money = min(player.money, MAX_MONEY)

func get_loss_streak(losing_team: Team, round_history: Array) -> int:
    """Calculate consecutive loss streak."""
    var streak: int = 0
    
    # Count from most recent rounds
    for i in range(round_history.size() - 1, -1, -1):
        if round_history[i].loser == losing_team:
            streak += 1
        else:
            break
    
    return streak

func can_afford_full_buy(team: Team) -> bool:
    """Check if team can afford full buy (rifle + armor + utility)."""
    var full_buy_cost: int = 4500  # Approximate
    
    var can_buy_count: int = 0
    for player in team.players:
        if player.money >= full_buy_cost:
            can_buy_count += 1
    
    # Consider it a full buy if 4+ players can afford
    return can_buy_count >= 4
```

### Buy Decision AI

```gdscript
# platform/simulation-game/cs2/economy/BuyDecisionAI.gd
class_name BuyDecisionAI

func decide_purchase(player: CS2Player, team: Team, round_number: int) -> Purchase:
    """AI decides what to buy based on situation."""
    
    var money: int = player.money
    var role: CS2Role = player.role
    
    # First round - pistol + kevlar or utility
    if round_number == 1:
        if role == CS2Role.AWPER:
            return Purchase.weapon("p250")  # Better pistol for AWPers
        else:
            return Purchase.kevlar()
    
    # Force buy logic (round 2 loss)
    if is_force_buy_round(team, round_number):
        if money >= 2700:
            return Purchase.weapon("galil")  # Cheap rifle
        elif money >= 1850:
            return Purchase.weapon("mp9") + Purchase.kevlar()
        else:
            return Purchase.kevlar()  # At least armor
    
    # Eco round
    if should_eco(team):
        return Purchase.nothing()  # Save money
    
    # Full buy
    if money >= 5000:
        return get_role_based_full_buy(role)
    
    # Partial buy
    return get_partial_buy(role, money)

func get_role_based_full_buy(role: CS2Role) -> Purchase:
    """Get optimal full buy for role."""
    match role:
        CS2Role.AWPER:
            return Purchase.weapon("awp") + Purchase.kevlar_helmet() + Purchase.utility_awp()
        CS2Role.ENTRY:
            return Purchase.weapon("ak47") + Purchase.kevlar_helmet() + Purchase.flashbangs(2)
        CS2Role.SUPPORT:
            return Purchase.weapon("ak47") + Purchase.kevlar_helmet() + Purchase.full_utility()
        _:
            return Purchase.weapon("ak47") + Purchase.kevlar_helmet()
```

---

## Utility System

### CS2 Utility Mechanics

```gdscript
# platform/simulation-game/cs2/utility/CS2UtilitySystem.gd
class_name CS2UtilitySystem

var active_smokes: Array[Smoke]
var active_molotovs: Array[Molotov]
var active_flashbangs: Array[Flashbang]
var active_he_grenades: Array[HEGrenade]

func throw_utility(player: CS2Player, utility_type: String, target: Vector3) -> void:
    """Player throws utility."""
    
    match utility_type:
        "smoke":
            var smoke = Smoke.new(player.position, target, player.team)
            active_smokes.append(smoke)
        "molotov":
            var molly = Molotov.new(player.position, target, player.team)
            active_molotovs.append(molly)
        "flashbang":
            var flash = Flashbang.new(player.position, target, player.team)
            active_flashbangs.append(flash)
        "he_grenade":
            var he = HEGrenade.new(player.position, target, player.team)
            active_he_grenades.append(he)

func process_active_utilities(delta: float) -> void:
    """Update all active utilities."""
    
    # Process smokes
    for smoke in active_smokes:
        smoke.time_remaining -= delta
        if smoke.time_remaining <= 0:
            smoke.dissipate()
            active_smokes.erase(smoke)
    
    # Process molotovs
    for molly in active_molotovs:
        molly.time_remaining -= delta
        apply_molotov_damage(molly)
        if molly.time_remaining <= 0:
            active_molotovs.erase(molly)
    
    # Process flashbangs (instant effect then remove)
    for flash in active_flashbangs:
        if flash.has_detonated:
            apply_flash_effect(flash)
            active_flashbangs.erase(flash)

func is_position_smoked(position: Vector3) -> bool:
    """Check if position is inside a smoke."""
    for smoke in active_smokes:
        if smoke.contains(position):
            return true
    return false

func is_position_in_molotov(position: Vector3) -> bool:
    """Check if position is inside molotov fire."""
    for molly in active_molotovs:
        if molly.is_in_fire(position):
            return true
    return false
```

### Smoke Mechanics

```gdscript
# platform/simulation-game/cs2/utility/Smoke.gd
class_name Smoke

const SMOKE_DURATION: float = 18.0  # Seconds
const SMOKE_RADIUS: float = 144.0   # Hammer units (~3.6m)

var position: Vector3
var time_remaining: float
var team: Team
var is_dissipating: bool = false

func _init(throw_pos: Vector3, target: Vector3, thrower_team: Team):
    position = target
    time_remaining = SMOKE_DURATION
    team = thrower_team
    
    # Simulate throw arc time
    var throw_distance: float = throw_pos.distance_to(target)
    var throw_time: float = throw_distance / 1000.0  # Approximate
    
    # Smoke doesn't activate immediately
    await get_tree().create_timer(throw_time).timeout

func contains(check_position: Vector3) -> bool:
    """Check if position is inside smoke volume."""
    if is_dissipating:
        return false
    
    var horizontal_dist: float = Vector2(position.x, position.z).distance_to(
        Vector2(check_position.x, check_position.z)
    )
    
    # Cylinder check (smoke is roughly cylindrical)
    return horizontal_dist < SMOKE_RADIUS and abs(position.y - check_position.y) < 100
```

---

## Bomb Objective

### Bomb Mechanics

```gdscript
# platform/simulation-game/cs2/bomb/BombSystem.gd
class_name BombSystem

enum BombState {
    NOT_PLANTED,
    PLANTING,
    PLANTED,
    DEFUSING,
    EXPLODED,
    DEFUSED,
}

var state: BombState = BombState.NOT_PLANTED
var position: Vector3
var plant_time_remaining: float
var explode_time_remaining: float
var defuse_time_remaining: float
var planter: CS2Player
var defuser: CS2Player
var has_defuse_kit: bool = false

const PLANT_TIME: float = 3.0
const EXPLODE_TIME: float = 40.0
const DEFUSE_TIME: float = 10.0
const DEFUSE_TIME_KIT: float = 5.0

func start_plant(player: CS2Player, site_position: Vector3) -> bool:
    """Begin bomb plant."""
    if state != BombState.NOT_PLANTED:
        return false
    
    state = BombState.PLANTING
    position = site_position
    plant_time_remaining = PLANT_TIME
    planter = player
    
    return true

func process_plant(delta: float) -> void:
    """Continue planting."""
    if state != BombState.PLANTING:
        return
    
    plant_time_remaining -= delta
    
    if plant_time_remaining <= 0:
        complete_plant()

func complete_plant() -> void:
    """Bomb successfully planted."""
    state = BombState.PLANTED
    explode_time_remaining = EXPLODE_TIME
    
    # Notify all players
    EventBus.emit_signal("bomb_planted", position, planter.team)

func start_defuse(player: CS2Player) -> bool:
    """Begin defuse."""
    if state != BombState.PLANTED:
        return false
    
    # Check if player has defuse kit
    has_defuse_kit = player.has_defuse_kit
    var defuse_time: float = DEFUSE_TIME_KIT if has_defuse_kit else DEFUSE_TIME
    
    state = BombState.DEFUSING
    defuse_time_remaining = defuse_time
    defuser = player
    
    return true

func process_defuse(delta: float) -> void:
    """Continue defusing."""
    if state != BombState.DEFUSING:
        return
    
    defuse_time_remaining -= delta
    
    if defuse_time_remaining <= 0:
        complete_defuse()

func complete_defuse() -> void:
    """Bomb successfully defused."""
    state = BombState.DEFUSED
    
    EventBus.emit_signal("bomb_defused", defuser)
    EventBus.emit_signal("round_end", Team.CT)

func process_bomb_timer(delta: float) -> void:
    """Tick down to explosion."""
    if state != BombState.PLANTED:
        return
    
    explode_time_remaining -= delta
    
    if explode_time_remaining <= 0:
        explode()

func explode() -> void:
    """Bomb explodes - T wins."""
    state = BombState.EXPLODED
    
    # Damage all players in radius
    var explosion_radius: float = 1750.0  # Hammer units
    var damage: int = 500  # Instant kill
    
    for player in get_all_players():
        if player.position.distance_to(position) < explosion_radius:
            player.take_damage(damage, planter, "bomb")
    
    EventBus.emit_signal("bomb_exploded")
    EventBus.emit_signal("round_end", Team.T)
```

---

## Testing & Validation

### Determinism Tests

```gdscript
# tests/cs2/test_determinism.gd
class_name TestCS2Determinism extends "res://addons/gut/test.gd"

func test_same_seed_same_result():
    """Verify deterministic simulation."""
    
    var config = CS2MatchConfig.new()
    config.seed = 12345
    config.map = "de_dust2"
    config.team_a = create_test_team("Team A")
    config.team_b = create_test_team("Team B")
    
    # Run simulation twice with same seed
    var sim1 = CS2MatchSimulator.new(config)
    var result1 = sim1.run_simulation()
    
    var sim2 = CS2MatchSimulator.new(config)
    var result2 = sim2.run_simulation()
    
    # Results must be identical
    assert_eq(result1.score_a, result2.score_a)
    assert_eq(result1.score_b, result2.score_b)
    assert_eq(result1.round_results.size(), result2.round_results.size())

func test_weapon_recoil_patterns():
    """Verify recoil patterns match CS2."""
    
    var ak = CS2WeaponDatabase.get_weapon("ak47")
    var pattern = ak.recoil_pattern
    
    # First shot should have no recoil
    assert_eq(pattern[0], Vector2.ZERO)
    
    # Pattern should have 30 entries (full magazine)
    assert_eq(pattern.size(), 30)

func test_economy_calculations():
    """Verify economy math is correct."""
    
    var eco = CS2EconomySystem.new()
    
    # Test loss bonus escalation
    assert_eq(eco.LOSS_BONUS_TIERS[0], 1400)
    assert_eq(eco.LOSS_BONUS_TIERS[4], 3400)
    
    # Test max money cap
    var player = CS2Player.new()
    player.money = 17000
    eco.calculate_round_end_economy(Team.T, [])
    assert_eq(player.money, 16000)  # Capped
```

---

## Integration with Existing Systems

### Data Pipeline

```python
# extraction/src/scrapers/cs2_match_parser.py
class CS2MatchParser:
    """Parse CS2 match data from HLTV/Pandascore."""
    
    def parse_round(self, round_data: dict) -> CS2Round:
        return CS2Round(
            round_number=round_data['round'],
            winner=self.parse_team(round_data['winner']),
            win_reason=round_data['win_type'],  # "elimination", "bomb_exploded", "defused", "time"
            kills=[self.parse_kill(k) for k in round_data['kills']],
            economy_changes=self.parse_economy(round_data['economy']),
            utility_usage=self.parse_utility(round_data['grenades']),
        )
```

### Analytics

```python
# analytics/src/cs2/cs2_simrating.py
class CS2SimRatingCalculator(SimRatingCalculator):
    """CS2-specific SimRating with economy component."""
    
    def calculate(self, player_stats: CS2PlayerStats) -> SimRatingResult:
        components = {
            'aim': self.normalize_adr(player_stats.adr) * 0.20,
            'game_sense': self.normalize_kast(player_stats.kast) * 0.20,
            'consistency': self.normalize_round_consistency(player_stats) * 0.20,
            'impact': self.normalize_impact(player_stats.impact_rating) * 0.20,
            'economy': self.normalize_value_per_dollar(player_stats.value_per_dollar) * 0.20,
        }
        
        return SimRatingResult(
            sim_rating=sum(components.values()),
            components=components,
        )
```

---

## Timeline

| Week | Task |
|------|------|
| 1-2 | Weapon system implementation |
| 3-4 | Economy system implementation |
| 5-6 | Utility system implementation |
| 7-8 | Bomb objective implementation |
| 9-10 | Integration testing |
| 11-12 | Balance tuning |

---

*Design Document Owner: Simulation Team*  
*Review Schedule: Bi-weekly during implementation*
