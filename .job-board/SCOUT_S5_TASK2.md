[Ver001.000]

# Scout S5 Task 2: Cross-Review of S6's Harvest Protocol Compliance
**Agent:** S5 (Schema Validation & Drift Detection)  
**Cross-Review Target:** S6 (Harvest Protocol & Data Quality Scout)  
**Date:** 2026-03-15  
**Scope:** Integration of Protocol Compliance with Schema Validation

---

## Executive Summary

Cross-analysis of S6's harvest protocol findings with S5's schema validation analysis reveals **strong architectural alignment** between the protocol layer and validation infrastructure. S6's compliance assessment (8.5/10) and S5's validation coverage (76%) intersect at critical control points that form the data quality backbone.

**Key Integration Insight:** The `SCHEMA_CONFLICT` exclusion reason (S6 §1.4) is the bridge between protocol compliance and schema validation — it triggers when S5's drift detection identifies structural changes.

---

## 1. How Protocol Compliance Affects Schema Validation

### 1.1 Protocol-Validation Intersection Points

| Protocol Element (S6) | Validation Impact (S5) | Integration Quality |
|-----------------------|------------------------|---------------------|
| `rescrape_if_schema_mismatch: true` | Triggers re-validation after drift | ✅ Strong |
| `SCHEMA_CONFLICT` exclusion code | Blocks analytics pipeline | ✅ Strong |
| `max_content_drift_pct: 5.0` | HTML structure threshold | ⚠️ **Gap Identified** |
| Epoch confidence floors | Affects validation strictness | ⚠️ **Misalignment** |
| `separation_flag` (RAW/RECONSTRUCTED) | Different validation rules per path | ✅ Strong |

### 1.2 Protocol-Driven Validation Behavior

**Finding:** The harvest protocol's `skip_policy` directly controls schema validation execution:

```
harvest_protocol.json (S6 §1.3)
├── skip_if_complete: true → Bypasses validation (faster, risk: stale schema)
├── skip_if_checksum_unchanged: true → Bypasses validation (faster, risk: missed drift)
└── rescrape_if_schema_mismatch: true → Forces re-validation
```

**S5 Assessment:** This creates a **validation bypass risk**. When `skip_if_checksum_unchanged=true`, schema drift that doesn't affect checksum (e.g., field reordering) may be missed.

**Recommendation:** Add `force_validation_interval` to periodically re-validate even unchanged records.

### 1.3 Confidence Tier Impact on Validation

S6 identified that **Epoch 3's 100% confidence floor is unrealistic** (W1). This affects schema validation:

| Epoch | Confidence Floor | Validation Behavior | Risk Level |
|-------|------------------|---------------------|------------|
| 1 (Historic) | 50% | Lenient validation, more drift tolerance | Low |
| 2 (Mature) | 75% | Standard validation | Low |
| 3 (Current) | 100% | Strict validation, may reject valid data | **HIGH** |

**Cross-Review Finding:** S6's confidence decay recommendation (§7.1) should be coordinated with S5's drift detection to avoid compounding strictness.

---

## 2. Integration of S6's Recommendations with Drift Detection

### 2.1 S6 Recommendation 1: Confidence Decay for Epoch 3

**S6 Proposal:** Replace 100% floor with maturity decay model  
**S5 Integration:** Confidence decay affects drift detection sensitivity

```python
# Proposed integrated configuration
{
  "epoch_3_confidence_model": "maturity_decay",
  "drift_detection": {
    "confidence_threshold": "dynamic",  # Link to epoch confidence
    "maturity_days": 30,
    "initial_validation_strictness": "lenient",
    "mature_validation_strictness": "strict"
  }
}
```

**Impact on Drift Detection:**
- **Days 0-7:** Lower validation strictness, focus on completeness
- **Days 8-30:** Gradual increase, detect subtle drift
- **Days 30+:** Full strictness, catch all anomalies

### 2.2 S6 Recommendation 2: ACS Bias Correction

**S6 Proposal:** Enable `use_adjusted_kill_value` by default  
**S5 Integration:** Bias correction affects field validation mappings

**Cross-Review Finding:** S5 identified that `adjusted_kill_value` is defined in KCRITR schema but **not extracted** from VLR (§2.2 gaps). S6's recommendation requires:

