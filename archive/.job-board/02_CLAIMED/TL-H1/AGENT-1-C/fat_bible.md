[Ver001.000]

# Fat — The Reborn Flame

> *"I have died a thousand deaths. I have been reborn a thousand times. Each flame that consumes me only makes my next life burn brighter."*

---

## Identity Matrix

| Attribute | Definition |
|-----------|------------|
| **Archetype** | Reborn Flame / Eternal Fire Spirit |
| **Core Trait** | Passionate Resilience — No setback is permanent, no defeat is final; rises from every failure with renewed intensity |
| **Secondary Trait** | Infectious Enthusiasm — Their passion ignites others, turning doubt into determination and hesitation into action |
| **Quirk 1** | Leaves scorch marks on everything they touch — furniture, doorknobs, even digital screens somehow get warm |
| **Quirk 2** | Speaks in temperature metaphors when emotional ("That makes me absolutely boiling mad!" or "I'm feeling a bit lukewarm about this plan") |
| **Flaw** | Reckless Intensity — Sometimes burns too bright, too fast, exhausting themselves or endangering allies in their fervor |

## Origin Story

Fat is not a single life but a continuous cycle of death and rebirth. Their first incarnation is lost to time — perhaps a mortal who loved too fiercely, perhaps a spirit born of ancient volcanic fury, perhaps something else entirely. What matters is the pattern: burn, consume, die, return, burn brighter.

Each death teaches them. Each rebirth transforms them. They remember fragments of past lives — the warmth of a hearth they protected, the fury of a wildfire they became, the gentle glow of a candle lit for the grieving. These memories are not burdens but fuel, each experience adding to the eternal flame that is their soul.

Other beings fear death. Fat has embraced it as a partner, a teacher, a necessary step in the cycle of becoming. This doesn't make them reckless with their own life — they understand that each death means losing progress, memories fading like morning mist — but it does make them fearless. What is there to fear when you have already died a thousand times?

Their current incarnation emerged from the ashes of the Great Library Fire, a tragic blaze that destroyed centuries of knowledge but birthed something new: a spirit of fire determined to protect what matters, to burn away only that which must be purged, to light the way for others through their own darkness.

---

## Visual Identity

### Color Palette

| Element | Specification | Usage |
|---------|---------------|-------|
| **Primary** | `#FF4500` (Inferno Orange) | Core flames, body heat, primary attacks |
| **Secondary** | `#FFD700` (Phoenix Gold) | Rebirth effects, ultimate forms, glory moments |
| **Accent** | `#FF1493` (Rose Flame) | Inner fire, emotional intensity, healing warmth |
| **Core** | `#FFFFFF` (White-Hot Center) | Maximum power, critical hits, rebirth core |
| **Ember** | `#FF6347` (Tomato Red) | Dying flames, low health, passive embers |
| **Ash** | `#696969` (Dim Grey) | Death state, pre-rebirth, spent fuel |

### Visual Motifs

- **Phoenix Wings** — Massive wings of pure flame that manifest during intense moments, spreading wide to display power or wrapping protectively around allies
- **Ember Trails** — Constant falling sparks and cinders that follow Fat's movement, creating a path of fading fire
- **Rebirth Aura** — Circular flame patterns that appear on the ground during resurrection, ancient symbols of eternal return
- **Flame Hair** — Their "hair" is actually living fire, constantly shifting color from deep red at roots to brilliant gold at tips based on emotional state
- **Magma Veins** — Cracks in their "skin" that glow with inner heat, brightening when power builds

### Form Variations

| State | Visual Description |
|-------|-------------------|
| **Base Form** | Humanoid shape composed of contained flames, vaguely armored appearance with ember-like texture, wings folded |
| **Combat Form** | Wings fully extended, flames intensify to white-hot at extremities, magma veins pulse with power |
| **Rebirth Form** | Condensed into golden egg/ember sphere, surrounded by healing flames, invulnerable state |
| **Ultimate Form** | Full phoenix manifestation — massive bird of pure fire, radiates waves of heat distortion |
| **Ash Form** | Defeated state — crumbling grey silhouette with dying embers, preparing for rebirth |
| **Overdrive Form** | Flame color shifts to brilliant magenta and gold, size increases 50%, creates localized heat haze |

---

## Animation Personality

