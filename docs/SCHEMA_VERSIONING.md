[Ver001.000]

# Schema Versioning & Deprecation Policy

**Purpose:** Define how to evolve schemas without breaking clients.
**Applies to:** TypeScript (`data/schemas/`), Python (`packages/shared/api/schemas/`), API responses

---

## Version Format

All schema files must include a version header:

```typescript
// TypeScript
/**
 * GameNodeID Types
 * SCHEMA VERSION: 1.0.0
 */

// Python
"""
GameNodeID Models
Schema Version: 1.0.0
"""
```

Versioning follows **MAJOR.MINOR.PATCH**:
- **MAJOR** — Breaking change (clients must update) — increment when removing fields or changing types
- **MINOR** — Additive change (backward compatible) — new optional fields, new endpoints
- **PATCH** — Bug fix (fully backward compatible) — typo fixes, clarifications

---

## Breaking Changes (MAJOR version bump)

**You MUST do all of:**

1. Update version in schema file (e.g., 1.0.0 → 2.0.0)
2. Create migration file: `docs/schema-migrations/v1-to-v2.md` explaining the change
3. Update `.agents/SCHEMA_REGISTRY.md` with new version
4. Create deprecation warning in API: `X-Deprecated-Since: 2.0.0`
5. Support old version for 2 release cycles before removing
6. Add to `.agents/CHANGELOG.md` under "Breaking Changes"

Example:

```typescript
/**
 * GameNodeID Types
 * SCHEMA VERSION: 2.0.0
 *
 * BREAKING CHANGE (v2.0.0): Removed deprecated `legacyId` field.
 * See: docs/schema-migrations/v1-to-v2.md
 */
```

---

## Additive Changes (MINOR version bump)

**You MAY:**

1. Add new optional fields (with `= undefined` or `| null`)
2. Add new response types
3. Extend enums with new values
4. Add new API endpoints

**Do NOT:**

1. Change existing field types
2. Remove fields
3. Make optional fields required

Example:

```typescript
// ✅ GOOD (MINOR version bump)
interface Player {
  id: string;
  name: string;
  region: string;  // NEW FIELD
  // Keep all existing fields unchanged
}

// ❌ BAD (would require MAJOR version bump)
interface Player {
  id: string;
  name: string;
  region: string;  // NEW, but as required field
  // ❌ REMOVED: organization?: string
}
```

---

## Non-Breaking Changes (PATCH version bump)

**Examples:**

- Fix typo in field name (internal refactor, no client impact)
- Add clarifying comments
- Improve field descriptions
- Fix validation rules that were too strict

**Must NOT:**

- Change any behavior visible to clients
- Add/remove fields
- Change type signatures

---

## Registry Entry Format

Update `.agents/SCHEMA_REGISTRY.md` when versioning changes:

```markdown
| Type | Source | Package | Status | Version |
|------|--------|---------|--------|---------|
| `GameNodeID` | `data/schemas/GameNodeID.ts` | `@njz/types` | ✅ Active | v2.0.0 |
| `GameNodeIDV1` | (archived) | (deprecated) | ⚠️ Deprecated since v2.0.0 | v1.0.0 |
```

---

## Migration Path

For breaking changes, support BOTH versions briefly:

```typescript
// Old schema (deprecated)
export interface GameNodeIDV1 {
  id: string;
  legacyId?: string;  // REMOVED in v2.0.0
}

// New schema (current)
export interface GameNodeID {
  id: string;
  // legacyId removed
}

// Adapter function
export function migrateV1toV2(v1: GameNodeIDV1): GameNodeID {
  return {
    id: v1.id,
    // Handle migration logic
  };
}
```

---

## Changelog

Maintain `docs/SCHEMA_CHANGELOG.md`:

```markdown
## v2.0.0 (2026-04-XX)

### Breaking Changes
- ❌ Removed `GameNodeID.legacyId` field
- ❌ Renamed `PathBLegacyRecord` to `VerifiedMatch`

### Migration
See `docs/schema-migrations/v1-to-v2.md` for upgrade guide.

## v1.1.0 (2026-03-27)

### New
- ✨ Added `GameNodeID.region` field (optional)
- ✨ Added `WorldPort.supportedGames` array

## v1.0.0 (2026-03-27)

Initial release of GameNodeID schema hierarchy.
```

---

## Client Update Requirements

For MAJOR version changes, document what clients must do:

```markdown
# GameNodeID v2.0.0 Migration Guide

## For Frontend Developers
1. Update imports: `import { GameNodeID } from '@njz/types@2.0.0'`
2. Remove any code referencing `GameNodeID.legacyId`
3. Update components that relied on legacy ID

## For API Consumers
1. Update API client to consume `/v2/game-nodes` instead of `/v1/game-nodes`
2. Parse new response format (see schema documentation)
3. No more `X-Legacy-Id` header support
```

---

## Enforcement

- ✅ Pre-commit hooks check schema version headers exist
- ✅ CI fails if breaking change without version bump
- ✅ PRs with schema changes require `schema-versioning` label
- ✅ SCHEMA_REGISTRY.md must be in sync with actual versions

---

**Policy Owner:** Specialist D — CI/CD Pipeline & Schema Versioning
**Last Updated:** 2026-03-27
**Next Review:** 2026-06-27
