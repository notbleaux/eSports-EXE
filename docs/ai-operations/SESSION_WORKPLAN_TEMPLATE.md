[Ver001.000]

# Session Work Plan Template — NJZ eSports Platform

**Purpose:** Template for per-session work plans. These are TEMPORARY documents — deleted in monthly M-Q4 cleanup.
**Tier:** T1 — load when starting a new implementation session.
**Storage location:** `.agents/session-workplans/Phase-N/YYYY-MM-DD-<session-id>.md`
**Lifetime:** Until monthly M-Q4 cleanup (see MONTHLY_CLEANUP_PROTOCOL.md)

⚠️ Do NOT commit session work plans to long-term storage. They are working context only.

---

## How to Use This Template

1. Copy this file to `.agents/session-workplans/Phase-<N>/YYYY-MM-DD-<brief-slug>.md`
2. Fill in the session header
3. Track decisions and blockers in real time as you work
4. At session end, mark status and note any handoff requirements
5. The file will be cleaned automatically in the next M-Q4 cycle

---

## Template

```markdown
[WorkPlan-TEMP]

# Session Work Plan — Phase <N>: <Task Name>

**Date:** YYYY-MM-DD
**Phase:** Phase N
**Session ID:** <agent-id or session slug>
**Plan reference:** `docs/superpowers/plans/<plan-file>.md` Task N
**Status:** IN_PROGRESS | COMPLETE | BLOCKED | HANDOFF_REQUIRED

---

## Objective
[One sentence — what this session will deliver]

## Scope (Tasks from Plan)
- [ ] Task N.1: [description]
- [ ] Task N.2: [description]
- [ ] Task N.3: [description]

## Decisions Made This Session

| Decision | Rationale | Reversible? |
|----------|-----------|-------------|
| [What was decided] | [Why] | Yes/No |

## Files Modified

| File | Change type | Notes |
|------|-------------|-------|
| [path] | created/modified/deleted | [brief note] |

## Blockers Encountered

| Blocker | Status | Resolution |
|---------|--------|------------|
| [description] | OPEN/RESOLVED | [how resolved or what's needed] |

## Open Questions (Carry to Next Session)
- [ ] [question that wasn't resolved]

## Handoff Notes
[What the next agent needs to know to continue — leave blank if no handoff]

## Commits Made This Session
- [hash] [message]
- [hash] [message]

## Status at Session End
- [ ] All planned tasks complete
- [ ] Tests pass
- [ ] No open blockers
- [ ] Handoff notes written (if applicable)

**Final status:** COMPLETE | HANDOFF_REQUIRED | BLOCKED
```

---

## Cleanup Protocol

Session work plans in `.agents/session-workplans/` are cleaned during M-Q4 each month:

```bash
# Run during M-Q4 cleanup
find .agents/session-workplans/ -name "*.md" -mtime +30 -delete
git add .agents/session-workplans/
git commit -m "chore(agents): monthly session workplan cleanup M-Q4 [SAFE]"
```

Only plans older than 30 days are deleted. Plans for IN_PROGRESS sessions are preserved.
