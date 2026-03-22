[Ver001.000]

# Multi-AI Coordination Guidelines

## Network
- Claude (sator-claude-001)
- Kimi CLI/Claw (sator-kimi-*-001)
- BLACKBOXAI (blackboxai-001)

## No-Conflict Rules
- **Unique Claiming:** One agent per task in JLB
- **File Locks:** Always acquire-lock before edit
- **Foreman Rotation:** 30min blocks, self-timeout
- **Broadcast Changes:** send-message -To broadcast after major changes
- **Kimi Claw Webhook:** Register in AGENT_REGISTRY, use MCP for terminal access

## Workflow
1. Check 01_LISTINGS/ACTIVE/
2. Claim & lock
3. Work & test
4. Complete to 03_COMPLETED/, release lock, broadcast
