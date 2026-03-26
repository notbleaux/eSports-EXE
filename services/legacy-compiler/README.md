[Ver001.000]

# Legacy Compiler Service

**Purpose:** Static Truth Legacy data pipeline — compiles historical data from multiple sources into the TeneT verification pipeline.
**Status:** Phase 0 Stub — Full implementation in Phase 2
**Language:** Python (Scrapy + BeautifulSoup + asyncpg)

## Responsibilities
- Web scrapers: VLR.gg, Liquidpedia (rate-limited, robots.txt compliant)
- Video metadata extraction
- Manual review queue management
- Path B distribution endpoint (feeds TeneT verification service)

## Data Sources
- VLR.gg (match history, player stats, team rosters)
- Liquidpedia (tournament trees, historical records)
- YouTube (video descriptions, livestream metadata)
- Manual admin entry

## See Also
- `data/schemas/tenet-protocol.ts` — PathBLegacyRecord, SourceDataPayload
- `packages/shared/axiom-esports-data/` — Existing data pipeline to integrate with
