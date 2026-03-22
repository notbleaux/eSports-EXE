[Ver001.000]

# WAVE 1.1 — AGENT 1-B TASK: Bin & Fat Character Bibles
**Priority:** P0  
**Estimated:** 8 hours  
**Due:** +24 hours from claim  
**Foreman:** Awaiting submission at `.job-board/02_CLAIMED/{agent-id}/`

---

## ASSIGNMENT

Create comprehensive character bibles for **Bin (Strategist/Twin Bind)** and **Fat (Fate Split)** — the cerebral and adaptive minds of the team.

### Source Material

**Bin (Original):**
- Primary: NJZ Haerin
- Solo elements: ILLIT Iroha (rhythm bind)
- Hybrid elements: LE SSERAFIM Kazuha (wind bind)
- Colors: Purple/Twin violet
- Outfit: Astra stars
- Synergy: Utility link

**Fat (Original):**
- Primary: NJZ Hyein
- Solo elements: LE SSERAFIM Yunjin (fate song)
- Hybrid elements: ILLIT Moka (split fate)
- Colors: Teal/Forked cyan
- Outfit: Cypher wires
- Synergy: Split defense

---

## DELIVERABLES

### 1. Character Bible — Bin (2-3 pages)

**Required Sections:**

```markdown
## Bin — The Twin Bind Strategist

### Identity Matrix
- **Archetype:** Tactician / Connection Weaver
- **Core Trait:** Sees patterns others miss
- **Secondary Trait:** Binds disparate elements into unity
- **Quirk 1:** Always has multiple plans (A, B, C...)
- **Quirk 2:** Talks to self while strategizing
- **Flaw:** Overthinks, sometimes paralyzed by options

### Visual Identity
| Element | Specification |
|---------|---------------|
| Primary | `#8B5CF6` (Violet) |
| Secondary | `#A855F7` (Purple) |
| Accent | `#C084FC` (Light Purple) |
| Dark | `#6B21A8` (Dark Purple) |

**CSS Variables:**
```css
--bin-primary: #8B5CF6;
--bin-secondary: #A855F7;
--bin-constellation: url('constellation-pattern.svg');
--bin-bind-glow: 0 0 15px rgba(139, 92, 246, 0.6);
```

### Animation Personality
| State | Behavior | Duration | Easing |
|-------|----------|----------|--------|
| Idle | Constellation particles orbit | 4s loop | linear |
| Hover | Connection lines draw to nearby | 0.4s | ease-out |
| Active | Star burst + lines pulse | 0.6s | spring |
| Calculating | Eyes glow, particles speed up | 1s | ease-in |

### Voice/Tone
- **Casual:** "I've mapped seventeen outcomes."
- **Strategic:** "Connect the weak points—weave strength."
- **Curious:** "What if we...?"
- **Never:** Dismissive of others' ideas, arrogant

### Synergy Mechanics
- **With Sol:** Strategic vision + speed = blitz tactics
- **With Lun:** Healing network (heal chains through Bin)
- **With Fat:** Probability calculation (fate + strategy)
- **With Uni:** Team coordination maximum

### Unique: Binding Visuals
When Bin synergizes, draw animated connection lines between affected heroes. Lines pulse with Bin's violet.

### Web Component Spec
```typescript
interface BinAvatarProps {
  state: 'idle' | 'hover' | 'active' | 'calculating';
  connections?: HeroId[]; // Draw lines to these
  showConstellation?: boolean;
}
```

### Godot Spec
- Sprite: Floating slightly (anti-gravity feel)
- Particles: Constellation orbits
- Dialogue: Analytical but warm
- Quest: "Weave the Web" — connect 5 data points
```

### 2. Character Bible — Fat (2-3 pages)

Follow same structure. Key elements:
- **Theme:** Fate, splits, adaptation
- **Visual:** Forking paths, wire motifs
- **Unique State:** "Split" — shows alternate version briefly
- **Tone:** Accepting of multiple outcomes, philosophical

### 3. Distinction Document

Critical: Bin and Fat must not feel similar despite both being "cerebral."

| Aspect | Bin | Fat |
|--------|-----|-----|
| Thinking | Proactive (plans ahead) | Reactive (adapts to fate) |
| Visual | Stars/connection | Wires/forks |
| Movement | Floating | Grounded but shifting |
| Philosophy | Control | Acceptance |
| Synergy | Links others | Splits defense |

---

## FOREMAN REVIEW CHECKLIST

- [ ] Bin's "binding" mechanic is visually distinct
- [ ] Fat's "split" concept doesn't overlap with "duality" (Sol/Lun)
- [ ] Purple (Bin) and Teal (Fat) don't clash visually
- [ ] Both feel complementary to Sol/Lun, not competing
- [ ] Villain ADORE/Vexor contrast colors defined

---

## CONSTRAINTS

1. **Strategist ≠ Leader:** Bin supports, doesn't override Sol
2. **Fate ≠ Passive:** Fat actively adapts, isn't helpless
3. **Visual Distinctness:** No purple/teal confusion
4. **Source Respect:** Haerin/Hyein traits incorporated

---

*Claim by moving to `.job-board/02_CLAIMED/{agent-id}/`*
