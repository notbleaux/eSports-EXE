<!--
╔════════════════════════════════════════════════════════════╗
║  FILE CREATED BY: ASSISTANT FOREMAN AF-001 🟠              ║
║  ROLE: 🟠 ORANGE — Meta-review, Verification, Partitioning ║
║  AUTHORITY: Below 🔴 FOREMAN, Above 🟡 TEAM LEADERS        ║
║  CONTACT: Via JLB 07_ASSISTANT_FOREMAN/ or F delegation    ║
╚════════════════════════════════════════════════════════════╝
-->

[Ver001.000]

# PARTITIONED PLAN — TL-H1 Wave 1.1 Heroes & Mascots
**Original Plan By:** TL-H1 (Agent 1-A)  
**Partitioned By:** AF-001 🟠  
**Partition Date:** March 23, 2026  
**Foreman Approval:** PENDING

---

## 🟢 SUB-AGENT OBLIGATIONS

### Agent 1-B — Sol & Lun Character Bibles

**Deliverables (unchanged from TL plan):**
- [ ] `docs/heroes/sol-bible.md` — 5 required sections
- [ ] `docs/heroes/lun-bible.md` — 5 required sections  
- [ ] `docs/heroes/sol-lun-synergy.md` — Synergy mechanics

**Section Requirements (per character):**
1. Visual Identity (hex colors, CSS vars, Godot resources)
2. Personality Matrix (5 traits, 3 quirks, 1 flaw)
3. Animation Personality (idle, hover, active, celebrating)
4. Cross-Platform Assets (SVG specs, sprite sheet specs)
5. Synergy Mechanics (how they interact)

**AF-Supplied Acceptance Criteria:**
- [ ] Colors pass WCAG AA contrast (use webaim.org)
- [ ] Animations include `prefers-reduced-motion` alternative
- [ ] All hex codes tested against all 13 seasonal suites
- [ ] Sprite sheet specs include frame count and dimensions

**Daily Obligations:**
- [ ] Submit progress update by 09:00 UTC to TEAM_REPORTS/
- [ ] Post blockers immediately to ESCALATIONS/
- [ ] End-of-day commit with descriptive messages

---

### Agent 1-C — Bin, Fat, Uni + Villains

**Deliverables (unchanged from TL plan):**
- [ ] `docs/heroes/bin-bible.md`
- [ ] `docs/heroes/fat-bible.md`
- [ ] `docs/heroes/uni-bible.md`
- [ ] `docs/heroes/bin-fat-uni-triad.md`
- [ ] `docs/villains/adore-bible.md`
- [ ] `docs/villains/hyber-bible.md`
- [ ] `docs/villains/vexor-bible.md`
- [ ] `docs/villains/roster-overview.md`

**Additional Villain Sections (AF clarification):**
- Opposition Mapping: Which hero value they oppose
- Visual Contrast: Inverse color theory notes
- Narrative Hooks: 2-3 story moment ideas
- Godot Integration: Boss encounter concept sketch

**AF-Supplied Acceptance Criteria:**
- [ ] Villains have clear philosophical opposition to heroes
- [ ] Color palettes are complementary (not clashing)
- [ ] Each villain has at least 1 narrative hook
- [ ] No stereotyping or harmful tropes in character design

**Daily Obligations:**
- [ ] Submit progress update by 09:00 UTC to TEAM_REPORTS/
- [ ] Post blockers immediately to ESCALATIONS/
- [ ] End-of-day commit with descriptive messages

---

## 🟡 TEAM LEADER OBLIGATIONS

### TL-H1 Core Responsibilities

**Daily (by 18:00 UTC):**
- [ ] Review both agent progress updates
- [ ] Conduct mid-day check-in at 14:00 UTC (if needed)
- [ ] Update TEAM_REPORT_002.md with team status
- [ ] Pre-review any agent submissions before Foreman review

**Coordination:**
- [ ] Ensure Sol/Lun synergy document is consistent with Bin/Fat/Uni triad
- [ ] Verify seasonal suite compatibility across all 5 heroes
- [ ] Maintain style consistency between 1-B and 1-C outputs

**Quality Gate 1 Enforcement (Day 4):**
- [ ] All bibles use consistent format
- [ ] Colors pass WCAG contrast checks
- [ ] Animations respect `prefers-reduced-motion`
- [ ] No stereotyping in character design
- [ ] Villains have clear opposition mapping

**Escalation Management:**
- [ ] Review agent blockers within 2 hours
- [ ] Escalate to Foreman if: cross-pipeline deps, scope changes, quality risks
- [ ] Document all decisions in TEAM_REPORTS/

**AF Review Points:**
- [ ] Submit Gate 1 results to AF for R3 verification by Day 4 end
- [ ] Request AF spot-check if unsure about any submission

