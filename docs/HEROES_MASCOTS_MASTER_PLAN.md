[Ver001.000]

# 4NJZ4 HEROES & MASCOTS — FOREMAN MASTER PLAN
**Repository:** Libre-X-eSport 4NJZ4 TENET Platform  
**Source Branch:** 18adbe1e (March 18, 2026 — feat(heroes))  
**Foreman:** Central coordination node  
**Total Waves:** 7 waves, 21 agents  
**Estimated Duration:** 168 hours (4 weeks @ 42h/week)

---

## EXECUTIVE SUMMARY

This master plan remodels the heroes/mascots concept from branch `18adbe1e` into a production-ready development pipeline. The 5 heroes (Sol, Lun, Bin, Fat, Uni) and 4 mascots (CheCat, CheBun, NyxiaCat, LunariaBunny) form the narrative and visual identity layer of the 4NJZ4 platform.

### Core Concept Remodeled

**Original:** Static hero definitions with basic traits  
**Remodeled:** Living character system with cross-platform presence (Web React + Godot), seasonal evolution, and player attachment mechanics.

**Key Innovations Added:**
- **Dual Presence System:** Heroes appear on web (help overlays, seasonal events) AND in Godot simulation (NPC guides, story moments)
- **Mascot Progression:** Editor system with 13-tier token rewards (exponential: Tier13 > sum 1-12)
- **Seasonal Lifecycle:** 13 styling suites with automatic transitions
- **Narrative Integration:** Heroes guide new users; mascots are playable avatars

---

## PHASE 1: CONCEPTUALIZATION & DESIGN SYSTEM (Week 1)

### Wave 1.1: Hero Concept Deep-Dive (3 agents)
**Foreman Assignment:**

| Agent | Task | Output |
|-------|------|--------|
| **Agent 1-A** | Sol & Lun refinement | Character bibles, color systems, animation keyframes |
| **Agent 1-B** | Bin & Fat refinement | Character bibles, ability concepts, villain contrast |
| **Agent 1-C** | Uni + villain roster (ADORE, HYBER, Vexor) | Unity mechanics, inverse color theory, narrative hooks |

**Deliverables per Agent:**
1. Character Bible (2-3 pages):
   - Primary/secondary color palettes (hex + CSS vars)
   - Personality matrix (5 traits, 3 quirks, 1 flaw)
   - Animation personality (idle, hover, active states)
   - Voice/tone guide (if text-to-speech enabled)
   - Synergy mechanics with other heroes

2. Cross-Platform Asset List:
   - Web: SVG portraits, CSS animated states, React component
   - Godot: Sprite sheets, tween animations, dialogue nodes

3. Foreman Review Checklist:
   - [ ] Colors pass WCAG contrast
   - [ ] Animations respect `prefers-reduced-motion`
   - [ ] Traits align with NJZ/ILLIT/LE SSERAFIM source material
   - [ ] No stereotyping in "equitable" design mandate

**Foreman Protocol:**
```
Pass 1 (Scout): Extract color palettes from source idols
Pass 2 (Plan): Map traits to gameplay mechanics
Pass 3 (Review): Check equity across all 5 heroes
Pass 4 (Implement): Approve bibles for production
```

---

### Wave 1.2: Mascot System Architecture (3 agents)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 2-A** | Little mascots (CheCat, CheBun) | Chibi art specs, animation rigs, physics parameters |
| **Agent 2-B** | Anthropomorphic mascots (NyxiaCat, LunariaBunny) | Big/small form specs, cosplay system, drama mechanics |
| **Agent 2-C** | Mascot Editor System | 6 animal types, outfit taxonomy, 13-tier economy |

**Mascot Editor Specifications:**

