[Ver001.000]

# TL-H1 Agent Briefing — Heroes & Mascots Wave 1.1
**Team Lead:** TL-H1 (Agent 1-A)  
**Briefing Date:** March 23, 2026  
**Phase:** 0 → 1 (Concept to Production)

---

## TEAM STRUCTURE

```
TL-H1 (Agent 1-A) ──┬── AGENT 1-B
                    └── AGENT 1-C
```

| Role | Agent ID | Assignment | Est. Hours |
|------|----------|------------|------------|
| **Team Lead** | 1-A (TL-H1) | Coordination + Sol/Lun review | 24h |
| **Sub-agent** | 1-B | Sol & Lun detailed bibles | 12h |
| **Sub-agent** | 1-C | Bin, Fat, Uni + 3 Villains | 12h |

---

## ASSIGNMENTS

### AGENT 1-B: Sol & Lun Character Bibles

**Deliverables:**
1. **Sol Bible** — The Radiant Strategist
2. **Lun Bible** — The Nocturnal Tactician

**Focus Themes:**
- **Duality/Synergy:** Sol and Lun are opposing but complementary forces
- **Color Theory:** Warm vs cool palettes, sun vs moon motifs
- **Animation Contrast:** Bright energetic movement vs fluid shadowy motion

**Required Bible Sections (per character):**
```
1. VISUAL IDENTITY
   - Primary/secondary/tertiary hex colors
   - CSS custom properties: --hero-{id}-{role}
   - Godot Color resources
   - Portrait art direction (SVG for web, sprite for Godot)

2. PERSONALITY MATRIX
   - 5 core traits (ranked 1-10)
   - 3 defining quirks
   - 1 character flaw (relatable, not stereotypical)
   - Voice/tone guidelines

3. ANIMATION PERSONALITY
   - Idle state: subtle movement patterns
   - Hover state: responsive engagement
   - Active state: action/reaction
   - Celebrating state: victory animation

4. CROSS-PLATFORM ASSETS
   - Web: SVG vector art, CSS animation keyframes
   - Godot: Sprite sheet specs, Tween animation curves

5. SYNERGY MECHANICS
   - How Sol interacts with other heroes (especially Lun)
   - Team composition bonuses when paired
```

**Output Files:**
- `docs/heroes/sol-bible.md`
- `docs/heroes/lun-bible.md`
- `docs/heroes/sol-lun-synergy.md`

---

### AGENT 1-C: Bin, Fat, Uni + Villains

**Deliverables:**
1. **Bin Bible** — The Binding Force
2. **Fat Bible** — The Fateful Guardian  
3. **Uni Bible** — The Unifying Presence
4. **Villain Roster:**
   - **ADORE** — Manipulative entity of toxic attachment
   - **HYBER** — Sleep/death manifestation of stagnation
   - **Vexor** — Chaos agent of disruption

**Focus Themes:**
- **Triad Dynamics:** Bin (connection), Fat (destiny), Uni (unity) form a philosophical triad
- **Villain Contrast:** Each villain opposes a hero value (ADORE vs authentic connection, etc.)
- **Unity Mechanics:** Uni brings all heroes together — "the whole greater than sum"

**Required Bible Sections (same format as 1-B):**
- Visual Identity (with seasonal suite compatibility)
- Personality Matrix
- Animation Personality
- Cross-Platform Assets
- Synergy Mechanics (intra-triad and full-team)

**Additional for Villains:**
- **Opposition Mapping:** Which hero value they oppose
- **Visual Contrast:** Inverse color theory (complementary to hero palettes)
- **Narrative Hooks:** Story moments where they appear
- **Godot Integration:** Boss/NPC encounter concepts

**Output Files:**
- `docs/heroes/bin-bible.md`
- `docs/heroes/fat-bible.md`
- `docs/heroes/uni-bible.md`
- `docs/heroes/bin-fat-uni-triad.md`
- `docs/villains/adore-bible.md`
- `docs/villains/hyber-bible.md`
- `docs/villains/vexor-bible.md`
- `docs/villains/roster-overview.md`

---

## COORDINATION PROTOCOLS

### Daily Standup
**Time:** 09:00 UTC (recommended)  
**Format:** Async text report to TEAM_REPORTS/

**Template:**
```markdown
AGENT-{ID} REPORT [YYYY-MM-DD HH:MM]
- Completed: [What you finished]
- Blocked: [Obstacles → escalate to TL?]
- Next: [Planned work today]
- Files: [Paths to drafts]
```

### Mid-Day Check-in
**Time:** 14:00 UTC (optional sync if needed)
**Purpose:** Early blocker detection, design alignment

### End-of-Day Summary
**Time:** Before 18:00 UTC
**Action:** Update task status in team notes, commit drafts

---

## QUALITY GATES

### Gate 1: Concept Approval (TL Review Before Foreman)
- [ ] All bibles use consistent format
- [ ] Colors pass WCAG contrast checks
- [ ] Animations respect `prefers-reduced-motion`
- [ ] No stereotyping in character design
- [ ] Villains have clear opposition mapping

