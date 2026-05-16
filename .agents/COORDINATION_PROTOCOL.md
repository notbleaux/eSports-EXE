[Ver001.001]

# Multi-Agent Coordination Protocol — Shared Context Framework
## Claude × Copilot × Kimi — 3-Agent Test Environment

**Purpose:** Prevent conflicts and enable effective collaboration between three AI agents in shared repository contexts  
**Status:** ACTIVE (replaces JLB-based system)  
**Created:** 2026-05-16  
**Environment:** Smaller-context testing framework — friction detection and resolution

---

## I. CORE PRINCIPLES

### 1.1 Shared Context Declaration

Before any agent begins work, it MUST check for and either join or create a Shared Context Declaration. This is the single source of truth for who is active, what they're doing, and which files are being touched.

**Declaration locations (checked in order):**
1. `.agents/session/SHARED_CONTEXT.md` — today's active shared context
2. `.agents/channels/broadcast/YYYY-MM-DD-shared.md` — daily broadcast file
3. `.agents/channels/broadcast/LATEST.md` — symlink to most recent broadcast

**If no declaration exists:** The first agent to start work creates it.
**If a declaration exists:** The agent appends its entry without overwriting existing entries.

### 1.2 Agent Identity in Shared Context

Every agent in shared context MUST identify itself per `.agents/AGENT_ID_PROTOCOL.md`:

| Agent | Lineage | Short Code | Discovery |
|-------|---------|------------|-----------|
| Claude Code | claude | CLA | `ANTHROPIC_MODEL` env var |
| GitHub Copilot | copilot | COP | `copilot-swe-agent` literal |
| Kimi (OpenClaw) | kimi | KMI | `KIMI_MODEL` env var |

### 1.3 Conflict Prevention Rules

| Rule | Description | Enforcement |
|------|-------------|-------------|
| **File Locking** | Lock before modifying non-owned files | Manual lock file in `.agents/active/` |
| **Broadcast Changes** | Notify others of >3 file changes | Append to broadcast channel |
| **Merge-First Resolution** | Smaller change merges first when conflicts arise | Agent discretion + CODEOWNER arbitration |
| **Schema Gate** | Schema changes must be committed before dependent domains | Phase gate verification |
| **Staggered Commits** | Commit every 15-30 minutes in shared context | Self-enforced |

---

## II. SHARED CONTEXT LIFECYCLE

### 2.1 Context Initialization (First Agent)

```markdown
# Shared Context — YYYY-MM-DD

**Status:** ACTIVE
**Agents:** 1 active
**Started:** HH:MM UTC

## Agent Entries

### Agent 1: [lineage]/[model] — [session-id]
**Domain:** [frontend|backend|schema|infra|docs|test]
**Files:** [list of files being modified]
**Started:** HH:MM UTC
**Estimated Completion:** HH:MM UTC
**Dependencies:** [none | Agent N | external]
```

### 2.2 Context Join (Subsequent Agents)

Append to the same file:

```markdown
### Agent 2: [lineage]/[model] — [session-id]
**Domain:** [frontend|backend|schema|infra|docs|test]
**Files:** [list]
**Started:** HH:MM UTC
**Estimated Completion:** HH:MM UTC
**Dependencies:** [none | Agent N | external]
**Coordination Notes:** [e.g., "will wait for Agent 1 schema commit before proceeding"]
```

### 2.3 Context Updates (During Work)

Every 15-30 minutes, or after significant progress:

```markdown
**Update HH:MM UTC — [lineage]/[model]:**
- [x] Completed: [specific task]
- [ ] Next: [specific task]
- ⚠️ Changed files: [new files added to scope]
- 🔒 Lock acquired: [file locked]
- 🔓 Lock released: [file unlocked]
```

### 2.4 Context Closure (Final Agent)

When all agents have completed:

```markdown
**Status:** CLOSED — All agents complete
**Closed:** HH:MM UTC
**Summary:**
- Agent 1: [completed tasks]
- Agent 2: [completed tasks]
**Next Actions:** [what the next shared context should focus on]
```

---

## III. AGENT DOMAINS & RESPONSIBILITIES

### 3.1 Claude (`sator-claude-code-001`)

**Primary Zone:**
- Cross-repo governance and standards
- Complex multi-file refactoring
- Architecture decisions and ADRs
- CI/CD workflow improvements
- Documentation and protocol authoring

