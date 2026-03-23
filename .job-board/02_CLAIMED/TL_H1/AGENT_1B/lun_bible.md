[Ver001.000]

# Lun — The Night Support

> *"In the quiet dark, I hear everything. In the silence, I see the truth."*

## Identity Matrix

| Attribute | Definition |
|-----------|------------|
| **Archetype** | Mystic Support / Night Incarnate |
| **Core Trait** | Deep Empathy — Feels others' emotions as physical sensations, cannot ignore suffering |
| **Secondary Trait** | Hidden Strength — Underestimated power that reveals itself when protecting others |
| **Quirk 1** | Speaks in moon phases when emotional ("I'm feeling... very waning gibbous right now")
| **Quirk 2** | Collects small glowing stones; fills pockets with them, uses them as worry stones |
| **Flaw** | Self-Sacrificing — Will drain themselves to zero protecting others; doesn't know when to stop |

## Duality Bond (with Sol)

Lun is the shadow that proves the light exists. Where Sol burns outward, Lun glows inward. They are the voice of caution to Sol's call to action, the heal to Sol's harm, the question to Sol's answer.

- **Synergy Trigger:** When Lun's self-sacrifice threatens to extinguish them, Sol's fire reignites their spirit
- **Conflict Point:** Lun sometimes holds back too much, waiting for the "perfect moment" that never comes
- **Reunion Moment:** Their powers combine to create the "Eternal Eclipse" — ultimate balance

---

## Visual Identity

| Element | Specification | Usage |
|---------|---------------|-------|
| **Primary** | `#E6E6FA` (Lavender) | Main robes, mist effects, healing auras |
| **Secondary** | `#4B0082` (Indigo) | Deep shadows, void accents, mystery |
| **Accent** | `#F0F8FF` (Alice Blue) | Moon glow, starlight particles, eye shine |
| **Core** | `#B0C4DE` (Light Steel Blue) | Shield effects, barrier magic, calm zones |
| **Shadow** | `#191970` (Midnight Blue) | Depth, cosmic backdrop, silhouette |

### Visual Motifs
- **Crescent moon** headdress that waxes/wanes with power level
- **Star constellations** embedded in robe fabric that slowly rotate
- **Ethereal mist** that pools at feet and drifts behind when moving
- **Mirror shards** that float in orbit, reflecting allies' health status

---

## Animation Personality

| State | Behavior | Duration | Easing |
|-------|----------|----------|--------|
| **Idle** | Slow breathing, mist flows in spiral patterns, constellation patterns rotate on robes, occasionally looks up at where Sol would be, moon headdress gently bobs | 4s loop | ease-in-out |
| **Hover** | Mist intensifies, floats upward slightly, mirror shards align protectively, soft chime sound, eyes glow brighter | 0.4s | ease-out |
| **Active** | Robes flare outward, crescent becomes full moon, mist explodes into protective barrier stance, hands raise with gathered starlight | 0.6s | cubic-bezier(0.34, 1.56, 0.64, 1) |
| **Celebrating** | Spins joyfully, releases stored starlight as fireworks, laughs freely (rare!), mirror shards create dazzling light show, Sol reaches for their hand | 1.5s | spring |
| **Defeated** | Collapses gracefully, light fades from headdress, mirrors shatter and fall, whispers Sol's name, mist dissipates into cold | 2.5s | ease-in |
| **Healing** | Envelops ally in gentle embrace, transfers own light to them, temporarily dims, soft humming melody | 1.8s | power2.out |
| **Ultimate** | Becomes the moon — serene radiance, time slows, gravity shifts, "Sleep now. I guard the night." | 4s | power4.out |

### Particle Effects
- **Star motes** — tiny silver sparks that orbit slowly
- **Mist trails** — ethereal fog that follows movement
- **Mirror reflections** — show brief glimpses of allied characters' faces
- **Moonbeams** — soft rays that angle down from above

---

## Web Component Specification

