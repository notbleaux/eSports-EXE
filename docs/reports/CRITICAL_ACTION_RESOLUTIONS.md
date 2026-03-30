[Ver001.000]

# Critical Action Resolutions

**Date:** 2026-03-30  
**Status:** Immediate Action Required  
**Authority:** Technical Lead

---

## PRIORITY MATRIX

| P0 (This Week) | P1 (Next 2 Weeks) | P2 (Month 2) |
|----------------|-------------------|--------------|
| HLTV scraper removal | Rust sim repo setup | Map library expansion |
| Gateway module implementation | ML model training | Betting UI completion |
| Betting DB migration | Store consolidation | Determinism verification |
| Hollow module audit | Token system migration | Hook consolidation |

---

## RESOLUTION 1: HLTV Scraper Immediate Removal

**Status:** 🔴 P0 — Legal Risk  
**ETA:** 24 hours  
**Owner:** Backend Agent

### Action Items

1. **Delete Files**
   ```bash
   rm packages/shared/axiom_esports_data/extraction/src/scrapers/hltv_client.py
   rm packages/shared/axiom_esports_data/extraction/src/scrapers/__init__.py
   rm packages/shared/axiom_esports_data/extraction/README_HLTV.md
   rm packages/shared/axiom_esports_data/extraction/test_hltv_mvp.py
   rmdir packages/shared/axiom_esports_data/extraction/src/scrapers/
   ```

2. **Update Data Pipeline**
   - [ ] Remove HLTV from data sources configuration
   - [ ] Update sync_pandascore.py to be sole CS2 data source
   - [ ] Add audit log for data provenance

3. **Database Cleanup**
   - [ ] Identify HLTV-sourced records
   - [ ] Mark with `source: 'hltv'` flag
   - [ ] Document retention policy

4. **Legal Documentation**
   - [ ] Update SCRAPING_LIABILITY_AUDIT.md with removal confirmation
   - [ ] Archive audit trail
   - [ ] Notify compliance

### Verification
```bash
# Confirm no HLTV references remain
grep -r "hltv\|HLTV" --include="*.py" . || echo "✅ Clean"
```

---

## RESOLUTION 2: Hollow Module Consolidation

**Status:** 🔴 P0 — Phase Blocker  
**ETA:** 1 week  
**Owner:** Backend Agent

### Module Audit Results

| Module | Location | Status | Action |
|--------|----------|--------|--------|
| Gateway | `services/api/src/njz_api/gateway/` | Placeholder | IMPLEMENT |
| Betting | `services/api/src/njz_api/betting/` | Placeholder | MIGRATE |
| Tokens | `services/api/src/njz_api/tokens/` | Placeholder | MIGRATE |

### Implementation Plan

1. **Gateway Module** (Phase 8 Gate 8.4)
   ```python
   # services/api/src/njz_api/gateway/router.py
   from fastapi import APIRouter
   import httpx
   
   router = APIRouter(prefix="/gateway")
   
   SERVICES = {
       "api": "http://localhost:8000",
       "websocket": "http://localhost:8001",
       "tenet": "http://localhost:8002",
       "legacy": "http://localhost:8003",
   }
   
   @router.get("/health")
   async def health_check():
       """Aggregate health from all services"""
       results = {}
       async with httpx.AsyncClient() as client:
           for name, url in SERVICES.items():
               try:
                   resp = await client.get(f"{url}/health", timeout=5)
                   results[name] = "healthy" if resp.status_code == 200 else "unhealthy"
               except:
                   results[name] = "unreachable"
       return results
   ```

2. **Betting Module Migration** (from packages/ to services/)
   ```bash
   # Source: packages/shared/api/src/betting/
   # Target: services/api/src/njz_api/betting/
   
   cp packages/shared/api/src/betting/*.py services/api/src/njz_api/betting/
   sed -i 's/from packages.shared.api/from services.api/g' services/api/src/njz_api/betting/*.py
   ```

3. **Token Module Migration**
   - [ ] Move token wallet logic
   - [ ] Move prediction logic
   - [ ] Update imports

4. **Database Migration** (006_betting_token_schema.py)
   ```python
   """Migration 006: Betting and Token tables
   
   Tables:
   - token_wallets (user_id, balance, locked)
   - predictions (user_id, match_id, amount, outcome)
   - odds_history (match_id, timestamp, odds)
   """
   ```

---

## RESOLUTION 3: Store Consolidation

**Status:** 🟡 P1 — Technical Debt  
**ETA:** 1 day  
**Owner:** Frontend Agent

### Action Items

1. **Move authStore.ts**
   ```bash
   mv apps/web/src/stores/authStore.ts apps/web/src/store/
   rmdir apps/web/src/stores/
   ```

2. **Update Imports**
   ```bash
   find apps/web/src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s|from '@/stores/'|from '@/store/'|g"
   ```

3. **Create Barrel Export**
   ```typescript
   // apps/web/src/store/index.ts
   export { useAuthStore } from './authStore'
   export { useDynamicStore } from './dynamicStore'
   export { useGridStore } from './gridStore'
   // ... etc
   ```

4. **TypeScript Check**
   ```bash
   pnpm run typecheck
   ```

---

## RESOLUTION 4: ML Model Training Execution

**Status:** 🟡 P1 — Feature Completion  
**ETA:** 3 days  
**Owner:** ML Agent

### Current State
- Training script: ✅ Ready
- Synthetic fallback: 2K samples
- Real data requirement: 50K+ matches
- Status: NOT TRAINED

