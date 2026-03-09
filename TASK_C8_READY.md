[Ver003.000]

## TEAM C - PASS 3 - PHASE 2: Performance Final Fixes (C8)

**Domain:** Performance (Final Pass)
**Team:** C
**Pass:** 3 of 3 (FINAL)
**Phase:** 2 of 3 (Fixes)

### Context
Read: `shared-context/TEAM_C_PASS3_PHASE1_AUDIT.md`
Read: `shared-context/TEAM_A_PASS2_PHASE3_VERIFY.md` (A6 found issues)

### Critical Issues from A6 Verification
1. **Bundle sizes still oversized:**
   - Hub2-ROTAS: 235KB (57% over 150KB budget)
   - Hub3-Information: 163KB (9% over)
   - Hub4-Games: 684KB (356% over)

2. **Zero WebP conversion:** 0 WebP files, still using JPG/PNG
3. **Service workers missing** in all hub pages
4. **Hub3 failing to render** (NO_FCP error)

### Final Fixes Required
1. **URGENT:** Fix Hub3 rendering failure (check build, dependencies)
2. **URGENT:** Reduce Hub4 bundle from 684KB to <150KB
   - Remove source maps from production (404KB waste)
   - Implement aggressive code splitting
   - Tree shake unused dependencies
3. Convert all images to WebP with fallbacks
4. Add service worker registration to all 4 hubs
5. Optimize Hub2 bundle (235KB → <150KB)

### Output
Create: `shared-context/TEAM_C_PASS3_PHASE2_FIXES.md`

Budget: 25K in / 10K out
Timeout: 15 minutes