[Ver001.000]
# VLR.gg Integration Analysis & Recommendations

## Executive Summary

**Current State:** VLR scraping infrastructure extracts 14 basic fields but stores in a 37-field KCRITR schema, leaving 23 fields underutilized or empty.

**Impact:** Missing derived metrics (RAR, SimRating, Investment Grade) that differentiate SATOR from raw stat aggregators.

**Recommendation:** Implement 3-phase enhancement pipeline to populate derived fields and expose via SATOR API.

---

## 1. VLR Metrics Extraction Audit

### 1.1 Currently Extracted (vlr_resilient_client.py)

| VLR Field | Canonical Name | Status | Usage |
|-----------|---------------|--------|-------|
| player | name | ✅ Active | Player identifier |
| team | team | ✅ Active | Team affiliation |
| agent | agent | ✅ Active | Character played |
| rating | role_adjusted_value | ⚠️ Misused | VLR's internal rating, not RAR |
| acs | acs | ✅ Active | Average Combat Score |
| kills | kills | ✅ Active | Kill count |
| deaths | deaths | ✅ Active | Death count |
| assists | - | ❌ Ignored | Available but discarded |
| kast | kast_pct | ✅ Active | KAST percentage |
| adr | adr | ✅ Active | Average Damage/Round |
| hs_pct | headshot_pct | ✅ Active | Headshot % |
| first_blood | first_blood | ✅ Active | First blood count |
| clutch_win | clutch_wins | ✅ Active | Clutches won |
| clutch_attempt | - | ❌ Ignored | Available but discarded |

### 1.2 VLR Metrics Available But Not Extracted

Via deeper HTML parsing (vm-stats-game tables):

| VLR Element | Data Available | Priority |
|-------------|----------------|----------|
| .mod-rounds | Round-by-round scores | HIGH |
| .mod-economy | Team economy per round | HIGH |
| .mod-spike | Plants/defuses | MEDIUM |
| .mod-ability | Ability usage stats | LOW |
| .mod-weapon | Weapon breakdown | MEDIUM |
| .mod-multikill | 2k/3k/4k/ace counts | MEDIUM |
| .mod-trade | Trade kill stats | MEDIUM |
| .mod-entry | Entry frag stats | HIGH |
| data-side | Attack/defense rounds | HIGH |

### 1.3 VLR Web Service Formulas (Reverse-Engineered)

```
# ACS (Average Combat Score)
ACS = (Total Combat Score) / (Rounds Played)
VLR Source: Scoreboard totals

# Rating (VLR's internal)
VLR Rating appears to be: (Kills * 1.0 + Assists * 0.5 - Deaths * 0.5 + First Bloods * 1.0) / Rounds
Normalized to ~1.0 baseline
Note: This is NOT the same as SATOR's role_adjusted_value

# KAST
KAST% = (Rounds with Kill + Assist + Survive + Trade) / Total Rounds * 100
VLR Source: Round-by-round tracking

# ADR
ADR = Total Damage / Rounds Played
VLR Source: Damage totals

# Headshot %
HS% = Headshot Kills / Total Kills * 100
VLR Source: Kill type tracking
```

---

## 2. Gap Analysis: VLR → KCRITR Schema

### 2.1 Populated Fields (14/37 = 38%)

```sql
-- Direct mappings from VLR
player_id, name, team, agent
kills, deaths, acs, adr, kast_pct
headshot_pct, first_blood, clutch_wins
match_id, map_name, tournament, patch_version, realworld_time
data_source, extraction_timestamp, checksum_sha256
```

### 2.2 Empty Fields Requiring Derivation (13/37 = 35%)

| Empty Field | Derivation Source | Complexity |
|-------------|-------------------|------------|
| region | team lookup table | LOW |
| role | agent + position inference | MEDIUM |
| role_adjusted_value | RAR calculation | HIGH |
| replacement_level | Global position averages | HIGH |
| rar_score | RAV / RL | HIGH |
| investment_grade | RAR score thresholds | MEDIUM |
| economy_rating | Round economy analysis | HIGH |
| adjusted_kill_value | Economy-adjusted kills | HIGH |
| sim_rating | SimRating algorithm | HIGH |
| age | External API (VLR profile) | MEDIUM |
| peak_age_estimate | Career trajectory analysis | HIGH |
| career_stage | Age + performance curve | MEDIUM |
| confidence_tier | Data quality scoring | MEDIUM |