```typescript
// Animal base types
const ANIMAL_TYPES = ['bunny', 'cat', 'dog', 'mouse', 'fish', 'bird'] as const;

// Outfit categories
type OutfitCategory = 'head' | 'body' | 'accessory' | 'special';

// 13-Tier Economy (exponential)
const TIER_COSTS = [
  100,    // Tier 1: Basic colors
  250,    // Tier 2: Patterns
  500,    // Tier 3: Accessories
  1000,   // Tier 4: Animated parts
  2000,   // Tier 5: Particle effects
  4000,   // Tier 6: Special poses
  8000,   // Tier 7: Companion pet
  16000,  // Tier 8: Aura effects
  32000,  // Tier 9: Transformation
  64000,  // Tier 10: Legendary skin
  128000, // Tier 11: Mythic elements
  256000, // Tier 12: God-tier particles
  1024000 // Tier 13: Hyper-exclusive (nebula/prism) — exceeds sum 1-12
];

// Total to max: ~1.6M tokens (6+ months daily play)
```

**Foreman Review Points:**
- [ ] CheCat vs CheBun distinction clear (CatBunny vs BunnyCat)
- [ ] NyxiaCat "Bugs style" vs LunariaBunny "Tom style" visually distinct
- [ ] Editor token economy sustainable (not p2w, pure progression)
- [ ] 6 animals have equitable customization depth

---

### Wave 1.3: Visual System Foundation (3 agents)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 3-A** | 13 Seasonal Styling Suites | CSS variable systems, Godot theme resources |
| **Agent 3-B** | Logo & Symbol System | SATOR+NJZ hybrid marks, vine runes, bubble glyphs |
| **Agent 3-C** | Typography & Free Space | Hyperpop sans + rune mono, Goya math grids |

**13 Seasonal Suite Specs:**

| Suite | Theme | Primary | Secondary | Accent | Use Case |
|-------|-------|---------|-----------|--------|----------|
| 1 | Spring Awakening | #4ade80 | #f472b6 | #fbbf24 | New user onboarding |
| 2 | Cherry Blossom | #f472b6 | #fb7185 | #fcd34d | NJZ signature |
| 3 | Summer Solstice | #fbbf24 | #f97316 | #3b82f6 | Sol focus events |
| 4 | Ocean Deep | #3b82f6 | #06b6d4 | #22d3ee | Lun focus events |
| 5 | Autumn Bind | #a855f7 | #8b5cf6 | #d946ef | Bin focus events |
| 6 | Harvest Fate | #10b981 | #059669 | #14b8a6 | Fat focus events |
| 7 | Winter Unity | #6366f1 | #8b5cf6 | #ec4899 | Uni focus events |
| 8 | Frost Crystal | #94a3b8 | #cbd5e1 | #e2e8f0 | Tournament mode |
| 9 | Ember Night | #dc2626 | #991b1b | #fbbf24 | Clutch moments |
| 10 | Starlight | #818cf8 | #6366f1 | #c084fc | Premium features |
| 11 | Void Edge | #1e293b | #334155 | #475569 | Dark mode base |
| 12 | Nebula Dawn | #c084fc | #a855f7 | #22d3ee | Year-end events |
| 13 | Hyper Exclusive | #0f172a | #1e1b4b | prism gradient | Tier13 unlock |

**Foreman Integration:**
- CSS custom properties cascade: `--suite-{n}-{role}`
- Godot Theme resources: `res://themes/seasonal/suite_{n}.tres`
- Automatic transition: CSS transitions + Godot Tween

---

## PHASE 2: HERO IMPLEMENTATION — WEB (Week 2)

### Wave 2.1: Hero Components & Overlay System (3 agents)

| Agent | Task | Files |
|-------|------|-------|
| **Agent 4-A** | HeroAvatar Component + Sol/Lun | `HeroAvatar.tsx`, `heroes/sol.svg`, `heroes/lun.svg` |
| **Agent 4-B** | Bin/Fat/Uni Avatars + States | `heroes/bin.svg`, `heroes/fat.svg`, `heroes/uni.svg` |
| **Agent 4-C** | HeroHelpOverlay + Rotation Logic | `HeroHelpOverlay.tsx` (rebuild), `useHeroRotation.ts` |

