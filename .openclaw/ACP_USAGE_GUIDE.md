# ACP Usage Guide - CORRECTED

## ⚠️ IMPORTANT: `kimi acp` Uses stdio, NOT HTTP Ports

The documentation showing `kimi acp --port 8080` is **INCORRECT**.

**Correct:** `kimi acp` uses **stdio transport** (stdin/stdout), not HTTP/TCP ports.

---

## How ACP Transport Works

### stdio Transport (Default)
```
┌─────────────┐      stdin/stdout      ┌─────────────┐
│   Client    │ ◄────────────────────► │    Agent    │
│  (VS Code:) │   JSON-RPC messages    │ (kimi acp)  │
└─────────────┘                        └─────────────┘
```

The client **spawns** the agent as a subprocess and communicates via:
- **stdin** → Send JSON-RPC requests TO agent
- **stdout** → Receive JSON-RPC responses FROM agent
- **stderr** → Agent logging

### HTTP Transport (Optional - NOT supported by kimi acp)
```
┌─────────────┐      HTTP/TCP          ┌─────────────┐
│   Client    │ ◄────────────────────► │    Agent    │
│  (Browser)  │   Port 8080 (example)  │  (Server)   │
└─────────────┘                        └─────────────┘
```

---

## Correct Usage Examples

### 1. Start kimi acp (stdio mode)
```powershell
# Just run kimi acp - it waits for JSON-RPC on stdin
kimi acp
```

### 2. Test with JSON-RPC
```powershell
# Send initialize request via stdin
$init = '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":1,"clientCapabilities":{"fs":{"readTextFile":true,"writeTextFile":true},"terminal":true},"clientInfo":{"name":"test","version":"1.0"}}}'
echo $init | kimi acp
```

### 3. Use Our ACP Client (Recommended)
```powershell
# Use the PowerShell collaboration CLI
.openclaw/collaborate.ps1 status

# Or use our Node.js client
node .openclaw/acp-client.js test-kimi
```

---

## Working with ACP

### Option A: Use Our VS Code: Extension (EASIEST)
```powershell
# Setup extension
.openclaw/setup-vscode-extension.ps1 -Dev

# Then in VS Code:
# 1. Press Ctrl+Shift+P
# 2. Type "ACP: Start Kimi Agent"
# 3. Use chat panel to interact
```

### Option B: Use Our Bridge Server
```powershell
# Terminal 1: Start bridge
python .openclaw/acp-server.py

# Terminal 2: Send JSON-RPC manually
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":1}}' | python .openclaw/acp-server.py
```

### Option C: Use Collaboration CLI
```powershell
# Check all agents
.openclaw/collaborate.ps1 status

# Delegate to Kimi CLI
.openclaw/collaborate.ps1 delegate -To "kimi-cli" -Message "List files"
```

---

## What Went Wrong?

**Incorrect command from docs:**
```powershell
kimi acp --port 8080  # ❌ ERROR: No such option: --port
```

**Why it failed:**
- `kimi acp` uses **stdio transport**, not HTTP
- No `--port` option exists
- The agent runs as a subprocess, not a network server

**Correct approach:**
```powershell
kimi acp  # ✅ Just start it - uses stdin/stdout
```

---

## Architecture Reminder

```
┌─────────────────────────────────────────────────────────────────┐
│                         YOUR SETUP                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  VS Code: Extension ──▶ ACP Client ──▶ kimi acp (stdio)          │
│       │                    │              │                      │
│       │                    │              └─▶ Uses stdin/stdout  │
│       │                    │                                     │
│       │                    └─▶ Spawns process                   │
│       │                                                          │
│       └─▶ Chat UI, File ops, Terminal                           │
│                                                                  │
│  MCP Servers (separate):                                         │
│  ├── PostgreSQL ──▶ Port 5432                                   │
│  ├── Redis ──▶ Port 6379                                        │
│  └── Docker ──▶ Unix socket/Named pipe                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Note:** MCP servers can use HTTP ports, but `kimi acp` itself uses stdio.

---

## Quick Fix - Try This Now

```powershell
# 1. Test our bridge (guaranteed to work)
.openclaw/test-acp.ps1

# 2. Check agent status
.openclaw/collaborate.ps1 status

# 3. Use collaboration CLI
.openclaw/collaborate.ps1 delegate -To "kimi-cli" -Message "Hello from ACP"
```

---

## Summary

| Wrong | Correct |
|-------|---------|
| `kimi acp --port 8080` | `kimi acp` (uses stdio) |
| HTTP/TCP transport | stdio (subprocess) transport |
| Port-based communication | stdin/stdout streams |
| Network server | Local subprocess |

**Remember:** ACP protocol supports both stdio and HTTP transports, but `kimi acp` specifically uses **stdio only**.
