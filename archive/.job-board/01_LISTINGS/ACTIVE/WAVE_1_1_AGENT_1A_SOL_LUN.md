[Ver001.000]

# WAVE 1.1 — AGENT 1-A TASK: Sol & Lun Character Bibles
**Priority:** P0  
**Estimated:** 8 hours  
**Due:** +24 hours from claim  
**Foreman:** Awaiting submission at `.job-board/02_CLAIMED/{agent-id}/`

---

## ASSIGNMENT

Create comprehensive character bibles for **Sol (Day/Leader)** and **Lun (Night/Support)** — the twin duality anchors of the 5-hero system.

### Source Material (from extracted branch)

**Sol (Original):**
- Primary: NJZ Hanni
- Solo elements: ILLIT Minju (dance grace)
- Hybrid elements: LE SSERAFIM Sakura (serene duality)
- Colors: Gold/Sunrise orange
- Outfit: Jett cape hybrid
- Synergy: Group speed boost

**Lun (Original):**
- Primary: NJZ Danielle
- Solo elements: LE SSERAFIM Chaewon (vocal harmony)
- Hybrid elements: ILLIT Yunah (gentle flow)
- Colors: Indigo/Moon silver
- Outfit: Skye orbs
- Synergy: Heal chain

---

## DELIVERABLES

### 1. Character Bible — Sol (2-3 pages)

**Required Sections:**

```markdown
## Sol — The Day Leader

### Identity Matrix
- **Archetype:** Charismatic Leader / Day Incarnate
- **Core Trait:** Radiates confidence that uplifts others
- **Secondary Trait:** Competitive drive tempered by fairness
- **Quirk 1:** Collects sunrise photos from different cities
- **Quirk 2:** Hums when thinking strategically
- **Flaw:** Sometimes pushes team too hard, forgets rest

### Visual Identity
| Element | Specification |
|---------|---------------|
| Primary | `#FFD700` (Gold) |
| Secondary | `#FF8C00` (Sunrise Orange) |
| Accent | `#FFF8DC` (Cornsilk glow) |
| Dark | `#B8860B` (Dark Goldenrod) |

**CSS Variables:**
```css
--sol-primary: #FFD700;
--sol-secondary: #FF8C00;
--sol-glow: 0 0 20px rgba(255, 215, 0, 0.5);
--sol-gradient: linear-gradient(135deg, #FFD700, #FF8C00);
```

### Animation Personality
| State | Behavior | Duration | Easing |
|-------|----------|----------|--------|
| Idle | Gentle float + subtle pulse | 3s loop | ease-in-out |
| Hover | Scale 1.05 + glow intensify | 0.3s | cubic-bezier(0.4, 0, 0.2, 1) |
| Active | Quick bounce + rays burst | 0.5s | spring |
| Celebrating | Spin + rainbow shimmer | 2s | ease-out |

### Voice/Tone
- **Casual:** "We've got this!"
- **Strategic:** "The opening is at dawn—move then."
- **Supportive:** "Every sunrise is a reset."
- **Never:** Arrogant, dismissive, impatient

### Synergy Mechanics
- **With Lun:** Day/Night cycle boost (12h rotation)
- **With Bin:** Strategic vision enhanced
- **With Fat:** Risk assessment improved
- **With Uni:** Team morale maximum

### Web Component Spec
```typescript
interface SolAvatarProps {
  state: 'idle' | 'hover' | 'active' | 'celebrating';
  showRays?: boolean;
  timeOfDay?: 'dawn' | 'noon' | 'dusk';
}
```

### Godot Spec
- Sprite: 8-frame idle, 12-frame celebrate
- Collision: CircleShape2D (radius: 32px)
- Dialogue: 15 lines minimum
- Quest: "Capture the Dawn" — guide 3 new users
```

### 2. Character Bible — Lun (2-3 pages)

Follow same structure. Key differences:
- Animation: Gentler, flowing (like water/moonlight)
- Voice: Softer, more reflective
- Synergy: Heal/restoration focused
- States include: meditating (unique to Lun)

### 3. Asset List (Spreadsheet)

| Asset | Platform | Format | Size | Priority |
|-------|----------|--------|------|----------|
| sol_portrait.svg | Web | SVG | 512x512 | P0 |
| sol_sprite_sheet.png | Godot | PNG | 256x2048 | P0 |
| sol_dialogue_avatar.png | Both | PNG | 128x128 | P1 |
| lun_portrait.svg | Web | SVG | 512x512 | P0 |
| ... | ... | ... | ... | ... |

---

## FOREMAN REVIEW CHECKLIST

Submit to `.job-board/02_CLAIMED/{agent-id}/SUBMISSION_1A.md`

- [ ] Colors pass WCAG AA contrast (4.5:1 minimum)
- [ ] Animations include `prefers-reduced-motion` fallback
- [ ] No stereotyping in personality traits
- [ ] Traits align with NJZ Hanni / Danielle public personas
- [ ] Synergy mechanics are implementable (not vague)
- [ ] Asset list is complete enough for Wave 2

---

## CONSTRAINTS

1. **Equitable Design:** Sol and Lun must feel equally "main character"
2. **Day/Night Parity:** Their visual relationship should mirror each other
3. **No Overlap:** Distinct from Bin (purple/violet) and Fat (teal)
4. **Source Respect:** Hybrids of idols, not copies

---

## QUESTIONS FOR FOREMAN?

Post in `.job-board/04_BLOCKS/{agent-id}/` if blocked.

---

*Claim this task by moving file to `.job-board/02_CLAIMED/{your-agent-id}/`*
*Submit all deliverables in same directory as SUBMISSION_1A.md*
