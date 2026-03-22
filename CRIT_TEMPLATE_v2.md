[Ver002.000]

# CRIT Review Template v2
## 60–90 Minute Visual Critique Session

**Purpose**: Rapid, actionable visual critique of current UI and component system; produce prioritized fixes and a 2-week design backlog.  
**Session Length**: 60–90 minutes  
**Frequency**: Weekly during active design/development  
**Date**: 2026-03-22  

---

## Participants

| Role | Required | Responsibility |
|------|----------|----------------|
| **Moderator** | Yes | Design lead; keeps time, guides discussion, ensures rules followed |
| **Product Owner** | Yes | Scope decisions, priority calls, success metrics |
| **Engineer** | Yes | Feasibility assessment, implementation notes |
| **QA / Accessibility** | Recommended | a11y testing, edge cases, device testing |
| **Observers** | Optional | Stakeholders, other designers (silent unless called on) |

---

## Pre-Session Preparation

### Moderator Checklist
- [ ] Schedule session (calendar invites with video link)
- [ ] Prepare environment (deployed demo URL, staging link)
- [ ] Print/share this template
- [ ] Set up shared note-taking doc (Notion, Google Docs)
- [ ] Prepare timer for rounds

### Participant Prep
- [ ] Review current build (10 min before session)
- [ ] Note 2-3 specific observations to share
- [ ] Bring reference materials (competitors, inspirations)

### Technical Setup
- [ ] Screen sharing working
- [ ] DevTools accessible
- [ ] Lighthouse or similar tools ready
- [ ] Recording setup (optional, with consent)

---

## Agenda (90 Minutes)

| Time | Phase | Activity | Owner |
|------|-------|----------|-------|
| 0:00–0:10 | Opening | Context and goals; PO states MVP and success metrics | Product Owner |
| 0:10–0:25 | Walkthrough | Guided demo of current state; designer or dev walks through | Designer/Dev |
| 0:25–0:55 | Critique Rounds | Three 10-minute focused rounds (see below) | All |
| 0:55–1:15 | Usability & a11y | Accessibility check, keyboard testing | QA / All |
| 1:15–1:25 | Prioritization | Rank issues, assign severity and owners | Moderator |
| 1:25–1:30 | Closing | Quick recap, confirm deliverables | Moderator |

---

## Critique Rounds (10 min each)

### Round A: Visual Hierarchy & Typography (10m)
**Focus**: Type scale, spacing, information architecture

**Questions**:
- Is the heading hierarchy clear (H1 vs H2 vs H3)?
- Is body text readable (size, line height, contrast)?
- Does spacing create clear grouping?
- Is the most important information most prominent?

**Common Issues**:
- Headings too similar in size
- Body text too small or cramped
- Poor vertical rhythm
- Competing focal points

### Round B: Panels, Tabs & Interaction Patterns (10m)
**Focus**: Component consistency, affordances, feedback

**Questions**:
- Do panels read as interactive?
- Are hover and focus states clear?
- Do tabs switch smoothly with appropriate animation?
- Are buttons and links visually distinct?

**Common Issues**:
- Missing hover states
- Inconsistent padding across panels
- Tab indicator jumps instead of slides
- Button hierarchy unclear

### Round C: Motion and Performance (10m)
**Focus**: Animation quality, performance, reduced motion

**Questions**:
- Does motion clarify or distract?
- Are transitions smooth (60fps)?
- Is timing appropriate (not too slow/fast)?
- Does reduced motion fallback work?

**Common Issues**:
- Animations too slow (feels sluggish)
- Janky animations (low frame rate)
- No reduced motion support
- Over-animated (distracting)

---

## Crit Rules

### During Critique
1. **Be Specific**: Cite exact element, screen, and state
   - ❌ "The buttons look weird"
   - ✅ "The secondary button on the Match Viewer has insufficient contrast in hover state"

2. **Be Constructive**: Propose a fix or tradeoff
   - ❌ "This doesn't work"
   - ✅ "The tab underline is hard to see; consider increasing height to 3px and using the accent color"

3. **Timebox**: 10 minutes per round strictly enforced
   - Set a timer
   - Table deep discussions for after session

4. **Stay Focused**: One topic per round
   - Don't drift into implementation details
   - Save technical deep-dives for post-session

### Decision Making
Every issue must be labeled:
- **Fix Now**: Critical for MVP; address this week
- **Fix Later**: Important but not blocking; add to backlog
- **Won't Fix**: Out of scope or intentional; document why

---

## Scoring Rubric (0–5)

Rate each area during or after the session:

| Area | 0 (Poor) | 5 (Excellent) | Score |
|------|----------|---------------|-------|
| **Hierarchy** | No clear hierarchy; everything competes | Crystal clear; instant comprehension | ☐ /5 |
| **Legibility** | Unreadable; text too small or poor contrast | Excellent at all sizes | ☐ /5 |
| **Panel Affordance** | Confusing; unclear what's interactive | Clearly interactive; obvious states | ☐ /5 |
| **Motion Purpose** | Distracting or jarring | Guides attention; feels natural | ☐ /5 |
| **Performance** | Slow, janky, or unresponsive | Snappy on 3G emulation | ☐ /5 |
| **Accessibility** | Fails WCAG; keyboard traps | Meets WCAG AA; fully operable | ☐ /5 |

