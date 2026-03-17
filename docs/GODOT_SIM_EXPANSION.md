# Godot Offline Game Simulator Expansion

## Accuracy-Focused (Base for Prob Sim)
- Less enjoyment, harder toggles (FM series).
- GM Modes: Scout→Analyst→Coach→Manager→Director→Owner.
- Interactive Desktop/Mobile screens.

```gdscript
# gm_mode.gd
enum GMMODE { SCOUT, ANALYST, COACH, MANAGER, DIRECTOR, OWNER }
var difficulty_toggle = HARD # More responsibilities

func roulette_wild_mode():
    var events = roll_13_slots()  # Turbulence/wildcards
```

**Auto-Gen Content**: Podcasts (PlatChat/PFF duos/panels), forums (2020-25 meta), emergent narratives (NBA MyPlayer+FM).
**Research**: Football Manager mechanics, PlatChat/ThinkingMansValorant transcripts.
**Accuracy**: Compare vs prob sim (refined/specialized).

