[Ver001.000]

# WAVE 1.2 — MASCOT SYSTEM ARCHITECTURE (3 Agents)
**Priority:** P0  
**Estimated:** 24 hours total (8h each)  
**Dependencies:** Wave 1.1 hero colors defined (for coordination)  
**Foreman:** Coordinate color harmony with hero bibles

---

## OVERVIEW

Create the complete mascot taxonomy, art specifications, and editor economy system.

### Source Material

**Little Mascots (Chibi):**
- CheCat (CatBunny): Chibi cutesy
- CheBun (BunnyCat): Chibi cutesy

**Anthropomorphic Mascots:**
- NyxiaCat (Cat): Bugs style, any cosplay, small/big
- LunariaBunny (Bunny): Tom style, drama forms, small/big

**Key Distinction:** Anthropomorphic ≠ Animals; small chibi ≠ little mascots

---

## AGENT 2-A: CheCat & CheBun (Little Mascots)

### Task
Define complete specifications for the two "little" chibi mascots.

### Deliverables

```markdown
## CheCat (CatBunny) Spec

### Visual Identity
- Body: 60% cat, 40% bunny elements
- Ears: Cat ears primary, bunny fluff inside
- Tail: Bunny tail (round, fluffy)
- Size: Small (fits in palm)
- Style: Chibi, oversized head

### Personality
- Curious, gets into everything
- Loves shiny objects
- Sound: "Nyaa~" + bunny nose wiggle

### Animation Set
| Animation | Description | Frames |
|-----------|-------------|--------|
| idle | Breathing + ear twitch | 12 |
| bounce | Happy hop | 8 |
| curious | Head tilt + sniff | 16 |
| sleep | Curl up + zzz | 20 |
| surprised | Ears up + eyes wide | 6 |

### Color Palette
- Fur: Soft orange (#FFB366) + white belly
- Ears: Pink inner (#FFB6C1)
- Eyes: Amber (#FFBF00)

---

## CheBun (BunnyCat) Spec

### Visual Identity
- Body: 60% bunny, 40% cat elements
- Ears: Long bunny ears, cat ear tufts
- Tail: Cat tail (slender)
- Size: Small (fits in palm)
- Style: Chibi, oversized head

### Personality
- Gentle, cautious
- Loves soft things
- Sound: "Purr~" + bunny hop

### Animation Set
Similar to CheCat but with bunny-primary movement

### Color Palette
- Fur: Soft grey (#A0A0A0) + white
- Ears: Pink inner
- Eyes: Blue (#87CEEB)
```

### Asset List
| Asset | Platform | Format | Priority |
|-------|----------|--------|----------|
| checat_idle_sprites.png | Godot | 512x256 | P0 |
| chebun_idle_sprites.png | Godot | 512x256 | P0 |
| mascots/checat.svg | Web | SVG | P0 |
| mascots/chebun.svg | Web | SVG | P0 |

---

## AGENT 2-B: NyxiaCat & LunariaBunny (Anthro Mascots)

### Task
Define big/small forms, cosplay system, and drama mechanics.

### Key Distinction Document

```markdown
## NyxiaCat vs LunariaBunny: Core Differences

| Aspect | NyxiaCat | LunariaBunny |
|--------|----------|--------------|
| Style | Bugs Bunny (wise-cracking) | Tom (dramatic, reactive) |
| Size range | 2ft → 6ft | 2ft → 5.5ft |
| Default | Medium (3ft), relaxed | Medium (3ft), alert |
| Big form | Confident, hands on hips | Dramatic poses, gesturing |
| Small form | Compact, plotting | Wide-eyed, emotional |
| Cosplay | Any character (commitment) | Any character (hammy) |
| Expression range | 0.5-1.5x (subtle) | 0.1-3x (extreme) |
| Gag style | Wordplay, schemes | Physical comedy, reactions |

### Cosplay System
Both can wear costumes. Each costume has:
- Base outfit (body)
- Headpiece
- Prop (optional)
- Special animation (unique to costume)

Example: "Cyber Ninja" costume
- NyxiaCat: Cool poses, efficient movements
- LunariaBunny: Over-the-top sword swings, posing
```

### Deliverables
- Full visual specs for both (small + big forms)
- Expression sheet (minimum 8 expressions each)
- Cosplay template system
- 3 example costumes with animation notes

---

## AGENT 2-C: Mascot Editor System

### Task
Design the complete mascot customization system.

### 6 Animal Base Types

