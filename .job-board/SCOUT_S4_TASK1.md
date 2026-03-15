# Scout Agent S4 — Task 1: VLR Extraction Pipeline Analysis

**Agent:** S4 (Data Collection Pipeline Scout)  
**Date:** 2026-03-15  
**Files Analyzed:**
- `packages/shared/axiom_esports_data/extraction/src/scrapers/vlr_resilient_client.py`
- `packages/shared/axiom_esports_data/extraction/src/parsers/match_parser.py`
- `packages/shared/axiom_esports_data/config/harvest_protocol.json`
- `packages/shared/axiom_esports_data/extraction/src/scrapers/epoch_harvester.py`
- `packages/shared/axiom_esports_data/extraction/src/storage/integrity_checker.py`

---

## Executive Summary

The VLR extraction pipeline demonstrates **production-ready robustness** with circuit breaker patterns, rate limiting, and integrity verification. However, **schema drift detection has critical gaps** that could lead to silent data loss during VLR.gg website updates. The harvest protocol is comprehensive but has unrealistic confidence thresholds for current epoch data.

---

## 1. Extraction Pipeline Robustness Assessment

### ✅ Strengths

| Component | Robustness Feature | Implementation Quality |
|-----------|-------------------|----------------------|
| **Circuit Breaker** | 5 failures → 5min cooldown, HALF_OPEN recovery | ✅ Solid (vlr_resilient_client.py:28-59) |
| **Rate Limiting** | 2s between requests, 3 concurrent max | ✅ Ethical and respectful |
| **User Agent Rotation** | 2 research-focused UAs | ⚠️ Minimal but adequate |
| **Content Checksums** | SHA-256 for deduplication | ✅ Strong integrity |
| **Registry Integration** | KnownRecordRegistry skip logic | ✅ Prevents redundant fetches |
| **Integrity Verification** | File-level SHA verification | ✅ Catches corruption |
| **Epoch Segmentation** | 3 temporal epochs with confidence floors | ✅ Smart data lifecycle |

### ⚠️ Weaknesses

| Issue | Location | Risk Level | Description |
|-------|----------|------------|-------------|
| Minimal User Agent Pool | vlr_resilient_client.py:22-25 | Medium | Only 2 UAs — rotation fatigue possible |
| No HTML Structure Hashing | match_parser.py:50-53 | High | Regex-based validation easily bypassed |
| Silent Schema Failures | match_parser.py:35-39 | High | Returns `None` on schema mismatch, no alert |
| No Content Diff Tracking | harvest_protocol.json:81-85 | Medium | CONTENT_DRIFT flagged but no baseline storage |
| Unrealistic Epoch 3 Floor | harvest_protocol.json:18 | Medium | 100% confidence floor for current data impossible |

### 🔧 Robustness Score: **7.5/10**

---

## 2. Schema Drift Detection Gaps

### Critical Gap #1: Hardcoded Field Lists

**Location:** `vlr_resilient_client.py:16-20`

```python
EXPECTED_SCHEMA_FIELDS = {
    "player", "team", "agent", "rating", "acs", "kills", "deaths",
    "assists", "kast", "adr", "hs_pct", "first_blood", "first_death",
    "clutch_win", "clutch_attempt"
}
```

**Problem:**
- Fields are hardcoded at import time
- No mechanism to detect NEW fields VLR.gg adds
- Missing fields are logged but not alerted
- No automated schema discovery from live data

**Impact:** If VLR.gg adds new stats (e.g., "flash_assists", "trade_kills"), the pipeline will silently ignore them, leading to incomplete analytics.

---

### Critical Gap #2: Weak HTML Structure Validation

**Location:** `match_parser.py:50-53`

```python
def _has_expected_structure(self, html: str) -> bool:
    """Basic structural validation — checks for required HTML elements."""
    required_markers = ["vm-stats-game", "mod-player", "mod-stat"]
    return all(marker in html for marker in required_markers)
```

**Problem:**
- Simple substring matching — doesn't validate DOM structure
- No CSS selector validation
- VLR.gg could change class names gradually without detection
- False positives possible (markers in comments, different contexts)

**Impact:** Structural changes that preserve marker strings will pass validation but fail parsing, causing data corruption.

---

### Critical Gap #3: No Schema Version Tracking

**Location:** Pipeline-wide

**Problem:**
- `harvest_protocol.json` defines `schema.kcritr_version = "v2"` but no enforcement
- No hash of expected HTML structure signatures
- No comparison between expected and actual DOM trees
- Schema drift in `conflict_resolution.schema_drift_detected` is CRITICAL but detection is weak

**Impact:** Per harvest protocol line 105-108, schema drift should block analytics pipeline, but current detection likely won't catch drift until data quality degrades significantly.

---

### Schema Drift Detection Score: **4/10**

---

## 3. Three Recommendations for Improvement

### 🔴 Recommendation #1: Implement Automated Schema Discovery

**Priority:** HIGH  
**Location:** New file `extraction/src/scrapers/schema_detector.py`