**HeroAvatar Component Spec:**

```typescript
interface HeroAvatarProps {
  hero: 'sol' | 'lun' | 'bin' | 'fat' | 'uni';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  state?: 'idle' | 'hover' | 'active' | 'celebrating';
  seasonalSuite?: 1-13;
  showTooltip?: boolean;
  onClick?: () => void;
}

// States trigger different CSS animations:
// - idle: subtle float (3s ease-in-out infinite)
// - hover: scale(1.05) + glow shadow
// - active: quick bounce + particle burst
// - celebrating: rainbow shimmer + jump
```

**HeroHelpOverlay Remodel:**

```typescript
interface HeroTip {
  hero: HeroId;
  tip: string;
  context: 'dashboard' | 'analytics' | 'simulation' | 'general';
  dismissible: boolean;
  priority: 1-5;
}

// Rotation logic:
// - Priority 1: Always show first
// - Context-aware: Match current route
// - Time-based: New tip every 30s or on action
// - Memory: Don't repeat dismissed tips in session
```

---

### Wave 2.2: Hero Dashboard Integration (3 agents)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 5-A** | HeroSynergyDisplay | Team composition bonuses, interaction web |
| **Agent 5-B** | SeasonalHeroFrame | Quarterly grid integration, masonry layout |
| **Agent 5-C** | HeroEventSystem | Time-limited events, hero-specific challenges |

---

## PHASE 3: HERO IMPLEMENTATION — GODOT (Week 2-3)

### Wave 3.1: Godot Hero NPC System (3 agents)

| Agent | Task | Files |
|-------|------|-------|
| **Agent 6-A** | HeroNPC Base + Sol/Lun | `HeroNPC.gd`, `npcs/SolNPC.tscn`, `npcs/LunNPC.tscn` |
| **Agent 6-B** | Bin/Fat/Uni NPCs | `npcs/BinNPC.tscn`, `npcs/FatNPC.tscn`, `npcs/UniNPC.tscn` |
| **Agent 6-C** | Dialogue System + Quests | `DialogueManager.gd`, `QuestSystem.gd`, hero storylines |

**HeroNPC Spec:**

```gdscript
class_name HeroNPC extends CharacterBody2D

@export var hero_data: HeroData
@export var patrol_points: Array[Marker2D]
@export var dialogue_tree: DialogueResource

var current_state: State = State.IDLE
var player_nearby: bool = false

enum State {
    IDLE,           # Play idle animation
    PATROL,         # Move between points
    INTERACT,       # Face player, animate
    CELEBRATE,      # Victory animation
    GUIDE           # Show path to objective
}

func _ready():
    # Load hero-specific assets
    sprite.texture = load("res://assets/heroes/%s_sprite.png" % hero_data.id)
    animation_player.play("idle")
    
    # Setup interaction area
    interaction_area.body_entered.connect(_on_player_enter)

func interact():
    current_state = State.INTERACT
    DialogueManager.show_dialogue(dialogue_tree, hero_data.id)
    emit_signal("hero_interacted", hero_data.id)
```

---

### Wave 3.2: Godot Hero Manager & Landing (2 agents)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 7-A** | LandingHeroes Remake | Animated intro, grid framing, dial integration |
| **Agent 7-B** | HeroesManager.gd Refactor | State machine, save/load, seasonal transitions |

---

## PHASE 4: MASCOT IMPLEMENTATION (Week 3-4)

### Wave 4.1: Mascot Assets & Animation (3 agents)

| Agent | Mascots | Output |
|-------|---------|--------|
| **Agent 8-A** | CheCat + CheBun | Chibi sprites, bounce/wiggle anims, SFX |
| **Agent 8-B** | NyxiaCat | Small/Big forms, cosplay variants, Bugs-style expressions |
| **Agent 8-C** | LunariaBunny | Small/Big forms, drama transformations, Tom-style reactions |

---