---

## 🟠 ASSISTANT FOREMAN OBLIGATIONS

### AF-001 Supplementary Tasks

**R2 Code Quality Spot-check (Day 3):**
- [ ] Review 1 random bible file from Agent 1-B
- [ ] Review 1 random bible file from Agent 1-C
- [ ] Check format consistency across both agents
- [ ] Document findings in R2_QUALITY_20260326.md

**R3 Dependency Tracking (Daily):**
- [ ] Verify TL-H2 dependency readiness (blocking check)
- [ ] Track color spec delivery timeline
- [ ] Update dependency matrix in VERIFICATION_ROUNDS/

**R4 Timeline Check (Day 2, Day 4):**
- [ ] Day 2: Verify Phase 1 progress (draft bibles on track)
- [ ] Day 4: Verify Gate 1 completion status
- [ ] Flag any timeline risks to Foreman

**Supplementary Documentation:**
- [ ] Create `docs/heroes/README.md` index (AF-supplied)
- [ ] Create `docs/villains/README.md` index (AF-supplied)
- [ ] Ensure cross-linking between hero/villain docs

**Accessibility Review:**
- [ ] AF will run WCAG contrast checker on all color specs
- [ ] AF will verify reduced-motion alternatives specified
- [ ] Report any issues to TL-H1 within 4 hours

---

### AF Verification Schedule for TL-H1

| Round | Date | Focus |
|-------|------|-------|
| R1 | 2026-03-23 | ✅ Plan completeness (COMPLETE) |
| R2 | 2026-03-26 | Code quality spot-checks |
| R3 | Daily | Dependency tracking (TL-H2) |
| R4 | 2026-03-25, 27 | Timeline adherence |
| R6 | 2026-03-26 | Documentation completeness |

---

## 🔴 FOREMAN OBLIGATIONS

### F Authority Reserved

**Approval Required:**
- [ ] Final approval of this partitioned plan
- [ ] Gate 1 completion sign-off (Day 6)
- [ ] Any scope changes to hero/villain count
- [ ] Cross-pipeline hero overlay integration (TL-H1 → TL-S8)

**F Sign-off Required:**
```
Partitioned plan approved: _____________ Date: _______
Phase 1 completion verified: _____________ Date: _______
```

**Escalation Triggers (TL-H1 → F):**
- Cross-pipeline dependency identified
- Scope change needed
- Quality gate at risk
- Agent performance concern

**AF Escalation to F:**
- Timeline risks detected in R4 check
- Dependency blocking beyond TL-H1 control
- Code quality issues in R2 spot-check

---

## CLEAR DIVISION SUMMARY

| Task | 1-B | 1-C | TL-H1 | AF-001 | F |
|------|-----|-----|-------|--------|---|
| Write Sol/Lun bibles | 🟢 | — | — | — | — |
| Write Bin/Fat/Uni bibles | — | 🟢 | — | — | — |
| Write villain bibles | — | 🟢 | — | — | — |
| Daily coordination | — | — | 🟡 | — | — |
| Quality Gate 1 | — | — | 🟡 | 🟠 | — |
| Code spot-checks | — | — | — | 🟠 | — |
| Final approval | — | — | — | — | 🔴 |

---

## SUCCESS CRITERIA (Partitioned)

### Agent 1-B Success
- [ ] 2 hero bibles complete with all 5 sections
- [ ] Synergy document links both characters
- [ ] WCAG AA contrast on all colors
- [ ] Reduced-motion alternatives specified

### Agent 1-C Success
- [ ] 3 hero bibles complete with all 5 sections
- [ ] Triad document shows philosophical connections
- [ ] 3 villain bibles complete with opposition mapping
- [ ] Roster overview ties everything together

### TL-H1 Success
- [ ] Both agents complete within 6 days
- [ ] Quality Gate 1 passed
- [ ] No blockers exceeding 4 hours
- [ ] Daily reports submitted on time

### AF-001 Success
- [ ] R2, R3, R4 verifications completed
- [ ] Supplementary documentation delivered
- [ ] No timeline risks escalated to F (unless real)

### Phase 1 Completion (F Approval)
- [ ] 5 hero bibles approved
- [ ] 3 villain bibles approved
- [ ] All cross-platform specs clear
- [ ] Synergy mechanics documented

---

## VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| Ver001.000 | 2026-03-23 | Initial partition by AF-001 |

---

**Original Plan:** TL-H1 AGENT_BRIEFING.md  
**Partitioned By:** AF-001 🟠 Assistant Foreman  
**Awaiting:** 🔴 Foreman Approval

---

**AF-001** 🟠 Assistant Foreman  
Meta-Coordination & Verification  
Reporting to: 🔴 Foreman
