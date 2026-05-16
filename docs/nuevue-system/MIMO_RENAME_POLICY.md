# Mimo Rename Policy — Forward Only

## Status: ACTIVE (Per Eli Answer #5)
**Policy**: Use "Mimo" in all new documentation and code. Preserve "JARVIS" in historical documents.
No bulk rename of existing files.

---

## Rationale

Mimo is not merely a rename of JARVIS — it is a **distinct Chinese open-source LLM** that replaces JARVIS as the orchestrator inside Anima Crossing — PolyOffice. Historical references to JARVIS remain accurate for the period they were written.

---

## Forward-Only Rules

### ✅ Use "Mimo" For
- All new documents created after 2026-05-16
- All new code comments and variable names
- Active project descriptions in PROJECT_REGISTRY.md
- Future ADRs and architecture decisions
- Agent role assignments going forward
- User-facing copy and UI labels

### ✅ Preserve "JARVIS" For
- Documents created before 2026-05-16 (historical accuracy)
- `MEMORY.md` archival references
- Git commit messages (immutable history)
- Old ADRs referencing JARVIS decisions
- Legacy code comments describing JARVIS-era architecture
- The `hvrryh-web` GitHub account (unchanged)

### ❌ Do NOT
- Bulk find-and-replace JARVIS → Mimo across all files
- Edit historical documents to retroactively apply the rename
- Change Git history or commit messages
- Rename the `hvrryh-web` account references

---

## Transition Mapping

| Context | Before 2026-05-16 | After 2026-05-16 |
|---------|-------------------|------------------|
| Orchestrator agent | JARVIS | Mimo |
| Agent class | Satyr (JARVIS) | Satyr (Mimo) |
| Account reference | `hvrryh-web` | `hvrryh-web` (unchanged) |
| Cloud system #1 | Kimi (existing) | Kimi (unchanged) |
| Cloud system #2 | DeepSeek (planned) | DeepSeek (unchanged) |
| Cloud system #3 | JARVIS (planned) | Mimo (now active) |
| In docs | "JARVIS orchestrates..." | "Mimo orchestrates..." |
| In code | `const jarvis = ...` | `const mimo = ...` |
| In comments | `// JARVIS: handles...` | `// Mimo: handles...` |

---

## File-Specific Guidance

### PROJECT_REGISTRY.md
- Update active project owner fields: JARVIS → Mimo
- Add note: "Historical references to JARVIS preserved in pre-2026-05-16 docs"

### HEARTBEAT.md / MEMORY.md
- New entries use "Mimo"
- Historical entries remain "JARVIS"
- Cross-reference note at top: "JARVIS → Mimo as of 2026-05-16"

### Code Repositories
- New repos (`nexez-sitegeiste`, etc.): Use Mimo exclusively
- Existing repos (`ZeSporteXte`): Update active references; leave historical
- Agent configuration files: Update role assignments

### Agent Diagrams / Visualizations
- Regenerate with Mimo label
- Archive JARVIS versions in `docs/historical/`

---

## Checklist

- [ ] Update PROJECT_REGISTRY.md active references
- [ ] Update HEARTBEAT.md going forward
- [ ] Update all new document templates
- [ ] Update agent role assignment docs
- [ ] Create `docs/historical/JARVIS-REFERENCES.md` index
- [ ] Verify no accidental bulk-renames in historical files

---

*Policy created: 2026-05-16*
*Effective date: 2026-05-16*
*Review: Quarterly (next: 2026-08-16)*