### Action Plan

1. **Data Sync**
   ```bash
   cd services/api
   python -m njz_api.scripts.sync_pandascore
   # Verify player_stats table has 50K+ rows
   ```

2. **Training Execution**
   ```bash
   pip install tensorflowjs tensorflow numpy
   python -m njz_api.ml.train_simrating
   ```

3. **Model Export**
   ```bash
   # Verify output
   ls apps/web/public/models/simrating/
   # Expected: model.json, *.bin, model_manifest.json
   ```

4. **Enable Hook**
   ```typescript
   // Update useMLInference.ts to load actual model
   import { loadTrainedModel } from '@/hub-1-sator/ml/simrating-model'
   ```

5. **Verification**
   ```bash
   pnpm run test:unit  # ML inference tests
   ```

---

## RESOLUTION 5: Rust Simulation Repository Setup

**Status:** 🟡 P1 — Architecture Foundation  
**ETA:** 1 week  
**Owner:** Rust Agent

### Repository Creation

1. **Create Repository**
   ```bash
   # Authorized under user dictate
   gh repo create notbleaux/njz-simulation-engine --public
   cd njz-simulation-engine
   ```

2. **Initial Structure**
   ```bash
   cargo new --lib crates/njz-sim-core
   mkdir -p bindings/python tests benches examples docs
   ```

3. **CI/CD Setup**
   ```yaml
   # .github/workflows/rust.yml
   name: Rust CI
   on: [push, pull_request]
   jobs:
     test:
       runs-on: ${{ matrix.os }}
       strategy:
         matrix:
           os: [ubuntu-latest, macos-latest, windows-latest]
       steps:
         - uses: actions/checkout@v4
         - uses: dtolnay/rust-toolchain@stable
         - run: cargo test --all-features
   ```

4. **PyO3 Binding**
   ```bash
   cd bindings/python
   cargo new --lib .
   # Add to Cargo.toml:
   # [lib]
   # crate-type = ["cdylib"]
   # [dependencies]
   # pyo3 = { version = "0.21", features = ["extension-module"] }
   ```

5. **Integration Test**
   ```python
   # tests/test_bindings.py
   import njz_simulation as sim
   
   def test_version():
       assert sim.__version__ == "0.1.0"
   
   def test_determinism():
       result1 = sim.simulate_match(seed=42, map="dust2")
       result2 = sim.simulate_match(seed=42, map="dust2")
       assert result1.hash == result2.hash
   ```

---

## RESOLUTION 6: Phase Gate Validation

**Status:** 🟡 P1 — Process Integrity  
**ETA:** 2 days  
**Owner:** Documentation Agent

### Invalidated Gates (Re-Validation Required)

| Phase | Gate | Claimed | Actual | Action |
|-------|------|---------|--------|--------|
| 6 | 6.1 Token prediction | ✅ Complete | ❌ Missing DB | REJECT |
| 8 | 8.4 Gateway health | 🔒 Locked | ❌ Empty module | REJECT |
| 8 | 8.5 Circuit breaker | 🔒 Locked | ❌ Not implemented | REJECT |

### Re-Validation Protocol

1. **Update PHASE_GATES.md**
   ```markdown
   | 6.1 | Token prediction | 🔴 REJECTED — DB tables missing | Re-verify after migration 006 |
   | 8.4 | Gateway health | 🟡 IN PROGRESS — Implementation started |
   ```

2. **Add Verification Commands**
   ```bash
   # Gate 6.1 verification
   psql $DATABASE_URL -c "SELECT * FROM token_wallets LIMIT 1;"
   
   # Gate 8.4 verification
   curl localhost:8000/gateway/health | jq '.api'
   ```

3. **CI Integration**
   ```yaml
   - name: Verify Phase Gates
     run: |
       ./scripts/verify_gate.sh 6.1
       ./scripts/verify_gate.sh 8.4
   ```

---

## RESOLUTION 7: Repository Hygiene Maintenance

**Status:** 🟢 Ongoing  
**ETA:** Continuous  
**Owner:** All Agents

### Pre-Commit Hooks

```yaml
# .pre-commit-config.yaml additions
repos:
  - repo: local
    hooks:
      - id: no-pycache
        name: No __pycache__ committed
        entry: find . -type d -name "__pycache__"
        language: system
        pass_filenames: false
        always_run: true
      
      - id: no-coverage
        name: No .coverage committed
        entry: find . -name ".coverage" -type f
        language: system
        pass_filenames: false
        always_run: true
```

### Monthly Cleanup

```bash
# Add to package.json scripts
"cleanup": "find . -type d -name '__pycache__' -exec rm -rf {} + && find . -name '*.pyc' -delete"
```

---

## TRACKING

| Resolution | Status | ETA | Owner | Blockers |
|------------|--------|-----|-------|----------|
| 1. HLTV Removal | ⏳ Pending | 24h | Backend | None |
| 2. Module Consolidation | ⏳ Pending | 1wk | Backend | Resolution 1 |
| 3. Store Consolidation | ⏳ Pending | 1d | Frontend | None |
| 4. ML Training | ⏳ Pending | 3d | ML | Data sync |
| 5. Rust Repo | ⏳ Pending | 1wk | Rust | None |
| 6. Phase Validation | ⏳ Pending | 2d | Docs | Resolution 2 |
| 7. Hygiene | ⏳ Pending | Cont | All | None |

---

*These resolutions are authorized for immediate execution. Update status in real-time as work progresses.*
