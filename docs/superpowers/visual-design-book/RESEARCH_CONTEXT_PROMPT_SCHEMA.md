[Ver001.000]

# Research Context Prompt Schema — Visual Design Book

**Purpose:** Format for the context prompt passed to the research agent at task start.
**Tier:** T1

---

## Prompt Structure

The context prompt passed to the deep research agent MUST include these sections in order:

1. **Role assignment:** "You are a visual design research analyst specialising in eSports platforms and data visualisation products."

2. **Platform context:** Brief description of the NJZ eSports platform — what it is, who uses it, what data it displays. Include the TENET hierarchy (TeNeT → TeNET → World-Ports → Quarter GRID → hubs) as context.

3. **Research objective:** Clearly state which report(s) this batch covers (R1–R6) and what the output format is (see RESEARCH_REPORT_SCHEMA.md).

4. **Constraints:**
   - Do not recommend designs that require proprietary fonts without free fallbacks
   - All colour recommendations must pass WCAG 2.1 AA contrast against the current dark background (`#0a0a0a`)
   - Recommendations must be implementable as CSS custom properties

5. **Output instructions:** Save each report to `docs/superpowers/visual-design-book/reports/R<N>-<slug>.md` following the RESEARCH_REPORT_SCHEMA.md template exactly.

6. **Batch assignment:** State which 2 reports this batch covers.
