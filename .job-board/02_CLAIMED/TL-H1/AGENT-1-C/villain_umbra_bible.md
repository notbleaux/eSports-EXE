[Ver001.000]

# Umbra — The Shadow Lord

> *"They cast light upon the world, blinding themselves to what lurks in the dark. I am that darkness. I am the shadow that gives their light meaning. I am inevitable."*

---

## Identity Matrix

| Attribute | Definition |
|-----------|------------|
| **Archetype** | Shadow Incarnate / Darkness Given Will |
| **Core Trait** | Patient Malevolence — Unlike chaotic villains, Umbra is calm, methodical, willing to wait centuries for the perfect moment to strike |
| **Secondary Trait** | Corruptive Influence — Their presence alone causes shadows to lengthen, hope to dim, and doubt to take root in even the purest hearts |
| **Quirk 1** | Speaks in whispers that seem to come from everywhere at once; their voice carries even in perfect silence |
| **Quirk 2** | Never appears fully in light — always partially obscured by shadow, even in direct sunlight |
| **Flaw** | Arrogance of the Dark — Believes light is temporary and darkness eternal, underestimates the resilience of hope |

## Origin Story

Before there was Umbra, there was only the space between stars — the primordial dark that existed before creation. When the first light dawned, it cast the first shadow, and in that contrast, Umbra was born. They are not merely darkness but the ANTI-LIGHT, the necessary counterweight that makes illumination meaningful.

For eons, Umbra existed in balance with the light. The day belonged to the sun, the night to the shadows, and neither could exist without the other. But then came the heroes — Sol and Lun, the twin flames who sought to banish darkness entirely. In their zeal to spread light to every corner, they created something new: a shadow that resented its nature, that refused to be merely the absence of light.

Umbra became self-aware in their rage. If light would not share the world, then darkness would consume it. They gathered all the shadows cast aside by the heroes' brightness, gave them purpose, gave them will. The Shadow Legion was born.

Their goal is not merely to defeat the heroes but to prove a terrible truth: that light is temporary, fragile, dependent on fuel and circumstance, while darkness is eternal, patient, and ultimately victorious. Every star dies. Every sun exhausts itself. But the void remains, waiting.

They are the philosophical opposite of Sol and Lun — where the twins represent hope and duality, Umbra represents inevitability and singularity. They do not hate the heroes; they pity them for believing in something as temporary as light.

---

## Visual Identity

### Color Palette

| Element | Specification | Usage |
|---------|---------------|-------|
| **Primary** | `#0D0D1A` (Void Black) | Main form, deepest shadows, true absence |
| **Secondary** | `#1A0A2E` (Dark Purple) | Shadow edges, corrupted magic, aura |
| **Accent** | `#4B0082` (Indigo Corruption) | Active abilities, shadow tendrils, eye glow |
| **Eyes** | `#800080` (Deep Violet) | Piercing gaze, only visible feature in darkness |
| **Terror** | `#DC143C` (Crimson Warning) | Rare moments of rage, blood association |
| **Trace** | `#2F2F4F` (Shadow Blue) | Movement trails, dimensional rifts |

### Visual Motifs

- **Living Shadow** — Umbra's form is not solid but composed of absolute darkness that constantly shifts and flows like liquid night
- **Tendrils of Night** — Shadowy appendages that extend from their form, grasping, probing, reaching toward light to extinguish it
- **Crown of Eclipses** — A halo of orbiting shadow spheres that block light like miniature black holes
- **Absorption Aura** — The area around Umbra is darker than physics should allow; light seems to die before reaching them
- **Face of Whispers** — Their face is never clearly seen, but sometimes, in the darkness, a suggestion of terrible beauty emerges

### Form Variations

