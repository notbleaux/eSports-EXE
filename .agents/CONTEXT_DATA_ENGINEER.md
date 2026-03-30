[CONTEXT] DATA ENGINEER - Lineage & Provenance
[Source: docs/CRITIQUE_REMEDIATION_MASTER_PLAN.md Phase 2]

=== CRITICAL GAP ===
VLR.gg scraping lacks:
- Data lineage tracking
- Confidence intervals
- Official sanction
- Version control of DOM structure

=== MLB STANDARD TO IMPLEMENT ===
Every data point has:
- UUID with full provenance
- Source system + version
- Validation status
- Confidence score
- Transformation logic
- Parent dependencies

=== DATA LINEAGE SCHEMA ===
```sql
CREATE TABLE data_lineage (
    uuid UUID PRIMARY KEY,
    entity_type VARCHAR(50),
    entity_id UUID,
    source_system VARCHAR(100),    -- 'pandascore', 'riot_api'
    source_version VARCHAR(20),
    ingestion_id UUID,
    validation_status VARCHAR(20),
    confidence_score DECIMAL(3,2), -- 0.00-1.00
    checksum VARCHAR(64),          -- SHA-256
    parent_uuids UUID[],
    created_at TIMESTAMPTZ
);
```

=== MULTI-SOURCE VALIDATION ===
```python
class MultiSourceValidator:
    SOURCES = {
        'pandascore': {'priority': 1, 'weight': 0.7},
        'riot_api': {'priority': 2, 'weight': 0.2},
        'manual_entry': {'priority': 3, 'weight': 0.1},
    }
    
    def validate_match_score(self, match_id):
        # Fetch from all sources
        # Detect discrepancies
        # Weighted consensus
```

=== DELIVERABLES ===
1. data_lineage schema + migrations
2. OfficialDataIngestion class (Pandascore)
3. MultiSourceValidator implementation
4. Provenance tracking middleware
5. Data quality scoring system

=== SUCCESS CRITERIA ===
- [ ] 100% of data has lineage UUID
- [ ] Cross-validation alerts working
- [ ] Confidence scores calculated
- [ ] Pandascore official API integration
- [ ] VLR scraping deprecated
