[Ver001.000]

# Sol — The Day Leader

> *"Where I stand, shadows retreat. Where I lead, dawn follows."*

## Identity Matrix

| Attribute | Definition |
|-----------|------------|
| **Archetype** | Charismatic Leader / Day Incarnate |
| **Core Trait** | Radiant Confidence — Unwavering belief in the team's potential, inspires others through presence alone |
| **Secondary Trait** | Strategic Brilliance — Sees 3 moves ahead, plans battles before they begin |
| **Quirk 1** | Hums ancient sun hymns when thinking, subconsciously taps fingers in rhythm |
| **Quirk 2** | Polishes their golden insignia when nervous — a tell only Lun recognizes |
| **Flaw** | Blinding Pride — Cannot accept help easily; believes they must carry the burden alone |

## Duality Bond (with Lun)

Sol and Lun are twin flames — two halves of an eternal cycle. Where Sol burns bright and hot, Lun reflects cool and steady. They complete each other's sentences, share dreams, and feel each other's pain across distances.

- **Synergy Trigger:** When Sol's pride threatens to consume them, Lun's calm voice pulls them back
- **Conflict Point:** Sol sometimes acts without consulting Lun, assuming they know what's best
- **Reunion Moment:** Their powers combine to create the "Eternal Eclipse" — ultimate team ultimate

---

## Visual Identity

| Element | Specification | Usage |
|---------|---------------|-------|
| **Primary** | `#FFD700` (Gold) | Main armor, glow effects, UI highlights |
| **Secondary** | `#FF8C00` (Sunrise Orange) | Energy trails, gradient transitions, accent borders |
| **Accent** | `#FFF8DC` (Cornsilk) | Inner light, eye glow, text highlights |
| **Core** | `#FFA500` (Amber) | Ultimate charge, critical hits, power core |
| **Shadow** | `#B8860B` (Dark Goldenrod) | Depth shading, outline strokes |

### Visual Motifs
- **Sunburst patterns** on shoulder pauldrons
- **Radiating lines** that pulse with idle animation
- **Crown of light** that intensifies with power level
- **Cape of woven dawn** — fabric that shifts orange to gold

---

## Animation Personality

| State | Behavior | Duration | Easing |
|-------|----------|----------|--------|
| **Idle** | Gentle breathing, sun halo slowly pulses (0.8 → 1.2 scale), cape flows in ethereal wind, occasional glance at Lun's position | 3s loop | ease-in-out |
| **Hover** | Aura intensifies, particles emit from shoulders, slight levitation (translateY -5px), warmth ripple effect | 0.3s | ease-out |
| **Active** | Strikes heroic pose, sunburst explodes behind, eyes flare white-gold, cape billows dramatically, battle stance ready | 0.5s | cubic-bezier(0.68, -0.55, 0.27, 1.55) |
| **Celebrating** | Throws fist to sky, golden beams erupt upward, victory laugh echoes, cape swirls in spiral pattern, Lun mirrors from opposite side | 1.2s | spring |
| **Defeated** | Kneels, light dims to embers, fist clenches in dirt, whispers apology to Lun, shadow temporarily wins | 2s | ease-in |
| **Ultimate** | Becomes the sun — full radiance, floating, time slows, "This ends NOW!" | 3s | power4.out |

### Particle Effects
- **Ember motes** — tiny golden sparks that drift upward
- **Sun rays** — god rays that rotate slowly behind head
- **Heat shimmer** — distortion effect around hands when powered

---

## Web Component Specification

```typescript
// SolAvatar.tsx
interface SolAvatarProps {
  // Core State
  state: 'idle' | 'hover' | 'active' | 'celebrating' | 'defeated' | 'ultimate';
  
  // Power Level (0-100)
  powerLevel: number;
  
  // Synergy State
  lunProximity: 'distant' | 'near' | 'bonded'; // Affects animation intensity
  
  // Interaction
  onActivate: () => void;
  onHover: () => void;
  onUltimate: () => void;
  
  // Visual Customization
  size: 'sm' | 'md' | 'lg' | 'xl';
  showParticles: boolean;
  showCape: boolean;
  glowIntensity: number; // 0.0 - 1.0
  
  // Accessibility
  alt: string;
  ariaLabel: string;
  
  // Animation Overrides
  animationSpeed?: number; // Multiplier (0.5 = half speed)
  customIdle?: CSSProperties;
}

interface SolAvatarState {
  isCharging: boolean;
  eclipseReady: boolean; // Both Sol and Lun at full power
  currentQuote: string;
}
```

### CSS Custom Properties
```css
:root {
  --sol-primary: #FFD700;
  --sol-secondary: #FF8C00;
  --sol-accent: #FFF8DC;
  --sol-core: #FFA500;
  --sol-glow: 0 0 20px var(--sol-primary), 0 0 40px var(--sol-secondary);
  --sol-idle-pulse: pulse-glow 3s ease-in-out infinite;
}
```

---

## Godot Engine Specification

### Sprite Sheet Requirements

