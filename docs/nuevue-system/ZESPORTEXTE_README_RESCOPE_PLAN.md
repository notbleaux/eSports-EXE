# ZeSporteXte README Rescope Plan — eSports-Only

## Status: APPROVED (Per Eli Answer #2)
**Decision**: ZeSporteXte is an eSports-only platform. Extract generic platform code to SiteGeiste.

---

## Current State

The `ZeSporteXte` README currently brands itself as **"NJZiteGeisTe Platform"** — a generic multi-purpose platform. This creates confusion:
- Visitors expect a general-purpose dev platform
- The actual code is eSports analytics (ROTAS, SATOR, OPERA, AREPO)
- Generic platform features (user management, dashboard shell) belong in SiteGeiste

---

## Rescope Actions

### 1. README Rewrite

**Current (Generic)**:
```markdown
# NJZiteGeisTe Platform
A unified platform for analytics, visualization, and community.
```

**Target (eSports-Only)**:
```markdown
# ZeSporteXte
Competitive eSports Analytics Platform
Real-time stats, predictive modeling, and fan engagement for Valorant & CS2.
```

### 2. Tagline Change
- **From**: "Poly repo IT, AI, & digital solutions"
- **To**: "Extreme sports analytics and engagement platform"

### 3. Feature Scope Narrowing

| Feature | Keep in ZeSporteXte? | Move to SiteGeiste? |
|---------|---------------------|---------------------|
| Valorant match stats | ✅ Yes | ❌ No |
| CS2 match stats | ✅ Yes | ❌ No |
| Player performance tracking | ✅ Yes | ❌ No |
| Team roster management | ✅ Yes | ❌ No |
| Tournament brackets | ✅ Yes | ❌ No |
| User authentication | ⚪ Strip | ✅ Yes |
| Dashboard shell/layout | ⚪ Strip | ✅ Yes |
| Generic admin panel | ⚪ Strip | ✅ Yes |
| Multi-game support framework | ✅ Yes (Valorant + CS2) | ❌ No |
| Cross-game analytics | ✅ Yes (differentiator) | ❌ No |
| Community forums (AREPO) | ✅ Yes | ❌ No |

### 4. Code Extraction

#### Files to Move to SiteGeiste
```
packages/shared/components/GridShell.tsx       → SiteGeiste
packages/shared/components/AdminPanel.tsx      → SiteGeiste
packages/shared/services/auth/                 → SiteGeiste
packages/shared/services/user/                 → SiteGeiste
apps/web/src/components/Dashboard/             → SiteGeiste
apps/web/src/hooks/useAuth.ts                  → SiteGeiste
apps/web/src/hooks/useUser.ts                  → SiteGeiste
```

#### Files to Keep in ZeSporteXte
```
packages/shared/services/esports/              ✅ Keep
packages/shared/services/analytics/            ✅ Keep
packages/shared/types/esports/               ✅ Keep
apps/web/src/components/RotasHub/            ✅ Keep
apps/web/src/components/SatorHub/            ✅ Keep
apps/web/src/components/OperaHub/            ✅ Keep
apps/web/src/components/ArepoHub/            ✅ Keep
```

### 5. Branding Update

| Element | Current | Target |
|---------|---------|--------|
| Repo name | `ZeSporteXte` | `ZeSporteXte` (keep) |
| Display name | NJZiteGeisTe Platform | ZeSporteXte |
| Tagline | "Poly repo platform" | "eSports analytics" |
| Primary color | Generic purple | Sport lime (#BFFF00) |
| Accent color | Generic pink | Energy orange (#FF6B2B) |
| Logo concept | Abstract tech | Controller + stats graph |

---

## Implementation Steps

### Phase 1: README Update (Immediate)
- [ ] Rewrite README.md with eSports-only focus
- [ ] Update `package.json` description fields
- [ ] Update `docs/` intro documents

### Phase 2: Code Extraction (After SiteGeiste repo created)
- [ ] Identify generic components for extraction
- [ ] Create extraction PR (patch-based)
- [ ] Move auth, user, dashboard shell to SiteGeiste
- [ ] Leave eSports-specific code in ZeSporteXte

### Phase 3: Branding Refresh
- [ ] Update color tokens in theme files
- [ ] Update favicon and OG images
- [ ] Update social media descriptions

### Phase 4: Documentation
- [ ] Update ADR-001 to reflect eSports-only scope
- [ ] Add migration note for generic features moved to SiteGeiste
- [ ] Update architecture diagrams

---

## Coordination with SiteGeiste

The extracted generic platform code becomes the foundation for SiteGeiste:
- Authentication system → SiteGeiste auth module
- Dashboard shell → SiteGeiste workspace shell
- Admin panel → SiteGeiste control panel
- User management → SiteGeiste profiles

This creates a clean separation:
- **SiteGeiste**: Generic dev platform + AI control + workspace
- **ZeSporteXte**: eSports-specific analytics (uses SiteGeiste for auth/shell)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking existing links | Keep `ZeSporteXte` repo name, only change display name |
| Data loss | Extract, don't delete — generic code stays in git history |
| Confusion during transition | Add banner to README: "Generic features moved to SiteGeiste" |
| Build breakage | Phase 2 extraction after SiteGeiste repo is ready |

---

*Plan created: 2026-05-16*
*Status: Approved, awaiting Phase 1 implementation*
*Blocked by: GitHub token needed for PR creation*