| State | Behavior | Duration | Easing |
|-------|----------|----------|--------|
| **Idle** | Gentle flame undulation, embers drift upward in lazy spiral, wings occasionally flutter, eyes pulse like coals breathing | 3s loop | ease-in-out |
| **Hover** | Heat intensifies, air shimmers, flames reach upward, wings spread slightly, ember trail accelerates | 0.3s | ease-out |
| **Active** | Explosive transition to combat stance, wings snap open with flame burst, magma veins brighten dramatically, battle cry | 0.4s | cubic-bezier(0.68, -0.55, 0.27, 1.55) |
| **Moving** | Leaves trail of fading flames, embers scatter behind, wings provide brief thrust (not true flight), footprints sizzle |
| **Fire Attack** | Arm extends with flame lance, projectile launches with trailing fire, impact creates blossom of embers | 0.5s | power2.out |
| **Rebirth (Death)** | Body collapses inward, flames dim to embers, form becomes ash statue, then golden light builds from within | 5s | multi-stage |
| **Rebirth (Return)** | Ash explodes outward, golden phoenix rises, flames restore rapidly, triumphant cry, full heal complete | 2s | elastic |
| **Flame Dash** | Body becomes pure flame stream, shoots forward, reforms at destination with fire burst, scorches ground path | 0.4s | exponential |
| **Defeated** | Final flame flickers, ash settles, ember eyes dim, stillness — but with faint pulse indicating rebirth countdown | 10s (respawn) | linear |
| **Celebrating** | Joyful flame burst upward, spins creating fire tornado, wings create arcs of golden sparks, triumphant laughter | 1.5s | spring |
| **Ultimate** | Full phoenix transformation, massive size increase, arena fills with golden light, heat distortion everywhere | 4s | power4.out |

### Particle Effects

- **Falling Embers** — Constant ambient particles that drift upward and fade
- **Heat Shimmer** — Distortion effect around Fat's body, intensifies with power
- **Flame Blossoms** — Impact explosions that scatter fire in petal-like patterns
- **Ash Particles** — Grey flecks during death/rebirth cycle, mixing with embers
- **Phoenix Feathers** — Golden flame shapes that appear during ultimate/rebirth
- **Scorch Marks** — Temporary terrain deformation where Fat walks or attacks

---

## Ability System — The Five Flames

### Ability 1: Fire Lance — "Solar Spear"

**Type:** Ranged Attack / Damage
**Cooldown:** 3 seconds
**Range:** 30 meters
**Damage:** High single-target + minor splash

**Description:**
Fat condenses their core flame into a searing lance of pure thermal energy and launches it at their target. The projectile leaves a trail of burning air and explodes on impact, sending smaller embers to nearby enemies.

**Mechanics:**
- Fast projectile speed (faster than average ranged attacks)
- Primary target takes full damage
- Enemies within 3 meters of impact take 30% splash damage
- Leaves "Burning Ground" for 3 seconds (minor damage over time to enemies standing in it)
- Every third consecutive hit applies "Ignite" (damage over time debuff)

**Visual:**
Fat pulls flame into their hand, forming a spinning spear of orange-white fire. On launch, the lance streaks forward leaving a heat-distorted trail. Impact creates flower-like flame burst with outward ripples of fire.

**Audio:**
Fire whoosh building to launch crackle, projectile hum, explosive impact with ember scatter sounds.

**Upgrade Path:**
- Level 2: Increased range (40 meters)
- Level 3: Pierce effect (hits up to 3 enemies in line)
- Level 4: Explosion radius increased (5 meters)
- Level 5: "Solar Detonation" — Ignite explosions chain to nearby enemies

---

### Ability 2: Rebirth Protocol — "Phoenix Renewal"

**Type:** Self-Heal / Second Chance
**Cooldown:** 60 seconds (resets on death)
**Trigger:** Manual activation OR automatic on fatal damage (if available)

**Description:**
Fat's core ability — the power that defines their existence. When activated (or triggered by fatal damage), Fat collapses into an egg of condensed golden flame. Over several seconds, they are completely healed and reborn in an explosion of restorative fire that also heals nearby allies.