**When to Use:**
- Governance/policy updates
- Multi-domain coordination
- Complex architectural changes
- CI/CD and infrastructure work

**Preferred Branch Prefix:** `claude/`

### 3.2 Copilot (`sator-copilot-swe-001`)

**Primary Zone:**
- `apps/web/src/` — Frontend component fixes
- `packages/*/src/` — Package code fixes
- Quick fixes and inline refactoring
- Dependency and build alignment
- Cache hygiene and repository maintenance

**When to Use:**
- Quick fixes while coding
- Component development
- Debugging sessions
- Build/dependency alignment
- Repository hygiene tasks

**Preferred Branch Prefix:** `copilot/`

### 3.3 Kimi (`sator-kimi-cli-001`)

**Primary Zone:**
- Root-level configuration and cross-component architecture
- Database schema changes and migrations
- Shell/script automation
- TypeScript error resolution sweeps
- Agent coordination and heartbeat tasks

**When to Use:**
- TypeScript error reduction
- Database/Redis operations
- Cross-component refactoring
- Long-running diagnostic tasks
- Multi-agent coordination oversight

**Preferred Branch Prefix:** `kimi/`

---

## IV. CONFLICT RESOLUTION WORKFLOW

### 4.1 Scenario: Two Agents Want Same File

```
┌────────────────────────────────────────────────────────────┐
│ 1. Agent A modifies "src/App.tsx"                          │
│    → Updates SHARED_CONTEXT.md with file in scope          │
├────────────────────────────────────────────────────────────┤
│ 2. Agent B wants to modify "src/App.tsx"                   │
│    → Reads SHARED_CONTEXT.md — sees Agent A has file       │
│    → Options:                                              │
│      a) Wait for Agent A to commit and release            │
│      b) Coordinate via broadcast: "Need src/App.tsx for X"│
│      c) Work on a different file and return later          │
├────────────────────────────────────────────────────────────┤
│ 3. Agent A commits changes                                  │
│    → Updates SHARED_CONTEXT.md: "src/App.tsx complete"    │
│    → Broadcasts: "src/App.tsx changes pushed to [branch]" │
├────────────────────────────────────────────────────────────┤
│ 4. Agent B pulls changes, proceeds with modification        │
│    → Updates SHARED_CONTEXT.md with new scope              │
└────────────────────────────────────────────────────────────┘
```

### 4.2 Scenario: Merge Conflict on Shared Branch

```
┌────────────────────────────────────────────────────────────┐
│ 1. Both agents push to same PR/branch                       │
│    → Git merge conflict detected                           │
├────────────────────────────────────────────────────────────┤
│ 2. Identify which change is smaller/more focused            │
│    → Smaller change: merge first (less risk)             │
│    → Larger change: rebase after smaller merges            │
├────────────────────────────────────────────────────────────┤
│ 3. If equal size or unclear:                               │
│    → Check CONTEXT_FORWARD.md for "DO NOT REDO" items     │
│    → Prioritize the change that fixes a blocking issue     │
│    → If still unclear: escalate to CODEOWNER             │
├────────────────────────────────────────────────────────────┤
│ 4. Post-resolution:                                        │
│    → Update SHARED_CONTEXT.md with resolution notes        │
│    → Verify typecheck/build passes after merge            │
└────────────────────────────────────────────────────────────┘
```

### 4.3 Lock File Format (Optional, High-Friction Files Only)

For files that are high-friction (e.g., `package.json`, `pnpm-lock.yaml`, CI workflows):

```json
{
  "lockId": "uuid",
  "agentId": "agent://kimi/k2-6/20260516-1/A0001",
  "filePath": "package.json",
  "acquiredAt": "2026-05-16T12:00:00Z",
  "expiresAt": "2026-05-16T13:00:00Z",
  "reason": "Adding @types/react to devDependencies",
  "branch": "kimi/ts-error-fixes"
}
```

Store at: `.agents/active/[lineage]-[session]/locks/[filename].json`

---

## V. BROADCAST CHANNEL PROTOCOL

### 5.1 When to Broadcast

**Must broadcast:**
- Schema/type definition changes
- Changes to shared interfaces or APIs
- CI/CD workflow modifications
- Dependency additions or removals
- Changes affecting >3 files across >1 domain

