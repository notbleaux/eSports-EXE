[Ver001.000]

# Filter Rules — ARCHIVE_MASTER_DOSSIER.md Tag Query Guide

**Purpose:** Enable tag-based filtering of archived documents using bash grep patterns. Allows agents to query ARCHIVE_MASTER_DOSSIER.md Index Table efficiently without manual scanning.

**Authority:** ARCHIVE_INDEX_SCHEDULE.md M-Q2 (line 20); audit PASS 1 Bullet 3 (Sub-3a); ARCHIVE_MASTER_DOSSIER.md line 12

**Tier:** T1 — load when querying or updating archives

**Framework:** NJZPOF v0.2 (Pillar 4 — MCP)

**Status:** Phase 9+ (tag adoption begins Phase 9)

---

## Tag System Overview

Tags are appended to entries in ARCHIVE_MASTER_DOSSIER.md Index Table, enabling machine-readable filtering. Tags follow this format:

```
[phase:N] [topic:X] [date:YYYY-MM] [author:agent-name]
```

**Example:**

```markdown
| DOSSIER-phase-2-execution-2026-03-27.md | 2026-03-27 | Phase Completion & Execution Reports | Consolidated Phase 2 completion, specialist deliverables [phase:2] [topic:execution] [date:2026-03] |
```

---

## Approved Tags

### Phase Tags
- `[phase:1]` — Phase 1 Scaffolding & Foundation
- `[phase:2]` — Phase 2 Data Layer
- `[phase:3]` — Phase 3 Analytics + Simulation
- `[phase:4]` — Phase 4 Live Data + Performance
- `[phase:5]` — Phase 5 ML + Community
- `[phase:6]` — Phase 6 Quality & Hardening
- `[phase:7]` — Phase 7 Post-Launch Features
- `[phase:8]` — Phase 8 Security & Accessibility
- `[phase:9]` — Phase 9 UI/UX Enhancement
- `[phase:10]` — Phase 10 Archive Optimization (Phase 10+)

### Topic Tags (Approved Categories from ARCHIVE_MASTER_DOSSIER.md Topic Map)
- `[topic:phase-completion]` — Phase completion & execution reports
- `[topic:discovery]` — Discovery & investigation rounds
- `[topic:verification]` — Verification, QA & testing
- `[topic:deployment]` — Deployment guides & status
- `[topic:implementation]` — Implementation plans & summaries
- `[topic:kid003]` — KID003 agent reports
- `[topic:security]` — Security & integrity audits
- `[topic:architecture]` — Architecture & design system
- `[topic:feature]` — Feature implementation (Betting, Fantasy, Wiki, etc.)
- `[topic:infrastructure]` — Production & infrastructure
- `[topic:executive]` — Executive summaries & reviews
- `[topic:misc]` — Miscellaneous (troubleshooting, guides, data)

### Date Tags
- `[date:YYYY-MM]` — Archive date in year-month format (e.g., `[date:2026-03]`)
- Only the month of archival is tagged, not the document creation date
- Used for "all documents archived in March 2026" type queries

### Author Tags (Optional, for Phase 9+)
- `[author:foreman]` — Foreman agent
- `[author:kid003]` — KID003 agent
- `[author:specialist-b]` — Specialist B team
- `[author:team-x]` — Other team designations
- Author tags are optional; use only if document responsibility is important for later traceability

---

## Query Syntax

### Single-Tag Queries

Find all documents matching one tag:

```bash
grep "\[phase:7\]" ARCHIVE_MASTER_DOSSIER.md
```

Output: All rows with Phase 7 tag

### Multi-Tag Queries (AND logic)

Find documents matching ALL tags (intersection):

```bash
grep -E "\[phase:7\].*\[topic:deployment\]" ARCHIVE_MASTER_DOSSIER.md
```

Output: Only Phase 7 documents related to deployment

### Multi-Tag Queries (OR logic)

Find documents matching ANY tag (union):

