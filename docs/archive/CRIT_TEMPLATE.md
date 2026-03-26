[Ver001.000]

# CRIT Review Session Template
## 60–90 Minute Visual Critique Session

**Purpose**: Rapid, actionable visual critique of current UI and component system; produce prioritized fixes and a 2-week design backlog.

**Duration**: 60–90 minutes  
**Frequency**: Weekly during active design/development phases  
**Status**: Ready to use  

---

## Participants

| Role | Required | Responsibility |
|------|----------|----------------|
| **Moderator** | Yes | Design lead; keeps time, guides discussion |
| **Product Owner** | Yes | Scope decisions, priority calls |
| **Frontend Engineer** | Yes | Feasibility assessment, implementation notes |
| **Visual Designer** | Yes | Design system consistency, aesthetic judgment |
| **Interaction Designer** | Recommended | Motion, accessibility, UX flow |
| **Stakeholder** | Optional | Business context, user perspective |

---

## Agenda (Timed)

| Time | Phase | Activity | Output |
|------|-------|----------|--------|
| 0:00–0:05 | **Opening** | Context and goals (Moderator) | Shared understanding |
| 0:05–0:15 | **Walkthrough** | Live demo of current state | Record observations |
| 0:15–0:30 | **Heuristic Review** | Checklist-based critique | Issue list |
| 0:30–0:50 | **Component Deep Dive** | Tabs, Panels, Replay viewer, Data cards | Detailed findings |
| 0:50–1:05 | **Prioritization** | Rank issues, assign severity | Prioritized backlog |
| 1:05–1:20 | **Action Items** | Assign owners, set ETAs | Owner assignments |
| 1:20–1:30 | **Closing** | Confirm deliverables, next steps | Meeting notes |

---

## Pre-Session Preparation

### For Moderator
- [ ] Schedule session (calendar invites)
- [ ] Prepare environment (deployed demo, Figma, staging URL)
- [ ] Print/share heuristic checklist
- [ ] Set up note-taking (shared doc)

### For Participants
- [ ] Review current build/staging site (10 min before)
- [ ] Note 2-3 observations to share
- [ ] Bring reference materials (competitors, inspirations)

### Technical Setup
- [ ] Screen sharing working
- [ ] DevTools accessible (for inspection)
- [ ] Lighthouse/similar tools ready
- [ ] Recording (optional, with consent)

---

## Heuristic Checklist

### Typography & Hierarchy
- [ ] **Heading scale**: H1–H3 clearly distinct; hierarchy obvious
- [ ] **Body readability**: Font choice readable; size 16px minimum
- [ ] **Line length**: Max 65-75ch for body text
- [ ] **Font consistency**: Single sans for UI, consistent weights
- [ ] **Optical sizing**: Display cuts for large headings, text cuts for body

**Score**: ☐ Pass ☐ Needs work ☐ Critical

### Color & Visual Design
- [ ] **Accent usage**: Consistent hub accents; not overused
- [ ] **Status clarity**: Success/warning/error colors meaningful
- [ ] **Contrast ratios**: Body text ≥ 4.5:1; large text ≥ 3:1
- [ ] **Background layers**: Clear hierarchy (page → card → elevated)
- [ ] **Border usage**: Subtle, consistent; not distracting

**Score**: ☐ Pass ☐ Needs work ☐ Critical

### Spacing & Layout
- [ ] **Vertical rhythm**: Consistent spacing between sections
- [ ] **Gutter consistency**: Grid gaps uniform across components
- [ ] **Padding balance**: Internal spacing feels balanced
- [ ] **Container alignment**: Content aligned to grid; not arbitrary
- [ ] **Whitespace**: Generous but not excessive

**Score**: ☐ Pass ☐ Needs work ☐ Critical

### Components & Interactions
- [ ] **Panels as cards**: Read as interactive where appropriate
- [ ] **Hover states**: Clear feedback on interactive elements
- [ ] **Focus states**: Visible, consistent (3px outline)
- [ ] **Button hierarchy**: Primary/secondary/ghost distinct
- [ ] **Tab clarity**: Active state obvious; keyboard accessible