**Should broadcast:**
- Significant progress on long-running tasks (>1 hour)
- Discovery of pre-existing issues affecting other agents
- Completion of a task that unblocks another agent

**No broadcast needed:**
- Single-file fixes within your declared domain
- Test-only changes
- Documentation typo fixes
- Comment additions

### 5.2 Broadcast Message Format

```markdown
## Broadcast — YYYY-MM-DD HH:MM UTC
**From:** agent://[lineage]/[model]/[session]/[order]
**Type:** [SCHEMA_CHANGE | PROGRESS | BLOCKER | COMPLETION | DISCOVERY]
**Scope:** [files or domains affected]

**Summary:** [1-2 sentence description]

**Details:**
- [specific change 1]
- [specific change 2]

**Impact on Other Agents:**
- [what other agents need to know or do]

**Next Steps:**
- [what you're doing next]
```

### 5.3 Broadcast Storage

Store at: `.agents/channels/broadcast/YYYY-MM-DD-HHMM-[lineage]-[type].md`

Update `.agents/channels/broadcast/LATEST.md` symlink after each broadcast.

---

## VI. DAILY WORKFLOW

### 6.1 Morning Sync (All Agents)

1. **Read SHARED_CONTEXT.md:**
   ```bash
   cat .agents/session/SHARED_CONTEXT.md 2>/dev/null || echo "No active shared context"
   ```

2. **Check LATEST broadcast:**
   ```bash
   cat .agents/channels/broadcast/LATEST.md 2>/dev/null || echo "No broadcasts today"
   ```

3. **Check for stale locks:**
   ```bash
   find .agents/active/*/locks/ -name "*.json" -mmin +60 2>/dev/null
   ```

### 6.2 During Work

**Before modifying any file:**
```bash
# 1. Check shared context
cat .agents/session/SHARED_CONTEXT.md

# 2. Check if file is in another agent's scope
grep -r "filename" .agents/session/ .agents/channels/broadcast/ 2>/dev/null

# 3. If high-friction file, check locks
find .agents/active/*/locks/ -name "*filename*" 2>/dev/null

# 4. Update shared context with your file
echo "- $(date +%H:%M): [lineage] now modifying [file]" >> .agents/session/SHARED_CONTEXT.md
```

**After committing:**
```bash
# Update shared context with commit info
echo "- $(date +%H:%M): [lineage] committed [hash] — [brief desc]" >> .agents/session/SHARED_CONTEXT.md
```

### 6.3 Evening Handoff

1. Update SHARED_CONTEXT.md with completion status
2. Leave CONTEXT_FORWARD.md for next session
3. If you're the last agent: mark SHARED_CONTEXT.md as CLOSED
4. Commit all coordination files

---

## VII. FRICTION DETECTION & RESOLUTION

### 7.1 Friction Log

When friction occurs in shared context, document it:

```markdown
## Friction Log — YYYY-MM-DD
**Agents:** [lineage A] + [lineage B]
**Time:** HH:MM UTC
**Type:** [CONFLICT | OVERLAP | COMMUNICATION_GAP | TOOL_FAILURE]

**What Happened:**
[description]

**Root Cause:**
[why it happened]

**Resolution:**
[how it was resolved]

**Prevention:**
[what protocol change prevents recurrence]
```

Store at: `.agents/friction-log/YYYY-MM-DD-[type].md`

### 7.2 Known Friction Patterns (from PRs 17-21)

| Pattern | PRs | Root Cause | Prevention |
|---------|-----|------------|------------|
| Overlapping tsconfig changes | #17 (Claude) + #20 (Copilot) | Both agents fixed `@njz/types` tsconfig independently | Shared context declaration before work begins |
| .turbo/cache tracking | #20 (Copilot) | Cache files committed accidentally | `.gitignore` rule + pre-commit check |
| Workflow spam | #21 (Copilot) | Broken workflows kept generating noise | `agent-validation.yml` checks + CODEOWNER approval |
| Vercel secret refs | #43 (Claude) | Undefined secrets in vercel.json | `EXTERNAL_SERVICE_RECONCILIATION.md` verification |
| Sentry removal staging | #43 (Claude) | Multi-stage removal across commits | Single-plan coordination in SHARED_CONTEXT |

### 7.3 Friction Escalation

