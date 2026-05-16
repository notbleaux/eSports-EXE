# AI Budget Policy & Lightweight Alert Framework

## Status: ACTIVE (Per v4 Master Plan)
**Enforcement mode:** Policy + guidelines + lightweight alerting. No hard gates.

---

## Global Budget Cap

| Tier | Monthly Limit | Weekly Equivalent | Applies To |
|------|--------------|-------------------|------------|
| **Production** | $50 USD | ~$11.50 | All AI services combined |
| **Development** | $25 USD | ~$5.75 | Sandbox/staging environments |
| **Emergency** | $15 USD buffer | — | Overrun allowance with alert |

### Services Tracked
- Claude (Anthropic): Haiku, Sonnet, Opus, Mythos
- Kimi (Moonshot): Thinking 2.6, Instant, Swarm, Agent
- DeepSeek: v3, v4, pro
- Mimo: Open-source + pro/large context
- Gemini: Google
- Copilot: Microsoft
- OpenClaw/Hermes: Cloud agent hosting

---

## Cost Grades & Defaults

| Grade | Cost Profile | Default For | Override Required |
|-------|-------------|-------------|-------------------|
| **effective** | Highest quality, highest cost | Production checks, critical reviews | — |
| **complex** | High quality, moderate cost | Architecture decisions, ADR reviews | — |
| **standard** | Balanced quality/cost | Daily development, routine tasks | — |
| **routine** | Lower cost, acceptable quality | Documentation, cleanup, formatting | — |
| **efficient** | Lowest cost, minimal quality | Drafts, brainstorming, exploration | — |

### Grade Assignment Rules
- **Claude Opus**: effective only (reserved for critical reviews)
- **Claude Sonnet/Haiku**: complex/standard (routine planning)
- **Kimi Thinking 2.6**: complex (heavy lifting)
- **Kimi Instant**: standard/routine (quick tasks)
- **Kimi Swarm**: efficient (parallel processing)
- **DeepSeek v3/v4**: standard (general tasks)
- **DeepSeek pro**: complex (when purchased)
- **Mimo**: efficient/standard (open-source, cost-effective)
- **Gemini/Copilot**: routine/standard (SaaS implementations)

---

## Lightweight Alert System

### Alert Triggers

| Threshold | Action | Channel |
|-----------|--------|---------|
| **50% weekly** | Yellow alert — reminder to review usage | Kimi Claw message |
| **75% weekly** | Orange alert — suggest downgrade grade | Kimi Claw message + memory flag |
| **90% weekly** | Red alert — require approval to continue | Kimi Claw message + wait for user OK |
| **100% weekly** | Hard stop — pause non-essential tasks | Kimi Claw message + auto-pause |
| **Monthly 80%** | Monthly review trigger | Evening review report highlight |

### Alert Content
```
🟡 Budget Alert — Week of YYYY-MM-DD
Usage: $X.XX / $11.50 (XX%)
Top consumers:
  1. [Service] [Grade] — $X.XX (XX%)
  2. [Service] [Grade] — $X.XX (XX%)
Recommendations:
  - Downgrade [task] from [grade] to [grade]
  - Defer [task] to next week
  - Use [cheaper alternative] for [use case]
```

### Tracking Mechanism
- **File**: `memory/budget-state.json`
- **Update frequency**: After every AI service call (estimated)
- **Reset**: Weekly (Monday 00:00 UTC), Monthly (1st of month)

---

## VORP & Token Expenditure Tracking

### Data Collected
```json
{
  "period": "weekly",
  "startDate": "2026-05-12",
  "endDate": "2026-05-18",
  "totalSpend": 0.00,
  "budgetCap": 11.50,
  "services": {
    "claude": { "haiku": 0.00, "sonnet": 0.00, "opus": 0.00 },
    "kimi": { "thinking-2.6": 0.00, "instant": 0.00, "swarm": 0.00 },
    "deepseek": { "v3": 0.00, "v4": 0.00 },
    "mimo": { "opensource": 0.00, "pro": 0.00 },
    "gemini": 0.00,
    "copilot": 0.00
  },
  "agents": {
    "ATLAS": { "tasks": 0, "tokens": 0, "cost": 0.00, "vorp": 0.0 },
    "SCRIBE": { "tasks": 0, "tokens": 0, "cost": 0.00, "vorp": 0.0 },
    "CLAWD": { "tasks": 0, "tokens": 0, "cost": 0.00, "vorp": 0.0 },
    "PIXEL": { "tasks": 0, "tokens": 0, "cost": 0.00, "vorp": 0.0 },
    "NOVA": { "tasks": 0, "tokens": 0, "cost": 0.00, "vorp": 0.0 },
    "VIBE": { "tasks": 0, "tokens": 0, "cost": 0.00, "vorp": 0.0 },
    "SENTINEL": { "tasks": 0, "tokens": 0, "cost": 0.00, "vorp": 0.0 },
    "TRENDY": { "tasks": 0, "tokens": 0, "cost": 0.00, "vorp": 0.0 }
  },
  "iterations": {
    "planned": 0,
    "actual": 0,
    "costOverrun": 0.00
  }
}
```

### VORP Calculation
```
VORP = (Value Generated / Cost) × Quality Score

Value Generated:
  - Code merged: 10 pts
  - Bug fixed: 5 pts
  - Doc created: 3 pts
  - Task completed: 2 pts
  - Alert triggered: -1 pt (penalty)

Quality Score (1.0-2.0):
  - No revisions needed: 2.0
  - Minor revisions: 1.5
  - Major revisions: 1.0
  - Rejected/abandoned: 0.5
```

---

## Monthly Review Integration

### Review Schedule
- **Monthly**: Full budget review in evening report (1st of month)
- **Quarterly**: VORP analysis + agent performance review
- **Annual**: Budget posture review + service renegotiation

### Review Content
1. Total spend vs. budget
2. Service utilization (which AI tools used most)
3. Agent VORP rankings
4. Iteration cost analysis (planned vs. actual)
5. Recommendations for next period

---

## Implementation Status

- [x] Policy documented
- [ ] `memory/budget-state.json` created
- [ ] Alert thresholds configured in HEARTBEAT.md
- [ ] VORP tracking integrated into agent task completion
- [ ] Monthly review template created
- [ ] Quarterly review template created

---

*Policy created: 2026-05-16*
*Status: Active — lightweight alerts pending implementation*