**Score**: ☐ Pass ☐ Needs work ☐ Critical

### Motion & Animation
- [ ] **Purposeful motion**: Animations clarify, not distract
- [ ] **Timing**: Fast enough (200-300ms) to feel responsive
- [ ] **Easing**: Smooth curves; not linear/robotic
- [ ] **Stagger**: Sequential panel reveals feel natural
- [ ] **Reduced motion**: Respects user preference

**Score**: ☐ Pass ☐ Needs work ☐ Critical

### Data Legibility
- [ ] **Tables readable**: Scannable at glance; alignment consistent
- [ ] **Number formatting**: Units clear; decimals meaningful
- [ ] **Charts clear**: Axes labeled; legends present
- [ ] **Status indicators**: Badges communicate state instantly
- [ ] **Timestamps**: Consistent format; timezone clear

**Score**: ☐ Pass ☐ Needs work ☐ Critical

### Branding & Identity
- [ ] **Hub distinction**: Each hub has unique accent/micro-motion
- [ ] **Logo presence**: Appropriate sizing; clear brand
- [ ] **Tone consistency**: Voice matches platform personality
- [ ] **Empty states**: On-brand illustrations/messaging
- [ ] **Loading states**: Branded skeletons/spinners

**Score**: ☐ Pass ☐ Needs work ☐ Critical

### Performance
- [ ] **Page load**: First meaningful paint < 2.5s
- [ ] **Animation smooth**: 60fps on target devices
- [ ] **Image optimization**: Appropriate formats, lazy loading
- [ ] **Bundle size**: Initial load < 200KB

**Score**: ☐ Pass ☐ Needs work ☐ Critical

### Accessibility
- [ ] **Keyboard nav**: All interactive elements reachable
- [ ] **Focus order**: Logical tab sequence
- [ ] **Screen reader**: Semantic HTML; ARIA where needed
- [ ] **Color independence**: Info not conveyed by color alone
- [ ] **Text resize**: Readable at 200% zoom

**Score**: ☐ Pass ☐ Needs work ☐ Critical

---

## Component Deep Dive Guide

### Tabs Component
**Questions to answer**:
1. Active state: Is it obvious which tab is selected?
2. Animation: Does the indicator move smoothly?
3. Keyboard: Can you navigate with arrow keys?
4. Content: Does panel content fade/animate appropriately?
5. Mobile: Does it adapt to small screens?

**Common issues**:
- Indicator jumps instead of slides
- Content flashes or doesn't animate
- No keyboard navigation
- Tab text wraps awkwardly

### Panel Component
**Questions to answer**:
1. Elevation: Do shadows communicate depth?
2. Hover: Is the hover state noticeable but subtle?
3. Content: Is padding consistent across instances?
4. Header: Is the panel title hierarchy clear?
5. Actions: Are action buttons positioned consistently?

**Common issues**:
- Inconsistent padding
- Shadows too heavy or too light
- No hover feedback
- Header typography inconsistent

### Replay Viewer
**Questions to answer**:
1. Canvas: Is the replay area prominent?
2. Timeline: Is scrubbing smooth and responsive?
3. Markers: Are event markers visible and clickable?
4. Side panel: Does it update contextually?
5. Controls: Are play/pause/scrub controls intuitive?

**Common issues**:
- Timeline too small
- Markers overlap or are hard to click
- Side panel doesn't sync with timeline
- Controls hidden or unclear

### Data Card
**Questions to answer**:
1. Hierarchy: Is the KPI the most prominent element?
2. Trend: Is direction (up/down) clear?
3. Sparkline: Does it add value or clutter?
4. Actions: Are secondary actions discoverable?
5. Responsive: Does it adapt to narrow containers?

**Common issues**:
- Numbers too small
- Trend indicators missing or unclear
- Too much information packed in
- Doesn't stack well on mobile

---

## Issue Capture Template

During the session, capture each issue using this format:

