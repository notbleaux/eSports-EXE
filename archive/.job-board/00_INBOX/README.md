[Ver001.000]

# 00_INBOX — Incoming Tasks

**Purpose:** Queue for new tasks before they are reviewed and posted to ACTIVE listings.

## Structure

```
00_INBOX/
├── README.md           # This file
└── {agent-id}/         # Per-agent inbox
    └── *.json          # Task files awaiting review
```

## Usage

- Tasks land here when created by agents or external systems
- Foreman reviews and moves to ACTIVE after validation
- Worker agents should NOT claim directly from INBOX
- Tasks here are in "pending review" state

## Workflow

1. Task created → placed in appropriate agent's INBOX
2. Foreman reviews → validates and moves to ACTIVE
3. Or: Foreman rejects → moves to ARCHIVED with reason