**Implementation:**
```python
class SchemaDetector:
    """
    Discovers and tracks VLR.gg schema changes over time.
    Compares live extractions against baseline signatures.
    """
    
    def capture_structure_signature(self, html: str) -> dict:
        """Generate a hash of the HTML structure (not content)."""
        soup = BeautifulSoup(html, "lxml")
        
        # Capture CSS selector patterns
        signatures = {
            "player_row_selector": "div.vm-stats-game div.mod-player",
            "stat_cell_selector": "div.mod-stat",
            "structure_hash": self._hash_dom_structure(soup),
            "field_order": self._extract_field_order(soup),
            "timestamp": datetime.utcnow().isoformat()
        }
        return signatures
    
    def detect_drift(self, current_html: str, baseline_signature: dict) -> dict:
        """Compare current structure against baseline."""
        current = self.capture_structure_signature(current_html)
        
        drift_report = {
            "structure_changed": current["structure_hash"] != baseline_signature["structure_hash"],
            "new_fields": set(current["field_order"]) - set(baseline_signature["field_order"]),
            "missing_fields": set(baseline_signature["field_order"]) - set(current["field_order"]),
            "drift_percentage": self._calculate_drift_percentage(current, baseline_signature)
        }
        
        # Alert if >5% drift (per harvest protocol)
        if drift_report["drift_percentage"] > 5.0:
            logger.critical("Schema drift detected: %.2f%%", drift_report["drift_percentage"])
            
        return drift_report
```

**Why:** Prevents silent data loss by proactively detecting structural changes before they corrupt analytics.

---

### 🟡 Recommendation #2: Add HTML Baseline Storage & Diff Tracking

**Priority:** MEDIUM  
**Location:** Extend `raw_repository.py` + new migration

**Implementation:**
```python
# In raw_repository.py
async def store_baseline_sample(self, html: str, epoch: int) -> None:
    """Store periodic baseline samples for drift comparison."""
    baseline_path = self.storage_path / "baselines" / f"epoch_{epoch}_baseline.html"
    baseline_path.write_text(html, encoding="utf-8")

async def compute_content_diff(self, new_html: str, baseline_path: Path) -> float:
    """Return percentage difference between new and baseline HTML."""
    import difflib
    baseline = baseline_path.read_text(encoding="utf-8")
    
    # Compare structure (not content values)
    baseline_structure = self._extract_structure_only(baseline)
    new_structure = self._extract_structure_only(new_html)
    
    similarity = difflib.SequenceMatcher(
        None, baseline_structure, new_structure
    ).ratio()
    
    return (1 - similarity) * 100  # Return as percentage
```

**Why:** Implements harvest protocol's `max_content_drift_pct: 5.0` requirement with actual diff calculation instead of just flagging.

---

### 🟢 Recommendation #3: Dynamic Field Discovery with Alerting

**Priority:** HIGH  
**Location:** Modify `vlr_resilient_client.py` + `match_parser.py`

**Implementation:**
```python
# In vlr_resilient_client.py
class ResilientVLRClient:
    def __init__(self, ...):
        # ... existing init ...
        self._discovered_fields: set[str] = set()
        self._field_discovery_enabled = True
    
    def validate_schema_dynamic(self, parsed_data: dict) -> dict:
        """Enhanced validation that discovers and reports new fields."""
        detected = set(parsed_data.keys())
        expected = EXPECTED_SCHEMA_FIELDS
        
        # Track newly discovered fields
        new_fields = detected - expected - self._discovered_fields
        if new_fields and self._field_discovery_enabled:
            self._discovered_fields.update(new_fields)
            logger.warning(
                "NEW FIELDS DISCOVERED: %s. Consider updating EXPECTED_SCHEMA_FIELDS.",
                new_fields
            )
            # Emit metric for monitoring
            self._emit_schema_discovery_metric(list(new_fields))
        
        missing = expected - detected
        extra = detected - expected
        
        return {
            "missing": list(missing),
            "extra": list(extra),
            "newly_discovered": list(new_fields),
            "schema_coverage": len(detected & expected) / len(expected) * 100
        }
    
    def _emit_schema_discovery_metric(self, fields: list[str]) -> None:
        """Emit Prometheus metric for schema drift monitoring."""
        # Integration with monitoring stack
        pass
```

**Why:** Transforms schema drift from silent failure to observable event, enabling proactive parser updates.

---

## Summary Table

| Aspect | Current State | Target State | Priority |
|--------|--------------|--------------|----------|
| Schema Detection | Hardcoded fields | Dynamic discovery | HIGH |
| Structure Validation | Substring matching | DOM signature hashing | HIGH |
| Drift Alerting | Log-only | Prometheus + PagerDuty | MEDIUM |
| Baseline Tracking | None | Periodic snapshots | MEDIUM |
| Field Coverage | 13 fields | Auto-expanding | HIGH |

---

## Sign-off

**Scout Agent:** S4  
**Status:** Task 1 Complete  
**Next:** Ready for trade with Agent S5

---

*Cross-reference: Foreman Pass 0 Analysis, Domain 2 (Data Collection Infrastructure)*
