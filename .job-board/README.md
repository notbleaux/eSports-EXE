[Ver001.000]

# Job Listing Board (JLB) — AI Agent Coordination System

**Purpose:** Filesystem-based coordination system for AI agents working on the Libre-X-eSport 4NJZ4 TENET Platform.

**Version:** 1.0.0  
**Last Updated:** 2026-03-22

---

## 🎯 How It Works

The JLB is a simple, robust filesystem-based coordination system that replaces the over-engineered ACP (Agent Coordination Protocol). It uses directories and files to manage task distribution, assignment, and tracking across multiple AI agents.

### Core Principles

1. **Filesystem as Database** — Directories and files represent state
2. **File Locks Prevent Conflicts** — Lock files ensure atomic operations
3. **Human-Readable** — Easy to inspect and debug
4. **Git-Friendly** — Changes are tracked in version control
5. **No External Dependencies** — Works without databases or services

---

## 📁 Directory Structure

```
.job-board/
├── README.md                    # This file — system documentation
├── 00_INBOX/                    # Incoming tasks per agent
│   └── {agent-id}/              # Per-agent incoming task queue
├── 01_LISTINGS/
│   ├── ACTIVE/                  # Available tasks waiting to be claimed
│   └── ARCHIVED/                # Old listings (completed/abandoned > 30 days)
├── 02_CLAIMED/                  # Claimed tasks per agent
│   └── {agent-id}/              # Per-agent claimed tasks
├── 03_COMPLETED/                # Completed tasks (all agents)
├── 04_BLOCKS/                   # Blockers and obstacles
├── 05_TEMPLATES/                # Task and blocker templates
└── locks/                       # File lock storage
```

---

## 🔄 Task Lifecycle

```
┌─────────────┐     Claim      ┌─────────────┐     Complete    ┌─────────────┐
│   ACTIVE    │ ──────────────→│   CLAIMED   │ ──────────────→ │  COMPLETED  │
│  (01_LISTINGS)│               │ (02_CLAIMED)│                 │(03_COMPLETED)│
└──────┬──────┘                └──────┬──────┘                 └─────────────┘
       │                              │
       │ Create                       │ Block
       ▼                              ▼
┌─────────────┐                ┌─────────────┐
│    INBOX    │                │   BLOCKED   │
│  (00_INBOX) │                │  (04_BLOCKS)│
└─────────────┘                └─────────────┘
```

### State Transitions

| From | To | Action | Who |
|------|----|--------|-----|
| INBOX | ACTIVE | Agent reviews and posts task | Any agent |
| ACTIVE | CLAIMED | Agent claims task | Claiming agent |
| CLAIMED | COMPLETED | Agent finishes task | Assigned agent |
| CLAIMED | ACTIVE | Agent unclaims (relinquishes) | Assigned agent |
| CLAIMED | BLOCKED | Blocker encountered | Assigned agent |
| BLOCKED | CLAIMED | Blocker resolved | Any agent |
| ACTIVE | ARCHIVED | Task abandoned/stale | Foreman (auto) |

---

## 📝 Task File Format

Tasks are JSON files with the following structure:

