[Ver001.000]

# JLB NAMING CONVENTION GUIDE

**Version:** 1.0  
**Effective:** 2026-03-23

---

## File Naming Format

`
{COMPONENT}-{PHASE}-{WAVE}-{AGENT-ID}_{TYPE}[_{VERSION}].md
`

### Components

| Component | Description | Example |
|-----------|-------------|---------|
| TL-{TEAM} | Team Leader | TL-A1, TL-H1, TL-S1 |
| AF-{ID} | Assistant Foreman | AF-001 |
| SAF-{ROLE} | SAF Council | SAF-ALPHA |
| OPT-{TYPE} | Optimization | OPT-PERF |
| FOR-{ROLE} | Foreman | FOR-001 |
| CL-{WAVE}-{AGENT} | Cleanup Agent | CL-1-1 |

### Types

| Type | Usage |
|------|-------|
| COMPLETION_REPORT | Agent completion report |
| STATUS_REPORT | Status update |
| VERIFICATION_REPORT | Verification documentation |
| BRIEFING | Agent briefing |
| FRAMEWORK | Framework documentation |
| TRACKING | Tracking document |
| LOG | Log file |

### Examples

✅ **Valid:**
- TL-A1-1-B_COMPLETION_REPORT.md
- AF-001_WAVE-1-2_VERIFICATION_REPORT_v2.md
- OPT-PERF_PERFORMANCE_TESTING.md
- CL-1-1_CLEANUP_REPORT.md

❌ **Invalid:**
- PHASE_1_COMPLETION_SUMMARY.md (wrong format)
- HELP_WAVE_1_1_AGENT_1A.md (wrong format)
- foreman_tracking.md (lowercase, wrong format)

---

## Directory Naming

### Format
`
{PHASE}_{WAVE}_{TEAM}_{AGENT-ID}
`

### Examples

✅ **Valid:**
- P1_W1_1_TL-A1-B
- CLEANUP_W1_CL-1-1
- P2_W2_0_TL-A3

---

*Created during CLEANUP-4 wave.*
