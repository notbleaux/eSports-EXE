[Ver001.000]

# 02_CLAIMED — Claimed Tasks

**Purpose:** Tasks currently being worked on by specific agents.

## Structure

```
02_CLAIMED/
├── README.md           # This file
└── {agent-id}/         # Per-agent claimed tasks
    └── TASK-*.json     # Tasks this agent is working on
```

## Usage

- Each agent has their own subdirectory
- Only the assigned agent modifies their tasks
- Tasks move here from ACTIVE when claimed
- Tasks move to COMPLETED or back to ACTIVE

## State Management

| Status | Meaning |
|--------|---------|
| `in_progress` | Actively being worked on |
| `blocked` | Waiting on blocker resolution |
| `completed` | Ready to move to COMPLETED |

## Relinquishing a Task

If you cannot complete a claimed task:

1. Update status to `pending`
2. Clear assignee field
3. Move back to `01_LISTINGS/ACTIVE/`
4. Add note in description about work done so far
