[Ver001.000]

# Scout S6 Task 1: Harvest Protocol & Data Quality Assessment
**Agent:** S6 (Harvest Protocol & Data Quality Scout)  
**Date:** 2026-03-15  
**Scope:** Data Collection Infrastructure - Harvest Protocol Compliance  
**Reference:** FOREMAN_PASS_0_ANALYSIS.md

---

## Executive Summary

Analysis of the harvest protocol implementation reveals a **well-architected** data collection infrastructure with strong protocol compliance. The KnownRecordRegistry, EpochHarvester, and overfitting guardrails are all implemented with proper coordination through the shared `harvest_protocol.json` contract.

**Overall Compliance Score: 8.5/10**

---

## 1. Protocol Compliance Assessment

### 1.1 Harvest Protocol Configuration (`harvest_protocol.json`)

| Component | Status | Notes |
|-----------|--------|-------|
| Protocol Version | ✅ 1.0.0 | Properly versioned |
| Schema Definition | ✅ kcritr_version v2 | 37 fields defined |
| Primary Key | ✅ Composite | `[player_id, match_id, map_name]` |
| Separation Flags | ✅ Defined | RAW (0) vs RECONSTRUCTED (1) |
| Data Sources | ✅ Listed | vlr_gg, liquipedia, hltv, grid |

**Epoch Configuration:**
```json
Epoch 1: 2020-12-03 → 2022-12-31 | Confidence Floor: 50.0% | Historic
Epoch 2: 2023-01-01 → 2025-12-31 | Confidence Floor: 75.0% | Mature
Epoch 3: 2026-01-01 → present   | Confidence Floor: 100.0% | Current
```

**⚠️ Concern Identified (FOREMAN Line 21):** Epoch 3 confidence floor of 100% is unrealistic for incremental data collection.

### 1.2 Completeness Definition Compliance

The protocol defines 6 criteria for record completeness - ALL implemented:

| Criterion | Protocol Spec | Implementation Status |
|-----------|---------------|----------------------|
| Min player count | 10 | ✅ `MIN_PLAYER_COUNT = 10` |
| Required fields non-null | kills, deaths, acs, adr, kast_pct | ✅ `REQUIRED_NON_NULL` |
| Separation flag | 0 (RAW) | ✅ Enforced |
| HTTP status | 200 | ✅ Checked |
| Checksum present | true | ✅ SHA-256 verified |
| Confidence tier min | 50.0 | ✅ `MIN_CONFIDENCE_TIER` |

### 1.3 Skip Policy Implementation

| Policy Rule | Config Value | Registry Implementation |
|-------------|--------------|------------------------|
| skip_if_complete | true | ✅ `should_skip()` line 165 |
| skip_if_excluded | true | ✅ `should_skip()` line 168 |
| skip_if_checksum_unchanged | true | ✅ `should_skip_checksum()` |
| rescrape_if_schema_mismatch | true | ⚠️ Via `SCHEMA_CONFLICT` exclusion |
| rescrape_if_confidence_below_floor | true | ⚠️ Via `LOW_CONFIDENCE` exclusion |

### 1.4 Exclusion Reasons (Canonical Codes)

All 8 exclusion reason codes properly defined and enforced:

| Code | Usage | Registry Validation |
|------|-------|---------------------|
| COMPLETE | Auto-marked | ✅ |
| MANUAL_EXCLUDE | Human/data team | ✅ |
| DUPLICATE | Deduplication | ✅ |
| SCHEMA_CONFLICT | Parser failure | ✅ Blocks pipeline |
| CONTENT_DRIFT | >5% HTML diff | ✅ |
| LOW_CONFIDENCE | Below epoch floor | ✅ |
| RATE_LIMIT_BAN | IP/UA banned | ✅ |
| EXAMPLE_DATA | separation_flag=9 | ✅ Corpus guard |

---

## 2. Known Record Registry Implementation

### 2.1 Architecture Compliance

The `KnownRecordRegistry` class (`extraction/src/storage/known_record_registry.py`, 401 lines) fully implements the registry API contract:

```python
# Primary query interface (all implemented)
is_known(match_id)          → bool ✅
is_complete(match_id)       → bool ✅
is_excluded(match_id)       → bool ✅
should_skip(match_id)       → bool ✅ (primary guard)

# Mutation interface (all implemented)
mark_complete(match_id)     → void ✅
mark_excluded(match_id, reason, notes, excluded_by) → void ✅
reinstate(match_id)         → void ✅
add_pending(match_id)       → void ✅

# List/stats interface (all implemented)
list_pending()              → list[str] ✅
list_excluded()             → list[ExclusionEntry] ✅
get_stats()                 → RegistryStats ✅
```

### 2.2 Key Implementation Strengths

