[Ver001.000]

# 01_LISTINGS/ARCHIVED — Archived Listings

**Purpose:** Storage for old, abandoned, or rejected tasks.

## Structure

```
01_LISTINGS/ARCHIVED/
├── README.md           # This file
└── TASK-*.json         # Archived task files
```

## When to Archive

- Task abandoned in ACTIVE > 7 days
- Task rejected by foreman (from INBOX)
- Task superseded by newer version
- Task no longer relevant

## Archive Reason

Archived tasks should have an `archiveReason` field added:

```json
{
  "id": "TASK-2026-0001",
  "status": "archived",
  "archiveReason": "Stale: no activity for 30 days",
  "archivedAt": "2026-03-22T15:57:28Z",
  "archivedBy": "foreman"
}
```

## Retention

Archived tasks are kept for 90 days, then may be deleted.
