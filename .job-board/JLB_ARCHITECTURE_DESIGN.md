[Ver001.000]

# JLB ARCHITECTURE DESIGN
## Long-Form Memory, MCP Integration & Maintenance Systems

**Role:** 🔴 Foreman (dual role: Agent Coordination + JLB Architecture)  
**Status:** Phase 1 Active — JLB Design Block  
**Budget:** $0 (Free tier only)  
**Goal:** Self-maintaining JLB with AI-assisted coordination

---

## 1. LONG-FORM MEMORY CONTEXT SYSTEM

### Problem
Current JLB is file-based with no persistent memory of:
- Historical agent performance
- Recurring blockers
- Pattern recognition across phases
- Institutional knowledge accumulation

### Solution: JLB Memory Layer

#### Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    JLB MEMORY LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Vector     │  │   Graph      │  │   Temporal   │      │
│  │   Store      │  │   Relations  │  │   Events     │      │
│  │  (embeddings)│  │  (connections)│  │  (timeline)  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│         └─────────────────┼─────────────────┘               │
│                           ▼                                 │
│                  ┌─────────────────┐                       │
│                  │  Query Engine   │                       │
│                  │  (RAG + Graph)  │                       │
│                  └────────┬────────┘                       │
│                           ▼                                 │
│                  ┌─────────────────┐                       │
│                  │   AI Context    │                       │
│                  │   Window        │                       │
│                  └─────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

#### Implementation (Free Tools)

**Option A: Git-Based Memory (Recommended)**
- Store as JSON/YAML in `.job-board/memory/`
- Git history = temporal memory
- Free, versioned, persistent
- Use embeddings via free APIs (Hugging Face)

**Option B: SQLite + LiteFS (Free)**
- SQLite database for structured queries
- LiteFS for replication (if needed)
- Zero cost, local file

**Selected: Option A (Git-Based)**

```typescript
// .job-board/memory/schema.ts
interface JLBMemory {
  agents: AgentMemory[];
  tasks: TaskMemory[];
  blockers: BlockerMemory[];
  patterns: PatternMemory[];
  embeddings: EmbeddingCache;
}

interface AgentMemory {
  agentId: string;
  velocity: number[]; // Per-phase completion rates
  quality: number[];  // Quality gate pass rates
  specialties: string[]; // What they excel at
  blockers: string[]; // Recurring blockers
  collaborations: string[]; // Who they work well with
}

interface PatternMemory {
  pattern: string;
  occurrences: number;
  contexts: string[];
  resolution: string;
}
```

#### Memory Population (Automated)

```bash
# Daily memory update (automated via GitHub Action)
#!/bin/bash
# .github/workflows/jlb-memory.yml

# 1. Parse all TEAM_REPORTS
# 2. Extract agent performance metrics
# 3. Identify recurring blockers
# 4. Update pattern recognition
# 5. Generate embeddings for semantic search
# 6. Commit to .job-board/memory/
```

---

## 2. MCP (Model Context Protocol) INTEGRATION

### What is MCP?
MCP = Model Context Protocol (Anthropic standard)
Allows AI assistants to:
- Access tools
- Read resources
- Execute prompts

### Free MCP Servers Available

| Server | Purpose | Cost |
|--------|---------|------|
| **GitHub MCP** | Repo operations, issues, PRs | Free |
| **Filesystem MCP** | Read/write local files | Free |
| **SQLite MCP** | Database queries | Free |
| **Fetch MCP** | HTTP requests | Free |
| **Memory MCP** | Persistent memory | Free |

### JLB MCP Integration Plan

```typescript
// .job-board/mcp/config.json
{
  "mcpServers": {
    "jlb-filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", ".job-board"]
    },
    "jlb-memory": {
      "command": "node",
      "args": [".job-board/mcp/memory-server.js"]
    },
    "jlb-github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}" }
    }
  }
}
```

### MCP Tools for JLB