**Total Score**: ___ / 30  
**Goal**: ≥ 24 (4.0 average)

---

## Screen-by-Screen Checklist

For each screen reviewed, check:

### Header
- [ ] Logo present and clickable
- [ ] Search functional
- [ ] User actions accessible
- [ ] Responsive behavior works

### Hero / Title
- [ ] Correct type scale
- [ ] Appropriate spacing
- [ ] Clear call-to-action

### Panels
- [ ] Clear header with title
- [ ] Actions visible and reachable
- [ ] Hover/focus states present
- [ ] Consistent padding

### Tabs
- [ ] Keyboard operable (arrow keys)
- [ ] Active state visible
- [ ] Animated underline (if applicable)
- [ ] Logical tab order

### Data
- [ ] Numbers readable
- [ ] Status colors consistent
- [ ] Units and labels present
- [ ] Trends clearly indicated

### Motion
- [ ] Purposeful and clarifying
- [ ] Performant (60fps)
- [ ] Reduced motion supported
- [ ] Timing appropriate

### Responsive
- [ ] Layout adapts to mobile
- [ ] Hierarchy preserved
- [ ] Touch targets adequate (≥ 44px)

### Security
- [ ] No sensitive info visible
- [ ] No secrets in source
- [ ] Security headers present

---

## Issue Capture Template

During the session, capture each issue using this format:

```markdown
### ISSUE-{NN}: [Short Title]

**Screen / Selector**: Where it appears
- URL: `/demo/match`
- Element: `.match-viewer .timeline`

**Severity**: High / Medium / Low

**Description**: 
What the issue is and why it matters.

**Current Behavior**:
What happens now.

**Expected Behavior**:
What should happen.

**Recommendation**:
Specific change to make.

**Screenshot / Reference**:
Link or attachment.

**Owner**: Name

**Due**: Date or sprint

**Decision**: Fix Now / Fix Later / Won't Fix
```

### Severity Definitions

| Severity | Criteria | Timeline |
|----------|----------|----------|
| **High** | Blocks release; major UX issue; a11y violation | Fix within 1 week |
| **Medium** | Noticeable degradation; confusing but workaround exists | Fix within 2 weeks |
| **Low** | Minor polish; nice-to-have | Fix when convenient |

---

## Post-Session Deliverables

### Immediate (End of Session)
- [ ] Completed issue list with severity labels
- [ ] Scoring rubric filled
- [ ] Decisions documented (Fix Now / Later / Won't)

### Within 24 Hours
- [ ] Meeting notes shared with all participants
- [ ] Issues entered into project tracker (GitHub Issues, Jira, etc.)
- [ ] Critical issues assigned and started

### Within 1 Week
- [ ] 2-week design backlog created
- [ ] Updated component library (if changes agreed)
- [ ] Follow-up CRIT scheduled

---

## Sample Output

```markdown
# CRIT Session: 2026-03-22
**Focus**: Match Viewer + Hub Tabs
**Attendees**: Alice (Design), Bob (FE), Carol (PO)

## Scores
- Hierarchy: 4/5
- Legibility: 5/5
- Panel Affordance: 3/5
- Motion Purpose: 4/5
- Performance: 5/5
- Accessibility: 3/5
- **Total: 24/30**

## Fix Now
- [ ] ISSUE-01: Tab underline not visible on mobile (Alice, 2 days)
- [ ] ISSUE-02: Match timeline missing keyboard focus (Bob, 1 day)

## Fix Later
- [ ] ISSUE-03: Panel shadows inconsistent (Alice, next sprint)
- [ ] ISSUE-04: Hover states too subtle (Bob, next sprint)

## Won't Fix
- [ ] ISSUE-05: Add 3D canvas to match viewer (out of MVP scope)
```

---

## Tips for Effective CRITs

### Do
- Start with the positive (what's working well)
- Use "I" statements ("I found this confusing" vs "This is bad")
- Reference the design brief (STYLE_BRIEF_v2.md)
- Take screenshots for reference
- Assign single owners (not teams)

### Don't
- Get defensive (designers, this is for you)
- Solve in the room (capture, prioritize, solve later)
- Skip the rubric (it keeps critique objective)
- Forget accessibility (test with keyboard)
- Leave without next steps

---

## References

- **Design Brief**: `STYLE_BRIEF_v2.md`
- **MVP Spec**: `MVP_v2.md`
- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **Lighthouse**: https://developers.google.com/web/tools/lighthouse

---

*Document Version: [Ver002.000]*  
*Last Updated: 2026-03-22*  
*Owner: Design Lead / Moderator*