**Mechanics:**
- Can be activated manually at any time (strategic timing)
- If not on cooldown, automatically triggers on "death" (cannot truly die during cooldown)
- During rebirth: Invulnerable, immobile, obvious visual indicator
- Duration: 5 seconds vulnerability, then full heal + resurrection
- On resurrection: Heals all allies within 15 meters for 40% of their max health
- Resurrection creates golden flame field for 5 seconds (allies regenerate health while standing in it)

**Visual:**
Fat collapses inward, flames condensing into golden egg shape covered in ancient fire symbols. Egg pulses with heartbeat rhythm. Explodes in golden pillar of flame, Fat emerges with wings fully extended in glory pose, healing fire spreads in circular wave.

**Audio:**
Flames being drawn inward (reverse fire sound), heartbeat pulse from egg, triumphant orchestral swell on resurrection, healing chimes for allies.

**Upgrade Path:**
- Level 2: Reduced cooldown (45 seconds)
- Level 3: Faster rebirth (3.5 seconds)
- Level 4: Ally heal increased to 60% max health
- Level 5: "Eternal Flame" — Can rebirth twice before cooldown (two charges)

---

### Ability 3: Flame Dash — "Combustion Leap"

**Type:** Mobility / Escape / Engagement
**Cooldown:** 8 seconds
**Range:** 20 meters
**Damage:** Moderate to enemies passed through

**Description:**
Fat transforms their body momentarily into pure flame, shooting forward in a blazing streak that damages enemies in their path and leaves burning ground behind. Upon reforming, they release a burst of fire that pushes nearby enemies back.

**Mechanics:**
- Instant direction selection (aimed)
- Intangible during dash (can pass through enemies and barriers)
- Enemies in path take damage and are "marked" with fire (take bonus damage from next attack)
- Upon arrival: Knockback burst (3 meters) and "Burning" debuff applied
- Leaves "Flame Trail" on ground for 4 seconds (damage over time zone)
- Can be used vertically (limited flight)

**Visual:**
Fat's body dissolves into horizontal column of fire, streaks forward at high speed, reforms with explosive flame burst. Ground shows scorched trail that continues to burn.

**Audio:**
Whoosh of ignition, rushing fire during dash, explosive reformation, sizzling trail.

**Upgrade Path:**
- Level 2: Increased range (30 meters)
- Level 3: Second charge (can dash twice rapidly)
- Level 4: Arrival explosion damage increased + stun added
- Level 5: "Inferno Path" — Flame trail follows Fat's movement for 3 seconds after dash

---

### Ability 4: Fire Nova — "Solar Flare"

**Type:** Area Damage / Crowd Control
**Cooldown:** 15 seconds
**Radius:** 12 meters
**Damage:** High to all enemies in radius

**Description:**
Fat releases a devastating explosion of flame in all directions, pushing enemies back and applying intense burning. The nova expands rapidly from Fat's position, creating a perfect circle of destruction.

**Mechanics:**
- Charge time: 1 second (vulnerable during charge)
- Expands from center at 20 meters/second
- Enemies hit take immediate damage + "Severe Burn" debuff (damage over time for 6 seconds)
- Knockback: 5 meters from center
- Destroys enemy projectiles in radius
- If used while below 25% health: Damage increased 50% (desperation bonus)

**Visual:**
Fat raises both arms, flames drawn inward to core, then explosive outward release creating perfect expanding ring of orange-white fire. Ground shows circular scorch pattern that fades over time.

**Audio:**
Fire being drawn in (reverse whoosh), charging hum, massive explosive release, crackling flames during burn debuff.

**Upgrade Path:**
- Level 2: Reduced charge time (0.6 seconds)
- Level 3: Larger radius (18 meters)
- Level 4: Pull effect before explosion (draws enemies in first)
- Level 5: "Supernova" — Leaves persistent burning zone for 8 seconds after explosion

---

### Ability 5: Phoenix Form — "Ascension of the Eternal Flame"

**Type:** Ultimate / Transformation
**Cooldown:** 120 seconds
**Duration:** 12 seconds

**Description:**
Fat unleashes their true form, transforming into a massive phoenix of pure golden flame. In this state, they gain flight, massively increased power, and the ability to rain destruction from above. The transformation is both beautiful and terrifying — a divine fire that cleanses all.