```typescript
// Tools exposed to AI agents via MCP
const jlbTools = {
  // Task Management
  "jlb_claim_task": (agentId, taskId) => {...},
  "jlb_submit_work": (agentId, submission) => {...},
  "jlb_check_status": (taskId) => {...},
  
  // Memory Access
  "jlb_query_memory": (query) => {...}, // RAG search
  "jlb_get_agent_history": (agentId) => {...},
  "jlb_find_similar_tasks": (taskId) => {...},
  
  // Coordination
  "jlb_request_tl_review": (agentId, work) => {...},
  "jlb_escalate_blocker": (agentId, blocker) => {...},
  "jlb_get_team_status": (tlId) => {...},
  
  // Reporting
  "jlb_generate_daily_report": (tlId) => {...},
  "jlb_update_metrics": () => {...}
};
```

---

## 3. ACP (Agent Communication Protocol) INTEGRATION

### What is ACP?
ACP = Agent Communication Protocol
Standard for agent-to-agent and agent-to-system communication

### ACP for JLB

```typescript
// Agent messages via ACP
interface ACPMessage {
  from: string;      // Agent ID
  to: string;        // Recipient (TL, AF, F, or broadcast)
  type: 'status' | 'blocker' | 'completion' | 'question';
  payload: unknown;
  timestamp: string;
  signature?: string; // For authentication
}

// Message routing
const acpRouter = {
  'agent→tl': (msg) => routeToTL(msg.to, msg),
  'tl→af': (msg) => routeToAF(msg),
  'tl→f': (msg) => routeToForeman(msg),
  'af→f': (msg) => routeToForeman(msg),
  'f→broadcast': (msg) => broadcastToAll(msg)
};
```

---

## 4. MAINTENANCE PROTOCOLS

### Daily Maintenance (Automated)

```yaml
# .github/workflows/jlb-daily-maintenance.yml
name: JLB Daily Maintenance
on:
  schedule:
    - cron: '0 2 * * *' # 2 AM UTC
  workflow_dispatch:

jobs:
  maintenance:
    runs-on: ubuntu-latest
    steps:
      - name: Archive completed tasks
        run: node .job-board/scripts/archive-completed.js
      
      - name: Update memory embeddings
        run: node .job-board/scripts/update-embeddings.js
      
      - name: Check stale tasks
        run: node .job-board/scripts/check-stale.js
      
      - name: Generate metrics report
        run: node .job-board/scripts/generate-metrics.js
      
      - name: Commit changes
        run: |
          git add .job-board/
          git commit -m "[JLB-MAINT] Daily maintenance $(date)"
          git push
```

### Weekly Maintenance (Semi-Automated)

| Day | Task | Owner |
|-----|------|-------|
| Monday | Review stale blockers | 🔴 Foreman |
| Tuesday | Archive old decisions | 🟠 AF |
| Wednesday | Update team roster | 🔴 Foreman |
| Thursday | Review metrics trends | 🟠 AF |
| Friday | Generate week report | Automated |

### Monthly Maintenance

- [ ] Full repository health check
- [ ] Dependency updates
- [ ] Security audit
- [ ] Performance review
- [ ] Framework updates

---

## 5. ARCHIVING PROTOCOLS

### Auto-Archive Rules

| Item | Archive After | Location |
|------|---------------|----------|
| Completed tasks | 30 days | `.job-board/archive/completed/` |
| Old team reports | 60 days | `.job-board/archive/reports/` |
| Resolved blockers | 90 days | `.job-board/archive/blockers/` |
| Grade cards | 180 days | `.job-board/archive/grades/` |
| Phase reports | 1 year | `.job-board/archive/phases/` |

### Archive Structure

```
.job-board/archive/
├── 2026-03/           # Monthly buckets
│   ├── completed/
│   ├── reports/
│   └── blockers/
├── 2026-02/
└── index.json         # Searchable index
```

---

## 6. ROADMAP UPDATE PROTOCOLS

### Flat Notebook Protocol

Instead of complex docs, use flat notebook:

```markdown
# .job-board/NOTEBOOK.md

## 2026-03-23
- Phase 1 initiated
- 9 agents deployed
- SAF Council forming
- Next: Phase 1.2 planning

## 2026-03-22
- Phase 0 complete
- All frameworks approved
- TLs operational

[Continues... one entry per day]
```

### Roadmap Updates