```markdown
### ISSUE-{NN}: [Short Title]

**Severity**: Critical / High / Medium / Low
**Category**: Typography / Color / Layout / Component / Motion / A11y / Performance

**Description**:
1-2 sentences describing the problem.

**Current Behavior**:
What happens now.

**Expected Behavior**:
What should happen.

**Suggested Fix**:
Specific recommendation or code hint.

**Reference**:
Screenshot, URL, or Figma link.

**Owner**: [Name/Role]
**ETA**: [Hours/Days]
```

### Severity Definitions

| Severity | Definition | Action |
|----------|------------|--------|
| **Critical** | Blocks release; major user impact | Fix within 24-48 hours |
| **High** | Significant UX degradation | Fix within 1 week |
| **Medium** | Noticeable but not blocking | Fix within 2 weeks |
| **Low** | Minor polish, nice-to-have | Fix when convenient |

---

## Prioritization Matrix

After capturing issues, plot them on this matrix:

```
        HIGH IMPACT
             │
    Quick    │    Major
    Wins     │    Projects
    ─────────┼───────────
    Fill-ins │    Thankless
             │    Tasks
             │
        LOW IMPACT
        
    LOW EFFORT    HIGH EFFORT
```

**Prioritize in this order**:
1. **Quick Wins** (High Impact, Low Effort) — Do first
2. **Major Projects** (High Impact, High Effort) — Plan carefully
3. **Fill-ins** (Low Impact, Low Effort) — Batch together
4. **Thankless Tasks** (Low Impact, High Effort) — Defer or drop

---

## Output Deliverables

### Immediate (End of Session)
- [ ] Issue list (Markdown or CSV)
- [ ] Priority matrix screenshot/notes
- [ ] Owner assignments with ETAs

### Within 24 Hours
- [ ] Meeting notes shared
- [ ] Issues entered into project tracker
- [ ] Critical issues assigned and started

### Within 1 Week
- [ ] 2-week design backlog created
- [ ] Updated `STYLE_BRIEF.md` (if tokens changed)
- [ ] Follow-up CRIT scheduled

---

## Sample Output: Issue List

```markdown
## CRIT Session: 2026-03-22
**Attendees**: Alice (Design), Bob (Frontend), Carol (PM)
**Focus**: Hub shell + Match viewer

### Critical
- [ ] **ISSUE-01**: Tab indicator jumps instead of sliding
  - Owner: Bob, ETA: 2 days

### High
- [ ] **ISSUE-02**: Panel hover state too subtle
  - Owner: Alice, ETA: 1 day
- [ ] **ISSUE-03**: Replay timeline markers overlap
  - Owner: Bob, ETA: 3 days

### Medium
- [ ] **ISSUE-04**: H3 and H4 sizes too similar
  - Owner: Alice, ETA: 1 day
- [ ] **ISSUE-05**: Data card sparkline missing on mobile
  - Owner: Bob, ETA: 2 days

### Low
- [ ] **ISSUE-06**: Footer links need more spacing
  - Owner: Alice, ETA: 30 min
```

---

## Follow-Up CRIT Checklist

Before the next session:
- [ ] Review action items from previous CRIT
- [ ] Deploy latest changes to staging
- [ ] Update component library/Figma
- [ ] Prepare specific focus area
- [ ] Send reminder with staging URL

---

## Tips for Effective CRITs

### Do
- **Timebox** each phase strictly
- **Focus on specifics**, not general likes/dislikes
- **Reference the brief** (STYLE_BRIEF.md)
- **Capture screenshots** for reference
- **Assign owners** with clear ETAs

### Don't
- Let discussions derail into implementation details
- Skip the checklist (it's comprehensive for a reason)
- Forget to check accessibility
- Leave without action items
- Schedule without a deployed demo to review

---

## Appendix: Reference Documents

- `STYLE_BRIEF.md` — Design tokens and principles
- `MVP.md` — Scope and acceptance criteria
- `MVP_BACKLOG.md` — Prioritized development tasks
- Component library (Storybook/Figma)
- Staging URL

---

*Document Version: [Ver001.000]*  
*Next Review: After first CRIT session*  
*Owner: Design Lead / Moderator*