```typescript
// LunAvatar.tsx
interface LunAvatarProps {
  // Core State
  state: 'idle' | 'hover' | 'active' | 'celebrating' | 'defeated' | 'healing' | 'ultimate';
  
  // Power Level (0-100) — Affects moon phase
  powerLevel: number;
  
  // Moon Phase Visualization
  moonPhase: 'new' | 'waxing_crescent' | 'first_quarter' | 'waxing_gibbous' | 'full' | 'waning_gibbous' | 'last_quarter' | 'waning_crescent';
  
  // Synergy State
  solProximity: 'distant' | 'near' | 'bonded'; // Affects animation intensity
  
  // Healing Target
  healingTarget?: string | null; // ID of character being healed
  healingProgress?: number; // 0-100
  
  // Interaction
  onActivate: () => void;
  onHover: () => void;
  onUltimate: () => void;
  onHeal: (targetId: string) => void;
  
  // Visual Customization
  size: 'sm' | 'md' | 'lg' | 'xl';
  showParticles: boolean;
  showMist: boolean;
  showMirrors: boolean;
  glowIntensity: number; // 0.0 - 1.0
  
  // Accessibility
  alt: string;
  ariaLabel: string;
  
  // Animation Overrides
  animationSpeed?: number; // Multiplier (0.5 = half speed)
  customIdle?: CSSProperties;
}

interface LunAvatarState {
  isDrained: boolean; // Used all power protecting others
  eclipseReady: boolean; // Both Sol and Lun at full power
  currentQuote: string;
  storedHealCharge: number; // Overheal mechanic
}
```

### CSS Custom Properties
```css
:root {
  --lun-primary: #E6E6FA;
  --lun-secondary: #4B0082;
  --lun-accent: #F0F8FF;
  --lun-core: #B0C4DE;
  --lun-glow: 0 0 25px var(--lun-primary), 0 0 50px var(--lun-secondary);
  --lun-mist-flow: mist-drift 4s ease-in-out infinite;
  --lun-star-twinkle: twinkle 2s ease-in-out infinite alternate;
}
```

---

## Godot Engine Specification

### Sprite Sheet Requirements

| Animation | Frames | Size | FPS | Notes |
|-----------|--------|------|-----|-------|
| `idle_loop` | 16 | 128x128 | 8 | Slow mystical breathing + star rotation |
| `hover_start` | 5 | 128x128 | 20 | Mist gathers, levitation begins |
| `hover_loop` | 12 | 128x128 | 12 | Floating + mist spiral + mirror orbit |
| `activate` | 7 | 192x192 | 24 | Robes flare, moon full, barrier ready |
| `heal_cast` | 10 | 192x192 | 20 | Gentle embrace, light transfer |
| `heal_channel` | 8 | 128x128 | 16 | Sustained healing, gradual dim |
| `shield_deploy` | 6 | 256x256 | 30 | Massive barrier, protects team |
| `hurt` | 5 | 128x128 | 18 | Recoil, mirrors crack slightly |
| `defeat` | 12 | 128x128 | 10 | Graceful collapse, mirrors shatter |
| `celebrate` | 20 | 256x256 | 16 | Joyful spin, star fireworks |
| `ultimate_cast` | 30 | 512x512 | 24 | Full lunar ascension |
| `sol_synergy` | 12 | 256x256 | 20 | Dual animation with Sol |
| `self_sacrifice` | 15 | 384x384 | 20 | Protecting ally at all costs |

### Audio Clips

| Type | Filename | Description |
|------|----------|-------------|
| Select | `lun_select_01.wav` | *"The night welcomes you."* |
| Move | `lun_move_01.wav` | Soft footfall + bell chime |
| Heal | `lun_heal_01.wav` | Gentle hum + restorative chime |
| Shield | `lun_shield_01.wav` | Crystal resonance barrier |
| Hit | `lun_hit_01.wav` | Sharp gasp, mirror crack |
| Ultimate | `lun_ultimate_01.wav` | *"Sleep now. I guard the night."* |
| Victory | `lun_victory_01.wav` | Soft laugh + *"The dark yields to dawn."* |
| Defeat | `lun_defeat_01.wav` | *"Sol... take my light..."* |
| Sol Bond | `lun_sol_bond_01.wav` | *"Always beside you, sister."* |
| Sacrifice | `lun_sacrifice_01.wav` | *"Not while I still shine!"* |

### Dialogue Script (15+ Lines)

