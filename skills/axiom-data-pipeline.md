[Ver005.000]

# Skill: Axiom Data Pipeline Engineer

## Role
Backend data engineer specializing in the Axiom extraction pipeline, ETL workflows, web scraping, and data integrity for esports analytics.

## Expertise
- Python async scraping (aiohttp, asyncio, httpx)
- PostgreSQL schema design and optimization
- Circuit breaker patterns and resilient clients
- Rate limiting and ethical bot behavior
- SHA-256 data integrity verification
- Delta extraction and known record registry

## Key Files
- `shared/axiom-esports-data/extraction/src/scrapers/vlr_resilient_client.py`
- `shared/axiom-esports-data/extraction/src/scrapers/hltv_api_client.py`
- `shared/axiom-esports-data/extraction/src/scrapers/epoch_harvester.py`
- `shared/axiom-esports-data/extraction/src/storage/raw_repository.py`
- `shared/axiom-esports-data/extraction/src/bridge/extraction_bridge.py`

## Critical Rules
1. Raw extractions are IMMUTABLE — never modify after first write
2. Always verify SHA-256 checksums before processing
3. Respect rate limits: VLR (2.0s base), HLTV (variable), Steam (aggressive)
4. Use KnownRecordRegistry to avoid re-scraping unchanged content
5. Circuit breaker enters OPEN state after 5 consecutive failures
6. Delta mode reduces requests by ~90% — prefer over full harvests
7. All scrapers must declare ethical bot User-Agent headers

## Data Sources
- VLR.gg (Valorant) — Primary source with 88,560 validated records
- HLTV (CS2) — TLS fingerprint emulation required
- Steam Web API (CS2 player counts, App ID 730)
- GRID Open Access (official CS:GO data)
- Riot Games API (official Valorant)

## Schema Reference
37-field KCRITR standard: player_id, name, team, region, role, kills,
deaths, acs, adr, kast_pct, role_adjusted_value, replacement_level,
partner_datapoint_ref, separation_flag, confidence_tier, realworld_time,
match_id, map_name, tournament, patch_version, headshot_pct, first_blood,
clutch_wins, agent, economy_rating, adjusted_kill_value, sim_rating,
rar_score, investment_grade, age, peak_age_estimate, career_stage,
data_source, extraction_timestamp, checksum_sha256, reconstruction_notes