```markdown
# .job-board/ROADMAP.md

## Current Phase: 1.1
Status: 🟢 Active
Completion: 45%

## Next Phase: 1.2
ETA: 2026-03-30
Dependencies: Phase 1.1 complete

## Upcoming Phases
- 1.2: [Description]
- 1.3: [Description]
- 2.1: [Description]
```

---

## 7. TWICE-DAILY KIMI AGENT CHECKS

### Schedule

| Time | Check Type | Action |
|------|-----------|--------|
| 09:00 UTC | Morning Check | Review overnight progress, identify blockers |
| 21:00 UTC | Evening Check | Review daily completion, update metrics |

### Check Protocol

```typescript
// Automated Kimi agent spawn
interface KimiCheck {
  time: '09:00' | '21:00';
  actions: [
    'Read all TEAM_REPORTS',
    'Check for blockers >4h old',
    'Verify task progress vs plan',
    'Update JLB metrics',
    'Flag issues for Foreman',
    'Generate check report'
  ];
}
```

### Implementation (GitHub Actions)

```yaml
# .github/workflows/kimi-check.yml
name: Kimi Agent JLB Check
on:
  schedule:
    - cron: '0 9 * * *'  # 9 AM UTC
    - cron: '0 21 * * *' # 9 PM UTC

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Kimi Check
        uses: kimi-ai/agent@v1
        with:
          task: 'jlb-morning-check' # or 'jlb-evening-check'
          config: '.job-board/kimi-config.json'
      
      - name: Commit Report
        run: |
          git add .job-board/checks/
          git commit -m "[KIMI-CHECK] $(date +%H:%M) check complete"
          git push
```

---

## 8. ASSESSMENT OF CURRENT STRUCTURES

### Current State Analysis

| Component | Status | Assessment | Priority |
|-----------|--------|------------|----------|
| **JLB Directory** | ✅ Good | Well-organized, clear hierarchy | Maintain |
| **Templates** | ✅ Good | Comprehensive, usable | Maintain |
| **Team Structure** | ✅ Good | 5-tier hierarchy clear | Maintain |
| **Memory** | ❌ Missing | No persistent memory | HIGH |
| **MCP** | ❌ Missing | No tool integration | HIGH |
| **Automation** | ⚠️ Partial | Some scripts, not integrated | MEDIUM |
| **Archiving** | ⚠️ Manual | Needs automation | MEDIUM |
| **Metrics** | ⚠️ Reactive | Not proactive | MEDIUM |
| **Kimi Checks** | ❌ Missing | No scheduled checks | HIGH |

### Improvement Priorities

**Week 1 (Critical):**
1. Implement git-based memory system
2. Setup MCP servers
3. Configure twice-daily Kimi checks

**Week 2 (Important):**
4. Automate archiving
5. Create maintenance workflows
6. Implement flat notebook

**Week 3 (Nice-to-have):**
7. Advanced metrics dashboard
8. Pattern recognition automation
9. Predictive blocker detection

---

## 9. FREE TOOL INVENTORY

| Tool | Purpose | Integration |
|------|---------|-------------|
| **Git** | Version control, history | Native |
| **GitHub Actions** | Automation | Workflows |
| **SQLite** | Structured data | Local DB |
| **Hugging Face** | Free embeddings | API |
| **MCP Servers** | AI tool access | Config |
| **Node.js** | Scripts | Runtime |
| **TypeScript** | Type safety | Dev |

**Total Cost: $0**

---

## 10. IMPLEMENTATION TIMELINE

### This Week (While Phase 1 Active)

| Day | JLB Architecture Task | Parallel Agent Mgmt |
|-----|----------------------|---------------------|
| Mon | Setup memory schema | Check 9 agents |
| Tue | Configure MCP | Review submissions |
| Wed | Kimi check automation | TL sync meeting |
| Thu | Archiving scripts | Pre-review cycle |
| Fri | Maintenance workflows | Weekend planning |

### Next Week

- Full automation testing
- Metrics dashboard
- Pattern recognition
- Documentation

---

## SUMMARY

JLB will become a **self-maintaining, AI-assisted coordination system** with:

✅ Long-form memory (git-based)  
✅ MCP tool integration (free)  
✅ Automated maintenance  
✅ Twice-daily AI checks  
✅ Zero cost  

**Next Action:** Begin implementation of memory schema and MCP config.