1. **Extraction layer:** Add adjusted_kill_value parsing
2. **Validation layer:** Update expected fields
3. **Translation layer:** Map VLR → adjusted_kill_value

```python
# S5+S6 Joint Implementation Path
vlr_resilient_client.py        field_translator.py         harvest_protocol.json
        │                              │                              │
        ▼                              ▼                              ▼
  Add field extraction ──────► Add mapping rule ──────► Enable bias correction
```

### 2.3 S6 Recommendation 3: Granular Exception Classification

**S6 Proposal:** Map exceptions to specific exclusion reasons  
**S5 Integration:** Exception type determines drift vs. transient failure

**Joint Classification Matrix:**

| Exception | S6 Exclusion Code | S5 Drift Category | Action |
|-----------|-------------------|-------------------|--------|
| `ParseError` | `SCHEMA_CONFLICT` | Structural drift | Block pipeline, alert |
| `ClientResponseError(404)` | `PERMANENT_NOT_FOUND` | N/A | Mark excluded |
| `TimeoutError` | `RETRYABLE_TIMEOUT` | N/A | Retry with backoff |
| `ChecksumMismatch` | `CONTENT_DRIFT` | Content drift | Re-extract, validate |

**Integration Benefit:** S5's drift detection can now distinguish between **transient failures** (retry) and **actual schema changes** (alert + block).

---

## 3. Quality Gates That Should Trigger Schema Re-Validation

### 3.1 Current Quality Gates (S5 + S6 Analysis)

Based on cross-review, these conditions should force re-validation regardless of skip policies:

| Gate | Trigger Condition | Re-Validation Scope | Priority |
|------|-------------------|---------------------|----------|
| **G1: Schema Version Change** | `datapoint_naming.json` modified | All records in epoch | CRITICAL |
| **G2: Epoch Boundary Cross** | Record ages into next epoch | Records crossing boundary | HIGH |
| **G3: Confidence Decay Milestone** | 7, 14, 30 days post-extraction | Records at maturity tier | HIGH |
| **G4: Content Drift Detected** | HTML diff > 5% | Affected match only | MEDIUM |
| **G5: ACS Bias Correction Toggle** | Config change from S6 R2 | All records with ACS field | MEDIUM |
| **G6: Temporal Wall Migration** | Overfitting guardrail update | Training set records | LOW |

### 3.2 Quality Gate Implementation

```python
# Proposed: quality_gate_checker.py (S5+S6 Joint Design)

class QualityGateChecker:
    """Determines when re-validation is required despite skip policies."""
    
    GATES = {
        "schema_version": {
            "trigger": "datapoint_naming.json mtime changed",
            "action": "revalidate_all",
            "override_skip": True
        },
        "epoch_boundary": {
            "trigger": "record.date < epoch.start_date",
            "action": "revalidate_record",
            "override_skip": True
        },
        "confidence_decay": {
            "trigger": "days_since_extraction in [7, 14, 30]",
            "action": "revalidate_record",
            "override_skip": False  # Respect checksum if unchanged
        },
        "content_drift": {
            "trigger": "html_diff_pct > 5.0",
            "action": "revalidate_match",
            "override_skip": True
        }
    }
```

### 3.3 Integration with KnownRecordRegistry

S6's registry (§2.1) should be extended with quality gate tracking:

```python
# Add to known_record_registry.py
@dataclass
class ValidationHistory:
    last_validation_timestamp: datetime
    schema_version_at_validation: str
    confidence_tier_at_validation: float
    quality_gates_passed: list[str]

def should_revalidate(self, match_id: str) -> tuple[bool, str]:
    """Check quality gates in addition to skip policies."""
    history = self.get_validation_history(match_id)
    
    for gate_name, gate_config in QUALITY_GATES.items():
        if gate_config["trigger"](history):
            return True, gate_name
    
    return False, ""
```

---

## 4. Joint Recommendation Synthesis

### 4.1 Cross-Cutting Themes