| Level | Condition | Action |
|-------|-----------|--------|
| 1 — Self-resolve | Single-file overlap, clear priority | Agents coordinate directly |
| 2 — Broadcast | Multi-file conflict, unclear priority | Post to broadcast channel, wait 10 min |
| 3 — CODEOWNER | Agents cannot agree | @notbleaux decides via PR comment |
| 4 — Emergency | Blocking production or data loss | Immediate human intervention |

---

## VIII. TOOLS & UTILITIES

### 8.1 Shared Context Creation Helper

```bash
#!/bin/bash
# .agents/scripts/init-shared-context.sh

DATE=$(date +%Y-%m-%d)
TIME=$(date +%H:%M)
LINEAGE=${1:-"unknown"}
MODEL=${2:-"unknown"}
SESSION=${3:-"unknown"}
DOMAIN=${4:-"unknown"}

FILE=".agents/session/SHARED_CONTEXT.md"

if [ ! -f "$FILE" ]; then
cat > "$FILE" << EOF
[Ver001.000]

# Shared Context — $DATE

**Status:** ACTIVE
**Agents:** 1 active
**Started:** $TIME UTC

## Agent Entries

### Agent 1: $LINEAGE/$MODEL — $SESSION
**Domain:** $DOMAIN
**Files:** TBD
**Started:** $TIME UTC
**Estimated Completion:** TBD
**Dependencies:** none

## Progress Log
EOF
else
  echo "" >> "$FILE"
  echo "### Agent N: $LINEAGE/$MODEL — $SESSION" >> "$FILE"
  echo "**Domain:** $DOMAIN" >> "$FILE"
  echo "**Started:** $TIME UTC" >> "$FILE"
fi

echo "Shared context initialized at $FILE"
```

### 8.2 Quick Status Check

```bash
# .agents/scripts/status-check.sh

echo "=== Active Shared Context ==="
cat .agents/session/SHARED_CONTEXT.md 2>/dev/null || echo "None"

echo ""
echo "=== Recent Broadcasts ==="
ls -lt .agents/channels/broadcast/ 2>/dev/null | head -5 || echo "None"

echo ""
echo "=== Active Locks ==="
find .agents/active/ -name "*.json" 2>/dev/null | head -10 || echo "None"

echo ""
echo "=== Agent Counters (from registry) ==="
jq '.agents' polyrepo/registry/index.json 2>/dev/null || echo "Registry not found"
```

---

## IX. BEST PRACTICES

### 9.1 Do's

✅ Check SHARED_CONTEXT.md before starting work  
✅ Broadcast changes affecting >3 files or shared interfaces  
✅ Commit incrementally (every 15-30 min) in shared context  
✅ Sign commits with Agent ID per `AGENT_ID_PROTOCOL.md`  
✅ Release file locks promptly after use  
✅ Document friction when it occurs  
✅ Respect domain boundaries — coordinate before crossing  

### 9.2 Don'ts

❌ Start work without checking for active shared context  
❌ Hold uncommitted changes for >1 hour in shared context  
❌ Modify files in another agent's scope without coordination  
❌ Force-push to shared branches  
❌ Ignore broadcast messages from other agents  
❌ Batch all changes into a single end-of-session commit  
❌ Create new root files without updating `.doc-tiers.json`  

---

## X. TESTING THE FRAMEWORK

This protocol is currently in **testing mode** for the 3-agent environment (Claude × Copilot × Kimi).

**Testing objectives:**
1. Detect friction points in real multi-agent workflows
2. Validate that shared context declarations prevent conflicts
3. Measure overhead of broadcast protocol vs. conflict resolution
4. Refine lock granularity (too coarse = blocking; too fine = ineffective)

**Feedback collection:**
- Friction logs → `.agents/friction-log/`
- Protocol refinements → PRs to this file
- Success metrics → Reduction in merge conflicts, faster task completion

**Exit criteria for testing mode:**
- 5 consecutive shared contexts without Level 2+ friction
- All 3 agents report protocol as "helpful, not burdensome"
- <10% overhead compared to solo-agent work

---

**Version:** 1.1.0  
**Owner:** Multi-Agent Coordination Team  
**Review:** Per shared context or weekly, whichever is more frequent  

*Protocol active. Agents may begin coordinated operations in shared contexts.*
