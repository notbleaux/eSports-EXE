[Ver001.000]

# TeneT Verification Service

**Purpose:** TeneT Key.Links verification bridge — parses, verifies, and tiers data from all ingestion sources.
**Status:** Phase 0 Stub — Full implementation in Phase 2
**Language:** Python (FastAPI + Celery)
**Port:** 8001

## Responsibilities
- Multi-source data collection (API, video metadata, scraped, manual)
- Trust level weighting per source
- Cross-reference consensus algorithm with confidence scoring (0.0–1.0)
- Routing: confidence ≥ 0.90 → Path B truth layer; 0.70–0.89 → flag for review; < 0.70 → reject
- Manual review queue for flagged entities

## Data Sources
| Source | Trust Level |
|--------|------------|
| Pandascore API | HIGH |
| Riot Official API | HIGH |
| Video Analysis | MEDIUM |
| Manual Review | HIGH |
| VLR.gg scrape | LOW |
| Liquidpedia scrape | MEDIUM |
| Fan Forum | LOW |

## Development
```bash
cd services/tenet-verification
uvicorn main:app --reload --port 8001
pytest tests/ -v
```

## See Also
- `data/schemas/tenet-protocol.ts` — TypeScript type contracts
- `docs/architecture/TENET_TOPOLOGY.md` — Full architecture