```bash
grep -E "\[phase:7\]|\[phase:8\]" ARCHIVE_MASTER_DOSSIER.md
```

Output: All Phase 7 or Phase 8 documents

### Complex Queries

Combine multiple conditions:

```bash
# Phase 7 OR Phase 8, AND deployment topic, AND archived in 2026-03
grep -E "\[phase:[78]\]" ARCHIVE_MASTER_DOSSIER.md | grep "\[topic:deployment\]" | grep "\[date:2026-03\]"
```

### Case-Insensitive Queries

```bash
grep -i "\[phase:7\]" ARCHIVE_MASTER_DOSSIER.md
```

---

## Common Query Patterns

### Pattern 1: "Show me all Phase N documents"

```bash
grep "\[phase:7\]" ARCHIVE_MASTER_DOSSIER.md
```

**Use case:** At phase boundary, find all archived work from completed phase

**Expected result:** 5–15 rows (all Phase 7 archived files)

---

### Pattern 2: "Show me all documents about topic X"

```bash
grep "\[topic:deployment\]" ARCHIVE_MASTER_DOSSIER.md
```

**Use case:** Need all deployment-related guides, reports, and checklists

**Expected result:** 10–20 rows (all deployment docs across phases)

---

### Pattern 3: "Show me all documents archived in month M"

```bash
grep "\[date:2026-03\]" ARCHIVE_MASTER_DOSSIER.md
```

**Use case:** Review what was consolidated during a specific month

**Expected result:** 30–50 rows (all 2026-03 archived documents)

---

### Pattern 4: "Show me Phase N + deployment"

```bash
grep "\[phase:7\]" ARCHIVE_MASTER_DOSSIER.md | grep "\[topic:deployment\]"
```

**Use case:** Find deployment guides specific to Phase 7

**Expected result:** 2–5 rows (Phase 7 deployment docs)

---

### Pattern 5: "Show me Phase N OR Phase N+1, both deployment"

```bash
grep -E "\[phase:7\]|\[phase:8\]" ARCHIVE_MASTER_DOSSIER.md | grep "\[topic:deployment\]"
```

**Use case:** Compare deployment approaches across two adjacent phases

**Expected result:** 3–8 rows (Phase 7 and Phase 8 deployment docs combined)

---

### Pattern 6: "Show me all from team X"

```bash
grep "\[author:specialist-b\]" ARCHIVE_MASTER_DOSSIER.md
```

**Use case:** Review all work contributed by specific team

**Expected result:** 5–10 rows (all Specialist B documents)

---

### Pattern 7: "Show me recent archives (last 30 days)"

```bash
# Requires `date` command to calculate 30 days ago
MONTH=$(date -d "30 days ago" "+%Y-%m")
grep "\[date:$MONTH\]" ARCHIVE_MASTER_DOSSIER.md
# For date ranges spanning months, repeat grep for multiple months:
grep -E "\[date:2026-03\]|\[date:2026-02\]" ARCHIVE_MASTER_DOSSIER.md
```

**Use case:** Find recently archived work (e.g., during CONTEXT_FORWARD staleness check)

**Expected result:** Varies by calendar (all docs from last 30 days)

---

## Helper Functions (bash)

Add these to your shell profile or create `.agents/indexing/filter-helpers.sh`:

```bash
# Query by phase
archive_phase() {
  grep "\[phase:$1\]" ARCHIVE_MASTER_DOSSIER.md
}

# Query by topic
archive_topic() {
  grep "\[topic:$1\]" ARCHIVE_MASTER_DOSSIER.md
}

# Query by date (month)
archive_date() {
  grep "\[date:$1\]" ARCHIVE_MASTER_DOSSIER.md
}

# Query by phase AND topic
archive_phase_topic() {
  grep "\[phase:$1\]" ARCHIVE_MASTER_DOSSIER.md | grep "\[topic:$2\]"
}

# Query by author
archive_author() {
  grep "\[author:$1\]" ARCHIVE_MASTER_DOSSIER.md
}

# Count documents by phase
archive_count_phase() {
  grep "\[phase:$1\]" ARCHIVE_MASTER_DOSSIER.md | wc -l
}

# List all unique phases in archive
archive_phases() {
  grep -oE "\[phase:[0-9]+\]" ARCHIVE_MASTER_DOSSIER.md | sort -u
}

# List all unique topics in archive
archive_topics() {
  grep -oE "\[topic:[a-z-]+\]" ARCHIVE_MASTER_DOSSIER.md | sort -u
}
```

