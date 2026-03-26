[Ver001.000]

# Multi-Agent Integration Guide
## Kimi CLI × VS Code × Open-Claw Cloud

**Purpose:** Setup and operational guide for three-agent coordination  
**Status:** READY TO DEPLOY  
**Last Updated:** 2026-03-17

---

## 🚀 QUICK START

### Step 1: Start Kimi ACP Server (for VS Code integration)

```bash
# Terminal: Start ACP server
kimi acp --port 8080 --host localhost

# Expected output:
# Starting Kimi ACP server on http://localhost:8080...
# ACP server ready. Listening for connections...
```

### Step 2: Open VS Code

```bash
# In project root
code .

# VS Code will:
# 1. Load kimi-settings.json
# 2. Connect to ACP server on port 8080
# 3. Register as sator-vscode-001
```

### Step 3: Verify All Agents

```bash
# Check agent registration
cat .agents/registry/AGENT_REGISTRY.md

# Check active locks
ls .agents/active/*/locks/

# Check channels
ls .agents/channels/
```

---

## 📋 AGENT REFERENCE

| Agent | ID | Type | Best For | Contact |
|-------|-----|------|----------|---------|
| **Kimi CLI** | sator-kimi-cli-001 | Terminal | Complex tasks, architecture, coordination | Terminal |
| **VS Code** | sator-vscode-001 | IDE | Quick edits, debugging, component work | VS Code |
| **Open-Claw** | sator-openclaw-001 | Cloud | Data processing, reports, monitoring | Cloud |

---

## 🔄 DAILY WORKFLOW

### Before Starting Work

```bash
# 1. Check for messages
ls .job-board/00_INBOX/kimi-cli-001/NEW/

# 2. Check broadcast channel
ls .agents/channels/broadcast/

# 3. Check active locks
.\.agents\tools\check-lock.ps1 -FilePath "src/App.tsx"
```

### During Work (Kimi CLI)

```powershell
# Before editing a file:
.\.agents\tools\acquire-lock.ps1 -AgentId "sator-kimi-cli-001" -FilePath "src/App.tsx" -Reason "Refactoring component"

# Make your changes...

# After editing:
.\.agents\tools\release-lock.ps1 -AgentId "sator-kimi-cli-001" -FilePath "src/App.tsx"

# Notify other agents of significant changes:
.\.agents\tools\send-message.ps1 -From "sator-kimi-cli-001" -To "broadcast" -Message "Updated Grid component API" -Channel "broadcast"
```

### During Work (VS Code)

VS Code agent automatically:
- ✅ Locks files before editing
- ✅ Releases locks on save
- ✅ Syncs with Kimi CLI via ACP
- ✅ Checks JLB for tasks

### During Work (Open-Claw)

Open-Claw agent automatically:
- ✅ Processes scheduled tasks
- ✅ Generates reports
- ✅ Updates data files
- ✅ Notifies on completion

---

## 🛠️ TOOLS REFERENCE

### PowerShell Scripts

| Script | Purpose | Example |
|--------|---------|---------|
| `check-lock.ps1` | Check if file is locked | `.\check-lock.ps1 -FilePath "src/App.tsx"` |
| `acquire-lock.ps1` | Lock a file | `.\acquire-lock.ps1 -AgentId "sator-kimi-cli-001" -FilePath "src/App.tsx"` |
| `release-lock.ps1` | Release a lock | `.\release-lock.ps1 -AgentId "sator-kimi-cli-001" -FilePath "src/App.tsx"` |
| `send-message.ps1` | Send message | `.\send-message.ps1 -From "..." -To "..." -Message "..."` |

### MCP Servers (for Kimi CLI)

| Server | Status | Use Case |
|--------|--------|----------|
| postgres | ✅ Working | Query database directly |
| redis | ✅ Working | Check cache/sessions |
| github | ✅ Working | Create PRs, issues |
| playwright | ✅ Working | Browser automation |
| context7 | ✅ Working | Library docs |

---

## 🚨 TROUBLESHOOTING

### Issue: ACP Server Won't Start

```bash
# Check if port is in use
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Use different port
kimi acp --port 8081
```

### Issue: VS Code Can't Connect to ACP

1. Verify ACP server is running: `curl http://localhost:8080/health`
2. Check VS Code settings: `.vscode/kimi-settings.json`
3. Restart VS Code

### Issue: File Lock Conflict

```powershell
# Check who holds the lock
.\.agents\tools\check-lock.ps1 -FilePath "src/App.tsx"

# If stale (>30 min), manually release:
rm .agents/active/{agent-id}/locks/{filename}.json

# Document the conflict
echo "Lock conflict resolved..." > .job-board/04_BLOCKS/LOCK-{timestamp}.md
```

### Issue: Agents Out of Sync

1. Pull latest changes: `git pull`
2. Check JLB status: `cat .job-board/README.md`
3. Review broadcast messages: `ls .agents/channels/broadcast/`
4. Restart ACP server

---

## 📊 MONITORING

### Check Agent Health

```bash
# List all active agents
ls .agents/active/

# Check each agent's locks
find .agents/active/*/locks -name "*.json" -exec cat {} \;

# Check message channels
ls -la .agents/channels/*/

# Check JLB inboxes
ls .job-board/00_INBOX/*/
```

### View Coordination Activity

```bash
# Recent messages
git log --oneline --all --grep="\[JLB\]" -10

# Recent lock activity
ls -lt .agents/active/*/locks/*

# Recent broadcasts
ls -lt .agents/channels/broadcast/*
```

---

## 🎯 USE CASES

### Use Case 1: VS Code Quick Fix + Kimi CLI Review

1. **VS Code Agent** spots a bug while coding
2. Acquires lock, makes quick fix
3. Sends message to Kimi CLI: "Fixed type error in Grid.tsx"
4. **Kimi CLI** reviews the change
5. Approves or suggests improvements

### Use Case 2: Kimi CLI Architecture + VS Code Implementation

1. **Kimi CLI** designs new feature architecture
2. Creates JLB task: "Implement new API endpoints"
3. Assigns to VS Code Agent
4. **VS Code Agent** implements in IDE
5. Reports completion back to JLB

### Use Case 3: Open-Claw Report + Kimi CLI Analysis

1. **Open-Claw** generates weekly analytics report
2. Saves to `reports/weekly-analytics.md`
3. Broadcasts: "New report available"
4. **Kimi CLI** reads report, suggests actions
5. Creates tasks in JLB for follow-up

---

## 📚 DOCUMENTATION

| Document | Purpose |
|----------|---------|
| `AGENT_INTEGRATION_GUIDE.md` | This guide - setup & operations |
| `.agents/COORDINATION_PROTOCOL.md` | Detailed coordination rules |
| `.agents/registry/AGENT_REGISTRY.md` | Agent registry and capabilities |
| `.agents/governance/GOVERNANCE_FRAMEWORK.md` | Governance rules |
| `.job-board/README.md` | Job Listing Board framework |

---

## ✅ CHECKLIST

- [ ] Kimi ACP server running on port 8080
- [ ] VS Code open with project
- [ ] All three agents registered in AGENT_REGISTRY.md
- [ ] Agent workspaces created
- [ ] Communication channels set up
- [ ] JLB inboxes configured
- [ ] PowerShell scripts executable
- [ ] MCP servers working (postgres, redis, github)
- [ ] Test file lock acquisition/release
- [ ] Test message broadcasting
- [ ] Commit coordination files

---

**Next Steps:**
1. Start Kimi ACP server
2. Open VS Code
3. Test coordination with a simple task
4. Scale to full multi-agent workflow

*Integration ready. Agents awaiting activation.*
