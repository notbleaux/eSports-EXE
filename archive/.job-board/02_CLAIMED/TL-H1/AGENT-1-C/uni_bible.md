[Ver001.000]

# Uni — The Starlight Unicorn

> *"In the darkest night, I am the first star. In the deepest despair, I am the hope that refuses to fade. I am the purity that evil cannot touch, the magic that logic cannot explain."*

---

## Identity Matrix

| Attribute | Definition |
|-----------|------------|
| **Archetype** | Cosmic Guardian / Purity Incarnate |
| **Core Trait** | Unwavering Hope — Believes in the good of all things, sees potential for redemption even in darkness, never gives up on anyone |
| **Secondary Trait** | Gentle Strength — Power that comes not from force but from conviction, the quiet certainty of one who knows their purpose |
| **Quirk 1** | Leaves trails of glittering star-dust wherever they walk, which fades slowly leaving a momentary map of their path |
| **Quirk 2** | Their horn glows different colors based on emotional state — soft blue for calm, golden for joy, silver for concern, white for determination |
| **Flaw** | Naive Optimism — Sometimes believes too strongly in the good of others, vulnerable to betrayal and manipulation |

## Origin Story

Uni was born not from a world but from a wish — the collective hope of a billion souls looking up at the night sky and asking for something pure, something good, something magical to believe in. Where other beings evolved or were created, Uni simply... came to be, coalesced from starlight and innocence and the oldest magic in the universe.

They are the last of the Starlight Unicorns, celestial beings tasked with guarding the boundaries between light and dark, hope and despair, purity and corruption. Their kind once numbered in the thousands, a radiant host that traveled the cosmos bringing miracles to worlds in need. But the ancient war against the Void claimed most of them, and now Uni carries alone the burden their kind once shared.

Despite this tragedy — or perhaps because of it — Uni's spirit remains unbroken. They have seen the worst the universe can offer: worlds consumed by darkness, civilizations fallen to despair, friends lost to corruption. And still they believe. Still they hope. Still they fight.

Their connection to the team is more than alliance — it is family. Uni sees in each hero something precious worth protecting, and in return offers them the unconditional love and support that only a creature of pure magic can provide. They are the heart of the team, the one who remembers birthdays, who notices when someone is hurting, who believes in everyone even when they don't believe in themselves.

---

## Visual Identity

### Color Palette