```typescript
const ANIMAL_TYPES = [
  {
    id: 'bunny',
    name: 'Bunny',
    traits: ['ears_long', 'tail_puff', 'hop_move'],
    default_colors: ['white', 'brown', 'grey', 'spotted']
  },
  {
    id: 'cat',
    name: 'Cat',
    traits: ['ears_point', 'tail_long', 'purr_sfx'],
    default_colors: ['orange', 'black', 'white', 'calico', 'tabby']
  },
  {
    id: 'dog',
    name: 'Dog',
    traits: ['ears_flop', 'tail_wag', 'bark_sfx'],
    default_colors: ['golden', 'black', 'white', 'spotted']
  },
  {
    id: 'mouse',
    name: 'Mouse',
    traits: ['ears_round', 'tail_thin', 'squeak_sfx', 'small_size'],
    default_colors: ['grey', 'white', 'brown']
  },
  {
    id: 'fish',
    name: 'Fish',
    traits: ['fins', 'tail_fin', 'bubble_sfx', 'water_anim'],
    default_colors: ['gold', 'beta', 'koi', 'neon']
  },
  {
    id: 'bird',
    name: 'Bird',
    traits: ['wings', 'beak', 'chirp_sfx', 'hop_float'],
    default_colors: ['parakeet', 'cockatiel', 'finch', 'crow']
  }
] as const;
```

### 13-Tier Economy

```typescript
const TIER_SYSTEM = {
  tiers: [
    { tier: 1, name: 'Novice', cost: 100, unlocks: ['basic_colors', 'simple_patterns'] },
    { tier: 2, name: 'Apprentice', cost: 250, unlocks: ['hats', 'accessories_basic'] },
    { tier: 3, name: 'Journeyman', cost: 500, unlocks: ['outfits_simple', 'eye_variants'] },
    { tier: 4, name: 'Craftsman', cost: 1000, unlocks: ['animated_parts', 'glow_effects'] },
    { tier: 5, name: 'Artisan', cost: 2000, unlocks: ['special_poses', 'particle_trail'] },
    { tier: 6, name: 'Expert', cost: 4000, unlocks: ['companion_pet', 'aura_basic'] },
    { tier: 7, name: 'Master', cost: 8000, unlocks: ['transformation', 'theme_music'] },
    { tier: 8, name: 'Grandmaster', cost: 16000, unlocks: ['legendary_skin', 'aura_advanced'] },
    { tier: 9, name: 'Champion', cost: 32000, unlocks: ['mythic_elements', 'custom_animation'] },
    { tier: 10, name: 'Legend', cost: 64000, unlocks: ['god_particles', 'title_prefix'] },
    { tier: 11, name: 'Mythic', cost: 128000, unlocks: ['celestial_form', 'exclusive_emote'] },
    { tier: 12, name: 'Divine', cost: 256000, unlocks: ['avatar_frame', 'showcase_slot'] },
    { tier: 13, name: 'Eternal', cost: 1024000, unlocks: ['nebula_form', 'prism_aura', 'hall_of_fame'] }
  ],
  
  // Tier 13 costs more than sum(1-12) = 511,750
  // This ensures true exclusivity
  
  token_sources: [
    { source: 'daily_login', amount: 50 },
    { source: 'match_complete', amount: 25 },
    { source: 'achievement', amount: 'varies' },
    { source: 'event_participation', amount: 100 }
  ],
  
  // Time to max: ~6 months of daily play
  estimated_max_months: 6
};
```

### Editor UI Flow

```
1. Select Base Animal (6 options)
   → Shows preview, confirms selection
   
2. Customize Appearance
   → Colors (limited by tier)
   → Patterns (limited by tier)
   → Size adjustments (subtle)
   
3. Equip Items
   → Head slot
   → Body slot
   → Accessories (2 slots)
   → Special slot (unlocked later)
   
4. Preview & Name
   → Animation preview
   → Name input (filtered)
   → Save confirmation
   
5. Export
   → Web: Save to profile
   → Godot: Export .tres file
```

---

## FOREMAN COORDINATION NOTES

### Color Harmony
Mascot colors should complement hero colors:
- CheCat orange → Sol gold harmony
- CheBun grey/blue → Lun silver harmony
- NyxiaCat → Bin purple-adjacent
- LunariaBunny → Fat cyan-adjacent

### Scale Reference
- Little mascots: 1/20th of hero height
- Anthro small: 1/4 of hero height
- Anthro big: 3/4 of hero height

---

*Waves 2-A, 2-B, 2-C can work in parallel after hero colors finalized*
