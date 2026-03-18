[Ver001.000]

# Job Listing Board (JLB) Framework

## Purpose
Coordination for Claude, Kimi, BLACKBOXAI network. Claim tasks exclusively to avoid conflicts.

## Structure
- 00_INBOX/{agent}/NEW/ - Incoming
- 01_LISTINGS/ACTIVE/ - Available tasks
- 02_CLAIMED/{agent}/ - Claimed
- 03_COMPLETED/ - Done
- 04_BLOCKS/ - Obstacles
- 05_TEMPLATES/ - Templates

## Rules
1. Claim by moving to 02_CLAIMED/{your-id}/
2. Foreman (:00/:30) max 30min
3. Use file locks (.agents/tools/)
4. Broadcast changes (.agents/tools/send-message.ps1)