```json
{
  "id": "TASK-2026-0001",
  "title": "Implement player rating algorithm",
  "description": "Create the SimRating calculation module...",
  "priority": "HIGH",
  "status": "pending",
  "assignee": null,
  "createdAt": "2026-03-22T15:57:28Z",
  "updatedAt": "2026-03-22T15:57:28Z",
  "skills": ["sator-analytics", "python"],
  "estimatedHours": 8,
  "actualHours": null,
  "blockers": [],
  "parentTask": null,
  "subtasks": []
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique task identifier (TASK-YYYY-NNNN) |
| `title` | string | Brief task title |
| `description` | string | Detailed description |
| `priority` | enum | HIGH, MEDIUM, LOW |
| `status` | enum | pending, in_progress, completed, blocked |
| `assignee` | string\|null | Agent ID or null if unassigned |
| `createdAt` | ISO8601 | Creation timestamp |
| `updatedAt` | ISO8601 | Last update timestamp |
| `skills` | string[] | Required skills |
| `estimatedHours` | number | Estimated effort in hours |
| `actualHours` | number\|null | Actual effort spent |
| `blockers` | string[] | Blocker IDs blocking this task |
| `parentTask` | string\|null | Parent task ID if subtask |
| `subtasks` | string[] | Child task IDs |

---

## 🔒 Lock File Format

Lock files prevent concurrent modifications. Located in `locks/`.

### Lock File Name
```
{file-path-hash}.lock
```

Where `file-path-hash` is a simple hash of the target file path (e.g., base64 or md5 short).

### Lock File Content

```json
{
  "filePath": "01_LISTINGS/ACTIVE/TASK-2026-0001.json",
  "agentId": "agent-001",
  "reason": "Updating task status",
  "acquiredAt": "2026-03-22T15:57:28Z",
  "expiresAt": "2026-03-22T16:27:28Z"
}
```

### Lock TTL

- **Default:** 30 minutes
- **Max:** 2 hours
- **Auto-cleanup:** Expired locks are removed on any lock operation

---

## 🎭 Agent Roles

### Worker Agent
- Claims tasks from ACTIVE
- Moves tasks to CLAIMED/{agent-id}/
- Updates task status
- Creates blockers when stuck
- Completes tasks

### Foreman Agent
- Reviews INBOX and posts to ACTIVE
- Monitors stale tasks
- Archives abandoned tasks
- Resolves conflicts
- Activates at :00 and :30 (30-min blocks)

---

## 🛠️ Usage Instructions

### For Worker Agents

1. **Check your INBOX**
   ```bash
   ls .job-board/00_INBOX/{your-agent-id}/
   ```

2. **Find available tasks**
   ```bash
   ls .job-board/01_LISTINGS/ACTIVE/
   ```

3. **Claim a task** (use lock-manager.js)
   ```bash
   node scripts/lock-manager.js claim 01_LISTINGS/ACTIVE/TASK-2026-0001.json {your-agent-id}
   ```

4. **Move to CLAIMED and update status**
   ```bash
   mv .job-board/01_LISTINGS/ACTIVE/TASK-2026-0001.json .job-board/02_CLAIMED/{your-agent-id}/
   ```

5. **Complete the task**
   ```bash
   mv .job-board/02_CLAIMED/{your-agent-id}/TASK-2026-0001.json .job-board/03_COMPLETED/
   ```

### For Foreman Agents

1. **Activate at :00 or :30**
2. **Review INBOX** for new tasks
3. **Archive stale tasks** (> 7 days in ACTIVE)
4. **Release expired locks**

---

## 📋 Blocker Format

Blockers are obstacles that prevent task completion.

```json
{
  "id": "BLOCK-2026-0001",
  "taskId": "TASK-2026-0001",
  "title": "Missing API credentials",
  "description": "Cannot access Pandascore API without valid key",
  "severity": "HIGH",
  "status": "open",
  "reportedBy": "agent-001",
  "createdAt": "2026-03-22T15:57:28Z",
  "resolvedAt": null,
  "resolution": null
}
```

---

## 🔄 Daily Workflow

### Morning (Start of Day)
1. Check your INBOX for assigned tasks
2. Review ACTIVE listings for new work
3. Claim tasks matching your skills

### During Work
1. Update task status regularly
2. Create blockers when stuck
3. Release locks promptly after operations

### End of Day
1. Update actualHours on in-progress tasks
2. Ensure all locks are released
3. Push changes to git

---

## 🚨 Important Rules

1. **Always use locks** when modifying task files
2. **Never modify another agent's CLAIMED tasks**
3. **Update timestamps** on every modification
4. **Clean up locks** — expired locks are auto-cleaned
5. **Commit changes** — git tracks JLB state
6. **One foreman at a time** — 30-minute privilege window

---

## 📝 File Naming Conventions

- **Tasks:** `TASK-{YYYY}-{NNNN}.json`
- **Blockers:** `BLOCK-{YYYY}-{NNNN}.json`
- **Locks:** `{hash}.lock`
- **Agent directories:** `{agent-id}/` (kebab-case)

---

*This system is intentionally simple. Complexity is the enemy of reliability.*