### 2.3 Fields Requiring New Extraction (10/37 = 27%)

| Field | New Data Required | VLR Source |
|-------|-------------------|------------|
| assists | Parse from scoreboard | .mod-stat (index 4) |
| separation_flag | Manual reconstruction flag | N/A |
| partner_datapoint_ref | Reconstruction linkage | N/A |
| reconstruction_notes | Manual entry | N/A |
| record_id | Auto-generated | N/A |

---

## 3. Category & Meta Type Analysis

### 3.1 SATOR Stat Categories

```
IDENTITY (5 fields)
├── player_id: UUID (canonical)
├── name: Display handle
├── team: Current team tag
├── region: Geographic region (EMEA, Americas, Pacific, China)
└── role: Combat role (Entry, IGL, Controller, Initiator, Sentinel)

PERFORMANCE_CORE (5 fields)
├── kills: Raw kill count
├── deaths: Raw death count
├── acs: Combat score (Riot formula)
├── adr: Damage per round
└── kast_pct: Participation metric

RAR_ANALYTICS (4 fields)
├── role_adjusted_value: Position-normalized performance
├── replacement_level: Average player at position
├── rar_score: RAV / RL (comparative metric)
└── investment_grade: A+ to D rating

EXTENDED_STATS (10 fields)
├── headshot_pct: Precision metric
├── first_blood: Opening kill count
├── clutch_wins: High-pressure performance
├── agent: Character played
├── economy_rating: Efficiency metric
├── adjusted_kill_value: Economy-context kills
├── sim_rating: Composite score (0-10)
├── age: Player age
├── peak_age_estimate: Career trajectory
└── career_stage: rising/peak/declining

MATCH_CONTEXT (5 fields)
├── match_id: Source match identifier
├── map_name: Played map
├── tournament: Competition name
├── patch_version: Game version
└── realworld_time: Match timestamp

PROVENANCE (8 fields)
├── data_source: Origin (vlr_gg, liquipedia, etc.)
├── extraction_timestamp: When scraped
├── checksum_sha256: Content verification
├── confidence_tier: Data quality (0-100)
├── separation_flag: Raw vs reconstructed
├── partner_datapoint_ref: Duplicate linkage
├── reconstruction_notes: Manual annotations
└── record_id: Auto-generated PK
```

### 3.2 Integration Points

```
┌─────────────────────────────────────────────────────────────┐
│  VLR.gg Website                                              │
│  ├── HTML Scoreboards (extracted)                           │
│  ├── Match Pages (extracted)                                │
│  └── Player Profiles (not extracted - API opportunity)      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Extraction Pipeline                                         │
│  ├── vlr_resilient_client.py (HTML fetch)                   │
│  ├── match_parser.py (HTML → RawMatchData)                  │
│  ├── field_translator.py (VLR → Canonical)                  │
│  └── extraction_bridge.py (deduplication)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  KCRITR Schema (37 fields)                                   │
│  ├── Raw fields: 14 (populated from VLR)                    │
│  ├── Derived fields: 13 (need calculation)                  │
│  └── Metadata fields: 10 (provenance + auto)                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  SATOR API                                                   │
│  ├── /sator/stats (aggregated platform stats)               │
│  ├── /sator/players (player listings)                       │
│  ├── /sator/players/{id} (detailed stats)                   │
│  └── /ws/sator (real-time updates)                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Recommended Adaptations & Implementations

### 4.1 Phase 1: Data Completeness (Week 1)

**Task 1.1: Fix VLR Field Extraction**

Update `match_parser.py` to extract missing fields:

```python
# Add to MatchParser._extract_players()
stat_columns = ["rating", "acs", "kills", "deaths", "assists",  # Added assists
                "kast", "adr", "hs_pct", "first_blood", 
                "clutch_win", "clutch_attempt"]  # Added clutch_attempt
