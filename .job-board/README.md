# Job Listing Board - Active Coordination

**Status:** MONOREPO REFACTOR IN PROGRESS  
**Coordinator:** Main Agent  
**Started:** 2026-03-24  

## Current Focus: Structural Refactoring

The repository requires immediate structural fixes before deployment troubleshooting can continue. See CRIT assessment for details.

## Active Listings

| ID | Phase | Priority | Status | Description |
|----|-------|----------|--------|-------------|
| REPO-REFACTOR-001 | 1 | P0 | 🔴 ACTIVE | Critical Structure Fixes |
| REPO-REFACTOR-002 | 2 | P1 | ⏳ PENDING | Workspace & Build System |
| REPO-REFACTOR-003 | 3 | P2 | ⏳ PENDING | Naming & Version Standardization |
| REPO-REFACTOR-004 | 4 | P2 | ⏳ PENDING | Code Organization & Cleanup |
| REPO-REFACTOR-005 | 5 | P1 | ⏳ PENDING | Final Validation & Deployment |

## Quick Links

- [Phase 1: Critical Fixes](./01_LISTINGS/ACTIVE/REPO-REFACTOR-001.md)
- [Phase 2: Build System](./01_LISTINGS/ACTIVE/REPO-REFACTOR-002.md)
- [Phase 3: Naming/Versioning](./01_LISTINGS/ACTIVE/REPO-REFACTOR-003.md)
- [Phase 4: Code Cleanup](./01_LISTINGS/ACTIVE/REPO-REFACTOR-004.md)
- [Phase 5: Validation](./01_LISTINGS/ACTIVE/REPO-REFACTOR-005.md)

## How to Participate

1. **Review** the listing for your assigned phase
2. **Claim** by creating a file in `.job-board/02_CLAIMED/{agent-id}/`
3. **Execute** using appropriate skills
4. **Report** status updates in your claimed task file
5. **Complete** by moving to `.job-board/03_COMPLETED/`

## Critical Path

```
Phase 1 (P0) → Phase 2 (P1) → Phase 5 (P1)
     ↓              ↓
Phase 3 (P2)  Phase 4 (P2)
```

## Blockers

None currently. Report blockers in `.job-board/04_BLOCKS/`

## Success Criteria

- [ ] All 5 phases complete
- [ ] Site deploys successfully
- [ ] No "React did not mount" errors
- [ ] All tests pass
- [ ] Documentation updated
