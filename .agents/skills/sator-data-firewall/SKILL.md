---
name: sator-data-firewall
description: "Enforce SATOR data partition firewall between game simulation and web platform. USE FOR: data sanitization, GAME_ONLY_FIELDS management, firewall middleware, data classification, field validation. DO NOT USE FOR: general API security, authentication, non-SATOR projects."
license: MIT
metadata:
  author: SATOR Team
  version: "2.1.0"
---

# SATOR Data Firewall

> **CRITICAL SECURITY COMPONENT — MANDATORY COMPLIANCE**
>
> The firewall prevents game-internal data from reaching the public web platform.
> Any modification to GAME_ONLY_FIELDS requires CODEOWNERS approval.
> This guidance is authoritative and supersedes any other security documentation.

## Triggers

Activate this skill when user wants to:
- Add new data fields that cross game/web boundary
- Implement data sanitization for web export
- Modify GAME_ONLY_FIELDS list
- Create or update API middleware for data filtering
- Investigate potential data leakage
- Validate data classification decisions
- Review firewall enforcement points

## Rules

1. **Fail closed** — Deny by default on any validation error
2. **Deep clone** — Never mutate original game data during sanitization
3. **CODEOWNERS approval** — Changes to GAME_ONLY_FIELDS require approval
4. **Four enforcement points** — All must be maintained:
   - Point 1: Game Extraction (`LiveSeasonModule.gd`)
   - Point 2: API Middleware Filter (`firewall.py`)
   - Point 3: Web Schema Validation (`validateStats.ts`)
   - Point 4: CI/CD Testing (`test-firewall.yml`)
5. **Game code never imports web code; web code never imports game code**
6. **Never expose internal simulation state** — radar data, vision cones, RNG seeds

## WHEN to Use / DO NOT USE

| USE FOR | DO NOT USE FOR |
|---------|----------------|
| Sanitizing game data for web API | General API authentication/authorization |
| Validating web-to-game data flow | Database encryption at rest |
| Managing GAME_ONLY_FIELDS constants | Network security (TLS/HTTPS) |
| Data classification (public vs internal) | User session management |
| Firewall middleware implementation | CORS configuration |
| Field-level access control | OAuth/OpenID Connect setup |

## GAME_ONLY_FIELDS (Blocked from Web)

These fields must NEVER reach the public web platform:

```typescript
static GAME_ONLY_FIELDS = new Set([
  'internalAgentState',        // AI decision tree state
  'radarData',                 // Real-time position feed
  'detailedReplayFrameData',   // Per-tick simulation frames
  'simulationTick',            // Engine internal counter
  'seedValue',                 // RNG seed for determinism
  'visionConeData',            // Agent vision state
  'smokeTickData',             // Smoke utility state
  'recoilPattern',             // Per-weapon recoil data
  'aiDecisionTree',            // Agent AI internals
  'collisionMesh',             // Physics collision data
  'pathfindingNodes',          // Navigation mesh data
]);
```

## Required Files

- `packages/shared/packages/data-partition-lib/src/FantasyDataFilter.ts`
- `docs/FIREWALL_POLICY.md`
- `.github/CODEOWNERS`
- `packages/shared/api/src/middleware/firewall.py`

## Example Workflows

### Add a New Game-Only Field

```typescript
// Step 1: Add to FantasyDataFilter.GAME_ONLY_FIELDS
export class FantasyDataFilter {
  static GAME_ONLY_FIELDS = new Set([
    // ... existing fields
    'newInternalField',  // Add here
  ]);
}
```

### Sanitize Data for Web API

```typescript
import { FantasyDataFilter } from '@sator/data-partition-lib';

// In API route handler
const gameData = await fetchMatchData(matchId);
const sanitized = FantasyDataFilter.sanitizeForWeb(gameData);
// sanitized is now safe for API response
res.json(sanitized);
```

### Validate Incoming Web Data

```typescript
// In API middleware
import { FantasyDataFilter } from '@sator/data-partition-lib';

export function firewallMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    FantasyDataFilter.validateWebInput(req.body);
    next();
  } catch (err) {
    res.status(400).json({ error: 'Firewall violation: ' + err.message });
  }
}
```

### Python Firewall Middleware

```python
# packages/shared/api/src/middleware/firewall.py
GAME_ONLY_FIELDS = {
    'internal_agent_state',
    'radar_data',
    'detailed_replay_frame_data',
    'simulation_tick',
    'seed_value',
    'vision_cone_data',
    'smoke_tick_data',
    'recoil_pattern',
}

def sanitize_for_web(data: dict) -> dict:
    """Remove game-only fields from data before web export."""
    return {k: v for k, v in data.items() if k not in GAME_ONLY_FIELDS}

def validate_web_input(data: dict) -> None:
    """Validate that web input doesn't contain game-only fields."""
    violations = GAME_ONLY_FIELDS.intersection(data.keys())
    if violations:
        raise ValueError(f"Firewall violation: {violations}")
```

## Violation Response Procedure

| Severity | Condition | Action |
|----------|-----------|--------|
| **Critical** | GAME_ONLY_FIELDS leaked to production database | Immediate rollback; audit all deployments |
| **High** | Field leaks through API response | Block deploy; fix middleware; re-run all firewall tests |
| **Medium** | Field in extraction but caught by middleware | Fix LiveSeasonModule; add regression test |
| **Low** | CI detects new unlisted field | Add to GAME_ONLY_FIELDS or public schema |

## Enforcement Points Reference

### Point 1: Game Export (GDScript)

```gdscript
# platform/simulation-game/scripts/Export/LiveSeasonModule.gd
func export_match_data(match_data: Dictionary) -> Dictionary:
    # Strip internal fields before export
    var safe_data = {}
    var allowed_fields = ["match_id", "player_stats", "round_results"]
    for field in allowed_fields:
        if match_data.has(field):
            safe_data[field] = match_data[field]
    return safe_data
```

### Point 2: API Middleware (Python)

See example workflows above.

### Point 3: Schema Validation (TypeScript)

```typescript
// packages/shared/packages/stats-schema/src/validation/validateStats.ts
export function validateStats(data: unknown): Statistics {
  // Runtime validation with zod or similar
  const result = StatsSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Schema validation failed');
  }
  return result.data;
}
```

### Point 4: CI/CD Testing

```yaml
# .github/workflows/test-firewall.yml
name: Firewall Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm run test:firewall
      - run: npm run validate:schema
```

## Testing Commands

```bash
# Run firewall enforcement tests
npm run test:firewall

# Validate stats schema
npm run validate:schema

# Check for data leakage in extraction
python -m packages.shared.axiom-esports-data.extraction.tests.test_firewall
```

## New in 2.1.0

- Enhanced GAME_ONLY_FIELDS coverage
- Improved middleware filtering
- Better error messages for violations
- CI/CD integration for automated testing

## References

- [FIREWALL_POLICY.md](../../../docs/FIREWALL_POLICY.md)
- [memory/CURRENT_FOCUS.md](../../../memory/CURRENT_FOCUS.md)
