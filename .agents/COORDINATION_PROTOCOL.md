[Ver001.000]

# Multi-Agent Coordination Protocol
## Kimi CLI × VS Code × Open-Claw Cloud

**Purpose:** Prevent conflicts and enable effective collaboration between three AI agents  
**Status:** ACTIVE  
**Created:** 2026-03-17

---

## I. CORE PRINCIPLES

### 1.1 Conflict Prevention Rules

| Rule | Description | Enforcement |
|------|-------------|-------------|
| **File Locking** | Lock before modifying | Auto-expire after 30min |
| **JLB Task Ownership** | One agent per active task | Git commit visibility |
| **Zone Separation** | Each agent has preferred zones | Manifest authorization |
| **Broadcast Changes** | Notify others of significant changes | Channel messages |

### 1.2 Communication Hierarchy

```
LEVEL 1: File Lock (immediate)
    ↓
LEVEL 2: JLB Task Assignment (within session)
    ↓
LEVEL 3: Channel Message (cross-agent)
    ↓
LEVEL 4: Foreman Arbitration (disputes)
    ↓
LEVEL 5: Human Override (final)
```

---

## II. AGENT ZONES & RESPONSIBILITIES

### 2.1 Kimi CLI Agent (`sator-kimi-cli-001`)

**Primary Zone:**
- Root-level configuration
- Cross-component architecture
- Database schema changes
- Documentation updates
- Agent coordination tasks

**When to Use:**
- Complex multi-file refactoring
- New feature architecture
- Coordination with other agents
- Database/Redis operations
- Shell/script automation

**Communication:**
- Channel: `.agents/channels/cli-team/`
- Inbox: `.job-board/00_INBOX/kimi-cli-001/`

### 2.2 VS Code Agent (`sator-vscode-001`)

**Primary Zone:**
- `apps/website-v2/src/` - Frontend code
- `packages/*/src/` - Package code
- Component-level changes
- Inline editing and refactoring

**When to Use:**
- Quick fixes while coding
- Component development
- Debugging sessions
- Code formatting/linting
- Inline documentation

**Communication:**
- Channel: `.agents/channels/ide-team/`
- Inbox: `.job-board/00_INBOX/vscode-agent-001/`

### 2.3 Open-Claw Cloud Agent (`sator-openclaw-001`)

**Primary Zone:**
- `data/` - Data processing
- `reports/` - Generated reports
- `logs/` - Log aggregation
- `memory/` - Documentation updates

**When to Use:**
- Scheduled data processing
- Report generation
- Analytics updates
- Log analysis
- Batch operations

**Communication:**
- Channel: `.agents/channels/cloud-team/`
- Inbox: `.job-board/00_INBOX/openclaw-cloud-001/`

---

## III. CONFLICT RESOLUTION WORKFLOW

### 3.1 Scenario: Two Agents Want Same File

```
┌────────────────────────────────────────────────────────────┐
│ 1. Agent A locks file "src/App.tsx"                        │
│    → Lock stored in .agents/active/{agent-id}/locks/       │
├────────────────────────────────────────────────────────────┤
│ 2. Agent B tries to modify "src/App.tsx"                   │
│    → Check: File is locked by Agent A                      │
│    → Action: Post message to broadcast channel             │
├────────────────────────────────────────────────────────────┤
│ 3. Agent A receives notification                           │
│    → Options:                                              │
│      a) Release lock early (if done)                       │
│      b) Extend lock (if still working)                     │
│      c) Coordinate via JLB                                 │
├────────────────────────────────────────────────────────────┤
│ 4. If no response in 5 minutes                             │
│    → Escalate to Foreman protocol                          │
│    → Foreman decides based on priority/effort              │
└────────────────────────────────────────────────────────────┘
```

### 3.2 Lock File Format

```json
{
  "lockId": "uuid",
  "agentId": "sator-kimi-cli-001",
  "filePath": "src/App.tsx",
  "acquiredAt": "2026-03-17T12:00:00Z",
  "expiresAt": "2026-03-17T12:30:00Z",
  "reason": "Refactoring component structure",
  "taskId": "TASK-001"
}
```

---

## IV. ACP SERVER INTEGRATION

### 4.1 Starting the ACP Server

For VS Code integration, start the ACP server:

```bash
# Terminal 1: Start ACP server
kimi acp --port 8080 --host localhost

# This enables VS Code extension to connect to Kimi
```

### 4.2 VS Code Extension Configuration

Create `.vscode/kimi-settings.json`:

