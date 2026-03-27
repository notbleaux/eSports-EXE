[Ver001.000]

# Visual Design Request Context — NJZ eSports Platform

**Purpose:** Context file for the deep research agent assigned to the Visual Design Book task.
**Tier:** T1
**CODEOWNER_APPROVAL_REQUIRED:** Yes — agent must have CLAIMED → ACTIVE in CODEOWNER_CHECKLIST.md C-7.X before beginning.

⚠️ IMPORTANT: This file is a CONTEXT and DIRECTIVE file for a future research agent. It is NOT a set of instructions for the current agent reading this. Do NOT execute the research described here unless you are the specifically claimed agent for task C-7.X.

---

## Task Assignment

You are assigned to produce the NJZ eSports Platform Visual Design Book. This is a 3-batch deep research process producing 6 analysis reports and 1 synthesis document.

## Platform Context

The NJZ eSports Platform (NJZiteGeisTe) is a community eSports analytics and simulation platform for Valorant and CS2. The platform is built on the TENET data topology:

- **TeNeT** — User-facing Home Portal (entry, auth, onboarding)
- **TeNET** — Network Directory routing users to World-Ports by game (`/hubs`)
- **World-Ports** — Game-specific entry points (`/valorant`, `/cs2`)
- **Quarter GRID** — Four hubs in every World-Port: SATOR (analytics), AREPO (community), OPERA (pro scene), ROTAS (stats)

The visual stack: React 18, Tailwind CSS, Framer Motion, Three.js/R3F. Current dark theme base `#0a0a0a`. Game accent colours: Valorant `#ff4655`, CS2 `#f0a500`. Typography: system font stack.

## Research Batches

**Batch 1 (R1 + R2):** Competitive landscape + game world palette research
**Batch 2 (R3 + R4):** Data visualisation patterns + typography and hierarchy
**Batch 3 (R5 + R6):** Interaction design patterns + component catalogue audit

## Process

For each batch:
1. Consult minimum 8 sources per report
2. Produce report following `RESEARCH_REPORT_SCHEMA.md`
3. Save to `docs/superpowers/visual-design-book/reports/`
4. After all 6 reports complete, produce S1 synthesis

After all 3 batches complete, produce `S1-synthesis.md`:
- Cross-batch recommendations synthesised into a unified design direction
- Token table: minimum 30 design tokens with recommended values
- Component gap analysis: what @njz/ui is missing vs. what was found in research
- Priority order for Phase 9 implementation

## Constraints

- All colour recommendations must pass WCAG 2.1 AA on `#0a0a0a` background
- No proprietary fonts without free fallbacks
- All tokens implementable as CSS custom properties
- Recommendations must be achievable within the existing Tailwind + Framer Motion stack
