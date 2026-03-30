[Ver001.000] [Part: 1/1, Phase: 1/1, Progress: 100%, Status: Complete]

# API Versioning Policy
## NJZiteGeisTe Platform - v1 API Stability Guarantees

---

## Versioning Strategy

### URL Path Versioning (Selected)

```
https://api.njzitegeist.com/v1/players
https://api.njzitegeist.com/v2/players  (future)
```

**Rationale:**
- Clear and explicit version in URL
- Easy to cache and route
- Self-documenting
- Industry standard (GitHub, Stripe, Twilio)

**Alternatives Considered:**
| Method | Pros | Cons | Decision |
|--------|------|------|----------|
| URL Path | Clear, cacheable | URL changes | ✅ Selected |
| Header | Clean URLs | Hard to test | ❌ Rejected |
| Content-Type | Semantic | Complex | ❌ Rejected |

---

## Version Lifecycle

### Version Status Definitions

| Status | Description | Support Level |
|--------|-------------|---------------|
| **BETA** | Early access, may change | Community support only |
| **STABLE** | Production-ready, fully supported | Full support |
| **DEPRECATED** | Still works, migration required | Critical fixes only |
| **SUNSET** | Disabled, returns 410 Gone | No support |

### Current Versions

| Version | Status | Released | Support Until | Sunset Date |
|---------|--------|----------|---------------|-------------|
| v1 | ✅ STABLE | 2026-01-15 | 2027-03-30 | TBD |
| v2 | ⬜ PLANNED | TBD | TBD | TBD |

---

## Stability Guarantees

### What IS Guaranteed (Non-Breaking)

The following changes will NOT trigger a major version bump:

1. **Adding New Endpoints**
   ```python
   # New endpoint added
   GET /v1/players/{id}/history  # NEW - no version bump
   ```

2. **Adding Optional Parameters**
   ```python
   # Existing endpoint with new optional param
   GET /v1/players?include_stats=true  # Optional - no version bump
   ```

3. **Adding Response Fields**
   ```json
   {
     "id": 123,
     "name": "Player",
     "new_field": "value"  // Added - no version bump
   }
   ```

4. **Bug Fixes**
   - Fixing incorrect data types
   - Correcting calculations
   - Fixing error responses

### What IS NOT Guaranteed (Breaking)

The following changes WILL trigger a major version bump:

1. **Removing Endpoints**
   ```python
   # This would require v2
   # GET /v1/old-endpoint  REMOVED
   ```

2. **Removing Response Fields**
   ```json
   {
     "id": 123
     // "name" field removed - BREAKING
   }
   ```

3. **Changing Response Types**
   ```json
   // Before: string
   "count": "10"
   
   // After: number - BREAKING
   "count": 10
   ```

4. **Changing Authentication**
   - New required scopes
   - Changed token format

---

## Deprecation Policy

### Timeline

```
Deprecation Notice (Day 0)
    ↓
6 Months Warning Period
    ↓
Sunset Date (410 Gone)
    ↓
3 Months Grace Period (returns 410 with migration guide)
    ↓
Complete Removal
```

### Deprecation Notifications

#### 1. Response Headers

```http
HTTP/1.1 200 OK
X-API-Version: v1
X-API-Deprecated: true
X-API-Sunset-Date: 2026-09-30
X-API-Migration-Guide: https://docs.njzitegeist.com/migration/v1-to-v2
```

#### 2. Response Body Warning

```json
{
  "data": { ... },
  "meta": {
    "warnings": [{
      "code": "DEPRECATION",
      "message": "This endpoint is deprecated and will be removed on 2026-09-30",
      "migration_guide": "https://docs.njzitegeist.com/migration/v1-to-v2"
    }]
  }
}
```

#### 3. Email Notifications

- Sent to registered API users 6 months before sunset
- Monthly reminders during final 3 months
- Final notice 1 week before

#### 4. Documentation

- Deprecation banner on affected endpoint docs
- Migration guide published
- Changelog entry

---

## Version Negotiation

### Client Version Specification

Clients SHOULD specify expected version in headers:

```http
Accept-Version: v1
```

If not specified, latest stable version is used.

### Version Mismatch Handling

```http
# Request
GET /v1/players
Accept-Version: v2

# Response (406 Not Acceptable)
HTTP/1.1 406 Not Acceptable
X-API-Version: v1

{
  "error": "Version mismatch",
  "message": "Endpoint /v1/players does not support version v2",
  "available_versions": ["v1"]
}
```

---

## Breaking Change Process

### Step 1: RFC (Request for Comments)

```markdown
# RFC: API v2 Breaking Changes

## Summary
Proposed changes for v2 API

## Motivation
Why these changes are needed

## Detailed Changes
1. Remove field X
2. Change type of field Y
3. New authentication

## Migration Path
How v1 users migrate to v2

## Timeline
- RFC Period: 2 weeks
- Beta Release: 1 month
- Stable Release: 3 months
- v1 Sunset: 12 months
```

### Step 2: Beta Release

```python
# Beta endpoints available
GET /v2-beta/players
```

- Documented but not guaranteed
- Community feedback welcome
- May change without notice

### Step 3: Stable Release

```python
# Stable v2 release
GET /v2/players
```

- Full stability guarantees apply
- v1 enters deprecation period

### Step 4: Deprecation

- v1 marked deprecated
- 6-month sunset period begins
- Migration tools provided

### Step 5: Sunset

```http
# v1 endpoint after sunset
HTTP/1.1 410 Gone

{
  "error": "Gone",
  "message": "API v1 has been sunset",
  "migration_guide": "https://docs.njzitegeist.com/migration/v1-to-v2",
  "support_email": "api-support@njzitegeist.com"
}
```

---

## Response Headers

All API responses include:

```http
X-API-Version: v1
X-API-Deprecated: false
X-API-Sunset-Date: null
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1711843200
```

---

## Changelog

### Format

```markdown
## API Changelog

### 2026-03-30
- Added: New endpoint GET /v1/players/{id}/stats
- Changed: SimRating calculation updated to v2.1
- Fixed: Pagination bug in /v1/matches

### 2026-03-15
- Deprecated: Field `legacy_score` in Player object
  - Migration: Use `simrating_v2` instead
  - Sunset: 2026-09-15
```

---

## Migration Guides

### v1 to v2 (Template)

When v2 is released, this template will be populated:

```markdown
# Migration Guide: v1 to v2

## Breaking Changes

### Authentication
- v1: Bearer token in header
- v2: Same (no change)

### Player Object
```diff
  {
    "id": 123,
    "name": "Player Name",
-   "legacy_score": 85,
+   "simrating_v2": {
+     "score": 87.5,
+     "confidence": 0.92
+   }
  }
```

### Endpoint Changes
- `GET /v1/players` → `GET /v2/players` (no change)
- `GET /v1/rankings` → `GET /v2/leaderboards` (renamed)

## Timeline
- v2 Beta: 2026-06-01
- v2 Stable: 2026-09-01
- v1 Sunset: 2027-03-01

## Support
Contact: api-support@njzitegeist.com
```

---

## Contact & Support

- **API Documentation:** https://docs.njzitegeist.com/api
- **Changelog:** https://docs.njzitegeist.com/api/changelog
- **Support Email:** api-support@njzitegeist.com
- **Status Page:** https://status.njzitegeist.com

---

*Policy Version: 001.000*  
*Effective Date: 2026-03-30*  
*Last Review: 2026-03-30*