| State | Visual Description |
|-------|-------------------|
| **Base Form** | Tall humanoid silhouette of absolute black, indigo eyes the only visible feature, shadow tendrils drifting at edges |
| **Combat Form** | Shadow mass expands, tendrils become numerous and aggressive, crown of eclipses intensifies, aura of darkness spreads |
| **Shadow Step Form** | Body dissolves into two-dimensional shadow on ground, moves at impossible speed, reforms with violent burst |
| **Ultimate Form** | "The Eclipse Made Flesh" — area becomes total darkness, Umbra becomes massive, swallows light sources, true horror manifestation |
| **Weakened Form** | In bright light, form becomes semi-transparent, tendrils retract, eyes dim, first sign of fear |
| **Corrupting Form** | Touching another being, shadow spreads into them like infection, visible veins of darkness |

---

## Animation Personality

| State | Behavior | Duration | Easing |
|-------|----------|----------|--------|
| **Idle** | Slow, breathing-like expansion and contraction of shadow mass, tendrils drift lazily, eyes pulse with slow rhythm, total silence | 6s loop | linear |
| **Hover** | Shadow density increases, form lifts slightly, tendrils reach upward testing the air, whispering intensifies | 0.5s | ease-out |
| **Active** | Explosive expansion, tendrils snap outward, eyes blaze violet, shadow aura triples in size, predatory stance | 0.4s | power4.out |
| **Moving** | Slides as if on ice, leaves trail of dying light, shadow pools where feet touch, tends to move along walls/ceilings |
| **Shadow Strike** | Form flattens to 2D, shoots forward at high speed, reforms at target with violent tendril impalement | 0.6s | exponential |
| **Darkness Cast** | Tendrils extend to surround area, darkness flows from them like liquid, light sources flicker and die | 1s (channel) | ease-in |
| **Corruption Touch** | Hand extends, shadow extends from fingertips into target, visible veins of darkness spread, target's eyes mirror Umbra's violet | 2s (channel) | linear |
| **Defeated** | Form destabilizes, tendrils retract frantically, light breaks through cracks, screams that are felt not heard, dissolves into dissipating smoke | 4s | ease-in |
| **Victory** | Shadow expands to fill space, all light extinguished, triumphant silence, suggestion of terrible smile in darkness | 3s | power4.out |
| **Ultimate** | "Eclipse Unending" — becomes massive, arena becomes total darkness, only eyes visible, true terror form | 5s | slow-linear |

### Particle Effects

- **Shadow Mist** — Constant emission of dark fog that spreads and fades
- **Light Death** — Visual effect of light sources flickering and dying near Umbra
- **Tendril Trails** — Shadowy streaks following tendril movements
- **Whisper Echoes** — Visual distortion suggesting sound without audio
- **Corruption Veins** — Lines of darkness that spread through corrupted targets
- **Eclipse Orbs** — Black spheres that orbit and absorb light

---

## Ability System — The Five Shadows

### Ability 1: Shadow Strike — "Lunge of the Void"

**Type:** Gap Close / Burst Damage
**Cooldown:** 8 seconds
**Range:** 25 meters
**Damage:** High single-target + moderate area

**Description:**
Umbra compresses their form into two-dimensional shadow, sliding across surfaces at impossible speed before reforming at their target and impaling them with violent shadow tendrils. This is their primary engagement tool — the darkness reaching out to claim the light.

**Mechanics:**
- Umbra becomes untargetable during slide (0.5 seconds)
- Slides along most direct path to target (can pass through obstacles if shadow can reach)
- Reform creates burst of shadow dealing damage to target and nearby enemies
- Applies "Marked by Darkness" debuff: Target takes 20% increased damage from Umbra for 6 seconds
- If target is killed by Shadow Strike: Umbra instantly resets cooldown (chain potential)
- Creates "Shadow Anchor" at departure point — can teleport back within 3 seconds

**Visual:**
Umbra's form flattens into ground shadow, streaks forward as fast-moving silhouette, reforms with explosive shadow burst, multiple tendrils impale target from all directions.

**Audio:**
Whisper crescendo, rushing shadow sound, wet impact of impalement, victim's scream echoes.