1. **Example Corpus Guard** (Line 161-164): Automatically skips `EXAMPLE_` prefixed matches
2. **Reason Code Validation** (Line 216-220): Raises `ValueError` for unknown exclusion reasons
3. **DB Persistence**: Syncs complete/excluded/pending states to PostgreSQL
4. **Conflict Resolution**: Implements all 5 conflict rules from protocol

### 2.3 Test Coverage

`test_known_record_registry.py` (279 lines) covers:
- Registry basics (known/complete/excluded state management)
- Should skip logic (complete/excluded/pending handling)
- Checksum-based deduplication
- Reinstatement workflow
- Stats calculation with skip rate
- Invalid exclusion reason rejection
- ExclusionList integration
- **Coordinated harvester + registry integration tests**

---

## 3. Epoch-Based Confidence Tiers

### 3.1 Implementation Mapping

| Epoch | Date Range | Confidence Floor | Implementation Location |
|-------|------------|------------------|------------------------|
| 1 | 2020-12-03 → 2022-12-31 | 50.0% | `EPOCHS[1]` in epoch_harvester.py:38-42 |
| 2 | 2023-01-01 → 2025-12-31 | 75.0% | `EPOCHS[2]` in epoch_harvester.py:38-42 |
| 3 | 2026-01-01 → today() | 100.0% | `EPOCHS[3]` in epoch_harvester.py:38-42 |

### 3.2 Epoch Boundary Tests

`test_epoch_harvester.py` validates:
- ✅ All epochs have start/end/confidence_floor
- ✅ Date order (start < end for each epoch)
- ✅ Epoch 1 confidence < Epoch 2 confidence
- ✅ Epoch 2 ends before Epoch 3 starts (no overlap)

### 3.3 Harvest Mode Integration

| Mode | Target Epochs | Behavior |
|------|---------------|----------|
| delta | [3] (daily), [2,3] (weekly) | Only incomplete records |
| full | [1, 2, 3] (monthly) | All records in range |

---

## 4. Overfitting Guardrails

### 4.1 Configuration (`overfitting_guardrails.json`)

| Guardrail | Config Value | Status |
|-----------|--------------|--------|
| Min maps for training | 50 | ✅ |
| Max maps ceiling | 200 | ✅ |
| Stratified sampling | true | ✅ By role, region |
| Temporal wall | 2024-01-01 | ⚠️ **Blocks 2024+ training data** |
| Adversarial validation | RandomForest, AUC>0.55=leakage | ✅ |
| ACS bias correction | **disabled by default** | ⚠️ **CONCERN** |

### 4.2 Implementation (`overfitting_guard.py`)

**OverfittingGuard class features:**
- Adversarial validation with RandomForestClassifier (100 estimators)
- 5-fold cross-validation for robustness
- Map ceiling enforcement (elite player downsampling)
- Sample floor enforcement (low-appearance exclusion)
- Feature importance reporting for diagnostics

**Confidence Penalty Weights:**
```
n < 30 maps:     weight = 0.4   (highly penalized)
n = 30-50 maps:  weight = 0.75  (moderately penalized)
n > 200 maps:    use temporal decay only
```

### 4.3 Test Assertions Policy

| Forbidden | Allowed |
|-----------|---------|
| Hardcoded player names | Range-based assertions |
| Specific match IDs | `assert 100 < acs < 500` |
| Exact ACS values | `assert -5 < sim_rating < 5` |
| .pkl/.joblib model files | `assert 0 <= confidence <= 100` |

---

## 5. Data Quality Metrics Coverage

### 5.1 Metrics Collected Per Match (from protocol)

| Category | Fields | Status |
|----------|--------|--------|
| Identity | player_id, name, team, region, role | ✅ |
| Raw Performance | kills, deaths, acs, adr, kast_pct | ✅ Required for completeness |
| Extended Performance | headshot_pct, first_blood, clutch_wins, agent, economy_rating, adjusted_kill_value | ✅ |
| RAR Metrics | role_adjusted_value, replacement_level, rar_score, investment_grade | ✅ |
| Temporal | age, peak_age_estimate, career_stage, realworld_time | ✅ |
| SimRating | sim_rating | ✅ |
| Match Context | match_id, map_name, tournament, patch_version | ✅ |
| Provenance | data_source, extraction_timestamp, checksum_sha256, confidence_tier, separation_flag, partner_datapoint_ref, reconstruction_notes, record_id | ✅ |

**Total: 37 fields** — matches `field_count` in protocol

### 5.2 Safety Thresholds Enforcement

