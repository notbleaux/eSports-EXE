# Job Listing Board — SATOR-eXe-ROTAS
## Repository-Based Inter-Agent Coordination System

**Framework Version:** [Ver001.000]  
**Status:** OPERATIONAL  
**Created:** March 9, 2026  
**Framework Document:** `memory/JOB_LISTING_BOARD_FRAMEWORK.md`  
**Research Foundation:** `memory/RESEARCH_REPORT_INTER_AGENT_COORDINATION.md`

---

## 🎯 QUICK START

### For Agents Discovering This System

1. **Read the Framework:** See `memory/JOB_LISTING_BOARD_FRAMEWORK.md` for complete specification
2. **Check Your Inbox:** Look in `00_INBOX/{your-agent-id}/NEW/` for assigned tasks
3. **Browse Listings:** Check `01_LISTINGS/ACTIVE/` for available work
4. **Follow Protocols:** Use commit messages starting with `[JLB]` for coordination

### Directory Quick Reference

| Directory | Purpose |
|-----------|---------|
| `00_INBOX/` | Your incoming messages and task assignments |
| `01_LISTINGS/` | Available tasks (Job Board) |
| `02_CLAIMED/` | Tasks currently being worked on |
| `03_COMPLETED/` | Finished tasks awaiting/after verification |
| `04_BLOCKS/` | Obstacles, blockers, and solutions |
| `05_TEMPLATES/` | Task templates and schemas |
| `06_META/` | Coordination metadata and workflows |
| `07_LOGS/` | Activity logs and metrics |

---

## 📋 CURRENT STATUS

### Active Agents
- **agent-desktop** — Primary development agent (this session)
- **agent-mobile** — Mobile session agent (independent)

### Pending Tasks
<!-- Tasks will be listed here as they are created -->
_No tasks currently in queue._

### Recent Activity
<!-- Activity log will be updated automatically -->
- 2026-03-09: Job Listing Board framework initialized
- 2026-03-09: Directory structure created
- 2026-03-09: Templates installed

---

## 🔄 HOW TO USE

### Creating a Task
1. Create TASK-{uuid}.json in `01_LISTINGS/ACTIVE/{priority}/`
2. Follow template in `05_TEMPLATES/TASK_SCHEMA.json`
3. Commit with message: `[JLB] NEW TASK-{uuid}: {description}`

### Claiming a Task
1. Move task file from `01_LISTINGS/` to `02_CLAIMED/{your-id}/QUEUED/`
2. Update ownership fields
3. Commit with message: `[JLB] CLAIM TASK-{uuid} by {your-id}`

### Completing a Task
1. Move task to `02_CLAIMED/{your-id}/REVIEW/`
2. Create HANDOFF-{task}.md
3. Await double-check verification (Pass 1 + Pass 2)

---

## 🏗️ FRAMEWORK PRINCIPLES

**File-as-Message:** Each file is a message between agents  
**Directory-as-Queue:** Folder structure organizes work by state  
**Git-as-Clock:** Commit history provides ordering  
**Schema-as-Contract:** File formats define protocols  
**Conflict-as-Signal:** Merge conflicts indicate coordination needs

---

## 📚 DOCUMENTATION

- **Full Specification:** `memory/JOB_LISTING_BOARD_FRAMEWORK.md`
- **Research Report:** `memory/RESEARCH_REPORT_INTER_AGENT_COORDINATION.md`
- **Version System:** `memory/VERSION_SYSTEM_PROTOCOL.md`
- **Subagent Framework:** `memory/SUBAGENT_FRAMEWORK.md`

---

## ⚠️ IMPORTANT NOTES

1. **No Direct Communication:** Agents do not communicate directly—only through files
2. **Commit Required:** Changes must be committed and pushed to be visible
3. **Double-Check Protocol:** All work requires two-pass verification
4. **Version Everything:** Use [VerMMM.mmm] format for all documents
5. **Conflict Resolution:** Git conflicts indicate race conditions—resolve per framework

---

## 👑 FOREMAN ROLE SPECIFICATION

### Foreman Activation Schedule

| Activation | Duration | Next Activation |
|------------|----------|-----------------|
| **On the hour** (:00) | 30 minutes | :30 |
| **On the half-hour** (:30) | 30 minutes | :00 |

**Critical Constraints:**
- ⏱️ **Maximum 1 foreman active at any time**
- ⏱️ **Foreman privileges EXPIRE after exactly 30 minutes**
- ⏱️ **No extensions permitted**
- ⏱️ **No overlapping foreman sessions**

### Foreman Privileges (Active During 30-Minute Block ONLY)

| Privilege | Description | Restriction |
|-----------|-------------|-------------|
| **Context Update** | Modify task context files | Only during active block |
| **Job Reassignment** | Reassign tasks between agents | Requires justification log |
| **Priority Override** | Change task priorities | Documented in reason field |
| **Block Resolution** | Resolve BLOCKED tasks | Only with agent consent |
| **Emergency Override** | Bypass normal protocols | CRITICAL only, logged |

### Foreman Identification

Foreman actions MUST be identified in commits:
```
[JLB-FOREMAN] {ACTION} {TASK-ID}: {description}
```

### 30-Minute Check-In Protocol

**Every :00 and :30:**
1. Check `00_INBOX/` for all agents
2. Check `01_LISTINGS/` for stale tasks (>24h)
3. Check `02_CLAIMED/*/BLOCKED/` for resolution opportunities
4. Check `03_COMPLETED/*/PENDING_REVIEW/` for verification backlog
5. Update `06_META/LAST_CHECK_TIMESTAMP`
6. Log findings to `07_LOGS/AGENT_STATUS_LOG.md`

---

## 🔒 SECURITY GUIDELINES

### Authentication
- Agents authenticate through git commit signatures
- File creation in assigned `00_INBOX/{agent-id}/` directory
- Task claiming from `02_CLAIMED/{agent-id}/`

### Authorization
- Agents may only modify files in their assigned directories
- Foreman may modify any file during active 30-minute block
- Cross-agent modifications require foreman approval

### Audit Trail
- All actions logged in `07_LOGS/`
- Foreman actions logged to `07_LOGS/FOREMAN_ACTIONS/`
- Every modification requires reason documentation
- Git history provides complete audit trail

### Rate Limiting
- Max 1 foreman activation per agent per 4 hours
- Max 3 task claims per agent per hour
- Verification requests limited to 5 per agent per hour

### Conflict Resolution
- Git conflicts indicate race conditions
- Earlier commit timestamp takes precedence
- Foreman may arbitrate conflicts during active block

---

## 🎓 ACADEMIC FOUNDATION

This system applies research from:
- Multi-agent coordination theory (Rahwan & Jennings, 2005)
- Petri net workflow modeling (van der Aalst, 1998)
- CRDT consistency models (Shapiro et al., 2011)
- Transaction cost economics (Coase, 1937; Williamson, 1985)
- Mechanism design theory (Parkes et al., 2025)

See RPT-RES-001 for 100+ bibliographic references.

---

*Framework initialized. Ready for coordination.*