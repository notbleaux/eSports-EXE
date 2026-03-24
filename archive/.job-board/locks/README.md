[Ver001.000]

# locks/ — File Lock Storage

**Purpose:** Store lock files to prevent concurrent modifications.

## Structure

```
locks/
├── README.md           # This file
└── {hash}.lock         # Individual lock files
```

## Lock File Naming

Lock files are named using a hash of the target file path:

```
{base64-hash}.lock
```

Example:
- Target: `01_LISTINGS/ACTIVE/TASK-2026-0001.json`
- Lock: `bGlzdGluZ3MvYWN0aXZlL3Rhc2stMjAyNi0wMDAx.json.lock`

## Lock File Content

```json
{
  "filePath": "01_LISTINGS/ACTIVE/TASK-2026-0001.json",
  "agentId": "agent-001",
  "reason": "Updating task status to claimed",
  "acquiredAt": "2026-03-22T15:57:28Z",
  "expiresAt": "2026-03-22T16:27:28Z"
}
```

## TTL (Time To Live)

- Default: 30 minutes
- Maximum: 2 hours
- Expired locks are automatically cleaned up

## Manual Cleanup

If needed, expired locks can be manually removed:

```bash
node scripts/lock-manager.js cleanup
```

## ⚠️ Warning

Never manually edit lock files. Always use the lock-manager.js utility.