```

**Task 1.2: Team Region Mapping**

Create `team_region_mapping.json`:

```json
{
  "SEN": {"region": "Americas", "full_name": "Sentinels"},
  "FNC": {"region": "EMEA", "full_name": "Fnatic"},
  "PRX": {"region": "Pacific", "full_name": "Paper Rex"},
  "EDG": {"region": "China", "full_name": "Edward Gaming"}
}
```

**Task 1.3: Role Inference from Agent**

```python
AGENT_ROLE_MAP = {
    "jett": "Duelist", "phoenix": "Duelist", "reyna": "Duelist",
    "raze": "Duelist", "yoru": "Duelist", "neon": "Duelist",
    "iso": "Duelist", "waylay": "Duelist",
    
    "sage": "Sentinel", "cypher": "Sentinel", "killjoy": "Sentinel",
    "chamber": "Sentinel", "deadlock": "Sentinel", "vyse": "Sentinel",
    
    "brimstone": "Controller", "omen": "Controller", "viper": "Controller",
    "astra": "Controller", "harbor": "Controller", "clove": "Controller",
    
    "sova": "Initiator", "breach": "Initiator", "skye": "Initiator",
    "kayo": "Initiator", "fade": "Initiator", "gekko": "Initiator",
    "tejo": "Initiator"
}
```

### 4.2 Phase 2: Derived Metrics Calculation (Week 2)

**Task 2.1: SimRating Calculation Service**

```python
# sator/simrating_calculator.py
class SimRatingCalculator:
    """
    Calculates SimRating from raw VLR stats.
    
    Formula (Simplified):
    SimRating = (
        (ACS / 300) * 0.35 +
        (KAST% / 100) * 0.25 +
        (ADR / 150) * 0.20 +
        (HS% / 100) * 0.10 +
        (First Bloods / 10) * 0.10
    ) * 10  # Scale to 0-10
    """
    
    def calculate(self, player_stats: dict) -> float:
        acs_component = (player_stats.get('acs', 0) / 300) * 0.35
        kast_component = (player_stats.get('kast_pct', 0) / 100) * 0.25
        adr_component = (player_stats.get('adr', 0) / 150) * 0.20
        hs_component = (player_stats.get('headshot_pct', 0) / 100) * 0.10
        fb_component = (player_stats.get('first_blood', 0) / 10) * 0.10
        
        return round((acs_component + kast_component + adr_component + 
                      hs_component + fb_component) * 10, 3)
```

**Task 2.2: RAR (Role Adjusted Rating) Calculation**

```python
# sator/rar_calculator.py
class RARCalculator:
    """
    Role Adjusted Rating calculation.
    
    RAR compares player performance to replacement-level player at their role.
    """
    
    async def calculate_for_player(self, player_id: str, pool: asyncpg.Pool):
        async with pool.acquire() as conn:
            # Get player stats
            player = await conn.fetchrow("""
                SELECT role, AVG(acs) as avg_acs, AVG(kast_pct) as avg_kast
                FROM player_performance
                WHERE player_id = $1
                GROUP BY role
            """, player_id)
            
            # Get replacement level (average at role)
            replacement = await conn.fetchrow("""
                SELECT AVG(acs) as avg_acs, AVG(kast_pct) as avg_kast
                FROM player_performance
                WHERE role = $1
                GROUP BY role
            """, player['role'])
            
            # Calculate RAR
            role_adjusted_value = player['avg_acs'] * (player['avg_kast'] / 100)
            replacement_level = replacement['avg_acs'] * (replacement['avg_kast'] / 100)
            rar_score = role_adjusted_value / replacement_level if replacement_level > 0 else 1.0
            
            # Determine investment grade
            investment_grade = self._grade_from_rar(rar_score)
            
            return {
                'role_adjusted_value': role_adjusted_value,
                'replacement_level': replacement_level,
                'rar_score': rar_score,
                'investment_grade': investment_grade
            }
    
    def _grade_from_rar(self, rar: float) -> str:
        if rar >= 1.5: return "A+"
        if rar >= 1.3: return "A"
        if rar >= 1.1: return "B"
        if rar >= 0.9: return "C"
        return "D"
