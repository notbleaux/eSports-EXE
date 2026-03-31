# Master Plan Team Enablement Program

**Program ID:** TEP-001  
**Version:** 1.0  
**Audience:** All engineering team members  
**Duration:** 2 hours (self-paced) + 30 min assessment  
**Prerequisite:** None

---

## Program Overview

The Master Plan is the single source of truth for eSports-EXE architecture. This certification program ensures all team members understand:

1. The five strategic pillars
2. The TENET four-HUB architecture
3. The ADR (Architecture Decision Record) process
4. Design token usage and validation
5. Governance model and approval tiers

**Certification Required Before:**
- Merging code to main branch
- Creating new HUBs or major components
- Proposing architectural changes

---

## Module 1: Master Plan Fundamentals (30 min)

### 1.1 The Five Strategic Pillars

Read: `docs/master-plan/master-plan.md` (Section: Strategic Pillars)

**Key Points:**
- **Cross-Game Unification:** Single interface for Valorant, CS2, and future games
- **Progressive Disclosure:** Interface adapts to user expertise (casual → pro)
- **Historical Authority:** Data integrity and audit trail
- **Community-Driven Intelligence:** User contributions improve data quality
- **Technical Excellence:** Performance, reliability, maintainability

**Knowledge Check:**
```
Q: Why is Progressive Disclosure important for ROTAS?
A: Because HLTV-style dense stats overwhelm casual users; 
   progressive disclosure shows complexity only when needed.
```

### 1.2 The TENET Architecture

Read: `docs/adrs/adr-001-tenet-architecture.md`

**The Four HUBs:**

| HUB | Purpose | Data Density | User Type |
|-----|---------|--------------|-----------|
| ROTAS | Raw statistics | Very High | Analysts |
| SATOR | Advanced analytics | High | Coaches |
| OPERA | Pro scene info | Medium | Fans |
| AREPO | Community | Variable | Everyone |

**The Sator Square Connection:**
```
S A T O R
A R E P O
T E N E T
O P E R A
R O T A S
```

This is a palindrome. It reads the same forwards, backwards, and in the four directions of the square. The architecture reflects this — each HUB connects to every other HUB through TENET.

**Knowledge Check:**
```
Q: Can ROTAS import code from SATOR?
A: No. HUBs cannot import from other HUBs. Shared code goes in shared/.
```

---

## Module 2: Architecture Decision Records (30 min)

### 2.1 What is an ADR?

An ADR documents significant architectural decisions. Once accepted, it cannot be modified — only superseded by a new ADR.

**ADR Lifecycle:**
```
Proposed → [Discussion] → Accepted → [Implementation]
                ↓
           Rejected
                ↓
           Superseded (by new ADR)
```

### 2.2 When to Create an ADR

**Required:**
- New HUB creation
- New external service integration
- Database schema changes affecting >1 HUB
- Changes to design tokens
- Modifications to API contracts

**Not Required:**
- Bug fixes
- Component refactoring (same behavior)
- Performance optimizations
- Documentation updates

### 2.3 ADR Template

Read: `docs/adrs/adr-template.md`

