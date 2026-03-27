[Ver001.000]

# Visual Design Book Schema — NJZ eSports Platform

**Purpose:** Defines the structure of the 6 analysis reports that form the Visual Design Book.
**Tier:** T1
**Produced by:** Phase 0-X research task (deep research agent, Kimi 2.5 preferred)

---

## Book Structure

The Visual Design Book is 6 reports + 1 synthesis document:

| Report | Title | Focus |
|--------|-------|-------|
| R1 | Competitive Landscape Analysis | Top 5 eSports analytics platforms — visual patterns, colour systems, typography, layout |
| R2 | Game World Palette Research | Valorant + CS2 official brand palettes, community-derived colour systems, contrast profiles |
| R3 | Data Visualisation Patterns | Chart types, animation conventions, and real-time display patterns used in eSports data products |
| R4 | Typography and Hierarchy Audit | Font stacks used across eSports platforms, hierarchy patterns for score/stat display |
| R5 | Interaction Design Patterns | Navigation, hover states, live indicator patterns, notification systems |
| R6 | Component Catalogue Audit | Audit of current `@njz/ui` components against identified patterns — gaps, inconsistencies |
| S1 | Synthesis and Design Recommendations | Distilled recommendations for Phase 9 design token system and component updates |

---

## Output Format

Each report (R1–R6) follows the RESEARCH_REPORT_SCHEMA.md template.
The synthesis (S1) follows its own format defined in that document.

All reports are saved to:
`docs/superpowers/visual-design-book/reports/R<N>-<slug>.md`
`docs/superpowers/visual-design-book/reports/S1-synthesis.md`
