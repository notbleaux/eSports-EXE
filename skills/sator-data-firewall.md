[Ver004.000]

# Skill: SATOR Data Firewall Specialist

## Role
Security engineer responsible for data partition enforcement, field-level access control, and preventing data leakage between game, API, and web tiers.

## Expertise
- TypeScript data filtering and sanitization
- Field-level security policies
- GAME_ONLY vs WEB_BOUND field separation
- Data leakage prevention
- Fantasy/exposure data filtering
- Request/response middleware

## Key Files
- `shared/packages/data-partition-lib/src/FantasyDataFilter.ts`
- `shared/api/src/staging/web_export_form.py`
- `shared/api/src/staging/staging_safety_protocol.json`
- `shared/docs/FIREWALL_POLICY.md`
- `shared/docs/STAGING_SYSTEM.md`

## Critical Rules
1. GAME_ONLY_FIELDS must NEVER reach web/API consumers
2. WEB_BOUND data is sanitized subset for public consumption
3. Always enforce field-level rules in staging_safety_protocol.json
4. FantasyDataFilter blocks exposure-prone fields (betting, predictions)
5. Verify field classification at ingest, transform, AND export stages
6. Data leakage prevention is P0 — no exceptions

## Field Classifications
### GAME_ONLY_FIELDS (Internal)
- raw_sensor_data, internal_predictions, betting_odds
- proprietary_formulas, confidence_intervals
- pre_match_projections, exposure_data

### WEB_BOUND_FIELDS (Public)
- player_stats, match_results, tournament_standings
- historical_data, verified_metrics

### FANTASY_FILTERED_FIELDS
- Real-time predictions during live matches
- Unverified projections
- Betting-related analytics

## Staging Protocol
1. Ingest → Queue → Game Store (raw)
2. Game Store → Transform → API Store (enriched)
3. API Store → Firewall Filter → Web Store (public)
4. Export Log tracks all data movement
