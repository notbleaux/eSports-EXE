[Ver001.000]

# WAVE 1.1 — AGENT 1-C TASK: Uni + Villains Roster
**Priority:** P0  
**Estimated:** 8 hours  
**Due:** +24 hours from claim  
**Foreman:** Awaiting submission at `.job-board/02_CLAIMED/{agent-id}/`

---

## ASSIGNMENT

Create comprehensive character bible for **Uni (Overcomer/Friends)** and **villain roster** (ADORE, HYBER, Vexor).

### Source Material

**Uni (Original):**
- Primary: NJZ Minji
- Solo elements: ILLIT Wonhee (unity beat)
- Hybrid elements: LE SSERAFIM Eunchae (friend power)
- Colors: Rainbow unity
- Outfit: Breach blasts
- Synergy: Team overdrive

**Villains (Original):**
- ADORE: Chrome black/gold (Sol inverse)
- HYBER: Neon black/red (Uni inverse)
- Vexor: Glitch black/green (Bin inverse)

---

## DELIVERABLES

### 1. Character Bible — Uni (2-3 pages)

**Critical Challenge:** Rainbow can look messy. Define Uni's "unity" carefully.

```markdown
## Uni — The Unity Overcomer

### Identity Matrix
- **Archetype:** Heart of the Team / Friendship Embodied
- **Core Trait:** Believes in others more than they believe in themselves
- **Secondary Trait:** Overcomes obstacles through persistence
- **Quirk 1:** Remembers everyone's preferences/favorites
- **Quirk 2:** Gives surprisingly good pep talks
- **Flaw:** Self-sacrificing to a fault

### Visual Identity: Controlled Rainbow
Instead of "all colors at once," Uni cycles through colors representing the team:

| Phase | Color | Represents |
|-------|-------|------------|
| 1 | Gold | Sol |
| 2 | Silver | Lun |
| 3 | Violet | Bin |
| 4 | Cyan | Fat |
| 5 | Prism | Uni's own light |

**Base:** White/light grey with color cycling accents

**CSS Variables:**
```css
--uni-base: #F8FAFC;
--uni-cycle: var(--current-phase-color);
--uni-prism: linear-gradient(90deg, 
  #FFD700, #C0C0C0, #8B5CF6, #14B8A6, #F472B6);
```

### Animation Personality
| State | Behavior | Duration |
|-------|----------|----------|
| Idle | Gentle color cycling (phases 1-5) | 5s loop |
| Hover | Cycle accelerates + team symbols appear | 0.5s |
| Active | All colors burst then unify to white | 0.8s |
| Overdrive | Full prism shimmer + pulse waves | 2s |
| Celebrating | Phase 5 (prism) dominates | 1s |

### Voice/Tone
- **Casual:** "We're stronger together!"
- **Encouraging:** "You've got this—I believe in you."
- **Determined:** "No wall we can't break through."
- **Never:** Sacrifices others, gives up

### Synergy Mechanics: Team Overdrive
When all 5 heroes are present:
- Uni triggers "Overdrive" state
- All heroes get enhanced versions of their synergy
- Visual: All heroes glow with their color + Uni's prism

### Web Component Spec
```typescript
interface UniAvatarProps {
  state: 'idle' | 'hover' | 'active' | 'overdrive' | 'celebrating';
  teamPresent?: HeroId[]; // Affects color cycling
  showUnityPulse?: boolean;
}
```

### Godot Spec
- Sprite: Color-shifting shader
- Unique: "Team Boost" ability (temporary buffs)
- Dialogue: Encouraging, inclusive
- Quest: "Gather the Five" — recruit all heroes
```

### 2. Villain Roster (2-3 pages total)

**Design Principle:** Villains are inverse colors AND inverse philosophies.

```markdown
## ADORE — The Sol Inverse

### Visual
- Chrome black base + gold accents
- Sharp angles vs Sol's warmth
- Glitch/static effects

### Philosophy
Sol uplifts others → ADORE demands worship
Team speed boost → Forces solo performance

### Narrative Role
Rival leader, former hero corrupted

---

## HYBER — The Uni Inverse

### Visual
- Neon black + blood red
- Fractured rainbow (broken unity)
- Discordant pulses

### Philosophy
Uni unites → HYBER divides
Team overdrive → Forces competition

### Narrative Role
Chaos agent, thrives on conflict

---

## Vexor — The Bin Inverse

### Visual
- Glitch black + toxic green
- Broken connections
- Static interference

### Philosophy
Bin connects → Vexor severs
Utility link → System breakdown

### Narrative Role
Sabotage expert, hacker archetype
```

### 3. Hero-Villain Dynamic Matrix

| Hero | Villain | Dynamic |
|------|---------|---------|
| Sol | ADORE | Rival leaders, former friends? |
| Lun | — | Calm to chaos? |
| Bin | Vexor | Connection vs severance |
| Fat | — | Fate vs …? |
| Uni | HYBER | Unity vs division |

*Note: Leave gaps for future villains or nuanced relationships.*

---

## FOREMAN REVIEW CHECKLIST

- [ ] Uni's rainbow feels cohesive, not messy
- [ ] "Team Overdrive" mechanic is exciting, not OP
- [ ] Villains feel threatening but not edgy-for-edginess
- [ ] Color inversions are visually clear
- [ ] Narrative hooks exist for future content

---

## CONSTRAINTS

1. **Rainbow Control:** Uni must have visual cohesion
2. **Villain Balance:** Threatening but not nightmare fuel
3. **Inverse Logic:** Each villain has clear philosophical opposition
4. **Expansion Room:** Leave gaps for future villains

---

*Claim by moving to `.job-board/02_CLAIMED/{agent-id}/`*
