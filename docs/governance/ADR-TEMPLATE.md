[Ver001.000]

# Architecture Decision Record Template — NJZ eSports Platform

**Purpose:** Template for recording MASTER-tier architectural decisions made during phase work.
**Tier:** T1 — reference when creating ADRs in Phase Logbooks.
**Authority:** `MASTER_PLAN.md §11` · `SESSION_LIFECYCLE.md Stage 5B`
**Framework:** NJZPOF v0.2
**Format:** MADR (Markdown Architectural Decision Records)

---

## When to Create an ADR

An ADR is required for decisions that are:

1. **Irreversible or hard to reverse** — schema choices, technology selections, data model structure
2. **Cross-phase impact** — affects work in more than one phase
3. **Non-obvious** — a future agent/developer would reasonably make a different choice without this record
4. **MASTER_PLAN-level** — changes to project architecture, hub structure, auth system, data flow

ADRs are **NOT** required for:
- Routine implementation choices (variable names, function decomposition)
- Gate-level technical decisions (those go in Session Notebook Decisions table)
- Choices that are easily reversible within the same phase

---

## ADR Placement

ADRs are written **inline in the Phase Logbook** under the session entry where the decision was made:

```
.agents/phase-logbooks/Phase-N-LOGBOOK.md
  └── ## Session YYYY-MM-DD
        └── **Architecture Decisions (ADRs):**
              └── [ADR content here]
```

For cross-phase decisions affecting multiple logbooks, also add a summary reference in `MASTER_PLAN.md §11`.

---

## ADR Format

```markdown
### ADR-[gate-number].[YYYY-MM-DD]: [Short Title]

**Status:** [Proposed | Accepted | Deprecated | Superseded by ADR-X.Y]
**Gate:** [N.X — gate where this decision was made]
**Impact:** [single-phase | cross-phase | permanent]

#### Context

[2-4 sentences: what situation, constraint, or requirement forced this decision?
What were the competing concerns? What was the consequence of not deciding?]

#### Decision

[1-3 sentences: what was decided. Be precise — name the specific technology,
pattern, or approach chosen. Avoid hedging language.]

#### Rationale

[3-5 bullet points: why this option over alternatives.
Reference constraints (budget, timeline, team size, existing tech) explicitly.
Reference any prior decisions that constrained this one.]

- [reason 1]
- [reason 2]
- [reason 3]

#### Consequences

**Positive:**
- [what becomes easier or better]

**Negative / Trade-offs:**
- [what becomes harder, or what is locked in]

**Neutral (context for future agents):**
- [things future agents must know because of this decision]

#### Alternatives Considered

| Option | Why Rejected |
|--------|-------------|
| [Alt 1] | [reason] |
| [Alt 2] | [reason] |
```

---

## Example ADR

```markdown
### ADR-7.3.2026-03-27: Risk-Tier Commit Tags Appended, Not Prepended

**Status:** Accepted
**Gate:** 7.3 — commit-msg hook implementation
**Impact:** permanent

#### Context

Phase 7 introduced risk-tier tags [SAFE|STRUCT|CRIT] on all commits for auto-merge
classification. The tag position (before or after the description) affects readability
in `git log --oneline` output and in GitHub PR titles. The convention had to be fixed
before the commit-msg hook was deployed to avoid retroactive history changes.

#### Decision

Risk-tier tags are appended after the description, separated by a space:
`type(scope): description [TAG]` — NOT `[TAG] type(scope): description`.

#### Rationale

- `git log --oneline` truncates from the right; the most human-readable part
  (type + scope + description) should appear first
- GitHub PR titles use the commit subject; prepended tags make PR list scanning harder
- Conventional Commits spec places the description immediately after the colon — a
  prepended tag would violate the spec pattern
- The auto-merge workflow reads the tag via `contains(github.event.pull_request.title, '[CRIT]')`
  — position does not affect machine parsing

#### Consequences

**Positive:**
- `git log --oneline` is clean and human-readable
- Conventional Commits spec compliance maintained

**Negative / Trade-offs:**
- Tags at end are easier to miss in a quick scan of log output
- Requires discipline: tag must not be omitted (commit-msg hook enforces)

**Neutral (context for future agents):**
- The commit-msg hook rejects commits without a valid [SAFE|STRUCT|CRIT] tag
- All Phase 7 and later commits follow this convention; Phase 1-6 commits do not have tags

#### Alternatives Considered

| Option | Why Rejected |
|--------|-------------|
| Prepend tag: `[SAFE] feat(x): description` | Breaks git log readability; non-standard |
| Separate commit field (trailer) | Not supported by GitHub PR title matching |
| No positional enforcement, separate manifest | Requires extra file; overkill for one convention |
```

---

## ADR Index

ADRs are discoverable via Phase Logbooks. For cross-phase or permanent ADRs, a summary
index is maintained in `MASTER_PLAN.md §11` under **Architecture Decision Log**.

Format for the §11 index entry:
```
- ADR-[gate].[date]: [title] — [logbook file, session date]
```