**Required Sections:**
1. Title and Number
2. Status (Proposed/Accepted/Rejected/Superseded)
3. Context (what's the problem?)
4. Decision (what are we doing?)
5. Consequences (trade-offs)

### 2.4 Hands-On Exercise

**Scenario:** The team wants to add a new caching layer for SATOR ML predictions.

**Task:** Draft an ADR following the template.

**Key Considerations:**
- Which HUBs are affected? (SATOR, possibly ROTAS for data freshness)
- What are the alternatives? (Redis, in-memory, CDN)
- What are the trade-offs? (Complexity vs. performance)

---

## Module 3: Design System and Tokens (20 min)

### 3.1 Design Tokens

Read: `docs/design-system/README.md`

**Core Tokens:**

```css
/* Colors - Never hardcode these */
--color-primary-bg: #0F172A;      /* Dark slate */
--color-accent-rotas: #14B8A6;     /* Teal */
--color-accent-opera: #F97316;     /* Orange */
--color-text-primary: #F8FAFC;
--color-text-secondary: #94A3B8;
```

**Usage:**
```typescript
// ✅ Correct
import { colors } from '@/design-tokens';
background: colors.primaryBg;

// ❌ Incorrect
background: '#0F172A';  // Hardcoded color
```

### 3.2 HUB-Specific Color Usage

| HUB | Primary Accent | Usage |
|-----|----------------|-------|
| ROTAS | `#14B8A6` (Teal) | Stats, tables, leaderboards |
| SATOR | `#14B8A6` (Teal) | Analytics, predictions |
| OPERA | `#F97316` (Orange) | Match pages, broadcasts |
| AREPO | `#F97316` (Orange) | Community, forums |

### 3.3 Validation

Run the validation script:
```bash
./scripts/validate-master-plan.sh
```

**Checks:**
- No hardcoded colors in component files
- No cross-HUB imports
- All ADRs properly formatted
- TypeScript compiles with zero errors

---

## Module 4: Governance Model (20 min)

### 4.1 Three-Tier Approval System

```
┌─────────────────────────────────────────────────────────┐
│  TIER 1: Master Plan Changes                           │
│  • Approval: Eli only                                   │
│  • Examples: Changing strategic pillars, HUB boundaries │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  TIER 2: Design/Architecture Changes                   │
│  • Approval: Tech Lead + Architecture Lead              │
│  • Examples: New HUB, new service integration          │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  TIER 3: Feature Implementation                        │
│  • Approval: Tech Lead                                  │
│  • Examples: New API endpoint, new component           │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Decision Matrix

Use this to determine which tier your change needs:

| Question | If Yes |
|----------|--------|
| Does this change a strategic pillar? | Tier 1 |
| Does this create a new HUB? | Tier 1 |
| Does this affect multiple HUBs? | Tier 2 |
| Does this change a public API? | Tier 2 |
| Is this purely internal refactoring? | Tier 3 |

### 4.3 Review Cadence

- **Weekly Architecture Reviews:** Fridays 2pm
- **Monthly Master Plan Audits:** First Monday of month
- **Quarterly Strategic Reviews:** With Eli

---

## Module 5: Hands-On Workshop (20 min)

### Exercise 1: Fix a Design Token Violation

**File:** `apps/web/src/components/StatsCard.tsx`

```typescript
// Current (violates design tokens)
const styles = {
  background: '#0F172A',
  accent: '#14B8A6',
};

// Fix this to use design tokens
```

**Solution:**
```typescript
import { colors } from '@/design-tokens';

const styles = {
  background: colors.primaryBg,
  accent: colors.accentRotas,
};
```

### Exercise 2: Identify Tier Level

**Scenarios:**

1. Adding a new `/api/rotas/leaderboards/headshots` endpoint
   - **Answer:** Tier 3 (feature implementation)

2. Creating a new HUB called "MYSTIC" for match predictions
   - **Answer:** Tier 1 (new HUB = Master Plan change)

3. Changing ROTAS to use TimescaleDB instead of PostgreSQL
   - **Answer:** Tier 2 (architectural change)

4. Adding a fifth strategic pillar
   - **Answer:** Tier 1 (strategic pillar change)

### Exercise 3: Run Validation

```bash
cd /root/.openclaw/workspace/eSports-EXE
./scripts/validate-master-plan.sh
```

**Expected Output:**
```
=== Master Plan Validation ===
✓ Design Token Compliance: 0 violations
✓ HUB Isolation: No cross-HUB imports found
✓ ADR Format: All ADRs valid
✓ TypeScript: 0 errors
✓ Documentation: README present

=== Validation Passed ===
```

---

## Certification Assessment

**Format:** 10 multiple choice questions + 1 practical exercise  
**Passing Score:** 80% (8/10 correct + exercise completed)  
**Time Limit:** 30 minutes

### Sample Questions

**Q1:** Which tier requires Eli's approval?
- A) Tier 1 only
- B) Tier 1 and Tier 2
- C) All tiers
- D) None

**Answer:** A

**Q2:** Can ROTAS import a utility function from SATOR?
- A) Yes, if it's a shared utility
- B) Yes, HUBs can import from each other
- C) No, HUBs cannot import from other HUBs
- D) Only if approved in an ADR

**Answer: C**

**Q3:** What is the correct color token for ROTAS accent?
- A) `#0F172A`
- B) `#14B8A6`
- C) `#F97316`
- D) `#FF4655`

**Answer: B**

### Practical Exercise

Create an ADR for the following scenario:

> "The team wants to add real-time WebSocket updates to ROTAS for live match scores. This will require a new Redis Pub/Sub setup and changes to the API to push updates instead of just polling."

**Requirements:**
1. Use the ADR template
2. Identify affected HUBs
3. List alternatives considered
4. Describe consequences

---

## Post-Certification

### Badge System

| Level | Requirement | Badge |
|-------|-------------|-------|
| Certified | Pass assessment | 🏛️ Master Plan Certified |
| Contributor | Create 3+ ADRs | 📝 ADR Author |
| Champion | Lead architecture review | 🏆 Architecture Champion |

### Ongoing Requirements

- **Quarterly Refresher:** 30 min review of changes
- **New ADR Review:** All team members review proposed ADRs
- **Validation:** Pre-commit hook runs on every PR

### Resources

**Documentation:**
- Master Plan: `docs/master-plan/master-plan.md`
- ADR Index: `docs/adrs/README.md`
- Design System: `docs/design-system/README.md`

**Tools:**
- Validation: `./scripts/validate-master-plan.sh`
- ADR Template: `docs/adrs/adr-template.md`

**People:**
- Master Plan Owner: Eli
- Architecture Lead: [Name]
- Tech Lead: [Name]

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────┐
│           MASTER PLAN QUICK REFERENCE               │
├─────────────────────────────────────────────────────┤
│  PILLARS: Cross-Game, Progressive, Historical,     │
│           Community, Technical Excellence          │
├─────────────────────────────────────────────────────┤
│  HUBS:    ROTAS (stats) → SATOR (analytics)        │
│           OPERA (pro)   → AREPO (community)        │
├─────────────────────────────────────────────────────┤
│  COLORS:  #0F172A (bg), #14B8A6 (ROTAS/SATOR),     │
│           #F97316 (OPERA/AREPO)                    │
├─────────────────────────────────────────────────────┤
│  TIERS:   1 = Eli only, 2 = Leads, 3 = Tech Lead   │
├─────────────────────────────────────────────────────┤
│  ADRs:    Proposed → Accepted → Immutable          │
│           (Supersede with new ADR if needed)       │
├─────────────────────────────────────────────────────┤
│  VALIDATE: ./scripts/validate-master-plan.sh       │
└─────────────────────────────────────────────────────┘
```

---

*Complete this certification before your first PR. Questions? Ask in #architecture Slack channel.*