### TL Pre-Review Checklist
Before submitting to Foreman, TL-H1 will verify:
1. File structure follows conventions
2. All required sections present
3. Cross-platform asset specs included
4. Seasonal suite compatibility noted
5. No content that would fail equity review

---

## TECHNICAL SPECIFICATIONS

### Seasonal Suite Integration
All hero colors must work across 13 seasonal suites:
```
Suite 1 (Spring):     #4ade80 / #f472b6 / #fbbf24
Suite 2 (Cherry):     #f472b6 / #fb7185 / #fcd34d
Suite 3 (Summer):     #fbbf24 / #f97316 / #3b82f6
Suite 4 (Ocean):      #3b82f6 / #06b6d4 / #22d3ee
Suite 5 (Autumn):     #a855f7 / #8b5cf6 / #d946ef
Suite 6 (Harvest):    #10b981 / #059669 / #14b8a6
Suite 7 (Winter):     #6366f1 / #8b5cf6 / #ec4899
Suite 8 (Frost):      #94a3b8 / #cbd5e1 / #e2e8f0
Suite 9 (Ember):      #dc2626 / #991b1b / #fbbf24
Suite 10 (Starlight): #818cf8 / #6366f1 / #c084fc
Suite 11 (Void):      #1e293b / #334155 / #475569
Suite 12 (Nebula):    #c084fc / #a855f7 / #22d3ee
Suite 13 (Exclusive): #0f172a / #1e1b4b / prism gradient
```

### Web Asset Specs
- **Portraits:** SVG, 512x512 viewBox
- **CSS Variables:** `--hero-{id}-primary`, `--hero-{id}-secondary`
- **Animations:** CSS keyframes, 300-500ms duration
- **States:** idle (subtle float), hover (scale + glow), active (bounce), celebrating (shimmer)

### Godot Asset Specs
- **Sprite Sheets:** PNG, 64x64 cells, 4-8 frames per animation
- **Theme Resources:** `res://themes/heroes/{id}.tres`
- **Tween Curves:** Ease-out for entrances, ease-in-out for loops
- **Dialogue:** `.dialogue` resource files for each hero

---

## ESCALATION TRIGGERS

**Escalate to TL-H1 immediately if:**
- Task will exceed 12-hour estimate by >2 hours
- Design decision affects other hero (cross-agent dependency)
- Unclear requirements or conflicting guidance
- Technical blocker (tooling, asset pipeline)

**TL-H1 will escalate to Foreman if:**
- Cross-pipeline dependency identified
- Scope change needed to hero/villain count
- Quality gate at risk
- Agent performance concern

---

## SUCCESS CRITERIA

### Phase 1 Completion Definition
- [ ] 5 hero bibles approved (Sol, Lun, Bin, Fat, Uni)
- [ ] 3 villain bibles approved (ADORE, HYBER, Vexor)
- [ ] All bibles include cross-platform asset specs
- [ ] Synergy mechanics documented
- [ ] TL pre-review passed
- [ ] Foreman final approval granted

### Individual Success Metrics
| Metric | Target |
|--------|--------|
| Bible completeness | 100% of sections filled |
| Format consistency | All files follow template |
| WCAG compliance | AA contrast on all colors |
| Asset spec clarity | Clear enough for implementation |
| Timeline adherence | Within ±1 day of estimate |

---

## RESOURCES

### Reference Documents
- `docs/HEROES_MASCOTS_MASTER_PLAN.md` — Full pipeline context
- `STYLE_BRIEF.md` — Project coding standards
- `.job-board/TEAM_LEADER_FRAMEWORK.md` — TL coordination protocols

### Source Material (from 18adbe1e)
Check `archive/heroes-concept-18adbe1e/` for:
- Original color palettes
- Initial trait definitions
- Placeholder art references

### Tools
- **Color contrast:** https://webaim.org/resources/contrastchecker/
- **CSS animation:** VS Code with Tailwind CSS IntelliSense
- **Godot sprites:** Aseprite or similar pixel art tool

---

## TIMELINE

| Phase | Duration | Milestone |
|-------|----------|-----------|
| Phase 0 | 2 hours | Setup complete, briefing delivered |
| Phase 1 | 3 days | Draft bibles ready for TL review |
| Phase 2 | 2 days | Revisions based on TL feedback |
| Phase 3 | 1 day | Final submission to Foreman |
| **Total** | **6 days** | Gate 1 approval |

---

## COMMITMENT

By proceeding with this assignment, you acknowledge:
1. Understanding of deliverables and timeline
2. Agreement to daily standup protocol
3. Commitment to escalate blockers promptly
4. Acceptance of quality gate criteria

**Questions?** Contact TL-H1 via ESCALATIONS/ directory.

---

*This briefing is version controlled. Updates will be posted in TEAM_REPORTS/CHANGELOG.md*
