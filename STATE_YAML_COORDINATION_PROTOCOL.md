[Ver014.000]

# STATE.YAML — Subagent Coordination Protocol
## File-Based Parallel Review System

**Version:** 1.0.0  
**Protocol:** STATE-YAML-001  
**Purpose:** Enable parallel subagent reviews without real-time messaging

---

## ARCHITECTURE OVERVIEW

```
Main Agent (Foreman)
    │
    ├── spawns Subagent-1 ──► reads/writes STATE.yaml ──► announces completion
    ├── spawns Subagent-2 ──► reads/writes STATE.yaml ──► announces completion
    ├── spawns Subagent-3 ──► reads/writes STATE.yaml ──► announces completion
    ├── spawns Subagent-4 ──► reads/writes STATE.yaml ──► announces completion
    └── spawns Subagent-5 ──► reads/writes STATE.yaml ──► announces completion
    
    └── Polls STATE.yaml ──► synthesizes results ──► final report
```

**Key Insight:** No direct agent-to-agent messaging. All coordination through shared file.

---

## STATE.YAML STRUCTURE

```yaml
meta:
  protocol_version: "1.0.0"
  project_id: "SATOR-ROTAS-AUTO-SAVE"
  created_at: "2026-03-09T10:00:00Z"
  last_updated: "2026-03-09T10:30:00Z"
  coordinator: "main"
  status: "active"

tasks:
  - id: "PHASE1-REVIEW"
    title: "Phase 1 SATOR/ROTAS 5x5 Analysis Review"
    assigned_to: "subagent-1"
    status: "in_progress"
    priority: 1
    
  - id: "PHASE2-REVIEW"
    title: "Phase 2 Latin Square Expansion Review"
    assigned_to: "subagent-2"
    status: "pending"
    priority: 2
    
  - id: "PHASE3-REVIEW"
    title: "Phase 3 Auto Save Implementation Review"
    assigned_to: "subagent-3"
    status: "pending"
    priority: 3
    
  - id: "PHASE4-REVIEW"
    title: "Phase 4 Symbol Translation Review"
    assigned_to: "subagent-4"
    status: "pending"
    priority: 4
    
  - id: "INTEGRATION-REVIEW"
    title: "Cross-Phase Integration Review"
    assigned_to: "subagent-5"
    status: "pending"
    priority: 5
    dependencies: ["PHASE1-REVIEW", "PHASE2-REVIEW", "PHASE3-REVIEW", "PHASE4-REVIEW"]
```

---

## SUBAGENT WORKFLOW

### Step 1: Spawn
```javascript
// Main agent spawns subagent with task
sessions_spawn({
  task: "Review PHASE1 document. Read STATE.yaml, check task assignment, " +
        "perform technical analysis, write findings to STATE.yaml, " +
        "mark task complete, announce back.",
  label: "PHASE1-REVIEW-ROUND1",
  model: "kimi-coding/k2p5",  // Using Kimi instead of Claude due to bug
  thinking: "high",
  runTimeoutSeconds: 600
})
```

### Step 2: Execute
```javascript
// Subagent reads STATE.yaml
read("/memory/STATE.yaml")

// Subagent performs review
// ... analysis work ...

// Subagent updates STATE.yaml
edit("/memory/STATE.yaml", {
  tasks: [
    {
      id: "PHASE1-REVIEW",
      status: "completed",
      completed_at: "2026-03-09T10:15:00Z",
      findings: ["Finding 1", "Finding 2"],
      score: 8.5
    }
  ]
})
```

### Step 3: Announce
```javascript
// Subagent announces completion back to main
// Automatic via OpenClaw announce mechanism
// Includes: status, runtime, token usage, findings summary
```

### Step 4: Synthesize
```javascript
// Main agent polls STATE.yaml after all announces
read("/memory/STATE.yaml")

// Check all tasks completed
// Synthesize findings into final report
// Proceed to next round or complete
```

---

## ADVANTAGES OF FILE-BASED COORDINATION

| Aspect | Message-Based | File-Based (STATE.yaml) |
|--------|--------------|------------------------|
| Reliability | Messages can be lost | File persists until deleted |
| Audit Trail | Transient | Permanent git-tracked history |
| Debugging | Hard to trace | Easy to inspect file state |
| Recovery | Complex retry logic | Simple file read |
| Scalability | Network bottlenecks | Local file I/O |
| Complexity | Async message handling | Synchronous file operations |

---

## IMPLEMENTATION STATUS

**File Structure:**
```
/memory/
├── STATE.yaml           # Main coordination file
├── STATE.yaml.bak       # Backup before each edit
├── FINDINGS/
│   ├── subagent-1-findings.md
│   ├── subagent-2-findings.md
│   ├── subagent-3-findings.md
│   ├── subagent-4-findings.md
│   └── subagent-5-findings.md
└── REPORTS/
    ├── round-1-synthesis.md
    ├── round-2-synthesis.md
    ├── round-3-synthesis.md
    ├── round-4-synthesis.md
    └── round-5-final.md
```

**Status:** ARCHITECTURE DEFINED  
**Ready for:** Step A (Config Fix + Spawn Test)

---

**STEP B COMPLETE:** File-based coordination protocol ready