# SATOR Stub Lifecycle Policy v1.0
# Part of NueVue SATOR Proposal v0.1
# Status: APPROVED by Eli (leBeauxBleaux / ILILIX) 2026-05-12

## Purpose
Prevent stub bloat, staleness, and circular dependencies in the 18-phase NueVue roadmap.

## Limits

| Limit | Value | Rationale |
|-------|-------|-----------|
| Max stubs per phase | 25 | Prevents phase scope creep |
| Max total stubs | 200 | Keeps _SATORtree.md navigable |
| Max stubs per agent | 15 | Prevents individual overload |

## Lifecycle Stages

```
seed → sprout → sapling → tree → grove → archived
```

| Stage | Definition | Exit Criteria |
|-------|-----------|---------------|
| **seed** | Idea captured, no work started | Agent assigned, phase active |
| **sprout** | Requirements defined, estimate provided | Implementation started |
| **sapling** | Implementation in progress | PR open or merge pending |
| **tree** | Merged to main, functional | Stable for 2+ weeks |
| **grove** | Reference implementation, other stubs depend on it | Becomes foundational |
| **archived** | No longer relevant or superseded | Manual review trigger |

## Time-Based Triggers

| Trigger | Duration | Action |
|---------|----------|--------|
| Archive warning | 30 days inactive | Flag for review in _CanonicalToDo.md |
| Auto-archive | 90 days inactive + not referenced | Move to `archive/` folder with `ARCHIVED_` prefix |
| Delete candidate | 180 days archived + no dependencies | Propose deletion in weekly review |
| Dependency expiry | 6 months from creation | Re-review if not started |

## Fields (Required on Every Stub)

```yaml
stub:
  id: SATOR-NNN           # Unique, sequential
  phase: N              # 1-18
  status: seed|sprout|sapling|tree|grove|archived
  owner: idk            # Agent/user IDK responsible
  created: YYYY-MM-DD   # Date added
  started: YYYY-MM-DD   # Date work began (null until sprout)
  merged: YYYY-MM-DD    # Date merged (null until tree)
  last_active: YYYY-MM-DD # Last commit/comment/update
  expires_after: N days  # Default: 180
  depends_on: [SATOR-NNN] # Blockers
  blocks: [SATOR-NNN]    # Stubs waiting on this
  description: "one line"
```

## Circular Dependency Prevention

1. **Phase isolation:** Stubs in Phase N must not depend on stubs in Phase > N+1
2. **Infrastructure bridge:** Phase 3 stubs use local/dev-only infra; Phase 9 provides cloud infra
3. **Agent handoff stubs:** Phase 5 stubs must specify `infrastructure_scope: local|cloud|hybrid`

## Weekly Review Process

Every Sunday 23:11 AEST:
1. Scan all stubs for expiry triggers
2. Auto-archive candidates flagged
3. Delete candidates proposed in review log
4. Owner notified of pending archives

## Enforcement

- CI check: `scripts/validate-sator-tree.sh`
  - Count stubs per phase
  - Detect circular dependencies
  - Flag expired stubs
- Pre-commit hook: Reject new stub if phase already at 25-stub limit
- Exception: Eli approval overrides any limit

---
*Approved: 2026-05-12*
*Canonical user: ililix*