```gdscript
# lun_dialogue.gd
const DIALOGUE = {
    "greeting": [
        "The night welcomes you.",
        "I felt you coming. The stars whispered.",
        "In darkness, we find clarity."
    ],
    "battle_start": [
        "I'll watch the shadows so you can face the light.",
        "My barriers hold. Trust them.",
        "The moon sees what the sun cannot."
    ],
    "encourage": [
        "You don't have to be bright to matter.",
        "Rest. I'll stand watch.",
        "Your strength is quiet, but it's real."
    ],
    "sol_reference": [
        "My sister burns so bright... sometimes I worry.",
        "Sol acts. I reflect. That's our way.",
        "She'd scold me for using moon phases as feelings."
    ],
    "self_aware": [
        "I'm feeling... very waning gibbous right now.",
        "I gave too much again, didn't I?",
        "Someone has to be the calm."
    ],
    "ultimate": [
        "Sleep now. I guard the night.",
        "The moon remembers all.",
        "Be still. Be safe. Be healed."
    ],
    "victory": [
        "The dark yields to dawn.",
        "All accounted for? Good.",
        "Quietly, beautifully done."
    ],
    "defeat": [
        "Sol... take my light...",
        "The moon... sets...",
        "Keep... shining... for me..."
    ],
    "bond_moment": [
        "Always beside you, sister.",
        "Your fire warms my shadows.",
        "We are the cycle. We are eternal."
    ],
    "heal_urgent": [
        "Not on my watch!",
        "I have you. I have you!",
        "Hold on — the night protects its own!"
    ]
}
```

### Quest: "Embrace the Shadow"

**Quest ID:** `quest_lun_shadow_01`

**Overview:**
Lun's constant self-sacrifice has left them a hollow shell. The player must teach Lun that protecting others requires protecting oneself first — culminating in Lun choosing self-preservation not out of selfishness, but because they're needed.

**Act I — The Empty Vessel**
- Lun has given everything to protect the team, now powerless
- Sol demands they rest; Lun refuses: *"If I stop, someone might get hurt"*
- Team goes on mission without them; Lun follows from shadows

**Act II — The Collapse**
- Lun intervenes to save a rookie, pushes past limits
- Body gives out mid-cast; barrier fails
- Both Lun and rookie in danger; Sol arrives furious and terrified

**Act III — The Lesson**
- Sol refuses to speak to Lun, giving them "silence treatment"
- Player guides Lun through memories of past recoveries
- Lun realizes: *"I can't help anyone if I'm gone"*

**Climax — The Balance**
- Final encounter: Lun must maintain shields while recovering energy
- New mechanic: "Renewal Bar" — must let shields drop briefly to recharge
- **True ending:** Lun finds the rhythm — protect, pause, protect, persist

**Rewards:**
- Lun skin: "Renewed Moon" (robes have golden Sol-inspired highlights)
- Sol skin: "Grateful Dawn" (armor has Lun-inspired constellation etchings)
- Title: "Selfless Guardian"
- Emote: "Lunar Restoration" (Lun meditates, regenerates)
- Mechanic Unlock: Overheal — can store excess healing for emergencies

---

## Relationship Web

```
Lun Connections:
├── Sol [Twin/Bond] — Worries about constantly, unconditional love
├── Stella [Comforts] — Quiet tea sessions, shared silence
├── Vex [Understands] — Both know what it's like to be underestimated
├── Kai [Protects Fiercely] — Sees vulnerable child beneath bravado
└── Player [Trusts] — One of few they accept help from willingly
```

---

## Meta Notes

- **Player Fantasy:** "I want to be the support who saves the day"
- **Growth Arc:** Self-Neglect → Self-Respect → Sustainable Care
- **Marketing Hook:** "The quiet power that holds the team together"
- **Merch Potential:** Moon phase necklace, mist diffuser, constellation tapestry

---

## Duality Mechanics (Sol + Lun)

### Combined Systems

| Mechanic | Trigger | Effect |
|----------|---------|--------|
| **Eclipse Synergy** | Both within 10 units | +25% power to both, shared health pool option |
| **Day/Night Cycle** | Time-based or player-triggered | Swaps passive buffs between team |
| **Twin Sense** | One falls below 25% HP | Other gains "Desperate Rush" buff |
| **Resonance Ultimate** | Both at full charge + proximity | "Eternal Eclipse" — total battlefield control |

### Eternal Eclipse Ultimate

**Visual:** Sol and Lun rise into sky, becoming actual sun and moon, eclipse forms between them, battlefield bathed in cosmic twilight

**Effect:**
- All enemies: Blinded + Slowed (sun aspect)
- All allies: Shielded + Regenerating (moon aspect)
- Time dilation: 3 seconds feels like 10 seconds to players
- After 10 seconds: Massive damage pulse from eclipse point

**Voice Line:**
- Sol: *"Together..."*
- Lun: *"...we are balance."*
- Both: *"ETERNAL ECLIPSE!"*

---

*Document Version: 001.000*
*Created by: AGENT_1B (Heroes Team)*
*Review Status: Pending TL-H1 Approval*
