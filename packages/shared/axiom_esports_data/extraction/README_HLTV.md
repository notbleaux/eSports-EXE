# HLTV Client MVP Documentation

[Ver001.000]

## Overview

Basic HLTV.org async client for CS2 data pipeline, following the same pattern as the existing VLR.gg scraper.

## Files Created

```
axiom_esports_data/
├── extraction/
│   ├── src/
│   │   ├── scrapers/
│   │   │   ├── __init__.py
│   │   │   └── hltv_client.py      # Async HLTV client
│   │   └── parsers/
│   │       ├── __init__.py
│   │       └── cs_match_parser.py  # CS2 match parser
│   ├── test_hltv_mvp.py            # Test suite
│   └── __init__.py
├── config/
│   ├── cs_maps.json                # CS2 map definitions
│   └── datapoint_naming.json       # Field mappings for VLR/HLTV
```

## Quick Start

### Fetch Recent Results

```python
import asyncio
from extraction.src.scrapers.hltv_client import HLTVClient

async def main():
    async with HLTVClient() as client:
        # Fetch recent results
        results = await client.fetch_results(offset=0, limit=10)
        
        for match in results:
            print(f"{match.team_a} {match.score_a}-{match.score_b} {match.team_b}")
            print(f"  Event: {match.event_name}")

asyncio.run(main())
```

### Fetch Match Details

```python
async def get_match_details():
    async with HLTVClient() as client:
        # Fetch full match details with player stats
        details = await client.fetch_match("2379423")
        
        print(f"Match: {details.team_a} vs {details.team_b}")
        print(f"Format: {details.format}")
        
        for map_stats in details.maps:
            print(f"\n{map_stats.map_name}: {map_stats.score_a}-{map_stats.score_b}")
            for player in map_stats.player_stats:
                print(f"  {player.player_name}: {player.kills}/{player.deaths}, "
                      f"ADR: {player.adr}, Rating: {player.rating}")
```

### Parse to RawMatchData

```python
from extraction.src.parsers.cs_match_parser import CS2MatchParser

parser = CS2MatchParser()

# Convert HLTV data to standard format
raw_match = parser.parse_hltv_match(hltv_data)

# Convert to staging payload
staging_payload = parser.to_staging_payload(raw_match)
```

## Rate Limiting

The client enforces HLTV's rate limit:
- **30 requests per minute** (2 second delay between requests)
- Semaphore limited to 3 concurrent requests
- Exponential backoff retry on failures

## CS2 Role Classification

Since CS2 has no agents (unlike Valorant), roles are inferred from stats:

```python
from extraction.src.parsers.cs_match_parser import CS2RoleClassifier

classifier = CS2RoleClassifier()
role = classifier.classify_from_stats(
    player_stats,
    awp_kills=8,        # High AWP kills → AWPer
    entry_success=0.7,  # High entry success → Entry
    is_igl=True         # Known IGL → IGL
)
```

Available roles:
- `awper` - Primary AWPer
- `entry` - Entry fragger
- `support` - Support player
- `igl` - In-game leader
- `lurker` - Lurker/flanker
- `rifler` - Default rifler

## Configuration Files

### cs_maps.json

Contains CS2 map definitions:
- Active duty maps (8): Dust2, Mirage, Inferno, Nuke, Overpass, Vertigo, Ancient, Anubis
- Reserve maps (4): Train, Cache, Cobblestone, Tuscan
- Map aliases for normalization
- Match format defaults (bo1, bo3, bo5)

### datapoint_naming.json

Field mappings for data normalization:
- Match fields (VLR, HLTV, Pandascore)
- Player fields (kills, deaths, adr, kast, rating)
- Game-specific fields (CS2: fk_diff, impact; Valorant: agent, acs)
- Normalization rules for team names and map names

## Testing

Run the test suite:

```bash
cd packages/shared
python axiom_esports_data/extraction/test_hltv_mvp.py
```

Tests verify:
- Config files are valid JSON
- Parser correctly converts HLTV data
- Role classifier assigns appropriate roles
- Client can be instantiated and parse mock HTML

## Integration with Staging System

The parser outputs `RawMatchData` which can be ingested:

```python
from api.src.staging.ingest_service import StagingIngestService

ingest = StagingIngestService()

# Parse and convert to staging payload
raw_match = parser.parse_hltv_match(hltv_data)
payload = parser.to_staging_payload(raw_match)

# Ingest to staging
record = ingest.ingest(
    source_system="hltv",
    payload_type="match_result",
    payload=payload,
    ingested_by="hltv_client",
    target_project="web"
)
```

## Known Limitations (MVP)

1. **HTML Parsing Only** - Uses BeautifulSoup on HTML responses; may break if HLTV changes their markup
2. **Basic Role Detection** - Simple heuristics for role classification; not as accurate as manual assignment
3. **No JavaScript Rendering** - Cannot handle dynamically loaded content
4. **Limited Error Recovery** - Basic retry logic; may fail on unexpected page structures

## Future Enhancements

- Add GraphQL or API endpoint support if available
- Implement caching layer for match data
- Add player career statistics fetching
- Implement team roster parsing
- Add HLTV ranking data integration
- Improve role classification with ML model

## References

- [HLTV.org](https://www.hltv.org)
- `docs/AGENT_DATA_PROCESS.md` - Staging system documentation
- `docs/FIREWALL_POLICY.md` - Data partition rules