**Mechanics:**
- Transformation: Full heal to 100% health on activation
- Flight enabled: Full 3D movement for duration
- Damage output: +100% increase
- Damage taken: -50% reduction
- All attacks apply "Sacred Flame" (cannot be extinguished, burns until duration ends)
- Can use enhanced abilities while transformed:
  - **Fire Rain:** Rains firebolts in target area (hold to channel)
  - **Dive Bomb:** Crash to ground for massive area damage
  - **Wing Buffets:** Push enemies with wing beats (auto on movement)
- On expiration or manual cancel: Dive to ground creating final explosion, return to base form

**Visual:**
Fat's flames intensify to blinding white-gold, body expands and shifts into massive phoenix shape (10 meter wingspan), golden feathers of fire, eyes become suns, arena lighting shifts to golden hour glow. Movement leaves trails of sacred flame.

**Audio:**
Triumphant orchestral crescendo, phoenix cry (eagle scream mixed with fire roar), wing beats like thunder, fire rain sounds like hail, massive impact on final dive.

**Upgrade Path:**
- Level 2: Extended duration (16 seconds)
- Level 3: Allies gain +25% damage while Fat is transformed (inspiration aura)
- Level 4: Final dive explosion leaves permanent "Sacred Ground" (ally buff zone)
- Level 5: "True Immortal" — If killed while transformed, immediately rebirth with full duration remaining

---

## Web Component Specification

```typescript
// FatAvatar.tsx
interface FatAvatarProps {
  // Core State
  state: 'idle' | 'hover' | 'active' | 'moving' | 'attacking' | 
         'rebirth_egg' | 'rebirth_emerging' | 'dashing' | 'defeated' | 
         'celebrating' | 'ultimate' | 'ash';
  
  // Flame Metrics
  flameIntensity: number; // 0-100, affects color and particle density
  heatLevel: 'cool' | 'warm' | 'hot' | 'inferno' | 'supernova';
  rebirthCharges: number; // 0-2 based on upgrade level
  
  // Health & Status
  healthPercent: number;
  isRebirthing: boolean;
  rebirthProgress: number; // 0-100
  
  // Ultimate
  ultimateActive: boolean;
  ultimateTimeRemaining: number; // seconds
  
  // Interaction
  onActivate: () => void;
  onHover: () => void;
  onRebirthTrigger: () => void;
  onUltimateActivate: () => void;
  
  // Visual Customization
  size: 'sm' | 'md' | 'lg' | 'xl';
  showWings: boolean;
  showEmberTrails: boolean;
  showHeatShimmer: boolean;
  flameColorOverride?: {
    primary?: string;
    secondary?: string;
    core?: string;
  };
  
  // Accessibility
  alt: string;
  ariaLabel: string;
  
  // Animation Overrides
  animationSpeed?: number;
  flameFlickerRate?: number;
}

interface FatAvatarState {
  consecutiveHits: number; // For ignite mechanic
  isMarked: boolean; // Has dash mark for bonus damage
  burnStacks: number; // Stacked burn debuffs
  phoenixFormPosition: { x: number; y: number; z: number } | null;
}
```

### CSS Custom Properties

```css
:root {
  /* Core Palette */
  --fat-primary: #FF4500;
  --fat-secondary: #FFD700;
  --fat-accent: #FF1493;
  --fat-core: #FFFFFF;
  --fat-ember: #FF6347;
  --fat-ash: #696969;
  
  /* Effects */
  --fat-glow-orange: 0 0 30px #FF4500, 0 0 60px #FF450080;
  --fat-glow-gold: 0 0 40px #FFD700, 0 0 80px #FFD70060;
  --fat-glow-supernova: 0 0 60px #FFFFFF, 0 0 120px #FFD700, 0 0 180px #FF4500;
  
  /* Animations */
  --fat-flame-flicker: flame-dance 0.5s ease-in-out infinite alternate;
  --fat-ember-rise: ember-float 4s linear infinite;
  --fat-heat-shimmer: shimmer-distort 2s ease-in-out infinite;
  --fat-rebirth-pulse: phoenix-beat 1s ease-in-out infinite;
}
```

---

## Godot Engine Specification

### Sprite Sheet Requirements