| Element | Specification | Usage |
|---------|---------------|-------|
| **Primary** | `#E0B0FF` (Mauve/Soft Violet) | Main body, ethereal glow, base aura |
| **Secondary** | `#C8A2C8` (Lilac) | Secondary gradients, mane highlights, soft edges |
| **Accent** | `#FFB6C1` (Light Pink) | Emotional warmth, healing effects, heart motifs |
| **Horn** | `#F0F8FF` (Alice Blue → #FFD700 Gold) | Horn glow, shifts with emotional state |
| **Mane/Tail** | Rainbow Nebula | Cosmic gradients flowing through all spectral colors |
| **Hooves** | `#4B0082` (Indigo) | Ground contact points, star-step effects |
| **Sparkle** | `#FFFFFF` (Pure White) | Star particles, magic effects, high-intensity moments |

### Visual Motifs

- **Spiral Horn** — The classic unicorn horn, but formed of crystallized starlight, constantly emitting soft rays of colored light based on emotion
- **Nebula Mane** — Their mane and tail are not hair but living cosmic clouds, constantly shifting through rainbow nebula patterns with stars visible within
- **Star-Dust Trails** — Each step leaves fading footprints of sparkling particles that map their recent movement
- **Constellation Markings** — Subtle patterns on their coat showing various constellations, which subtly shift to match the night sky of whatever world they're on
- **Halo of Hope** — A faint ring of light that appears above their head during healing or protective abilities
- **Rainbow Bridge** — When using teleportation, they create prismatic pathways through space

### Form Variations

| State | Visual Description |
|-------|-------------------|
| **Base Form** | Elegant quadruped unicorn with soft violet-white coat, flowing nebula mane, spiral horn of starlight, gentle expressive eyes |
| **Healing Form** | Horn glows brilliant white-gold, surrounded by orbiting healing orbs, halo intensifies, star-dust forms protective spirals |
| **Combat Form** | Horn becomes weapon of pure light, mane streams backward like comet trails, eyes glow with fierce determination, battle aura manifests |
| **Teleport Form** | Body becomes prismatic light, dissolves into rainbow spectrum, travels through created light bridge, reforms with star burst |
| **Ultimate Form** | Full celestial manifestation — twice normal size, wings of pure light manifest, surrounded by orbiting planets and stars, reality seems to brighten |
| **Vulnerable Form** | When betrayed or hurt emotionally, colors dim, horn glow fades to grey, star-dust stops falling, pure sadness visual |

---

## Animation Personality

| State | Behavior | Duration | Easing |
|-------|----------|----------|--------|
| **Idle** | Gentle breathing, mane flows in ethereal wind, horn pulses softly with inner light, occasional hoof stamp creating star spark, tail sways gracefully | 5s loop | ease-in-out |
| **Hover** | Graceful levitation (unicorns don't touch ground unless they choose to), mane floats upward, star-dust swirls around form, horn brightens | 0.4s | ease-out |
| **Active** | Strikes pose with horn pointed forward, battle aura flares, eyes glow white, mane streams dramatically, hoof scrapes creating sparks | 0.5s | cubic-bezier(0.34, 1.56, 0.64, 1) |
| **Walking** | Elegant prancing gait, each hoof-fall creates star burst, mane flows with movement, tail leaves trail of nebula clouds |
| **Running** | Galloping with rainbow trail, speed lines of light, mane becomes comet trail, ground sparkles where hooves touch |
| **Healing** | Horn lowers toward target, golden light streams from tip, gentle lowering of head, protective stance, soft humming animation | 2-4s (channel) | power2.out |
| **Shield Cast** | Horn draws circle in air, light follows path creating barrier, stomp creates ground pulse, protective aura expands | 0.8s | ease-out |
| **Teleport** | Body dissolves into vertical rainbow beam, travels through light, reforms with star explosion and prismatic rings | 1s | exponential |
| **Light Beam** | Horn charges with spiraling energy, releases concentrated beam of stellar energy, recoil pushes body back slightly | 0.6s | power4.out |
| **Defeated** | Collapses gracefully, horn dims to grey, mane loses color becoming pale white, star-dust stops, gentle sadness pose | 3s | ease-in |
| **Celebrating** | Joyful rearing, horn shoots fireworks of light, mane creates rainbow arcs, prancing in circle, pure happiness radiating | 2s | spring |
| **Ultimate** | Transformation sequence — wings manifest, size increases, celestial objects orbit, blinding radiance, time seems to slow | 5s | power4.out |

### Particle Effects

- **Star-Dust** — Constant gentle fall of sparkling particles from mane and hooves
- **Horn Rays** — Soft beams of colored light projecting from horn based on emotion
- **Healing Orbs** — Golden spheres that orbit during healing actions
- **Nebula Clouds** — Soft colorful fog that follows movement, especially from mane/tail
- **Prismatic Flares** — Rainbow light bursts during teleportation and powerful abilities
- **Constellation Sparkles** — Star patterns that appear on ground during idle moments
- **Hope Halo** — Ring of light that appears during protective actions

---

## Ability System — The Five Miracles

### Ability 1: Healing Touch — "Starlight Restoration"

**Type:** Healing / Support
**Cooldown:** 6 seconds
**Range:** 15 meters
**Heal Amount:** High single-target + minor regeneration over time

**Description:**
Uni channels pure stellar energy through their horn, directing a beam of restorative light to a wounded ally. The healing is more than physical — it restores hope, clears negative status effects, and leaves the target with a lingering regeneration buff.

**Mechanics:**
- Targeted ally heal with moderate wind-up (0.5 seconds)
- Instantly restores 40% of target's maximum health
- Applies "Starlight Renewal" buff: +5% max health regeneration per second for 8 seconds
- Clears all negative status effects (poison, slow, damage over time)
- If target is below 25% health: Heal amount increased to 60% (desperation bonus)
- Overheal mechanic: Excess healing converts to temporary shield (max 20% max health)
- Cooldown reduced by 2 seconds if used on ally below 25% health

**Visual:**
Uni's horn glows brilliant gold-white, gentle beam of sparkling light extends to target. Target is enveloped in soft nebula cloud as healing applies. Golden orbits appear around healed target. Overheal shows as translucent star-shield.

**Audio:**
Gentle harp-like tones, soft chimes with each healing pulse, hopeful orchestral swell, target's pain sounds fade to relieved sighs.

**Upgrade Path:**
- Level 2: Increased range (25 meters)
- Level 3: Chain heal (bounces to 2 additional nearby allies at 50% effectiveness)
- Level 4: Regeneration duration increased (12 seconds) + adds +20% movement speed
- Level 5: "Miracle Cure" — Can resurrect recently fallen ally (within 5 seconds of death) once per 60 seconds

---

### Ability 2: Shield of Purity — "Aegis of Innocence"

**Type:** Defensive / Protection
**Cooldown:** 12 seconds
**Duration:** 8 seconds or until destroyed
**Shield Health:** 800 HP (scales with Uni's level)

**Description:**
Uni creates a barrier of pure magical force, manifesting as a dome of prismatic light that protects all allies within. The shield converts damage taken into healing energy, embodying the principle that purity transforms harm into help.

**Mechanics:**
- Deploys as dome centered on Uni's position (10 meter radius)
- All allies inside dome take 50% reduced damage from all sources
- 25% of damage blocked is converted to healing distributed among allies in dome
- Shield health depletes as it absorbs damage
- Enemies entering dome are slowed by 30% (purity is hard for corruption to bear)
- Shield prevents enemy projectiles from entering (destroys them on contact)
- If shield expires naturally (not destroyed): All allies healed for 15% max health

**Visual:**
Uni's horn draws glowing circle in air, which expands into hemisphere of translucent rainbow light. Dome surface shows flowing aurora patterns. Damage appears as ripples of light across surface. Enemy projectiles shatter against it in sparkles.

**Audio:**
Crystal resonance on creation, gentle humming while active, bell-like chimes when blocking damage, harmonic chord on natural expiration healing.

**Upgrade Path:**
- Level 2: Increased shield health (1200 HP)
- Level 3: Dome radius increased (15 meters)
- Level 4: Damage-to-heal conversion increased to 40%
- Level 5: "Divine Aegis" — When shield breaks, releases healing nova healing all allies for 30% max health

---

### Ability 3: Teleport — "Rainbow Bridge"

**Type:** Mobility / Team Relocation
**Cooldown:** 15 seconds
**Range:** 40 meters

**Description:**
Uni creates a bridge of pure prismatic light, instantly transporting themselves and nearby allies to a target location. The rainbow pathway persists briefly, allowing for rapid team repositioning and tactical retreats or advances.

**Mechanics:**
- Uni and up to 2 nearby allies (within 8 meters) are teleported
- Teleport is instant (no cast time) but has 0.5 second arrival delay
- Destination must be within line of sight
- On arrival: All teleported allies gain +30% movement speed for 3 seconds
- Rainbow bridge persists for 3 seconds after teleport, allowing one additional ally to follow
- Can be used to teleport through thin barriers (windows, gaps)
- Arrival creates blinding flash that disorients nearby enemies for 1 second

**Visual:**
Uni rears, horn creates vertical rainbow beam, affected allies glow with prismatic light, all dissolve into light streams that arc through air. At destination, light streams reform with star burst and prismatic ring explosion. Fading rainbow path lingers briefly.

**Audio:**
Harp glissando upward, whoosh of light travel, crystalline chimes on arrival, disorientation sound for affected enemies.

**Upgrade Path:**
- Level 2: Increased range (60 meters)
- Level 3: Can teleport up to 4 allies
- Level 4: Bridge persists for 5 seconds, unlimited allies can follow
- Level 5: "Celestial Express" — Can store 2 charges, reduced cooldown (10 seconds)

---

### Ability 4: Light Beam — "Stellar Lance"

**Type:** Ranged Damage / Piercing
**Cooldown:** 10 seconds
**Range:** 50 meters
**Damage:** Very high piercing beam

**Description:**
Uni focuses their horn's light into a concentrated beam of stellar energy capable of piercing through multiple enemies. This is their primary combat ability — proof that purity is not weakness, and that light can cut as surely as any blade.

**Mechanics:**
- 0.8 second charge time (horn glows increasingly bright)
- Releases instant beam that pierces all enemies in line
- Damage: Very high to first target, 20% less to each subsequent target (minimum 40% of base)
- Range: 50 meters or until hitting environment
- Critical hits (headshots) deal 50% bonus damage and apply "Blinded" debuff (reduced accuracy for 3 seconds)
- Beam leaves "Scorched Light" path on ground for 3 seconds (minor damage to enemies standing in it)
- While charging: Uni emits visible targeting laser showing beam path

**Visual:**
Horn spirals with concentrating light energy, visible beam of white-gold energy charging. Release creates brilliant laser beam with rainbow diffraction at edges. Pierced enemies show light passing through them. Ground shows lingering burn of pure light.

**Audio:**
Powering-up hum, release scream of energy, impact sounds for each enemy hit, sizzling ground effect.

**Upgrade Path:**
- Level 2: Reduced charge time (0.5 seconds)
- Level 3: Beam width increased (easier to hit, hits more enemies)
- Level 4: Damage reduction per target decreased (only 10% per target)
- Level 5: "Supernova Beam" — Full charge can be held for 3 seconds, releasing wider beam dealing massive damage

---

### Ability 5: Ultimate Blessing — "Ascension of Pure Light"

**Type:** Ultimate / Team-Wide Buff
**Cooldown:** 120 seconds
**Duration:** 15 seconds

**Description:**
Uni reveals their true celestial nature, manifesting wings of pure light and becoming a beacon of hope that empowers all allies. In this form, death itself is held at bay, and the team fights with the strength of those who know they cannot fall.

**Mechanics:**
- Transformation: Uni grows wings of light, size increases 50%, surrounded by orbiting stars
- All allies within 30 meters gain following effects:
  - **Invincibility Shield:** Cannot be reduced below 1 health (prevents death)
  - **Regeneration:** +10% max health per second
  - **Empowerment:** +50% damage output
  - **Purity:** Immune to all negative status effects
- Uni gains flight and can attack with enhanced Light Beams (no charge time)
- Uni's healing abilities have no cooldown during ultimate
- On expiration: All allies healed to full health, all negative effects cleared
- If Uni is defeated while ultimate is active: Ultimate immediately ends, but all allies healed to full as final blessing

**Visual:**
Uni's form becomes blindingly bright, crystalline wings of light manifest from shoulders, body expands, surrounded by miniature solar system of orbiting light orbs. Ground transforms into star-field pattern. All affected allies glow with golden auras. Reality seems to brighten as hope manifests physically.

**Audio:**
Angelic choir swells, harp crescendo, sustained harmonic chord, individual instrument notes for each buff application, triumphant finale on expiration healing.

**Upgrade Path:**
- Level 2: Extended duration (20 seconds)
- Level 3: Range increased (40 meters)
- Level 4: Additional effect: Allies resurrect instantly if they "die" (once per ally per ultimate)
- Level 5: "True Miracle" — After ultimate ends, all allies retain +25% damage buff for 60 seconds

---

## Web Component Specification

```typescript
// UniAvatar.tsx
interface UniAvatarProps {
  // Core State
  state: 'idle' | 'hover' | 'active' | 'walking' | 'running' | 
         'healing' | 'shielding' | 'teleporting' | 'beaming' | 
         'defeated' | 'celebrating' | 'ultimate';
  
  // Emotional State
  emotionalState: 'calm' | 'joy' | 'concern' | 'determination' | 'sadness';
  hornColor: string; // Changes with emotional state
  
  // Ability States
  isChanneling: boolean;
  shieldActive: boolean;
  shieldHealth?: number;
  ultimateActive: boolean;
  ultimateTimeRemaining: number;
  
  // Metrics
  purityLevel: number; // 0-100, affects aura intensity
  starsCollected: number; // Cosmetic/progression
  
  // Interaction
  onActivate: () => void;
  onHover: () => void;
  onHeal: (targetId: string) => void;
  onUltimateActivate: () => void;
  
  // Visual Customization
  size: 'sm' | 'md' | 'lg' | 'xl';
  showWings: boolean;
  showStarDust: boolean;
  showNebula: boolean;
  hornGlowIntensity: number; // 0.0 - 1.0
  
  // Accessibility
  alt: string;
  ariaLabel: string;
  
  // Animation Overrides
  animationSpeed?: number;
  maneFlowRate?: number;
}

interface UniAvatarState {
  healingTarget: string | null;
  teleportDestination: { x: number; y: number } | null;
  shieldAlliesProtected: string[];
  ultimateBuffsApplied: string[];
  starDustPath: Array<{ x: number; y: number; age: number }>;
}
```

### CSS Custom Properties

```css
:root {
  /* Core Palette */
  --uni-primary: #E0B0FF;
  --uni-secondary: #C8A2C8;
  --uni-accent: #FFB6C1;
  --uni-horn-base: #F0F8FF;
  --uni-horn-joy: #FFD700;
  --uni-horn-concern: #C0C0C0;
  --uni-horn-determination: #FFFFFF;
  --uni-hooves: #4B0082;
  --uni-sparkle: #FFFFFF;
  
  /* Effects */
  --uni-glow-soft: 0 0 30px #E0B0FF, 0 0 60px #E0B0FF40;
  --uni-glow-healing: 0 0 40px #FFD700, 0 0 80px #FFD70060;
  --uni-glow-ultimate: 0 0 60px #FFFFFF, 0 0 120px #FFD700, 0 0 180px #E0B0FF;
  
  /* Animations */
  --uni-mane-flow: nebula-drift 5s ease-in-out infinite;
  --uni-horn-pulse: gentle-glow 3s ease-in-out infinite;
  --uni-star-fall: sparkle-drop 4s linear infinite;
  --uni-teleport: rainbow-shift 1s ease-in-out;
}
```

---

## Godot Engine Specification

### Sprite Sheet Requirements

| Animation | Frames | Size | FPS | Notes |
|-----------|--------|------|-----|-------|
| `idle_loop` | 16 | 128x128 | 10 | Breathing + mane flow + horn pulse |
| `hover_loop` | 12 | 128x128 | 12 | Levitation + star-dust swirl |
| `activate` | 8 | 192x192 | 24 | Battle stance + aura flare |
| `walk_cycle` | 10 | 128x128 | 12 | Prancing gait + hoof sparks |
| `run_cycle` | 8 | 128x128 | 16 | Gallop + speed lines |
| `heal_cast` | 12 | 256x256 | 20 | Horn lower + beam + sustain |
| `shield_cast` | 8 | 256x256 | 24 | Circle draw + dome expansion |
| `shield_loop` | 6 | 128x128 | 8 | Dome maintained |
| `teleport_out` | 8 | 128x128 | 24 | Rainbow dissolve |
| `teleport_in` | 8 | 128x128 | 24 | Reform + star burst |
| `beam_charge` | 10 | 192x192 | 16 | Horn spiral energy |
| `beam_fire` | 6 | 384x128 | 30 | Laser beam release |
| `ultimate_transform` | 30 | 512x512 | 24 | Wings manifest + celestial |
| `ultimate_flight` | 16 | 256x256 | 12 | Winged flight cycle |
| `ultimate_beam` | 8 | 384x256 | 30 | Rapid fire beams |
| `hurt` | 5 | 128x128 | 18 | Horn dim + recoil |
| `defeat` | 15 | 128x128 | 8 | Graceful collapse + dimming |
| `celebrate` | 20 | 256x256 | 16 | Rearing + fireworks |

### Shader Requirements

```glsl
// Uni's nebula mane shader
shader_type canvas_item;

uniform float nebula_flow : hint_range(0.0, 1.0) = 0.5;
uniform float star_density : hint_range(0.0, 1.0) = 0.3;
uniform vec4 color_base : source_color = vec4(0.88, 0.69, 1.0, 1.0);
uniform vec4 color_accent1 : source_color = vec4(1.0, 0.71, 0.76, 1.0);
uniform vec4 color_accent2 : source_color = vec4(0.78, 0.64, 0.78, 1.0);
uniform sampler2D noise_texture;
uniform sampler2D star_texture;

void fragment() {
    vec2 uv = UV;
    
    // Flowing nebula effect
    float flow = TIME * nebula_flow;
    vec4 noise1 = texture(noise_texture, uv * 3.0 + vec2(flow * 0.1, 0.0));
    vec4 noise2 = texture(noise_texture, uv * 2.0 - vec2(0.0, flow * 0.15));
    
    // Color mixing based on noise
    vec4 nebula = mix(color_base, color_accent1, noise1.r);
    nebula = mix(nebula, color_accent2, noise2.r * 0.5);
    
    // Star particles
    vec4 stars = texture(star_texture, uv * 10.0 + vec2(flow * 0.5, flow * 0.3));
    nebula = mix(nebula, vec4(1.0), stars.r * star_density);
    
    COLOR = nebula * texture(TEXTURE, uv);
}
```

### Audio Clips

| Type | Filename | Description |
|------|----------|-------------|
| Select | `uni_select_01.wav` | *"Hope shines eternal!"* |
| Select | `uni_select_02.wav` | Gentle harp + soft whinny |
| Move | `uni_move_01.wav` | Elegant hoof falls + sparkles |
| Heal | `uni_heal_01.wav` | *"Be whole once more!"* + healing chime |
| Shield | `uni_shield_01.wav` | Crystal resonance + *"I protect you!"* |
| Teleport | `uni_teleport_01.wav` | Rainbow harp glissando |
| Beam | `uni_beam_01.wav` | Power charge + stellar release |
| Ultimate | `uni_ultimate_01.wav` | Angelic choir + *"Light prevails!"* |
| Hit | `uni_hit_01.wav` | Pained whinny + horn dim |
| Victory | `uni_victory_01.wav` | *"Darkness fades before hope!"* |
| Defeat | `uni_defeat_01.wav` | Sad whinny + *"My light... fades..."* |

### Dialogue Script (20+ Lines)

```gdscript
# uni_dialogue.gd
const DIALOGUE = {
    "greeting": [
        "Hope shines eternal!",
        "The stars led me to you today.",
        "What a beautiful day for a miracle!",
        "I believe in you, you know. Always have."
    ],
    "battle_start": [
        "Darkness cannot stand before the light!",
        "I will protect everyone!",
        "Have courage, friends. We shine together!",
        "Evil may be strong, but hope is stronger!"
    ],
    "healing": [
        "Be whole once more!",
        "Let my light mend you.",
        "Pain is temporary. Hope is eternal.",
        "You're too precious to lose."
    ],
    "shielding": [
        "I protect you!",
        "No harm shall pass!",
        "Behind me, friends!",
        "Purity is your shield!"
    ],
    "emotional_quirks": [
        "My horn is glowing pink—I'm just so happy!",
        "I feel silver today... something troubles me.",
        "Gold means joy, and you bring me gold!",
        "White is determination. And I am DETERMINED."
    ],
    "encourage": [
        "I see the light in you, even when you don't.",
        "You're stronger than your doubts!",
        "The darkest night produces the brightest stars!",
        "I believe in you. That's all that matters."
    ],
    "ultimate": [
        "Light prevails!",
        "Behold the miracle of hope!",
        "Ascension of Pure Light!",
        "Together, we are invincible!"
    ],
    "victory": [
        "Darkness fades before hope!",
        "I knew we could do it!",
        "Another triumph for the light!",
        "See? I believed in us!"
    ],
    "defeat": [
        "My light... fades...",
        "Don't... lose... hope...",
        "The stars... grow... dim...",
        "Protect... them... for me..."
    ],
    "naive_moment": [
        "But surely they can be redeemed?",
        "Maybe if we just talk to them...",
        "Everyone has good inside, right?",
        "I just know they didn't mean it!"
    ],
    "bond_moment": [
        "You're the family I choose.",
        "My heart glows gold whenever you're near.",
        "I'd cross galaxies for you.",
        "You make my magic stronger just by existing."
    ]
}
```

---

## Quest: "The Shattered Horn"

**Quest ID:** `quest_uni_betrayal_01`

**Overview:**
Uni's naive trust leads to betrayal — someone they believed in turns out to be an enemy agent. Their horn cracks, their magic fades, and they must learn that purity doesn't mean blind trust, and that wisdom must balance hope.

**Act I — The Betrayal**
- Uni vouches for a newcomer, insists on their goodness
- Newcomer is revealed as HYBER's agent, steals critical item
- Uni's horn cracks in the emotional shock; powers diminished

**Act II — The Doubt**
- Uni withdraws, questions their core belief in goodness
- Horn glow fades to grey; healing abilities weakened
- Player must remind Uni of all the times their hope was RIGHT

**Act III — The Wise Hope**
- Uni realizes: Trust is a choice, not blindness
- Wisdom + Hope = Strength that cannot be exploited
- Horn mends with golden scar — stronger at the broken places

**Climax — The Test**
- Same betrayer appears, asks for help again
- **Player choice:** Uni can reject them OR offer redemption with boundaries
- True ending: Uni offers second chance with protective conditions

**Rewards:**
- Uni skin: "Wise Hope" (horn has golden scar, more regal bearing)
- Title: "The Golden Scar"
- Emote: "Protective Blessing" (heals with visible boundary circle)
- Mechanic Unlock: "Discerning Light" — healing reveals enemy disguises

---

## Relationship Web

```
Uni Connections:
├── Sol [Admires] — Sees their leadership potential, worries about their pride
├── Lun [Soul Friend] — Quiet understanding, shared healing nature
├── Bin [Protects] — Wants to help them understand feelings
├── Fat [Inspires] — Their rebirth is the physical version of Uni's hope
├── HYBER [Pities] — Believes even the villain of division can be united
├── Void [Fears] — The only thing that could truly extinguish hope
└── Player [Believes In] — Trusts the player's judgment absolutely
```

---

## Meta Notes

- **Player Fantasy:** "I want to save everyone, to be the ultimate support"
- **Growth Arc:** Naive Hope → Tested Faith → Wise Compassion
- **Marketing Hook:** "The pure heart who learned that trust is a choice"
- **Merch Potential:** Horn headbands, nebula fabric items, star-dust glitter products
- **Esports Connection:** Appeals to support players, team players, healers
- **Accessibility Note:** Bright light effects — include option to reduce flashes

---

*Document Version: 001.000*
*Created by: AGENT_1C (Heroes Team)*
*Review Status: Pending TL-H1 Approval*