```

**Task 2.3: Economy Rating Calculation**

```python
# sator/economy_calculator.py
class EconomyCalculator:
    """
    Calculates economy-adjusted performance metrics.
    
    Economy Rating = (Damage dealt) / (Credits spent on weapons)
    Adjusted Kill Value = Kill importance weighted by round economy
    """
    
    def calculate_economy_rating(self, damage: int, loadout_cost: int) -> float:
        """Damage efficiency per credit spent."""
        return round(damage / max(loadout_cost, 1), 2)
    
    def calculate_adjusted_kill_value(self, 
                                      kills: int, 
                                      eco_rounds: int, 
                                      full_buy_rounds: int) -> float:
        """
        Kills in eco rounds weighted higher than full-buy rounds.
        """
        eco_weight = 1.5
        full_buy_weight = 1.0
        
        total_rounds = eco_rounds + full_buy_rounds
        if total_rounds == 0:
            return 0.0
        
        eco_ratio = eco_rounds / total_rounds
        avg_weight = (eco_ratio * eco_weight) + ((1 - eco_ratio) * full_buy_weight)
        
        return round(kills * avg_weight, 2)
```

### 4.3 Phase 3: SATOR API Integration (Week 3)

**Task 3.1: Enriched Player Endpoint**

Update `/api/sator/players/{id}` to include derived metrics:

```json
{
  "player_id": "uuid",
  "name": "TenZ",
  "team": "SEN",
  "region": "Americas",
  "role": "Duelist",
  
  // Raw stats from VLR
  "acs": 285.5,
  "kast_pct": 78.5,
  "adr": 185.2,
  "headshot_pct": 32.1,
  
  // Derived metrics (new)
  "sim_rating": 8.45,
  "rar_score": 1.35,
  "investment_grade": "A",
  "economy_rating": 1.85,
  "adjusted_kill_value": 245.5,
  "career_stage": "peak",
  
  // Trend analysis (new)
  "rating_trend": "rising",
  "form_rating": 8.67,
  "recent_matches": [...]
}
```

**Task 3.2: Leaderboard by Metric Type**

Add query parameter to `/api/sator/players/top`:

```
GET /api/sator/players/top?metric=sim_rating&limit=10
GET /api/sator/players/top?metric=rar_score&limit=10
GET /api/sator/players/top?metric=acs&limit=10
```

**Task 3.3: Materialized Views for Performance**

```sql
-- Create materialized view for top players by SimRating
CREATE MATERIALIZED VIEW mv_top_players_simrating AS
SELECT 
    player_id, name, team, region, role,
    AVG(acs) as avg_acs,
    AVG(kast_pct) as avg_kast,
    AVG(adr) as avg_adr,
    AVG(sim_rating) as avg_sim_rating,
    AVG(rar_score) as avg_rar,
    COUNT(*) as matches_played
FROM player_performance
WHERE sim_rating IS NOT NULL
GROUP BY player_id, name, team, region, role
HAVING COUNT(*) >= 10
ORDER BY avg_sim_rating DESC;

-- Index for fast lookup
CREATE INDEX idx_mv_top_simrating ON mv_top_players_simrating(avg_sim_rating DESC);

-- Refresh every hour
-- Add to cron: REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_players_simrating;
```

### 4.4 Phase 4: VLR Deep Data Extraction (Week 4)

**Task 4.1: Round-Level Data Extraction**

Create new parser for round-by-round data:

```python
# parsers/round_parser.py
class RoundParser:
    """
    Extracts round-level data from VLR match pages.
    
    Available in VLR HTML:
    - Round score (e.g., "1-0")
    - Win type (elimination, spike explode, time, defuse)
    - Team economy (credits)
    - Player loadouts (weapon + shield)
    - Side (attack/defense)
    """
    
    def parse_rounds(self, html: str) -> list[dict]:
        soup = BeautifulSoup(html, "lxml")
        rounds = []
        
        for round_row in soup.find_all(class_="round"):
            round_data = {
                "round_number": self._extract_round_number(round_row),
                "score": self._extract_score(round_row),
                "win_type": self._extract_win_type(round_row),
                "team_a_economy": self._extract_economy(round_row, team="a"),
                "team_b_economy": self._extract_economy(round_row, team="b"),
                "side_won": self._extract_side(round_row),
            }
            rounds.append(round_data)
        
        return rounds