### Wave 4.2: Mascot Editor (Web + Godot) (3 agents)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 9-A** | Editor UI/UX | 6 animal selectors, outfit grid, preview canvas |
| **Agent 9-B** | 13-Tier System | Token economy, unlock logic, progression persistence |
| **Agent 9-C** | Godot Integration | Export to simulation, playable mascot controller |

**Mascot Save Data:**

```typescript
interface MascotSave {
  id: string;
  name: string;
  baseAnimal: typeof ANIMAL_TYPES[number];
  equipped: {
    head: string | null;
    body: string | null;
    accessory: string[];
    special: string | null;
  };
  unlockedTiers: number[];
  stats: {
    gamesPlayed: number;
    tokensEarned: number;
    favoriteOutfit: string;
  };
  createdAt: Date;
  lastModified: Date;
}
```

---

## PHASE 5: VISUAL SYSTEMS & INTEGRATION (Week 4)

### Wave 5.1: World Trees & Fluid Effects (2 agents)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 10-A** | WorldTree Component (VAL/CS2 variants) | Windy/smoky variants, seasonal mutations |
| **Agent 10-B** | Fluid/Stillness/Motion System | CSS particles, Godot shaders, dial SFX |

---

### Wave 5.2: Cross-Platform Sync (1 agent)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 11** | Web↔Godot State Sync | Hero progress, mascot saves, seasonal state |

---

## PHASE 6: TESTING & POLISH (Week 4)

### Wave 6.1: Testing Suite (2 agents)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 12-A** | Web Testing | HeroOverlay, MascotEditor, seasonal transitions |
| **Agent 12-B** | Godot Testing | NPC interactions, mascot gameplay, save/load |

---

### Wave 6.2: Final Review & Documentation (1 agent)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 13** | Documentation + Style Guide | HEROES_DESIGN_v2.md, MASCOT_SYSTEM.md, asset pipeline |

---

## AGENT ASSIGNMENT SUMMARY

```
WAVE 1.1 (3 agents): Hero Concept Deep-Dive
├── Agent 1-A: Sol & Lun
├── Agent 1-B: Bin & Fat
└── Agent 1-C: Uni + Villains

WAVE 1.2 (3 agents): Mascot System Architecture
├── Agent 2-A: CheCat, CheBun
├── Agent 2-B: NyxiaCat, LunariaBunny
└── Agent 2-C: Editor + Economy

WAVE 1.3 (3 agents): Visual System Foundation
├── Agent 3-A: 13 Seasonal Suites
├── Agent 3-B: Logo & Symbols
└── Agent 3-C: Typography & Free Space

WAVE 2.1 (3 agents): Web Hero Components
├── Agent 4-A: HeroAvatar (Sol/Lun)
├── Agent 4-B: HeroAvatar (Bin/Fat/Uni)
└── Agent 4-C: HeroHelpOverlay

WAVE 2.2 (3 agents): Web Dashboard Integration
├── Agent 5-A: HeroSynergyDisplay
├── Agent 5-B: SeasonalHeroFrame
└── Agent 5-C: HeroEventSystem

WAVE 3.1 (3 agents): Godot Hero NPCs
├── Agent 6-A: HeroNPC Base + Sol/Lun
├── Agent 6-B: Bin/Fat/Uni NPCs
└── Agent 6-C: Dialogue + Quests

WAVE 3.2 (2 agents): Godot Hero Manager
├── Agent 7-A: LandingHeroes
└── Agent 7-B: HeroesManager Refactor

WAVE 4.1 (3 agents): Mascot Assets
├── Agent 8-A: CheCat, CheBun
├── Agent 8-B: NyxiaCat
└── Agent 8-C: LunariaBunny

WAVE 4.2 (3 agents): Mascot Editor
├── Agent 9-A: Editor UI/UX
├── Agent 9-B: 13-Tier System
└── Agent 9-C: Godot Integration

WAVE 5.1 (2 agents): Visual Systems
├── Agent 10-A: World Trees
└── Agent 10-B: Fluid Effects

WAVE 5.2 (1 agent): Cross-Platform Sync
└── Agent 11: State Synchronization

WAVE 6.1 (2 agents): Testing
├── Agent 12-A: Web Tests
└── Agent 12-B: Godot Tests

WAVE 6.2 (1 agent): Documentation
└── Agent 13: Final Documentation

TOTAL: 32 agents across 7 phases
```