**Usage:**

```bash
# Load helpers
source .agents/indexing/filter-helpers.sh

# Query Phase 7
archive_phase 7

# Query deployment topic across all phases
archive_topic deployment

# Query Phase 7 + deployment
archive_phase_topic 7 deployment

# Count Phase 8 documents
archive_count_phase 8

# List all phases
archive_phases
```

---

## Tag Maintenance

### Monthly (M-Q2) Update Process

When new files are archived:

1. **Identify phase** of archived document (look at filename or CONTEXT_FORWARD.md current phase)
2. **Select topic** from approved list above
3. **Record archive month** as `[date:YYYY-MM]`
4. **Optionally add author** if multi-team or external contribution

**Example row entry:**

```markdown
| DOSSIER-phase-7-execution-2026-03-27.md | 2026-03-27 | Phase Completion & Execution Reports | Phase 7 completion, launch features, performance [phase:7] [topic:phase-completion] [date:2026-03] |
```

### Tag Format Rules

- Tags are **case-sensitive**: `[phase:7]` ≠ `[phase:7]`
- Tags are **space-separated** (one space after `]`, before `[`)
- Tags are **appended to the description** (fourth column of Index Table)
- Always include **phase tag** (unless document spans multiple phases)
- Always include **topic tag** (required for category filtering)
- Always include **date tag** (required for freshness tracking)
- **Author tag is optional** (add only if needed for multi-team coordination)

---

## Tag Validation

### M-Q1 Verification Checklist

Run these checks monthly to catch tagging errors:

```bash
# 1. Check for malformed tags (missing brackets or colons)
grep -E "\[phase:[0-9]+\]" ARCHIVE_MASTER_DOSSIER.md | wc -l
# Should match count of total index rows

# 2. Find rows WITHOUT phase tag
grep -v "\[phase:" ARCHIVE_MASTER_DOSSIER.md | grep -v "^|" | grep -v "^---" | grep -v "^#"
# Should return empty (all rows must have phase tag)

# 3. Find rows WITHOUT topic tag
grep -v "\[topic:" ARCHIVE_MASTER_DOSSIER.md | grep -v "^|" | grep -v "^---" | grep -v "^#"
# Should return empty (all rows must have topic tag)

# 4. Find rows WITHOUT date tag
grep -v "\[date:" ARCHIVE_MASTER_DOSSIER.md | grep -v "^|" | grep -v "^---" | grep -v "^#"
# Should return empty (all rows must have date tag)

# 5. Check for invalid topic tags (not in approved list)
grep -oE "\[topic:[a-z-]+\]" ARCHIVE_MASTER_DOSSIER.md | sort -u
# Verify all tags match approved list above
```

---

## Troubleshooting

| Problem | Symptom | Solution |
|---------|---------|----------|
| **Query returns no results** | `grep "[phase:7]"` returns empty | Check brackets are literal `[` `]` (not escaped); check tag capitalization |
| **Query is too greedy** | `grep "phase"` matches "phase-completion" topic too | Use exact tag syntax `[phase:7]` with brackets |
| **Multi-tag AND query returns nothing** | `grep "[phase:7]" ... grep "[topic:X]"` is empty | Verify both tags exist in same row (check ARCHIVE_MASTER_DOSSIER.md directly) |
| **Tag doesn't match approved list** | `[topic:foo]` not recognized | Update tag to approved topic from list; add new topics only via M-Q1 review process |
| **Author field is inconsistent** | Some rows have `[author:X]`, others don't | Author tags are optional; inconsistency is OK. Add author tags only when intentional |

