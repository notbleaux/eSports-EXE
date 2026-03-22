[Ver001.000]

# 01_LISTINGS/ACTIVE — Available Tasks

**Purpose:** Tasks available for agents to claim and work on.

## Structure

```
01_LISTINGS/ACTIVE/
├── README.md           # This file
└── TASK-*.json         # Available task files
```

## Usage

- Agents browse and claim tasks from this directory
- Tasks remain here until claimed or archived
- Maximum age before auto-archive: 7 days
- Use lock-manager.js before claiming

## Claiming a Task

```bash
# 1. Acquire lock
node scripts/lock-manager.js claim \
  01_LISTINGS/ACTIVE/TASK-2026-0001.json \
  your-agent-id

# 2. Move to your CLAIMED directory
mv 01_LISTINGS/ACTIVE/TASK-2026-0001.json \
   02_CLAIMED/your-agent-id/

# 3. Update status to "in_progress"
# 4. Release lock (automatic on successful move)
```

## Priority Indicators

Tasks should be claimed in priority order:
1. **HIGH** — Critical path, do first
2. **MEDIUM** — Standard work
3. **LOW** — Backlog items