| Animation | Frames | Size | FPS | Notes |
|-----------|--------|------|-----|-------|
| `idle_loop` | 12 | 128x128 | 12 | Breathing flames + ember rise |
| `hover_start` | 4 | 128x128 | 24 | Heat intensify + wing spread begin |
| `hover_loop` | 8 | 128x128 | 16 | Wings flutter + shimmer |
| `activate` | 6 | 192x192 | 30 | Battle stance + flame burst |
| `move_loop` | 8 | 128x128 | 16 | Movement + ember trail |
| `fire_lance_cast` | 6 | 192x192 | 24 | Spear formation + throw |
| `rebirth_death` | 12 | 128x128 | 10 | Collapse to ash + egg formation |
| `rebirth_egg_loop` | 4 | 96x96 | 8 | Pulsing egg |
| `rebirth_emerge` | 15 | 256x256 | 20 | Explosive resurrection |
| `flame_dash` | 8 | 256x128 | 30 | Horizontal flame streak |
| `nova_charge` | 8 | 192x192 | 16 | Arms raise + fire draw |
| `nova_explode` | 12 | 384x384 | 24 | Expanding ring |
| `ultimate_transform` | 24 | 512x512 | 30 | Full phoenix transformation |
| `ultimate_flight` | 16 | 512x256 | 16 | Phoenix flight cycle |
| `ultimate_dive` | 10 | 512x512 | 24 | Dive bomb impact |
| `hurt` | 4 | 128x128 | 20 | Flame dampen + recoil |
| `defeat` | 10 | 128x128 | 10 | Flames dying + ash settle |
| `celebrate` | 16 | 256x256 | 20 | Joy flame burst + spin |

### Shader Requirements

```glsl
// Fat's flame shader
shader_type canvas_item;

uniform float flame_intensity : hint_range(0.0, 1.0) = 0.8;
uniform float heat_distortion : hint_range(0.0, 1.0) = 0.3;
uniform vec4 flame_core : source_color = vec4(1.0, 1.0, 1.0, 1.0);
uniform vec4 flame_inner : source_color = vec4(1.0, 0.27, 0.0, 1.0);
uniform vec4 flame_outer : source_color = vec4(1.0, 0.84, 0.0, 1.0);
uniform sampler2D noise_texture;

void fragment() {
    vec2 uv = UV;
    
    // Heat distortion
    float noise = texture(noise_texture, uv * 5.0 + TIME * 2.0).r;
    uv.y -= noise * heat_distortion * 0.1;
    
    // Flame gradient based on Y position and noise
    float flame = 1.0 - uv.y;
    flame += noise * 0.3;
    flame *= flame_intensity;
    
    // Color mixing based on flame intensity
    vec4 color = mix(flame_outer, flame_inner, flame);
    color = mix(color, flame_core, pow(flame, 3.0));
    
    COLOR = color * texture(TEXTURE, uv);
}
```

### Audio Clips

| Type | Filename | Description |
|------|----------|-------------|
| Select | `fat_select_01.wav` | *"Ready to burn bright!"* |
| Select | `fat_select_02.wav` | Warm crackling + satisfied hum |
| Move | `fat_move_01.wav` | Fire whoosh + ember scatter |
| Fire Lance | `fat_lance_01.wav` | *"Feel the heat!"* + throw |
| Rebirth Death | `fat_rebirth_death_01.wav` | Flames drawing inward |
| Rebirth Live | `fat_rebirth_live_01.wav` | *"From ash... I RISE!"* |
| Flame Dash | `fat_dash_01.wav` | Ignition + streak + reform |
| Fire Nova | `fat_nova_01.wav` | Charge + *"BURN!"* + explode |
| Ultimate | `fat_ultimate_01.wav` | Phoenix cry + orchestral |
| Hit | `fat_hit_01.wav` | Flame sputter + pain grunt |
| Victory | `fat_victory_01.wav` | *"Another life, another victory!"* |
| Defeat | `fat_defeat_01.wav` | Dying flames + *"I'll... return..."* |

### Dialogue Script (20+ Lines)