| Animation | Frames | Size | FPS | Notes |
|-----------|--------|------|-----|-------|
| `idle_loop` | 12 | 128x128 | 12 | Breathing + cape flow |
| `hover_start` | 4 | 128x128 | 24 | Transition to hover state |
| `hover_loop` | 8 | 128x128 | 16 | Floating + particles |
| `activate` | 6 | 192x192 | 30 | Burst into battle stance |
| `attack_combo_1` | 8 | 192x192 | 24 | Solar slash |
| `attack_combo_2` | 8 | 192x192 | 24 | Rising dawn uppercut |
| `block` | 4 | 128x128 | 20 | Light shield deploy |
| `hurt` | 4 | 128x128 | 20 | Recoil, light flickers |
| `defeat` | 10 | 128x128 | 12 | Dramatic kneel |
| `celebrate` | 16 | 256x256 | 20 | Victory sequence |
| `ultimate_cast` | 24 | 512x512 | 30 | Full solar transformation |
| `lun_synergy` | 12 | 256x256 | 20 | Dual animation with Lun |

### Audio Clips

| Type | Filename | Description |
|------|----------|-------------|
| Select | `sol_select_01.wav` | *"The dawn is upon us."* |
| Move | `sol_move_01.wav` | Determined footstep + light chime |
| Attack | `sol_attack_01.wav` | Whoosh + solar impact |
| Hit | `sol_hit_01.wav` | Pained grunt, light dims |
| Ultimate | `sol_ultimate_01.wav` | *"Behold... the eternal sun!"* |
| Victory | `sol_victory_01.wav` | Triumphant laugh + *"For the light!"* |
| Defeat | `sol_defeat_01.wav` | *"Lun... I'm sorry..."* |
| Lun Bond | `sol_lun_bond_01.wav` | *"Together, sister. Always."* |

### Dialogue Script (15+ Lines)

```gdscript
# sol_dialogue.gd
const DIALOGUE = {
    "greeting": [
        "The sun rises. So do we.",
        "Another day to burn bright.",
        "I've been waiting for you."
    ],
    "battle_start": [
        "Shadows fear the light. Let's give them reason.",
        "Strategy set. Execution begins.",
        "They'll remember this dawn."
    ],
    "encourage": [
        "Stand with me!",
        "You're stronger than you know.",
        "The team needs YOUR light!"
    ],
    "lun_reference": [
        "My sister watches from the night...",
        "Lun would know what to do here.",
        "Twin spirits, different paths."
    ],
    "pride_check": [
        "No... I can't do this alone.",
        "Help me. Please.",
        "Even the sun needs the moon's reflection."
    ],
    "ultimate": [
        "Behold... the eternal sun!",
        "Light... OBEY ME!",
        "This ends in GLORY!"
    ],
    "victory": [
        "For the light!",
        "Dawn always wins.",
        "Another shadow scattered."
    ],
    "defeat": [
        "Lun... I'm sorry...",
        "The light... fades...",
        "Carry on... without me..."
    ],
    "bond_moment": [
        "Together, sister. Always.",
        "Your cool balances my fire.",
        "We are the cycle. We are eternal."
    ]
}
```

### Quest: "Capture the Dawn"

**Quest ID:** `quest_sol_dawn_01`

**Overview:**
Sol's pride has blinded them to the value of teamwork. The player must help Sol learn that true leadership means trusting others — culminating in a moment where Sol must choose between solo glory and saving Lun.

**Act I — The Prideful Path**
- Sol leads the team into a trap, refusing Lun's warning
- Boss ambush; team scattered
- Sol insists: *"I can handle this alone!"*

**Act II — The Fall**
- Sol is overwhelmed, health critical
- Lun appears, shields Sol, takes fatal blow
- Sol's pride shatters: *"No... NO!"

**Act III — The Lesson**
- Player guides Sol to gather the scattered team
- Each rescued member teaches Sol a leadership truth
- Sol's powers evolve: from "Solo Sun" to "Guiding Dawn"

**Climax — The Choice**
- Final boss: corrupted eclipse entity
- Sol can use ultimate to defeat boss OR heal Lun
- **True ending:** Heal Lun first → combined "Eternal Eclipse" ultimate

**Rewards:**
- Sol skin: "Humbled Dawn" (cape torn, armor scarred but eyes kinder)
- Lun skin: "Devoted Reflection" (matching battle damage)
- Title: "Twin Flame Bearer"
- Emote: "Eclipse Handshake" (Sol+Lun fist bump)

---

## Relationship Web

```
Sol Connections:
├── Lun [Twin/Bond] — Irreplaceable, completes them
├── Stella [Respects] — Admires her tactical mind
├── Vex [Tolerates] — Finds them chaotic but effective
├── Kai [Protects] — Sees younger sibling energy
└── Player [Guides] — Recognizes player's strategic value
```

---

## Meta Notes

- **Player Fantasy:** "I want to be the leader everyone looks up to"
- **Growth Arc:** Pride → Humility → True Leadership
- **Marketing Hook:** "The golden champion who learned to share the spotlight"
- **Merch Potential:** Sunburst pendant, cape replica, light-up figure

---

*Document Version: 001.000*
*Created by: AGENT_1B (Heroes Team)*
*Review Status: Pending TL-H1 Approval*