```

**Task 4.2: New Database Table for Round Data**

```sql
-- Migration 019_round_level_data.sql
CREATE TABLE IF NOT EXISTS round_performance (
    id SERIAL PRIMARY KEY,
    match_id VARCHAR(50) NOT NULL,
    map_name VARCHAR(50),
    round_number SMALLINT NOT NULL,
    
    -- Round outcome
    winning_team VARCHAR(100),
    win_type VARCHAR(50), -- elimination, explode, defuse, time
    
    -- Economy context
    team_a_credits SMALLINT,
    team_b_credits SMALLINT,
    team_a_loadout_value SMALLINT,
    team_b_loadout_value SMALLINT,
    
    -- Side info
    team_a_side VARCHAR(10), -- attack, defense
    team_b_side VARCHAR(10),
    
    -- Spike
    spike_planted BOOLEAN DEFAULT FALSE,
    spike_planted_by VARCHAR(100),
    spike_defused BOOLEAN DEFAULT FALSE,
    spike_defused_by VARCHAR(100),
    
    -- Timestamps
    round_duration_seconds SMALLINT,
    realworld_time TIMESTAMPTZ,
    
    FOREIGN KEY (match_id, map_name) REFERENCES player_performance(match_id, map_name)
);

CREATE INDEX idx_round_performance_match ON round_performance(match_id, map_name);
```

---

## 5. Implementation Priority Matrix

| Task | Impact | Effort | Priority | Timeline |
|------|--------|--------|----------|----------|
| Fix assists extraction | HIGH | LOW | P0 | Day 1 |
| Team region mapping | HIGH | LOW | P0 | Day 1 |
| Role inference | HIGH | LOW | P0 | Day 2 |
| SimRating calc | HIGH | MEDIUM | P1 | Week 1 |
| RAR calc | HIGH | HIGH | P1 | Week 2 |
| Materialized views | HIGH | LOW | P1 | Week 2 |
| Economy metrics | MEDIUM | HIGH | P2 | Week 3 |
| Round-level data | HIGH | HIGH | P2 | Week 4 |
| Age/peak estimation | MEDIUM | MEDIUM | P3 | Week 4 |
| VLR profile scraping | MEDIUM | MEDIUM | P3 | Week 4 |

---

## 6. Success Metrics

After implementation:

```sql
-- Target: 90% of records have SimRating
SELECT 
    COUNT(*) as total_records,
    COUNT(sim_rating) as with_simrating,
    ROUND(COUNT(sim_rating) * 100.0 / COUNT(*), 2) as coverage_pct
FROM player_performance;
-- Target: coverage_pct >= 90%

-- Target: RAR scores populated
SELECT 
    COUNT(*) as total_players,
    COUNT(rar_score) as with_rar
FROM (
    SELECT DISTINCT player_id, rar_score
    FROM player_performance
) subquery;
-- Target: with_rar >= 1000 players

-- Target: API response time < 100ms for top players
EXPLAIN ANALYZE
SELECT * FROM mv_top_players_simrating LIMIT 10;
-- Target: Execution time < 100ms
```

---

## 7. Next Steps

1. **Immediate (Today):**
   - Add `assists` extraction to `match_parser.py`
   - Create `team_region_mapping.json`
   - Implement `AGENT_ROLE_MAP`

2. **This Week:**
   - Build `SimRatingCalculator`
   - Update SATOR API to include derived fields
   - Create materialized view for top players

3. **Next Week:**
   - Build `RARCalculator`
   - Implement economy metrics
   - Add database migration for round-level data

4. **Future:**
   - VLR profile scraping for age data
   - Career trajectory analysis
   - Predictive modeling
