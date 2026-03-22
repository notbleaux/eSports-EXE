[Ver001.000]

# 04_BLOCKS — Blockers and Obstacles

**Purpose:** Track obstacles that prevent task completion.

## Structure

```
04_BLOCKS/
├── README.md           # This file
└── BLOCK-*.json        # Blocker files
```

## When to Create a Blocker

- Missing dependencies
- External API unavailable
- Requirements unclear
- Technical obstacles discovered
- Need input from other agents/teams

## Blocker Lifecycle

```
open → in_review → resolved / wontfix
```

## Linking to Tasks

Blockers reference the blocked task(s):

```json
{
  "id": "BLOCK-2026-0001",
  "taskIds": ["TASK-2026-0001", "TASK-2026-0002"],
  "status": "open"
}
```

Tasks also reference their blockers:

```json
{
  "id": "TASK-2026-0001",
  "blockers": ["BLOCK-2026-0001"],
  "status": "blocked"
}
```

## Resolution

When a blocker is resolved:
1. Update blocker status to `resolved`
2. Set `resolvedAt` timestamp
3. Update linked tasks to remove blocker reference
4. Move linked tasks back to `in_progress`
