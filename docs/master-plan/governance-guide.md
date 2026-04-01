# Master Plan Governance Guide

## Overview

This guide explains how to use the Master Plan system to prevent Design Drift and Architecture Drift.

## What is "Drift"?

### Design Drift
When the UI/UX gradually becomes inconsistent:
- Colors deviate from the palette
- Typography becomes inconsistent
- Components vary across HUBs
- User experience fragments

**Prevention:** Design token system + validation script

### Architecture Drift
When the codebase structure degrades:
- HUBs start importing from each other
- New dependencies violate tech stack decisions
- Data models become inconsistent
- Boundaries blur

**Prevention:** ADR process + architecture reviews

---

## The Governance Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    MASTER PLAN                               │
│              (Single Source of Truth)                        │
│  ┌──────────────┬──────────────┬──────────────┐            │
│  │   5 Pillars  │  Boundaries  │  Contracts   │            │
│  └──────────────┴──────────────┴──────────────┘            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              DECISION MAKING PROCESS                         │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ TIER 1:    │  │ TIER 2:    │  │ TIER 3:    │            │
│  │ Master Plan│  │ Design/    │  │ Technical  │            │
│  │ Changes    │  │ Arch       │  │ Lead       │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│       │                │                │                   │
│       ▼                ▼                ▼                   │
│  ┌─────────────────────────────────────────────┐           │
│  │           Architecture Review                │           │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │           │
│  │  │ ADR  │ │ Code │ │Design│ │Tests │      │           │
│  │  │Review│ │Review│ │Review│ │Review│      │           │
│  │  └──────┘ └──────┘ └──────┘ └──────┘      │           │
│  └─────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    VALIDATION                                │
│                                                              │
│  ┌──────────────────────────────────────────┐              │
│  │  ./scripts/validate-master-plan.sh       │              │
│  │                                            │              │
│  │  ✓ HUB isolation                           │              │
│  │  ✓ Design token usage                      │              │
│  │  ✓ TypeScript compliance                   │              │
│  │  ✓ Documentation presence                  │              │
│  └──────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

---

## When to Create an ADR

Create an ADR when:

1. **Adding a new technology**
   - New npm package
   - New Python dependency
   - New service or infrastructure

2. **Changing architecture boundaries**
   - Modifying HUB structure
   - Adding new services
   - Changing data flow

3. **Modifying design system**
   - New colors
   - New typography
   - New component patterns

4. **Changing API contracts**
   - New endpoints
   - Breaking changes
   - New response formats

**Don't create an ADR for:**
- Bug fixes
- Refactoring without architectural impact
- Adding existing pattern components
- Documentation improvements

---

## Decision Tiers

### TIER 1: Master Plan Changes
**Approver:** Elijah Bleaux only

**Scope:**
- Changes to strategic pillars
- Modifications to TENET architecture
- Tech stack changes
- Major roadmap shifts

**Process:**
1. Create ADR with detailed justification
2. Schedule review meeting
3. Get written approval
4. Update Master Plan
5. Announce to team

### TIER 2: Design System / Architecture
**Approver:** Design Lead + Technical Lead

**Scope:**
- New design tokens
- New component patterns
- API contract changes
- Service modifications

**Process:**
1. Create ADR
2. Post in #architecture channel
3. 48-hour review period
4. Address feedback
5. Merge ADR as "Accepted"

### TIER 3: Feature Implementation
**Approver:** Technical Lead

**Scope:**
- Features within existing architecture
- Component development
- Bug fixes
- Performance improvements

**Process:**
1. Standard code review
2. CI passes
3. Merge

---

## The ADR Lifecycle

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Proposed │────▶│ Accepted │────▶│Deprecated│
└──────────┘     └──────────┘     └──────────┘
                      │
                      ▼
                ┌──────────┐
                │Superseded│
                │ by ADR-X │
                └──────────┘
