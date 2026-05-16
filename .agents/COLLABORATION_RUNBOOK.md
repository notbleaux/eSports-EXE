[Ver001.000]

# Collaboration Runbook — Multi-Agent Shared Context Procedures

**Purpose:** Step-by-step procedures for multi-agent collaboration within shared contexts  
**Status:** ACTIVE — Testing mode for 3-agent environment  
**Authority:** `.agents/AGENT_CONTRACT.md` + `.agents/COORDINATION_PROTOCOL.md`  
**Applies to:** Claude, Copilot, Kimi concurrent operations

---

## Procedure 1: Starting Work in a Shared Context

### Step 1: Check for Active Context (60 seconds)

```bash
# Check today's shared context
ls -la .agents/session/SHARED_CONTEXT.md 2>/dev/null

# If exists, read it
cat .agents/session/SHARED_CONTEXT.md

# If not exists, check recent broadcasts
ls -lt .agents/channels/broadcast/ | head -5
```

**Decision:**
- **Context exists:** Append your agent entry (go to Procedure 2)
- **No context:** Initialize new shared context (go to Procedure 3)

### Step 2: Check Agent ID Protocol (30 seconds)

```bash
# Read current counter state
jq '.agents.[your_lineage]' polyrepo/registry/index.json

# Example for Kimi:
jq '.agents.kimi' polyrepo/registry/index.json
```

**Record your starting counter** — you'll increment it when signing commits.

### Step 3: Identify Your Domain

| If your task is... | Your domain is... | Check with other agents on... |
|-------------------|-------------------|------------------------------|
| Type definitions, schemas | `schema` | Any schema changes in progress |
| React components, hooks, pages | `frontend` | Same hub or shared components |
| API endpoints, models, auth | `backend` | Same router or service |
| ETL, scrapers, data sync | `pipeline` | Same connector or transformer |
| CI/CD, Docker, workflows | `infra` | Any workflow modifications |
| Documentation, ADRs, policies | `docs` | Concurrent docs work (low friction) |
| Tests, test infrastructure | `test` | Low friction — proceed |

### Step 4: Declare Your Work

Append to `.agents/session/SHARED_CONTEXT.md`:

```markdown
### Agent N: [lineage]/[model] — [session-id]
**Domain:** [domain]
**Files:** [initial file list]
**Started:** [HH:MM UTC]
**Estimated Completion:** [HH:MM UTC]
**Dependencies:** [none | Agent X | external]
**Counter Start:** [ZSXT-AGENT-XXX-SXX-AXXXX]
```

---

## Procedure 2: Appending to an Existing Shared Context

### When Another Agent is Already Active

**Read the existing context first.** Note:
- What domains are claimed
- What files are in scope
- Any dependencies or blockers
- Recent progress updates

**Then append your entry** without overwriting existing content.

**If your domain overlaps with another agent:**
1. Check if your files overlap
2. If no overlap: proceed, note "parallel work, no file overlap"
3. If overlap: add coordination note — "will wait for Agent X commit on [file] before proceeding" or "coordinating with Agent X on [file]"

**Example coordination note:**
```markdown
**Coordination Notes:** 
- Agent A is modifying `packages/@njz/types/tsconfig.json` (schema domain)
- My work in frontend domain depends on those schema changes
- Will wait for Agent A's commit before proceeding with component updates
```

---

## Procedure 3: Initializing a New Shared Context

### When You're the First Agent Today

Create `.agents/session/SHARED_CONTEXT.md`:

```bash
DATE=$(date +%Y-%m-%d)
TIME=$(date +%H:%M)

cat > .agents/session/SHARED_CONTEXT.md << EOF
[Ver001.000]

# Shared Context — $DATE

**Status:** ACTIVE
**Agents:** 1 active
**Started:** $TIME UTC
**Framework Version:** .agents/COORDINATION_PROTOCOL.md v1.1.0

## Agent Entries

### Agent 1: [lineage]/[model] — [session-id]
**Domain:** [domain]
**Files:** [initial file list]
**Started:** $TIME UTC
**Estimated Completion:** [HH:MM UTC]
**Dependencies:** none
**Counter Start:** [ZSXT-AGENT-XXX-SXX-AXXXX]

## Progress Log

## Friction Log
EOF
```

**Then update the LATEST symlink:**
```bash
ln -sf .agents/session/SHARED_CONTEXT.md .agents/channels/broadcast/LATEST.md
```

---

## Procedure 4: Making Changes in Shared Context

### During Work — Every 15-30 Minutes

**Update your progress in SHARED_CONTEXT.md:**

```markdown
**Update [HH:MM UTC] — [lineage]/[model]:**
- [x] Completed: [specific task]
- [ ] Next: [specific task]
- Files touched: [list new files]
- Status: [on-track | delayed | blocked]
```

### Before Committing

**Check for conflicts:**
```bash
# Pull latest changes
git pull origin main  # or your base branch

# Check if files you're committing were modified by others
git log --oneline --since="1 hour ago" -- [your-files]
```

**If conflicts detected:**
1. Resolve merge conflicts locally
2. Run `pnpm typecheck` to verify no type regressions
3. Update SHARED_CONTEXT.md with conflict resolution notes

### When Committing

**Sign your commit per AGENT_ID_PROTOCOL.md:**

```bash
# Standard commit with sign-off
git commit -m "type(scope): description

Agent-Sign-Off:     agent://[lineage]/[model]/[session]/[order]
ZSXT-R-Counter:     [ZSXT-R-XXXX]
Agent-Counter:      [ZSXT-AGENT-XXX-SXX-AXXXX]
Project-Counter:    [NJZ-P-XXXX]
Portfolio-Counter:  [NJZPL-MUTUAL-XXXX]"
```

