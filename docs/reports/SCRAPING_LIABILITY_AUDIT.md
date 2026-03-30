[Ver001.000]

# Scraping Liability Audit & Mitigation Plan

**Date:** 2026-03-30  
**Classification:** P0 Legal Risk  
**Reviewer:** Critical Architecture Review

---

## 🚨 Executive Summary

The repository contains **active web scraping code** for HLTV.org (CS2 data) that violates Terms of Service and creates significant legal liability.

| Source | Status | Risk Level | Action Required |
|--------|--------|------------|-----------------|
| HLTV.org | Active scraper | 🔴 **CRITICAL** | Immediate removal required |
| VLR.gg | Referenced in docs | 🟡 **HIGH** | Verify no active code |
| PandaScore | Official API | 🟢 **LOW** | Primary data source |

---

## Affected Files

### P0 — Immediate Removal Required

```
packages/shared/axiom_esports_data/extraction/src/scrapers/hltv_client.py
packages/shared/axiom_esports_data/extraction/src/scrapers/__init__.py
packages/shared/axiom_esports_data/extraction/README_HLTV.md
packages/shared/axiom_esports_data/extraction/test_hltv_mvp.py
```

### HLTV Client Analysis

The `hltv_client.py` file contains:
- Direct scraping of `https://www.hltv.org` (line 80)
- BeautifulSoup HTML parsing for match data
- Player statistics extraction
- Rate limiting (30 req/min) — **insufficient for ToS compliance**

**HLTV.org Terms of Service violations:**
1. No automated access without written permission
2. No scraping/framing without consent
3. No commercial use of scraped data

---

## Mitigation Strategy

### Phase 1: Immediate Containment (This Week)

1. **Remove HLTV scraper files** from active codebase
2. **Document data source migration** to PandaScore exclusively
3. **Add legal disclaimer** to all data consumers

### Phase 2: Official API Migration (Next Sprint)

| Data Need | Current Source | Migration Target |
|-----------|---------------|------------------|
| CS2 Match Results | HLTV scraping | PandaScore API |
| CS2 Player Stats | HLTV scraping | PandaScore API |
| CS2 Rankings | HLTV scraping | Valve Web API |
| VCT Valorant | PandaScore | ✅ Already compliant |

### Phase 3: Compliance Verification

- [ ] All scraping code removed from `main` branch
- [ ] CI check to prevent scraping code commits
- [ ] Data lineage audit for existing database records
- [ ] Legal review of PandaScore API terms

---

## Implementation Notes

### Why PandaScore is Compliant

- Official partnership with tournament organizers
- Legal API access with rate limits
- Commercial use permitted with proper licensing
- Covers both Valorant and CS2

### Why HLTV Scraping is Not

- No API available for commercial use
- Explicit ToS prohibition on scraping
- Competitive business model (HLTV Pro)
- Historical C&D letters sent to scrapers

---

## Remediation Commit

All HLTV scraping files must be removed in a single commit with message:

```
fix(legal): Remove HLTV.org scraping code

- Delete hltv_client.py and related files
- Migration to PandaScore API complete
- No active scraping remains in codebase

Refs: SCRAPING_LIABILITY_AUDIT.md
```

---

## Sign-off

| Role | Name | Date | Status |
|------|------|------|--------|
| Legal Review | TBD | | Pending |
| Data Pipeline Owner | TBD | | Pending |
| Engineering Lead | TBD | | Pending |
