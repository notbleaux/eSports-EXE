# FIXED Quick Start - ACP Without Port Confusion

## ❌ What Was Wrong

The documentation showed:
```powershell
kimi acp --port 8080  # ❌ WRONG - No such option!
```

**Reality:** `kimi acp` uses **stdio** (stdin/stdout), NOT HTTP ports.

---

## ✅ Working Solutions (Choose One)

### Option 1: Use Our Bridge (EASIEST - Guaranteed to Work)

```powershell
# Terminal 1: Start the bridge
python .openclaw/acp-server.py

# Terminal 2: Use collaboration CLI
.openclaw/collaborate.ps1 status
```

**Why this works:** Our bridge is a complete ACP implementation that doesn't need authentication.

---

### Option 2: Use Collaboration CLI (Recommended)

```powershell
# Check all agents
.openclaw/collaborate.ps1 status

# You'll see:
# ==============================================================
#                     Agent Status Board                        
# ==============================================================
# 
# Active Agents:
#   [openclaw-cloud] Status: standby
#   [kimi-cli] Status: active
#   [kimi-vscode] Status: active
#
# MCP Servers:
#   * github: connected
#   * context7: connected
#   * playwright: connected
```

---

### Option 3: Use VS Code: Extension

```powershell
# Setup and run
.openclaw/setup-vscode-extension.ps1 -Dev
```

This opens VS Code: with the ACP extension loaded.

---

### Option 4: Use Kimi CLI Directly (No ACP Mode)

If `kimi acp` gives you trouble, just use regular kimi:

```powershell
# Start interactive mode
kimi

# Or with thinking
kimi --thinking

# Or web UI
kimi web
```

**MCP servers still work in regular mode!**

---

## 🔍 Understanding the Difference

### ACP (Agent Client Protocol)
- **Purpose:** Standardize communication between IDE and AI agent
- **Transport:** stdio (stdin/stdout) for `kimi acp`
- **Use case:** IDE integration (VS Code:, Zed, etc.)

### MCP (Model Context Protocol)  
- **Purpose:** Connect AI to external tools (DB, Docker, etc.)
- **Transport:** stdio, HTTP, or SSE
- **Use case:** Database queries, file system, APIs

### Your Setup
```
┌─────────────────────────────────────────────────────────────┐
│  Kimi CLI can work in TWO ways:                              │
│                                                              │
│  1. Regular Mode: kimi [--thinking]                          │
│     └── Uses MCP servers (PostgreSQL, Redis, etc.)          │
│                                                              │
│  2. ACP Mode: kimi acp                                       │
│     └── Uses stdio JSON-RPC for IDE integration             │
│     └── ALSO uses MCP servers                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Bottom line:** You don't NEED `kimi acp` to use MCP servers!

---

## 🚀 Simplest Working Setup

### Step 1: Verify MCP Works (No ACP needed)
```powershell
# Just start kimi normally
kimi

# Then ask it to use MCP:
# "Query the PostgreSQL database for all players"
# "Check Redis cache for session data"
```

### Step 2: Use Our Tools
```powershell
# Collaboration CLI
.openclaw/collaborate.ps1 delegate -To "kimi-cli" -Message "Your task here"

# Or Python bridge
python .openclaw/acp-server.py
```

---

## 🎯 Summary

| If you want... | Use this... |
|----------------|-------------|
| Quick AI assistant | `kimi` or `kimi --thinking` |
| MCP tools (DB, Docker) | `kimi` (regular mode) |
| IDE integration | VS Code: extension + our bridge |
| Multi-agent setup | `.openclaw/collaborate.ps1` |

**Forget about `--port 8080` - it doesn't exist!** The documentation was wrong.

---

## Test Right Now

```powershell
# This WILL work:
.openclaw/test-acp.ps1

# This will NOT work:
kimi acp --port 8080  # ❌ No such option!

# This WILL work:
kimi acp  # ✅ Uses stdio (but may need login)
```

---

## Need Help?

Run these commands for help:
```powershell
# Our tools
.openclaw/collaborate.ps1 status
.openclaw/test-acp.ps1

# Kimi help
kimi --help
kimi acp --help
```