**Update counters after commit:**
```bash
# Increment your agent counter in the registry
# (Manual for Phase 0; automated in Phase 1+)
```

---

## Procedure 5: Broadcasting Significant Changes

### When Broadcasting is Required

Broadcast MUST happen when:
- Schema/type definition changes
- Shared interface or API modifications
- CI/CD workflow changes
- Dependency additions/removals
- Changes affecting >3 files across >1 domain
- Discovery of pre-existing issues affecting other agents

### Broadcast Message Creation

```bash
DATE=$(date +%Y-%m-%d)
TIME=$(date +%H:%M)
LINEAGE=[your_lineage]
TYPE=[SCHEMA_CHANGE|PROGRESS|BLOCKER|COMPLETION|DISCOVERY]

cat > ".agents/channels/broadcast/$DATE-$TIME-$LINEAGE-$TYPE.md" << EOF
## Broadcast — $DATE $TIME UTC
**From:** agent://[lineage]/[model]/[session]/[order]
**Type:** $TYPE
**Scope:** [files or domains affected]

**Summary:**
[1-2 sentence description]

**Details:**
- [specific change 1]
- [specific change 2]

**Impact on Other Agents:**
- [what other agents need to know or do]

**Next Steps:**
- [what you're doing next]
EOF

# Update LATEST symlink
ln -sf ".agents/channels/broadcast/$DATE-$TIME-$LINEAGE-$TYPE.md" .agents/channels/broadcast/LATEST.md
```

---

## Procedure 6: Handling File Overlap

### When You Need a File Another Agent is Touching

**Option A: Wait (Recommended for small changes)**
```markdown
**Coordination Note:** Waiting for Agent X to complete `src/App.tsx` — my change is lower priority
```

**Option B: Coordinate (For parallel modifications)**
1. Post broadcast: "Need to modify `src/App.tsx` for [reason] — Agent X currently has this file"
2. Wait 10 minutes for response
3. If Agent X agrees to stagger: proceed with your changes, commit first if smaller
4. If no response: proceed with caution, commit incrementally

**Option C: Work on Different File (Recommended if possible)**
```markdown
**Coordination Note:** Deferring `src/App.tsx` — working on `src/components/Grid.tsx` instead, will return to App.tsx later
```

---

## Procedure 7: Resolving Merge Conflicts

### When Two Agents Push to Same Branch

**Step 1: Identify change sizes**
```bash
git log --stat --oneline HEAD...origin/[branch] | head -20
```

**Step 2: Apply merge-first rule**
- Smaller change (fewer files/lines) merges first
- Larger change rebases after

**Step 3: If equal size or unclear priority**
- Check CONTEXT_FORWARD.md for "DO NOT REDO" items
- Prioritize blocking fixes over enhancements
- If still unclear: escalate to CODEOWNER (@notbleaux)

**Step 4: Post-resolution**
```markdown
**Friction Log — $DATE:**
**Agents:** [lineage A] + [lineage B]
**Time:** $TIME UTC
**Type:** CONFLICT
**What Happened:** Merge conflict on [branch] for [files]
**Resolution:** [lineage A] merged first (smaller change), [lineage B] rebased
**Prevention:** [what protocol change prevents recurrence]
```

Store at: `.agents/friction-log/$DATE-CONFLICT-[file].md`

---

## Procedure 8: Closing a Shared Context

### When You're Done

**Update your entry in SHARED_CONTEXT.md:**
```markdown
**Final Update [HH:MM UTC] — [lineage]/[model]:**
- [x] All tasks complete
- Commits: [hash1], [hash2], [hash3]
- PR: [PR number or branch]
- Next agent notes: [anything the next agent should know]
```

### When All Agents Are Done

**If you're the last active agent:**
```markdown
**Status:** CLOSED — All agents complete
**Closed:** [HH:MM UTC]
**Summary:**
- [lineage A]: [completed tasks]
- [lineage B]: [completed tasks]
- [lineage C]: [completed tasks]
**Next Actions:** [what the next shared context should focus on]
**Friction Summary:** [link to friction logs if any]
```

**Archive the context:**
```bash
DATE=$(date +%Y-%m-%d)
mv .agents/session/SHARED_CONTEXT.md ".agents/session/SHARED_CONTEXT-$DATE-CLOSED.md"
rm -f .agents/channels/broadcast/LATEST.md
```

---

## Procedure 9: Emergency — Blocking Production or Data Loss

### Immediate Actions

1. **STOP all work** on affected files
2. **Broadcast emergency:** `echo "EMERGENCY: [description]" > .agents/channels/broadcast/EMERGENCY-$(date +%s).md`
3. **Contact CODEOWNER immediately** — @notbleaux
4. **Do not commit or push** until CODEOWNER responds
5. **Document in friction log** after resolution

---

## Quick Reference Card

| Situation | Action | Time Budget |
|-----------|--------|-------------|
| Starting work | Check SHARED_CONTEXT.md → declare entry | 2 min |
| Every 15-30 min | Update progress in SHARED_CONTEXT.md | 1 min |
| Before commit | Pull → check for conflicts → typecheck | 3 min |
| Committing | Sign with Agent ID → increment counter | 1 min |
| Significant change (>3 files) | Create broadcast message | 2 min |
| File overlap detected | Coordinate or wait | 5-10 min |
| Merge conflict | Apply merge-first rule → resolve | 10-15 min |
| Emergency | Stop → broadcast → contact CODEOWNER | Immediate |
| Done | Update entry → check if last agent → close | 2 min |

---

*This runbook is a living document. Update it when friction reveals gaps.*