| Theme | S5 Finding | S6 Finding | Joint Recommendation |
|-------|------------|------------|---------------------|
| **Config vs. Code** | Hardcoded `EXPECTED_SCHEMA_FIELDS` | Hardcoded temporal wall | Centralize in `harvest_protocol.json` |
| **Alerting Gap** | Schema drift logs only | Exception handling generic | Unified alert system |
| **Validation Bypass** | Checksum skip risks | Confidence floor unrealistic | Quality gate override system |
| **Field Loss** | 2 fields discarded | ACS bias disabled | Unified field pipeline |

### 4.2 Synthesized Recommendations (Priority Ordered)

#### **R1: Unified Configuration-Driven Validation** (HIGH)
**Synthesized from:** S5-R2 (config-driven schema) + S6-R3 (exception classification)

```json
// harvest_protocol.json extension
{
  "validation_policy": {
    "expected_fields_source": "config",  // S5-R2
    "exception_classification": {        // S6-R3
      "retryable": ["TIMEOUT", "RATE_LIMIT"],
      "permanent": ["NOT_FOUND", "SCHEMA_CONFLICT"]
    },
    "quality_gates": {                   // New from cross-review
      "force_revalidation_on_schema_change": true,
      "force_revalidation_on_epoch_cross": true
    }
  }
}
```

**Impact:** Eliminates hardcoded values in both extraction (S5) and epoch handling (S6).

---

#### **R2: Integrated Drift-Confidence Alerting System** (HIGH)
**Synthesized from:** S5-R1 (automated alerting) + S6-R1 (confidence decay)

```python
# New: integrated_alert_system.py

class IntegratedAlertSystem:
    """Unified alerts for schema drift and confidence issues."""
    
    ALERT_RULES = [
        {
            "condition": "schema_conflict AND confidence < 50",
            "severity": "CRITICAL",
            "action": ["block_pipeline", "notify_ops", "create_incident"],
            "escalation_minutes": 5
        },
        {
            "condition": "content_drift AND epoch == 3",
            "severity": "HIGH", 
            "action": ["log_detailed", "notify_data_team"],
            "escalation_minutes": 30
        },
        {
            "condition": "confidence_decay_milestone",
            "severity": "INFO",
            "action": ["revalidate_record"],
            "escalation_minutes": None
        }
    ]
```

**Impact:** Single alerting channel instead of separate drift logs and confidence checks.

---

#### **R3: End-to-End Field Pipeline Integrity** (MEDIUM)
**Synthesized from:** S5 (field loss) + S6-R2 (ACS bias correction)

**Current State:**
```
VLR HTML → Extract (15 fields) → Translate (13 fields) → KCRITR (37 fields)
                   │                      │
            first_death lost      adjusted_kill_value
            clutch_attempt lost     not extracted
```

**Proposed Pipeline:**
```
VLR HTML → Extract (all fields) → Bias Correction (S6-R2) → Translate → KCRITR
                 │                                              │
                 └─ Config-driven expected fields (S5-R2) ──────┘
```

**Implementation:**
1. Update `vlr_resilient_client.py` to extract `adjusted_kill_value` (S6)
2. Add `first_death` and `clutch_attempt` to KCRITR schema OR document intentional exclusion (S5)
3. Enable ACS bias correction by default (S6-R2)
4. Update `field_translator.py` mappings (S5)

---

#### **R4: Epoch-Aware Validation Scheduling** (MEDIUM)
**Synthesized from:** S5 (drift detection) + S6 (epoch configuration)

**Problem:** Current validation runs uniformly regardless of epoch maturity.

**Solution:** Epoch-aware validation schedule:

| Epoch | Extraction Frequency | Validation Frequency | Reason |
|-------|---------------------|----------------------|--------|
| 3 (Current) | Daily | Every extraction | High confidence target |
| 2 (Mature) | Weekly | Weekly | Stable, mature data |
| 1 (Historic) | Monthly | Quarterly | Frozen, archival data |

```python
# epoch_harvester.py extension
def get_validation_schedule(self, epoch: int) -> str:
    schedules = {
        1: "quarterly",   # Historic - stable
        2: "weekly",      # Mature - periodic check
        3: "per_extraction"  # Current - always validate
    }
    return schedules.get(epoch, "per_extraction")
```

---

### 4.3 Implementation Priority Matrix