| Threshold | Value | Purpose |
|-----------|-------|---------|
| max_consecutive_http_errors | 10 | Circuit breaker trigger |
| max_error_rate_pct | 20.0% | Pipeline health limit |
| min_batch_success_rate_pct | 80.0% | Quality floor |
| max_new_exclusions_per_run_pct | 5.0% | Drift detection |
| circuit_breaker_failure_threshold | 5 | Auto-stop threshold |
| circuit_breaker_recovery_seconds | 300 | Cooldown period |
| rate_limit_seconds | 2.0 | Ethical scraping |
| max_concurrent_requests | 3 | Resource limiting |
| request_timeout_seconds | 30 | Hang protection |
| max_content_drift_pct | 5.0 | Change detection |

---

## 6. Issues Identified

### 6.1 Critical Issues (None Found)

### 6.2 Warning Issues (2 Found)

| Issue | Location | Description | Recommendation |
|-------|----------|-------------|----------------|
| **W1** | harvest_protocol.json:18 | Epoch 3 confidence floor 100% unrealistic for incremental data | Reduce to 85-90% or implement maturity decay |
| **W2** | overfitting_guardrails.json:41 | ACS bias correction disabled by default | Enable `use_adjusted_kill_value` by default |

### 6.3 Advisory Issues (2 Found)

| Issue | Location | Description | Recommendation |
|-------|----------|-------------|----------------|
| **A1** | overfitting_guardrails.json:28 | Temporal wall blocks 2024+ training data | Document rationale; plan wall migration |
| **A2** | epoch_harvester.py:138-143 | Generic MANUAL_EXCLUDE used for all exceptions | Differentiate retryable vs permanent failures |

---

## 7. Three Recommendations for Quality Improvement

### Recommendation 1: Implement Confidence Decay for Epoch 3
**Priority: HIGH**

**Problem:** Epoch 3's 100% confidence floor is unrealistic for fresh data. Newly extracted matches haven't undergone the same validation maturity as historical data.

**Solution:** Implement temporal confidence decay:
```json
{
  "epoch_3_confidence_model": "maturity_decay",
  "initial_confidence": 75.0,
  "maturity_days": 30,
  "max_confidence": 95.0,
  "validation_bonus": 5.0
}
```

**Files to Modify:**
- `harvest_protocol.json` - Update Epoch 3 config
- `known_record_registry.py` - Add maturity scoring
- `extraction_bridge.py` - Calculate confidence on write

---

### Recommendation 2: Enable ACS Bias Correction by Default
**Priority: HIGH**

**Problem:** ACS (Average Combat Score) inherently favors Duelist agents. The guardrail config has bias correction disabled, risking skewed SimRating calculations.

**Solution:**
```json
{
  "acs_bias_correction": {
    "use_raw_acs_in_simrating": false,
    "use_adjusted_kill_value": true,
    "enabled_by_default": true
  }
}
```

**Rationale:** The protocol explicitly states "ACS inherently favors Duelists. Always use adjusted_kill_value." The config should reflect this mandate.

**Files to Modify:**
- `overfitting_guardrails.json` - Enable by default
- `service_enhanced.py` - Honor config setting

---

### Recommendation 3: Add Granular Exception Classification
**Priority: MEDIUM**

**Problem:** All harvest exceptions result in `MANUAL_EXCLUDE`, which is semantically incorrect. Some exceptions are retryable (network timeout), others are permanent (404 Not Found).

**Solution:** Implement exception-to-reason mapping:
```python
EXCEPTION_REASON_MAP = {
    "TimeoutError": "RETRYABLE_TIMEOUT",
    "ClientResponseError(404)": "PERMANENT_NOT_FOUND",
    "ClientResponseError(403)": "RATE_LIMIT_BAN",
    "ParseError": "SCHEMA_CONFLICT",
    "ChecksumMismatch": "CONTENT_DRIFT",
}
```

**Benefits:**
- Accurate exclusion analytics
- Automatic retry for transient failures
- Better alerting (critical vs warning)

**Files to Modify:**
- `epoch_harvester.py` - Exception classification
- `harvest_protocol.json` - Add new exclusion reasons
- `known_record_registry.py` - Support retry tracking

---

## 8. Summary Statistics

| Metric | Value |
|--------|-------|
| Protocol Version | 1.0.0 |
| Lines of Implementation | 1,147 (401 registry + 257 harvester + 146 guard + 279 tests + 65 epoch tests) |
| Test Coverage | 344 lines across 2 test files |
| Exclusion Reason Codes | 8 (all validated) |
| Epoch Boundaries | 3 (all tested) |
| Safety Thresholds | 10 (all configured) |
| Data Quality Metrics | 37 fields |
| Compliance Score | 8.5/10 |

---

## Scout S6 Sign-Off

**Task 1 Status:** ✅ COMPLETE  
**Analysis Depth:** Protocol config → Implementation → Tests → Metrics  
**Deliverable:** 3 quality improvement recommendations provided  
**Ready for Trade:** YES — S4 Task pending

**Scout:** S6  
**Timestamp:** 2026-03-15T16:34+11:00