---

## QUALITY GATES

Each phase must pass these gates before proceeding:

### Gate 1: Concept Approval (End Phase 1)
- [ ] All 5 hero bibles approved by foreman
- [ ] Mascot taxonomy clear and non-overlapping
- [ ] 13 seasonal suites cover all use cases
- [ ] Equity review passed (no stereotypes)

### Gate 2: Component Completeness (End Phase 2)
- [ ] All web hero components render correctly
- [ ] HeroHelpOverlay rotates tips properly
- [ ] Accessibility (reduced motion, screen reader)

### Gate 3: Godot Integration (End Phase 3)
- [ ] All 5 NPCs animate and dialogue
- [ ] Landing scene performance >60fps
- [ ] Save/load persistence works

### Gate 4: Mascot System (End Phase 4)
- [ ] Editor exports to both platforms
- [ ] 13-tier economy balances
- [ ] All 6 animal types customizable

### Gate 5: Visual Polish (End Phase 5)
- [ ] World trees render in both variants
- [ ] Seasonal transitions smooth
- [ ] Web/Godot visual parity

### Gate 6: Release Ready (End Phase 6)
- [ ] All tests pass
- [ ] Documentation complete
- [ ] No console errors
- [ ] Foreman final sign-off

---

## RISK MITIGATION

| Risk | Mitigation |
|------|------------|
| Art asset delays | Start with CSS/SVG placeholders; swap final art later |
| Scope creep | Strict 13-tier limit; no additional animals post-launch |
| Cross-platform sync complexity | Web as source of truth; Godot fetches on launch |
| Performance on low-end | LOD system for mascot details; particle limits |
| Cultural sensitivity | Equity review at Gate 1; idol attribution respectful |

---

## FOREMAN PROTOCOL

### Daily Standup Format (Async)
```
AGENT-{ID} REPORT [{timestamp}]
- Completed: [tasks]
- Blocked: [obstacles → need foreman?]
- Next: [planned work]
- Files: [paths to drafts]
```

### 4-Pass Review Per File
```
Pass 1 (Scout): Check file exists, runs without errors
Pass 2 (Plan): Review against spec, note deviations
Pass 3 (Review): Code quality, accessibility, performance
Pass 4 (Implement): Approve or request changes with specific fixes
```

### Change Request Format
```
[FOREMAN-REVIEW-{file}]
Status: [APPROVED | CHANGES_REQUESTED | NEEDS_DISCUSSION]
Issues:
  1. [line:col] [issue] → [suggested fix]
Next: [proceed | revise | escalate]
```

---

## SUCCESS CRITERIA

**Phase 1 Complete:**
- 5 hero bibles with complete asset lists
- Mascot taxonomy with clear distinctions
- 13 seasonal suites as CSS/Godot themes

**Phase 2 Complete:**
- HeroAvatar component with 4 states
- HeroHelpOverlay with context-aware tips
- Dashboard integration with synergy display

**Phase 3 Complete:**
- 5 Godot NPCs with dialogue
- Landing scene with animated hero framing
- Save/load persistence

**Phase 4 Complete:**
- 4 mascots with all animations
- Editor with 6 animals, 13 tiers
- Cross-platform mascot sync

**Phase 5 Complete:**
- World trees (VAL/CS2 variants)
- Fluid/stillness/motion systems
- Visual parity web/godot

**Phase 6 Complete:**
- 100% test coverage for critical paths
- Complete documentation
- Foreman sign-off

---

*Foreman: Update this plan with [VerMMM.mmm] on each revision.*
*Agents: Follow this plan, not source branch code. Submit drafts to foreman.*