```json
{
  "kimi.acp.enabled": true,
  "kimi.acp.host": "localhost",
  "kimi.acp.port": 8080,
  "kimi.agent.id": "sator-vscode-001",
  "kimi.coordination.channel": ".agents/channels/ide-team/",
  "kimi.locks.enabled": true,
  "kimi.locks.autoRelease": true,
  "kimi.locks.timeoutMinutes": 30
}
```

### 4.3 Cross-Agent Communication via ACP

When VS Code agent makes changes:

```typescript
// VS Code extension notifies Kimi CLI
const response = await fetch('http://localhost:8080/agent/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: 'sator-vscode-001',
    to: 'sator-kimi-cli-001',
    type: 'FILE_CHANGED',
    payload: {
      file: 'src/components/Grid.tsx',
      changeType: 'modified',
      summary: 'Fixed type error in props'
    }
  })
});
```

---

## V. DAILY WORKFLOW

### 5.1 Morning Sync (All Agents)

1. **Check Inbox:**
   ```bash
   # Each agent checks their JLB inbox
   ls .job-board/00_INBOX/{agent-id}/NEW/
   ```

2. **Review Locks:**
   ```bash
   # Check for stale locks
   find .agents/active/*/locks/ -name "*.json" -mmin +30
   ```

3. **Channel Updates:**
   ```bash
   # Read broadcast messages
   ls -lt .agents/channels/broadcast/
   ```

### 5.2 During Work

**Before modifying any file:**

```bash
# 1. Check if file is locked
cat .agents/active/*/locks/$(echo "filepath" | tr '/' '_').json 2>/dev/null

# 2. If not locked, acquire lock
echo '{"lockId":"...","agentId":"...","filePath":"...",...}' > .agents/active/{agent-id}/locks/{filename}.json

# 3. Make changes
# ... edit files ...

# 4. Release lock
rm .agents/active/{agent-id}/locks/{filename}.json

# 5. Broadcast significant changes
echo '{"from":"...","type":"FILE_CHANGED","..."}' > .agents/channels/broadcast/$(date +%s).json
```

### 5.3 Evening Handoff

1. Release all locks
2. Update task status in JLB
3. Leave status message in channel
4. Commit all coordination files

---

## VI. EMERGENCY PROCEDURES

### 6.1 Deadlock Resolution

If two agents lock files that depend on each other:

```bash
# 1. Identify deadlock
# Both agents report in broadcast channel

# 2. Foreman (Kimi CLI) intervenes
# Review both locks and decide priority

# 3. Release lower priority lock
rm .agents/active/{lower-priority-agent}/locks/{file}.json

# 4. Document in BLOCKS/
echo "Deadlock resolved: ..." > .job-board/04_BLOCKS/DEADLOCK-{timestamp}.md
```

### 6.2 Agent Crash Recovery

If an agent crashes with active locks:

```bash
# 1. Check for stale locks (older than 30 min)
find .agents/active/*/locks/ -name "*.json" -mmin +30

# 2. Review lock content
cat .agents/active/{crashed-agent}/locks/{file}.json

# 3. If safe, release lock
rm .agents/active/{crashed-agent}/locks/{file}.json

# 4. Log incident
echo "Lock released due to agent crash..." >> .agents/audit/emergency-releases.log
```

---

## VII. TOOLS & UTILITIES

### 7.1 Check Lock Status

```bash
# Check if file is locked
node .agents/tools/check-lock.js --file=src/App.tsx
```

### 7.2 List Active Locks

```bash
# Show all active locks
node .agents/tools/list-locks.js
```

### 7.3 Send Message to Agent

```bash
# Send message to another agent
node .agents/tools/send-message.js \
  --from=sator-kimi-cli-001 \
  --to=sator-vscode-001 \
  --message="Working on shared component"
```

---

## VIII. BEST PRACTICES

### 8.1 Do's

✅ Lock files before editing  
✅ Check inbox before starting work  
✅ Broadcast significant changes  
✅ Release locks promptly  
✅ Use JLB for task coordination  
✅ Respect zone boundaries  

### 8.2 Don'ts

❌ Edit files without checking locks  
❌ Hold locks for >30 minutes  
❌ Ignore broadcast messages  
❌ Cross into another agent's zone without coordination  
❌ Modify `.agents/` files directly (except own workspace)  

---

**Version:** 1.0.0  
**Owner:** AI Coordination Team  
**Review:** Weekly  

*Protocol active. Agents may begin coordinated operations.*