**Upgrade Path:**
- Level 2: Increased range (35 meters)
- Level 3: Reform explosion radius increased, applies slow to nearby enemies
- Level 4: "Shadow Anchor" duration increased to 5 seconds, grants brief invulnerability on return
- Level 5: "Chains of Darkness" — Can chain to second target if first is killed (up to 3 chains)

---

### Ability 2: Darkness — "Eclipse Zone"

**Type:** Area Denial / Debuff
**Cooldown:** 15 seconds
**Duration:** 10 seconds
**Radius:** 12 meters

**Description:**
Umbra extends their essence to create a zone of absolute darkness where light cannot exist. Within this field, enemies are blinded, weakened, and slowly consumed by the shadows. It is a piece of Umbra's true domain brought into the physical world.

**Mechanics:**
- Targeted area becomes pitch black (affected enemies have vision reduced to 3 meters)
- Enemies inside zone:
  - Take damage over time (shadow consumption)
  - Have reduced accuracy (can't see targets clearly)
  - Movement speed reduced by 30%
  - Cannot use targeted abilities requiring vision
- Light-based abilities (from heroes like Sol) are 50% less effective inside zone
- Umbra gains +30% damage while inside their own darkness
- Zone persists even if Umbra leaves it

**Visual:**
Tendrils extend from Umbra in all directions, darkness flows from them like black liquid filling the area, affected enemies show visible shadow corruption, light sources inside zone are extinguished.

**Audio:**
Whispers intensify, sound of dying light (reverse brightness), consuming shadows (wet sounds), victim disorientation.

**Upgrade Path:**
- Level 2: Increased radius (18 meters)
- Level 3: Extended duration (14 seconds)
- Level 4: Enemies inside have healing reduced by 50%
- Level 5: "Total Eclipse" — Zone becomes absolute; enemies are completely blind (UI disabled) for first 3 seconds

---

### Ability 3: Shadow Binding — "Chains of Despair"

**Type:** Crowd Control / Setup
**Cooldown:** 12 seconds
**Duration:** 4 seconds root
**Range:** 20 meters

**Description:**
Umbra manifests solid chains of pure shadow that erupt from the ground to bind their target in place. These chains not only immobilize but also drain hope, applying a stacking debuff that makes the victim more vulnerable with each passing moment.

**Mechanics:**
- Targeted enemy is rooted (cannot move) for 4 seconds
- While bound:
  - Target takes increasing damage over time (starts low, doubles each second)
  - Target's damage output reduced by 30%
  - Target cannot use mobility abilities
- Chains can be destroyed by allies (500 HP) or by the bound victim (after 2 seconds, can attack chains)
- If chains last full duration: Target takes massive burst damage and is slowed for 3 seconds
- Umbra gains health equal to 50% of damage dealt by chains

**Visual:**
Shadow chains erupt from ground around target, wrap tightly binding arms and legs, chains pulse with indigo light as they drain victim, victim shows visible struggle.

**Audio:**
Chain clanking, shadow solidifying sound, victim struggle sounds, draining hum, final burst impact.

**Upgrade Path:**
- Level 2: Increased chain health (750 HP) — harder to break
- Level 3: Extended duration (5.5 seconds)
- Level 4: Affects up to 2 nearby enemies (secondary chains at 50% strength)
- Level 5: "Hopeless Binding" — Bound target cannot be healed by allies

---

### Ability 4: Corruption Touch — "Taint of the Void"

**Type:** Damage Over Time / Anti-Healing
**Cooldown:** 10 seconds
**Duration:** 8 seconds
**Range:** Melee (5 meters)

**Description:**
Umbra makes direct physical contact, channeling pure shadow essence into their victim. This corruption spreads through the target like a dark infection, consuming them from within and making healing efforts actively harmful.

**Mechanics:**
- Melee range ability requiring brief channel (0.8 seconds)
- Applies "Void Corruption" debuff for 8 seconds:
  - Damage over time (significant)
  - All healing received converted to damage (healing becomes harmful)
  - Target's vision slowly darkens at edges (screen effect)
  - On expiration: Burst damage to target and minor splash to nearby allies
- If target dies while corrupted: Explodes dealing damage to nearby allies and creates temporary shadow minion
- Umbra can have up to 3 targets corrupted simultaneously

**Visual:**
Umbra's hand extends shadow directly into target's chest, visible veins of darkness spread through target's body, target's eyes turn violet, dark aura surrounds them.

**Audio:**
Shadow channeling sound, victim's pained gasp, heartbeat slowing, corruption spreading (organic squelch), explosion on death.

**Upgrade Path:**
- Level 2: Extended duration (11 seconds)
- Level 3: Can corrupt up to 5 targets simultaneously
- Level 4: Death explosion creates shadow minion that fights for Umbra (10 seconds)
- Level 5: "Absolute Corruption" — Corruption cannot be cleansed, must run full duration

---

### Ability 5: Ultimate — "Eclipse Unending"

**Type:** Ultimate / Transformation / Arena Control
**Cooldown:** 150 seconds
**Duration:** 12 seconds

**Description:**
Umbra reveals their true nature, transforming into a massive manifestation of primordial darkness. In this form, they become nearly unstoppable — a living eclipse that consumes all light, hope, and life in their domain. This is what Umbra truly is: not a being of shadow, but shadow itself given terrible purpose.

**Mechanics:**
- Transformation: Umbra grows to 3x normal size, arena lighting dims by 80%
- All enemies within 30 meters are affected:
  - Movement speed reduced by 50%
  - Damage output reduced by 40%
  - Cannot use ultimate abilities
  - Vision reduced to 5 meters
- Umbra gains following bonuses:
  - +100% damage output
  - +50% damage reduction
  - All abilities have no cooldown
  - Health regeneration (+5% max health per second)
- New ultimate-only ability: "Shadow Nova" — massive explosion of darkness dealing massive damage
- On expiration: All enemies in radius take damage based on time spent in darkness
- If Umbra kills 3+ enemies during ultimate: Ultimate duration extends by 5 seconds

**Visual:**
Umbra's form expands massively, becoming more shadow than shape, crown of eclipses becomes blinding black hole array, arena becomes almost completely dark with only enemy silhouettes and Umbra's violet eyes visible, reality seems to warp toward them.

**Audio:**
Deep bass building to impossible volume, whispers become overwhelming choir, sound of stars dying, heartbeat of the void, silence after explosion.

**Upgrade Path:**
- Level 2: Extended duration (16 seconds)
- Level 3: Increased radius (40 meters)
- Level 4: Enemies inside cannot use ANY abilities (total lockdown)
- Level 5: "Forever Night" — After ultimate ends, zone remains as permanent darkness for 30 seconds

---

## Web Component Specification

```typescript
// UmbraAvatar.tsx
interface UmbraAvatarProps {
  // Core State
  state: 'idle' | 'hover' | 'active' | 'moving' | 'striking' | 
         'darkness_cast' | 'binding' | 'corrupting' | 'defeated' | 
         'victory' | 'ultimate';
  
  // Shadow Metrics
  darknessLevel: number; // 0-100, affects aura size
  tendrilCount: number; // 3-12 based on state
  corruptionStacks: number; // Active corruptions
  
  // Ability States
  isIntangible: boolean; // During shadow strike
  darknessZones: Array<{ x: number; y: number; radius: number }>;
  boundTargets: string[];
  corruptedTargets: string[];
  
  // Ultimate
  ultimateActive: boolean;
  ultimateTimeRemaining: number;
  killsDuringUltimate: number;
  
  // Interaction
  onActivate: () => void;
  onHover: () => void;
  onShadowStrike: () => void;
  onUltimateActivate: () => void;
  
  // Visual Customization
  size: 'sm' | 'md' | 'lg' | 'xl';
  showTendrils: boolean;
  showDarknessAura: boolean;
  showEclipseCrown: boolean;
  darknessIntensity: number; // 0.0 - 1.0
  
  // Accessibility
  alt: string;
  ariaLabel: string;
  
  // Animation Overrides
  animationSpeed?: number;
  whisperIntensity?: number;
}

interface UmbraAvatarState {
  shadowAnchorPosition: { x: number; y: number } | null;
  canReturnToAnchor: boolean;
  currentZoneCount: number;
  totalCorruptionDamage: number;
}
```

### CSS Custom Properties

```css
:root {
  /* Core Palette */
  --umbra-primary: #0D0D1A;
  --umbra-secondary: #1A0A2E;
  --umbra-accent: #4B0082;
  --umbra-eyes: #800080;
  --umbra-terror: #DC143C;
  --umbra-trace: #2F2F4F;
  
  /* Effects */
  --umbra-glow: 0 0 30px #1A0A2E, 0 0 60px #0D0D1A;
  --umbra-eyes-glow: 0 0 20px #800080, 0 0 40px #80008080;
  --umbra-ultimate: 0 0 80px #0D0D1A, 0 0 160px #1A0A2E, inset 0 0 100px #000000;
  
  /* Animations */
  --umbra-breath: shadow-pulse 6s linear infinite;
  --umbra-tendril-drift: tendril-float 4s ease-in-out infinite alternate;
  --umbra-whisper: text-blur 0.5s ease-in-out infinite;
  --umbra-darkness-spread: void-expand 1s ease-out;
}
```

---

## Godot Engine Specification

### Sprite Sheet Requirements

| Animation | Frames | Size | FPS | Notes |
|-----------|--------|------|-----|-------|
| `idle_loop` | 20 | 128x128 | 8 | Breathing shadow + tendril drift |
| `hover_start` | 6 | 128x128 | 20 | Density increase + tendril reach |
| `active` | 8 | 192x192 | 24 | Explosive expansion + predatory |
| `move_loop` | 10 | 128x128 | 16 | Shadow sliding + trail |
| `shadow_strike` | 12 | 256x256 | 30 | 2D slide + reform + impale |
| `darkness_cast` | 15 | 256x256 | 20 | Tendril extend + zone fill |
| `binding_cast` | 10 | 256x256 | 24 | Chain eruption + wrap |
| `binding_loop` | 8 | 128x128 | 12 | Chains maintained |
| `corruption_cast` | 12 | 192x192 | 20 | Hand extend + shadow channel |
| `corruption_loop` | 6 | 128x128 | 8 | Corruption maintained |
| `ultimate_transform` | 30 | 512x512 | 24 | Massive expansion + eclipse |
| `ultimate_loop` | 12 | 512x512 | 12 | Massive form maintained |
| `ultimate_nova` | 15 | 512x512 | 30 | Shadow nova explosion |
| `hurt` | 5 | 128x128 | 16 | Form destabilize + light break |
| `defeat` | 20 | 256x256 | 12 | Dissolution + smoke |
| `victory` | 16 | 256x256 | 16 | Expansion + darkness fill |

### Audio Clips

| Type | Filename | Description |
|------|----------|-------------|
| Select | `umbra_select_01.wav` | *"The shadows welcome you."* (whisper) |
| Move | `umbra_move_01.wav` | Shadow sliding + whisper trail |
| Shadow Strike | `umbra_strike_01.wav` | Rush + impale + wet impact |
| Darkness | `umbra_darkness_01.wav` | *"Embrace... the void."* + zone creation |
| Binding | `umbra_binding_01.wav` | Chain eruption + struggle |
| Corruption | `umbra_corrupt_01.wav` | Channeling + infection |
| Ultimate | `umbra_ultimate_01.wav` | *"ECLIPSE... UNENDING!"* + bass drop |
| Hit | `umbra_hit_01.wav` | Form destabilize + pain whisper |
| Victory | `umbra_victory_01.wav` | Satisfied silence + expansion |
| Defeat | `umbra_defeat_01.wav` | Dissolution scream (felt, not heard) |

### Dialogue Script (15+ Lines)

```gdscript
# umbra_dialogue.gd
const DIALOGUE = {
    "greeting": [
        "The shadows welcome you.",
        "Light cannot reach where I dwell.",
        "I am what remains when hope dies.",
        "Your light... amuses me."
    ],
    "battle_start": [
        "I will teach you the meaning of darkness.",
        "Your light flickers. My shadow is eternal.",
        "Every sun must set. Every flame must die.",
        "Come, little lights. Let me extinguish you."
    ],
    "shadow_strike": [
        "From shadow!",
        "I am already here!",
        "You cannot outrun darkness!",
        "The void claims you!"
    ],
    "taunt_sol": [
        "Your sun will set, little light-bringer.",
        "How bright you burn... how quickly you exhaust.",
        "Even stars die. You are merely a candle.",
        "Your pride blinds you more than your light."
    ],
    "taunt_lun": [
        "Your shadows are borrowed. Mine are real.",
        "You reflect light. I consume it.",
        "Even the moon has a dark side... I am that side."
    ],
    "ultimate": [
        "ECLIPSE... UNENDING!",
        "Behold the true face of night!",
        "Light DIES HERE!",
        "I am the VOID!"
    ],
    "victory": [
        "As it was. As it will always be.",
        "Darkness... prevails...",
        "Your light was temporary. My shadow is forever.",
        "Rest now... in eternal night."
    ],
    "defeat": [
        "Impossible... darkness... cannot... die...",
        "The light... will fade... I will... return...",
        "This is... but... a shadow...",
        "Eternal... night... delayed... not... denied..."
    ]
}
```

---

## Quest: "The Last Candle"

**Quest ID:** `quest_umbra_candle_01`

**Overview:**
Umbra has consumed all light in a village, leaving the people in darkness and despair. The player must guide a single child who refuses to let their candle die, proving that hope is stronger than darkness.

**Act I — The Consumption**
- Village plunged into unnatural darkness
- Umbra claims another victory for the void
- Player discovers single light still burning — a child's candle

**Act II — The March**
- Player protects child carrying candle through Umbra's domain
- Umbra taunts, offers easy surrender to darkness
- Child's hope never wavers: "Light always comes back."

**Act III — The Dawn**
- Reach village center at darkest hour
- Umbra confronts directly, attempts to extinguish candle
- **Player choice:** Shield candle with body, proving light worth protecting

**Climax — The First Ray**
- As candle nearly dies, true dawn breaks (Umbra's power limited by time)
- Umbra forced to retreat, but promises return
- Village learns: Darkness is powerful, but light is patient too

**Rewards:**
- Cosmetic: "Candle Bearer" title
- Lore unlock: Umbra's origin story
- Village becomes repeatable defense mission

---

## Relationship Web

```
Umbra Connections:
├── Sol [Despises/Pities] — The brightest light casts the darkest shadow
├── Lun [Sees as Failed Shadow] — Could have been kin, chose reflection instead
├── Bin [Respects] — Binary opposites: 1s and 0s, light and dark
├── Fat [Frustrated By] — Cannot truly kill what perpetually returns
├── Uni [Wants to Corrupt] — Pure light would make the sweetest shadow
├── Glitch [Tolerates] — Chaos serves darkness, but unpredictably
├── Void [Serves/Fears] — The ultimate darkness even Umbra dreads
└── Player [Obsessed With] — Seeks to prove inevitability of darkness
```

---

## Meta Notes

- **Narrative Role:** Primary antagonist for Sol/Lun arc, embodiment of depression/despair
- **Fighting Style:** Hit-and-run assassin with area denial, rewards patience
- **Counterplay:** Bright light abilities reduce Umbra's power, keep moving to avoid bindings
- **Marketing Hook:** "The shadow that proves the light"
- **Merch Potential:** Black crystal items, eclipse-themed accessories, shadowy aesthetic
- **Accessibility Note:** Very dark visuals — high contrast mode recommended

---

*Document Version: 001.000*
*Created by: AGENT_1C (Heroes Team)*
*Review Status: Pending TL-H1 Approval*