```

### Status Meanings

**Proposed**
- Under discussion
- Seeking feedback
- Not yet approved

**Accepted**
- Approved and in effect
- Must be followed
- Document is locked

**Deprecated**
- No longer in effect
- Kept for history
- Don't follow anymore

**Superseded**
- Replaced by newer ADR
- Link to replacement included
- Historical reference only

---

## Weekly Architecture Review

**When:** Every Friday, 30 minutes  
**Attendees:** Technical Lead, Design Lead, key contributors  
**Agenda:**

1. Review ADRs from the week (10 min)
2. Check validation script results (5 min)
3. Discuss upcoming architectural decisions (10 min)
4. Update roadmap if needed (5 min)

**Outputs:**
- ADR status updates
- Action items for next week
- Roadmap adjustments

---

## Monthly Master Plan Audit

**When:** First Monday of each month  
**Duration:** 1 hour  
**Attendees:** Full team

**Checklist:**

- [ ] Does the code match the Master Plan?
- [ ] Are there undocumented deviations?
- [ ] Are ADRs being followed?
- [ ] Is the roadmap on track?
- [ ] Should the Master Plan evolve?

**Outputs:**
- Master Plan update PR (if needed)
- New ADRs for discovered issues
- Roadmap adjustments

---

## Validation Script

The `validate-master-plan.sh` script checks for common violations:

### What It Checks

1. **HUB Isolation**
   - Ensures HUBs don't import from each other
   - Validates shared/ is used for cross-HUB code

2. **Design Token Usage**
   - Detects hardcoded colors
   - Flags potential design drift

3. **TypeScript Compliance**
   - Ensures zero TypeScript errors
   - Validates type safety

4. **Documentation Presence**
   - Checks Master Plan exists
   - Verifies ADR index

5. **Test Coverage**
   - Warns if no tests found
   - Encourages test discipline

6. **Component Documentation**
   - Checks for JSDoc comments
   - Ensures UI components documented

### Running the Script

```bash
# From project root
./scripts/validate-master-plan.sh

# In CI/CD
- name: Validate Master Plan
  run: ./scripts/validate-master-plan.sh
```

### Exit Codes

- `0` — All checks passed (or warnings only)
- `1` — Errors found, fix required

---

## Common Violations and Fixes

### Violation: Cross-HUB Import

**Problem:**
```typescript
// In hub-2-rotas/index.tsx
import { SomeComponent } from '../hub-1-sator/components';
```

**Fix:**
1. Move component to `shared/components/`
2. Update import:
```typescript
import { SomeComponent } from '@/components/shared';
```

### Violation: Hardcoded Color

**Problem:**
```css
.my-class {
  color: #FF4655;
}
```

**Fix:**
```css
.my-class {
  color: theme('colors.accent.opera');
}
```

Or use Tailwind class:
```html
<div class="text-accent-opera">
```

### Violation: Missing ADR

**Problem:** Added new technology without documenting decision.

**Fix:**
1. Create ADR retroactively
2. Document why the technology was chosen
3. List alternatives considered
4. Submit for review

---

## Best Practices

### For Developers

1. **Read before coding**
   - Check Master Plan for boundaries
   - Review relevant ADRs
   - Understand design tokens

2. **Write ADRs early**
   - Don't wait until after implementation
   - Propose before committing
   - Seek feedback

3. **Run validation often**
   - Before committing
   - Before pushing
   - In CI/CD pipeline

4. **Ask questions**
   - When in doubt, ask in #architecture
   - Better to clarify than drift

### For Leads

1. **Enforce governance**
   - Don't approve PRs that violate ADRs
   - Require ADRs for Tier 2+ changes
   - Run validation in CI

2. **Keep documentation current**
   - Update Master Plan quarterly
   - Archive outdated ADRs
   - Maintain roadmap

3. **Review regularly**
   - Weekly architecture reviews
   - Monthly Master Plan audits
   - Quarterly strategy sessions

---

## Resources

- [Master Plan](../master-plan/master-plan.md)
- [ADR Template](../adrs/adr-template.md)
- [Design System](../design-system/README.md)
- [Roadmap](../roadmap/roadmap.md)

---

## FAQ

**Q: Can I modify the Master Plan?**

A: Only Elijah can approve Master Plan changes. Create an ADR proposing the change.

**Q: What if I need to violate an ADR for an emergency fix?**

A: Document it! Create a follow-up ADR explaining why the violation was necessary.

**Q: How detailed should ADRs be?**

A: Enough that someone 6 months from now understands the decision and its trade-offs.

**Q: Can ADRs be changed after acceptance?**

A: No. Create a new ADR that supersedes the old one. Keep history intact.

**Q: What if validation fails but I disagree?**

A: Create an ADR proposing a change to the validation rules. Don't bypass checks.

---

*Remember: The Master Plan is a living document, but changes require intention, not drift.*