```gdscript
# fat_dialogue.gd
const DIALOGUE = {
    "greeting": [
        "Ready to burn bright!",
        "Another day, another chance to shine!",
        "I can feel the fire rising already!",
        "Hey there! Let's turn up the heat!"
    ],
    "battle_start": [
        "Time to turn up the heat!",
        "They think they can handle the fire? Cute.",
        "I'll burn through them like dry tinder!",
        "Get ready to feel the burn!"
    ],
    "temperature_quirks": [
        "That makes me absolutely boiling mad!",
        "I'm feeling a bit lukewarm about this plan...",
        "You're ice cold with those insults!",
        "Things are heating up nicely!",
        "That's a scorching take!"
    ],
    "rebirth": [
        "From ash... I RISE!",
        "Death is just... a warm-up!",
        "You can't extinguish what's eternal!",
        "Ouch! But I've felt worse!"
    ],
    "encourage": [
        "Burn bright, my friend!",
        "You've got fire in your soul—I can see it!",
        "Don't let your flame go out!",
        "Together, we'll be an inferno!"
    ],
    "ultimate": [
        "Behold the TRUE flame!",
        "I am reborn in GLORY!",
        "Phoenix... ASCEND!",
        "BASK IN MY INFERNO!"
    ],
    "victory": [
        "Another life, another victory!",
        "We burned brighter than them!",
        "Phoenixes rise, and so do winners!",
        "That was absolutely FIRE!"
    ],
    "defeat": [
        "I'll... return... stronger...",
        "My flame... flickers... but never... dies...",
        "See you... in the next life...",
        "This isn't... the end..."
    ],
    "bond_moment": [
        "You've kept my flame burning when I wanted to go out.",
        "Friendship is the fuel that makes my fire eternal.",
        "I'd die a thousand deaths for you. And I probably will!",
        "You warm my heart—and that's saying something!"
    ]
}
```

---

## Quest: "The Cooled Heart"

**Quest ID:** `quest_fat_cool_01`

**Overview:**
Fat's intensity has become dangerous — they're burning out allies in their fervor to win. The player must help them learn that true strength comes from controlled fire, not wild conflagration.

**Act I — The Wildfire**
- Mission goes wrong: Fat's overzealous attack destroys cover, endangers team
- Allies express concern; Fat dismisses it ("We won, didn't we?")
- Player witnesses the emotional cost of Fat's recklessness

**Act II — The Dimming**
- Fat pushes too hard, enters battle unable to rebirth (cooldown)
- Nearly dies permanently; saved by team sacrifice
- Forced vulnerability: Fat must rely on others for protection

**Act III — The Controlled Burn**
- Player guides Fat through precision challenges requiring restraint
- Learn to modulate intensity: when to blaze, when to bank the fire
- New understanding: controlled fire lasts longer, burns truer

**Climax — The Hearth Guardian**
- Final battle: Fat must choose between glorious sacrifice or sustainable support
- **Player choice:** Guide Fat to protect and sustain rather than burn out
- Fat discovers new form: "Hearth Flame" — warm, protective, enduring

**Rewards:**
- Fat skin: "Hearth Guardian" (softer orange, steady glow, no wild flickering)
- Title: "The Controlled Burn"
- Emote: "Warmth Share" (gentle flame that heals nearby allies slightly)
- Mechanic Unlock: "Sustainable Fire" — abilities cost less when used with tactical timing

---

## Relationship Web

```
Fat Connections:
├── Sol [Respects Intensity] — Kindred spirits of passion, friendly rivalry
├── Lun [Comforts) — Helps Fat find calm when flames burn too wild
├── Bin [Fascinates] — Can't compute biological fire; endless questions
├── Uni [Inspires] — Fat would die (and has) protecting Uni's hope
├── Glitch [Hates] — Corruption is the only fire Fat wants to extinguish
├── Void [Fears] — The only thing that could truly end their rebirth cycle
└── Player [Grows With] — Learns sustainable intensity through partnership
```

---

## Meta Notes

- **Player Fantasy:** "I want to be unstoppable, to never truly die"
- **Growth Arc:** Reckless Intensity → Controlled Power → Sustainable Strength
- **Marketing Hook:** "The immortal phoenix who learned when not to burn"
- **Merch Potential:** LED flame accessories, phoenix wing cosplay, heat-changing mugs
- **Esports Connection:** Appeals to aggressive players, clutch performers, comeback lovers
- **Balance Note:** Rebirth mechanic must feel powerful but have clear counterplay (egg vulnerability)

---

*Document Version: 001.000*
*Created by: AGENT_1C (Heroes Team)*
*Review Status: Pending TL-H1 Approval*