---

## Examples

### Example 1: Find all Phase 7 deployment documentation

```bash
grep "\[phase:7\]" ARCHIVE_MASTER_DOSSIER.md | grep "\[topic:deployment\]"
```

Returns:
```
| DEPLOYMENT_GUIDE_FINAL.md | 2026-03-17 | Deployment Guides | Final approved deployment guide [phase:7] [topic:deployment] [date:2026-03] |
| DEPLOYMENT_STATUS_REPORT.md | 2026-03-17 | Deployment Guides | Deployment status and metrics [phase:7] [topic:deployment] [date:2026-03] |
```

### Example 2: Count Phase 8 security audits

```bash
grep "\[phase:8\]" ARCHIVE_MASTER_DOSSIER.md | grep "\[topic:security\]" | wc -l
```

Returns: `3` (three Phase 8 security documents)

### Example 3: List all topics in Phase 7

```bash
grep "\[phase:7\]" ARCHIVE_MASTER_DOSSIER.md | grep -oE "\[topic:[a-z-]+\]" | sort -u
```

Returns:
```
[topic:phase-completion]
[topic:deployment]
[topic:security]
```

### Example 4: Find all documents archived in March 2026

```bash
grep "\[date:2026-03\]" ARCHIVE_MASTER_DOSSIER.md | head -10
```

Returns: First 10 documents from 2026-03 archive

### Example 5: Query helper function usage

```bash
source .agents/indexing/filter-helpers.sh

# Find Phase 7 + deployment using helper
archive_phase_topic 7 deployment

# Count Phase 8
archive_count_phase 8

# List all available topics
archive_topics
```

---

## Integration with SESSION_LIFECYCLE.md

Tags are applied in **ARCHIVE_INDEX_SCHEDULE.md M-Q2** (line 20):

```
M-Q2 | Days 8–14 | Update Index Table with new files; add tags ([phase:N] [topic:X] [date:YYYY-MM]) to new entries
```

During SESSION_LIFECYCLE.md **Stage 1D (Cleanup)**, agents use tags to verify archive completeness:

```bash
# Verify that fragments for completed phase are all tagged [phase:X]
grep "\[phase:7\]" ARCHIVE_MASTER_DOSSIER.md | wc -l
```

---

## FAQ

**Q: Can I create custom tags?**  
A: No. All tags must come from the approved lists above. To add new tags, file a request during M-Q1 review; new tags are added to this file via community decision.

**Q: What if a document spans multiple phases?**  
A: Tag it with the **primary phase** (where most of the work occurred). Add a note in the Index Table description (third column) if it spans phases: "Spans Phase 7–8" or "Initiated Phase 7, completed Phase 8."

**Q: Can I use multiple topic tags in one row?**  
A: No. Each row has exactly one topic tag. If a document covers multiple topics, create separate rows for it in the Index Table (one per topic), each linking to the same document.

**Q: Are tags backward-compatible with existing rows?**  
A: No. Existing rows (before March 2026) will be gradually tagged during M-Q2 updates. Older entries without tags are still searchable via document name or date.

**Q: What if the approved topics list grows?**  
A: This file will be updated during M-Q1 cadence. Agents should check this file monthly for new approved tags.

---

## Maintenance

**Monthly (M-Q1):** Review tag usage; validate syntax; propose new topics if needed

**Quarterly:** Audit that all archived documents have complete tags; fix any gaps

**On phase completion:** Ensure all phase documents are tagged with correct [phase:N] tag

---

*Filter Rules Version: [Ver001.000]*  
*Created: 2026-03-27*  
*Last Updated: 2026-03-27*  
*Next Review: M-Q1 April 2026*
