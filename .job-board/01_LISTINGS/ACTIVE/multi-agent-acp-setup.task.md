# Multi-Agent ACP Collaboration Task
**Task ID:** JLB-2026-03-18-001  
**Priority:** HIGH  
**Status:** ACTIVE  
**Created:** 2026-03-18  
**Due:** 2026-03-19  

---

## 🎯 Objective
Complete the integration of ACP (Agent Client Protocol) multi-agent system for Libre-X 4NJZ4 TENET Platform with three agents working in concert.

---

## 👥 Agents Involved

| Agent | Role | Status | Working On |
|-------|------|--------|------------|
| **Kibubuki** (kimi-cli) | System/Orchestrator | ✅ Active | Terminal, file ops, MCP tools |
| **Bibi** (kimi-vscode) | IDE Specialist | ✅ Active | Code: editing, Git, GitHub |
| **Kode** (openclaw-cloud) | Architect | ⏸️ Standby | Architecture, planning, reviews |

---

## ✅ Completed Work

### Infrastructure Setup
- [x] Kimi CLI installed (v1.22.0)
- [x] ACP Protocol v1.0 confirmed
- [x] MCP servers configured (7 total)
- [x] Docker containers running (API, DB, Redis)
- [x] ACP Bridge Server implemented (Python)
- [x] VS Code: Extension ready (TypeScript)
- [x] Collaboration CLI created (PowerShell)
- [x] **axiom_esports_data folder renamed** (hyphen → underscore)
- [x] **Import paths fixed** in token_routes.py
- [x] **API Server running** (healthy on port 8000)

### ACP Testing
- [x] All 7 ACP tests passing
- [x] Bridge server accepts JSON-RPC connections
- [x] Collaboration CLI operational

---

## 🔄 In Progress / Needs Work

### Immediate Tasks

#### 1. Webhook Server (Port 3001)
**Assigned to:** Kibubuki (kimi-cli)  
**Command:** `.openclaw/scripts/webhook-server.ps1 -Port 3001`  
**Status:** ⏳ Not started  
**Test:** `curl http://localhost:3001/health`

#### 2. VS Code: Extension Compilation
**Assigned to:** Bibi (kimi-vscode)  
**Path:** `.openclaw/vscode-extension.ts`  
**Command:** `.openclaw/setup-vscode-extension.ps1 -Dev`  
**Status:** ⏳ Needs build  

#### 3. API Import Verification
**Assigned to:** Kode (openclaw-cloud)  
**Verify:** All imports work after folder rename  
**Files to check:**
- packages/shared/api/src/gateway/hub_gateway.py
- packages/shared/api/src/staging/data_collection_service.py
- packages/shared/api/src/sator/service_enhanced.py

#### 4. ACP Bridge + Kimi Integration
**Assigned to:** All agents  
**Goal:** Test end-to-end ACP communication  
**Steps:**
1. Start bridge: `python .openclaw/acp-server.py`
2. Test JSON-RPC: Send initialize request
3. Verify session creation works

---

## 🐛 Known Issues

| Issue | Severity | Agent | Status |
|-------|----------|-------|--------|
| `kimi acp` has UTF-8 encoding bug on Windows | Medium | Kibubuki | Workaround: Use Python bridge |
| `--port` flag doesn't exist for kimi acp | Low | Kibubuki | Documentation error, use stdio |
| Webhook server not running | Medium | Kibubuki | Needs start |
| VS Code: extension needs build | Low | Bibi | Setup script ready |

---

## 🎮 Collaboration Workflow

### Phase 1: Individual Agent Setup (Current)
1. ✅ Kibubuki: System-level tools working
2. ✅ Bibi: IDE integration ready  
3. ✅ Kode: Architecture planning available

### Phase 2: ACP Integration
1. ⏳ Start ACP Bridge Server
2. ⏳ Test agent-to-bridge communication
3. ⏳ Verify MCP server access through bridge

### Phase 3: Joint Task Execution
1. ⏳ Create shared session
2. ⏳ Assign subtasks to each agent
3. ⏳ Synchronize results via Job Board

---

## 📁 Key Files & Locations

```
.openclaw/
├── acp-server.py              # ACP Bridge (Kibubuki)
├── collaborate.ps1            # Multi-agent CLI
├── vscode-extension.ts        # VS Code: extension (Bibi)
├── vscode-acp-client.ts       # ACP client
└── test-acp.ps1              # Test suite

packages/shared/
├── api/                       # FastAPI (Kode)
│   └── src/
│       └── tokens/
│           └── token_routes.py    # ✅ Fixed import
├── axiom_esports_data/       # ✅ Renamed folder
└── setup.py                  # ✅ Updated

.job-board/
├── 01_LISTINGS/ACTIVE/        # This task
├── 02_CLAIMED/               # Agent work directories
└── 03_COMPLETED/             # Finished tasks
```

---

## 🧪 Test Commands

```powershell
# Test ACP Bridge
python .openclaw/acp-server.py

# Test Collaboration CLI
.openclaw/collaborate.ps1 status
.openclaw/collaborate.ps1 delegate -To "kimi-cli" -Message "Task"

# Test API
curl http://localhost:8000/health

# Test Webhook (after start)
curl http://localhost:3001/health

# Test MCP
kimi mcp list
```

---

## 📝 Next Actions

1. **Kibubuki**: Start webhook server → Test with curl
2. **Bibi**: Build VS Code: extension → Test in dev mode
3. **Kode**: Review architecture → Plan Phase 2 integration
4. **All**: Update this task file with progress

---

## 🏆 Success Criteria

- [ ] All three agents can communicate via ACP
- [ ] MCP servers accessible through ACP bridge
- [ ] VS Code: extension connects to bridge
- [ ] Webhook server running and responding
- [ ] First joint task completed collaboratively

---

**Claim this task in:** `.job-board/02_CLAIMED/{agent-id}/`

**Questions?** Check `.job-board/05_TEMPLATES/` for task templates.