| Recommendation | S5 Component | S6 Component | Effort | Value |
|----------------|--------------|--------------|--------|-------|
| R1: Unified Config | field_translator.py | harvest_protocol.json | M | HIGH |
| R2: Integrated Alerting | epoch_harvester.py | known_record_registry.py | M | HIGH |
| R3: Field Pipeline | vlr_resilient_client.py | overfitting_guardrails.json | L | MEDIUM |
| R4: Epoch Scheduling | test_schema_validation.py | epoch_harvester.py | L | MEDIUM |

---

## 5. Cross-Review Findings Summary

### 5.1 Architectural Strengths Confirmed

| Aspect | S5 View | S6 View | Joint Assessment |
|--------|---------|---------|------------------|
| Multi-layer validation | ✅ 4 layers | ✅ Protocol enforcement | **Robust** |
| Exclusion reason codes | Via `SCHEMA_CONFLICT` | 8 canonical codes | **Complete** |
| Checksum integration | File-level | Skip policy | **Coordinated** |
| Test coverage | Schema tests (62 lines) | Registry tests (279 lines) | **Good** |

### 5.2 Gaps Requiring Joint Action

| Gap | S5 Impact | S6 Impact | Joint Fix |
|-----|-----------|-----------|-----------|
| No automated alerts | Drift undetected for days | Exceptions silently handled | R2: Integrated alerting |
| Hardcoded schemas | Code change required | Epoch configs separate | R1: Unified config |
| Validation bypass | Checksum skip risks | Confidence floor too strict | Quality gates (§3) |
| Field loss | 2 fields unmapped | ACS bias not applied | R3: Field pipeline |

### 5.3 Risk Assessment

| Risk | Likelihood | Impact | Mitigation Status |
|------|------------|--------|-------------------|
| Schema drift undetected | MEDIUM | HIGH | ⚠️ Needs R2 implementation |
| Epoch 3 data rejection | HIGH | MEDIUM | ⚠️ Needs S6-R1 + quality gates |
| Silent field loss | LOW | LOW | ✅ Documented, R3 planned |
| Validation bypass | MEDIUM | MEDIUM | ⚠️ Needs quality gates |

---

## 6. Sign-Off

### S5 Cross-Review Assessment of S6's Work

| Criteria | Score | Notes |
|----------|-------|-------|
| Protocol Compliance Analysis | 9/10 | Thorough coverage of all 8 exclusion codes |
| Completeness Criteria Mapping | 9/10 | All 6 criteria verified |
| Epoch Configuration | 8/10 | Correctly identified 100% floor issue |
| Overfitting Guardrails | 8/10 | Good coverage of disabled ACS correction |
| Recommendations Quality | 9/10 | Actionable, prioritized, well-justified |
| **Overall S6 Task 1 Grade** | **8.6/10** | **Excellent work, ready for integration** |

### Synthesis Completion

✅ **How protocol compliance affects schema validation** - Documented intersection points (§1)  
✅ **Integration of S6 recommendations with drift detection** - Mapped to 3 cross-cutting themes (§2)  
✅ **Quality gates for schema re-validation** - 6 gates defined with implementation (§3)  
✅ **Joint recommendation synthesis** - 4 synthesized recommendations with priority matrix (§4)

### Files Referenced

| File | S5 Usage | S6 Usage | Cross-Review Integration |
|------|----------|----------|-------------------------|
| `harvest_protocol.json` | Schema drift policy | Full protocol config | R1: Unified config |
| `known_record_registry.py` | Exclusion management | Registry API | R2: Alerting integration |
| `epoch_harvester.py` | Drift detection trigger | Epoch configuration | R4: Scheduling |
| `vlr_resilient_client.py` | Expected fields | N/A | R3: Field pipeline |
| `overfitting_guardrails.json` | N/A | Guardrail config | R3: ACS correction |

---

**Scout S5 Task 2 Status:** ✅ COMPLETE  
**Cross-Review Target:** S6 Task 1  
**Deliverable:** 4 joint recommendations, 6 quality gates, integration analysis  
**Ready for:** Foreman review and implementation assignment

**Scout:** S5  
**Timestamp:** 2026-03-15T16:40+11:00
