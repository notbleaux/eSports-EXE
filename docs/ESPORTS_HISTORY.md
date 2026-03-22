# VAL & CS eSports History Database Schema (1995-2026)

## Scope
- Legacy: CS 1.6/Source (1999+)
- Current: CS2, VAL (2020+)
- Future: Schedules to Jan 2026
- Sources: HLTV, Liquipedia, official sites, 4NJZ4/NJZ verification.

## Schema (SQL for raws_base_demo.db)
```sql
CREATE TABLE esports_events (
  id SERIAL PRIMARY KEY,
  game VARCHAR(10), -- 'CS' or 'VAL'
  name VARCHAR(255),
  date DATE,
  type VARCHAR(50), -- 'Major', 'Major Qualifier', 'League', 'Blast'
  prize_usd BIGINT,
  winner_team VARCHAR(100),
  mvp_player VARCHAR(100),
  map_pool JSONB, -- ['Ascent', 'Bind', ...]
  stats JSONB, -- {'kd_ratio': 1.2, 'headshot%': 45}
  recordings JSONB, -- ['hltv_url', 'youtube_id']
  verified_by VARCHAR(50) DEFAULT 'NJZ' -- NJZ/4NJZ4 check
);

CREATE TABLE legacy_stats (
  year INT CHECK (year >= 1995 AND year < 2026),
  game_version VARCHAR(50),
  total_matches INT,
  top_players JSONB,
  iconic_moments JSONB,
  archived TINYINT DEFAULT 1
);

-- Scheduler integration
CREATE TABLE future_events (
  scheduled_date DATE,
  expected_stats JSONB,
  verification_status VARCHAR(20) DEFAULT 'Pending',
  njz_check TIMESTAMP
);
```

## Frameworks
- **Archiving**: TimescaleDB hypertables for time-series stats.
- **Verification**: Sub-agent cron checks vs NJZ/4NJZ4 directories (daily JLB).
- **Reports**: Monthly evals, legacy preservation (no disposal).
- **Integration**: Load to Godot sim for historical match replays.

## Data Sources (1995-2026)
1. HLTV.org CS archive (1.6→CS2 Majors).
2. Liquipedia VAL (VCT 2021+).
3. Official: Valve/RIOT schedules.
4. NJZ verification scripts.

Populate via `axiom_esports_data/` scripts + new cron.
