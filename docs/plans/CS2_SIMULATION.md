# CS2 Simulation Design

## Core Mechanics (Godot 4)
```gdscript
# test_round_management.gd
func process_freeze_time(delta: float):
    for player in all_players:
        if can_buy(player):
            player.process_economy(delta)

func complete_plant():
    state = BombState.PLANTED
    EventBus.emit("bomb_planted", position, planter.team)
```

**Data Flow**: HLTV scraping → Twin-table → Sim input.
**Research**: [HLTV API](https://www.hltv.org/), Godot FPS tutorials.

