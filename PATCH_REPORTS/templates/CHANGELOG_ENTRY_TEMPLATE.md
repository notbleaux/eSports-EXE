# Changelog Entry Template

> Use this template when adding entries to LIVE.md or LEGACY.md

---

## Version Entry Template

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Release Date: YYYY-MM-DD

### Summary

One-paragraph summary of this release.

### Changes

#### Added
- New feature 1
- New feature 2
- New documentation

#### Changed
- Modified behavior X
- Updated component Y

#### Deprecated
- Feature Z (will be removed in X.Y.Z+1)

#### Removed
- Old feature (use new feature instead)

#### Fixed
- Bug 1 (#issue)
- Bug 2 (#issue)

#### Security
- Security fix description (CVE-XXXX-XXXX)

### Patches Included

| Patch | Type | Description |
|-------|------|-------------|
| [NNN](../patches/YYYY/YYYY-MM-DD_NNN_TYPE_description.md) | TYPE | Brief description |

### Upgrade Notes

Steps for upgrading from previous version:

1. Step 1
2. Step 2
3. Step 3

### Breaking Changes

List any breaking changes and migration steps.

### Known Issues

*No known issues* (or list them)

### Contributors

Thanks to @contributor1, @contributor2 for their contributions!
```

---

## Single Patch Entry Template

For adding a single patch to an existing version:

```markdown
| [NNN](../patches/YYYY/YYYY-MM-DD_NNN_TYPE_description.md) | TYPE | Brief description |
```

---

## Security Fix Entry

```markdown
#### Security
- **CVE-XXXX-XXXX**: [Brief description] ([Patch NNN](../patches/YYYY/YYYY-MM-DD_NNN_SEC_description.md))
  - Severity: Critical/High/Medium/Low
  - Impact: [What was affected]
  - Fix: [How it was fixed]
```

---

## Migration Entry

```markdown
### Migration

Migrated from [source] to [target]:

| Item | From | To |
|------|------|-----|
| Repository | old-repo | new-repo |
| Database | old-db | new-db |

See [Patch NNN](../patches/YYYY/YYYY-MM-DD_NNN_MIGRATION_description.md) for details.
```

---

## Example Entry

```markdown
## [1.1.0] - 2026-03-15

### Release Date: 2026-03-15

### Summary

This release adds the SATOR Square visualization v2 with WebGL support and improves API performance by 30%.

### Changes

#### Added
- SATOR Square v2 with WebGL rendering
- New Player Comparison feature
- Dark mode support
- Real-time websocket updates

#### Changed
- Improved API response times by 30%
- Updated database query optimization
- Enhanced error messages

#### Fixed
- Fixed memory leak in visualization component (#123)
- Fixed race condition in pipeline (#124)
- Fixed mobile layout issues (#125)

#### Security
- Updated dependencies to address CVE-2026-XXXX

### Patches Included

| Patch | Type | Description |
|-------|------|-------------|
| [002](../patches/2026/2026-03-10_002_FEAT_sator-square-v2.md) | FEAT | SATOR Square v2 |
| [003](../patches/2026/2026-03-12_003_PERF_api-optimization.md) | PERF | API optimization |
| [004](../patches/2026/2026-03-15_004_FEAT_player-comparison.md) | FEAT | Player comparison |
| [005](../patches/2026/2026-03-15_005_BUG_memory-leak-fix.md) | BUG | Memory leak fix |

### Upgrade Notes

1. Run database migration: `psql $DATABASE_URL -f migrations/010_sator_square_v2.sql`
2. Update environment variable: `ENABLE_WEBGL=true`
3. Restart API service

### Contributors

Thanks to @hvrryh-web for the WebGL implementation!
```

---

**Template Version:** 1.0.0  
**Status:** 🟢 LIVE
