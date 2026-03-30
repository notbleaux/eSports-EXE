[Ver001.000]

# SimRating™ Validation Gap Analysis

**Date:** 2026-03-30  
**Reviewer:** Critical Architecture Review (MLB Analytics Perspective)  
**Classification:** P0 Data Science Risk

---

## Executive Summary

SimRating™ suffers from **black-box syndrome** — proprietary formulas without validation, confidence intervals, or proven correlation to actual performance. This mirrors early WAR/xFIP challenges in baseball analytics.

| Criterion | MLB Best Practice | SimRating Status | Gap |
|-----------|-------------------|------------------|-----|
| Open Formula | Published calculation | Proprietary 5-component | 🔴 Missing |
| Confidence Intervals | Statistical uncertainty | "Confidence tiers" (vague) | 🔴 Missing |
| Test-Retest Reliability | Repeatability scores | Not measured | 🔴 Missing |
| Context Adjustment | Role-Adjusted Replacement | RAR mentioned, unvalidated | 🟡 Partial |
| Data Provenance | Source tracking | Mixed scraping + PandaScore | 🔴 Compromised |
| Temporal Decay | Performance regression | Not implemented | 🔴 Missing |
| Park/Map Effects | Context normalization | Not implemented | 🔴 Missing |

---

## Critical Gaps (MLB Analogues)

### 1. Open Formula — The "WAR" Problem

**MLB History:** WAR took 5+ years to gain acceptance because early versions had opaque calculations.

**SimRating Current:**
```python
# From packages/shared/api/src/njz_api/ml/train_simrating.py
# Formula components mentioned but not documented:
# - K/D/A component (30%)
# - ACS component (25%)
# - Headshot % (15%)
# - Round impact (20%)
# - Clutch factor (10%)
```

**Required:**
- Public formula documentation
- Version history (SimRating v1, v2, etc.)
- GitHub issue tracker for formula refinements

---

### 2. Confidence Intervals — The "xFIP" Lesson

**MLB Best Practice:** xFIP reports expected ERA with confidence bounds.

**SimRating Current:**
```typescript
// Single score only
interface SimRating {
  score: number;  // 0-100
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  // No confidenceInterval field
}
```

**Required:**
```typescript
interface SimRating {
  score: number;
  confidenceInterval: {
    lower: number;  // 95% CI lower bound
    upper: number;  // 95% CI upper bound
  };
  sampleSize: number;  // Matches included
  reliability: 'high' | 'medium' | 'low';  // Based on sample size
}
```

---

### 3. Position-Specific Baselines

**MLB Context:** WAR has different replacement levels for each position (C, SS, 1B, etc.).

**Valorant Need:**
| Role | Baseline K/D | Baseline ACS | Notes |
|------|--------------|--------------|-------|
| Duelist | 1.05 | 230 | Entry fraggers, high variance |
| Controller | 0.95 | 190 | Smokes, lower expected combat |
| Sentinel | 1.00 | 200 | Defense anchor |
| Initiator | 0.98 | 210 | Info gathering, assist-heavy |

**SimRating Current:** Single baseline for all roles.

**Required:** Role-adjusted calculation with distinct distributions.

---

### 4. Temporal Decay — The "Recency Bias" Fix

**MLB Parallel:** Recent performance is more predictive than old performance.

**Implementation Needed:**
```python
# Exponential decay weighting
def calculate_simrating(matches: List[Match], half_life_days: int = 30):
    """
    Weight recent matches more heavily.
    half_life_days: number of days for weight to decay to 50%
    """
    now = datetime.now(timezone.utc)
    weights = []
    for match in matches:
        days_ago = (now - match.date).days
        weight = 0.5 ** (days_ago / half_life_days)
        weights.append(weight)
    return weighted_average(matches, weights)
```

---

### 5. Map Effects — The "Park Factor" Equivalent

**MLB Context:** Coors Field (high altitude) boosts offensive stats by ~20%.

**Valorant Context:**
| Map | Attacker Win% | Avg Rounds | Notes |
|-----|---------------|------------|-------|
| Ascent | 52% | 22.3 | Balanced |
| Bind | 48% | 21.8 | Teleporters favor defenders |
| Haven | 51% | 23.1 | 3 sites = more rounds |
| Split | 49% | 21.2 | Verticality |
| Lotus | 50% | 22.5 | 3 sites, destructible doors |

**SimRating Current:** No map adjustment.

**Required:** Map-specific performance normalization.

---

## Data Quality Issues

### Garbage-In-Garbage-Out Risk

| Data Source | Trust Level | Volume | Status |
|-------------|-------------|--------|--------|
| PandaScore API | Official | High | ✅ Primary |
| HLTV Scraping | Unauthorized | Medium | 🔴 **REMOVE** |
| Manual Entry | Unknown | Low | ⚠️ Audit |

**Critical:** Mixed trust sources compromise SimRating validity.

---

## Validation Roadmap

### Phase 1: Transparency (Week 1-2)
- [ ] Document complete SimRating formula
- [ ] Publish validation methodology
- [ ] Create SimRating changelog

### Phase 2: Statistical Rigor (Week 3-4)
- [ ] Add confidence intervals
- [ ] Implement sample size thresholds
- [ ] Add reliability scores

### Phase 3: Context Awareness (Month 2)
- [ ] Role-specific baselines
- [ ] Temporal decay weighting
- [ ] Map effect normalization

### Phase 4: Predictive Validation (Month 3)
- [ ] Backtest against historical match outcomes
- [ ] Calculate prediction accuracy
- [ ] Compare to betting market odds

---

## Comparison: SimRating vs. Established Metrics

| Feature | SimRating v2 | HLTV Rating 2.0 | MLB WAR | FiveThirtyEight ELO |
|---------|--------------|-----------------|---------|---------------------|
| Open Formula | ❌ No | ⚠️ Partial | ✅ Yes | ✅ Yes |
| Confidence Intervals | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| Position/Role Adjusted | ❌ No | ❌ No | ✅ Yes | N/A |
| Temporal Decay | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| Context Normalization | ❌ No | ⚠️ Partial | ✅ Yes | ✅ Yes |
| Predictive Validation | ❓ Unknown | ✅ Yes | ✅ Yes | ✅ Yes |

---

## Recommendations

1. **Immediately:** Remove HLTV-scraped data from SimRating training
2. **This Sprint:** Add confidence intervals to API response
3. **Next Month:** Implement role-specific baselines
4. **Q2 2026:** Complete predictive validation study

---

## Sign-off

This analysis is based on MLB analytics best practices and esports industry standards. Implementation will significantly improve SimRating credibility and utility.
