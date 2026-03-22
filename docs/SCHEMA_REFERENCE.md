[Ver001.000]

# eSports-EXE — Schema Reference

**Complete field documentation for CS and Valorant historical data**

---

## Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Tournament    │────▶│     Match       │◀────│      Team       │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ name            │     │ tournament_id   │     │ name            │
│ game            │     │ team_a_id (FK)  │     │ game            │
│ tier            │     │ team_b_id (FK)  │     │ region          │
│ start_date      │     │ winner_id (FK)  │     │ founded_date    │
│ region          │     │ status          │     └─────────────────┘
└─────────────────┘     │ format          │              │
         │              │ match_date      │              │
         │              └─────────────────┘              │
         │                       │                       │
         │              ┌────────┴────────┐              │
         │              ▼                 ▼              │
         │     ┌─────────────────┐ ┌─────────────────┐   │
         │     │  PlayerMatchStats│ │   MapResult     │   │
         │     ├─────────────────┤ ├─────────────────┤   │
         └────▶│ match_id (FK)   │ │ match_id (FK)   │   │
               │ player_id (FK)  │ │ map_name        │   │
               │ team_id (FK)    │ │ team_a_score    │   │
               │ kills           │ │ team_b_score    │   │
               │ deaths          │ └─────────────────┘   │
               │ assists         │                       │
               │ [game_stats]    │                       │
               └─────────────────┘                       │
                        │                               │
                        ▼                               ▼
               ┌─────────────────┐              ┌─────────────────┐
               │     Player      │              │  TeamMember     │
               ├─────────────────┤              ├─────────────────┤
               │ id (PK)         │              │ team_id (FK)    │
               │ name            │              │ player_id (FK)  │
               │ game            │              │ role            │
               │ nationality     │              │ join_date       │
               │ current_team_id │              │ is_active       │
               └─────────────────┘              └─────────────────┘
```

---

## Core Entities

### 1. Tournament

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | UUID | ✅ | Unique identifier | `"550e8400-e29b-41d4-a716-446655440000"` |
| `game` | Enum | ✅ | Game type | `"cs"` or `"valorant"` |
| `name` | String(255) | ✅ | Full tournament name | `"PGL Major Copenhagen 2024"` |
| `slug` | String(100) | ✅ | URL-friendly identifier | `"pgl-major-copenhagen-2024"` |
| `tier` | Integer | ✅ | 1 = Tier 1, 2 = Tier 2 | `1` |
| `series` | String(50) | ❌ | Tournament series | `"Major"`, `"Masters"` |
| `season` | String(20) | ❌ | Season/year | `"2024"`, `"VCT 2024"` |
| `start_date` | Date | ✅ | Tournament start | `"2024-03-17"` |
| `end_date` | Date | ✅ | Tournament end | `"2024-03-31"` |
| `region` | String(50) | ✅ | Primary region | `"EU"`, `"NA"`, `"INT"` |
| `location` | String(255) | ❌ | Physical location | `"Copenhagen, Denmark"` |
| `prize_pool_usd` | Integer | ❌ | Prize pool in USD | `1250000` |
| `currency` | String(3) | ❌ | Prize currency | `"USD"` |
| `organizer` | String(100) | ❌ | Event organizer | `"PGL"` |
| `team_count` | Integer | ✅ | Number of teams | `24` |
| `match_count` | Integer | ✅ | Number of matches | `67` |
| `teams` | UUID[] | ✅ | Participating team IDs | `["...", "..."]` |
| `matches` | UUID[] | ✅ | Match IDs | `["...", "..."]` |
| `liquipedia_url` | URL | ❌ | Liquipedia link | `"https://liquipedia.net/..."` |
| `hltv_url` | URL | ❌ | HLTV link (CS only) | `"https://www.hltv.org/..."` |
| `vlr_url` | URL | ❌ | VLR link (Valorant only) | `"https://www.vlr.gg/..."` |
| `created_at` | Timestamp | ✅ | Record creation | `"2024-01-15T10:30:00Z"` |
| `updated_at` | Timestamp | ✅ | Last update | `"2024-03-31T22:00:00Z"` |
| `data_source` | Enum | ✅ | Origin | `"liquipedia"` |
| `data_quality` | Enum | ✅ | Completeness | `"complete"`, `"partial"` |

---

### 2. Team

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | UUID | ✅ | Unique identifier | `"..."` |
| `game` | Enum | ✅ | Game type | `"cs"` |
| `name` | String(255) | ✅ | Team name | `"Natus Vincere"` |
| `slug` | String(100) | ✅ | URL identifier | `"natus-vincere"` |
| `region` | String(50) | ✅ | Home region | `"EU"` |
| `nationality` | String(100) | ❌ | Country | `"Ukraine"` |
| `founded_date` | Date | ❌ | Creation date | `"2009-12-17"` |
| `disbanded_date` | Date | ❌ | Closure date | `null` |
| `is_active` | Boolean | ✅ | Current status | `true` |
| `current_roster` | TeamMember[] | ✅ | Active players | `[{...}, {...}]` |
| `roster_history` | HistoricalRoster[] | ✅ | Past lineups | `[{...}]` |
| `total_matches` | Integer | ✅ | Career matches | `1450` |
| `total_wins` | Integer | ✅ | Career wins | `950` |
| `total_losses` | Integer | ✅ | Career losses | `500` |
| `win_rate` | Decimal | ✅ | Win percentage | `0.655` |
| `achievements` | Achievement[] | ✅ | Tournament results | `[{...}]` |
| `liquipedia_url` | URL | ❌ | Liquipedia link | `"https://..."` |
| `hltv_url` | URL | ❌ | HLTV link | `"https://..."` |
| `vlr_url` | URL | ❌ | VLR link | `"https://..."` |
| `social_links` | Object | ❌ | Social media | `{twitter: "..."}` |

#### TeamMember Sub-Schema

| Field | Type | Description |
|-------|------|-------------|
| `player_id` | UUID | Player reference |
| `name` | String | In-game name |
| `role` | Enum | `player`, `coach`, `analyst`, `manager` |
| `join_date` | Date | When joined team |
| `is_active` | Boolean | Currently on roster |

#### Achievement Sub-Schema

| Field | Type | Description |
|-------|------|-------------|
| `tournament_id` | UUID | Tournament reference |
| `tournament_name` | String | Tournament name |
| `placement` | Integer | 1 = 1st, 2 = 2nd, etc. |
| `date` | Date | Achievement date |
| `prize_money_usd` | Integer | Prize amount |

---

### 3. Player

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | UUID | ✅ | Unique identifier | `"..."` |
| `game` | Enum | ✅ | Game type | `"valorant"` |
| `name` | String(255) | ✅ | In-game name | `"TenZ"` |
| `slug` | String(100) | ✅ | URL identifier | `"tenz"` |
| `real_name` | String(255) | ❌ | Legal name | `"Tyson Ngo"` |
| `nationality` | String(100) | ✅ | Country | `"Canada"` |
| `birth_date` | Date | ❌ | Date of birth | `"2001-05-05"` |
| `current_team_id` | UUID | ❌ | Current team | `"..."` |
| `current_team_name` | String | ❌ | Team name | `"Sentinels"` |
| `role` | String(50) | ❌ | Position | `"Duelist"` |
| `primary_agent` | String | ❌ | Main agent (Valorant) | `"Jett"` |
| `agent_pool` | String[] | ❌ | Played agents | `["Jett", "Raze"]` |
| `career_stats` | CareerStats | ✅ | Aggregated stats | `{...}` |
| `matches` | UUID[] | ❌ | Recent match IDs | `["..."]` |
| `liquipedia_url` | URL | ❌ | Liquipedia link | `"https://..."` |
| `hltv_url` | URL | ❌ | HLTV link | `"https://..."` |
| `vlr_url` | URL | ❌ | VLR link | `"https://..."` |
| `social_links` | Object | ❌ | Social media | `{twitter: "..."}` |

#### CareerStats Sub-Schema

| Field | Type | CS | Valorant | Description |
|-------|------|----|----------|-------------|
| `total_matches` | Integer | ✅ | ✅ | Career match count |
| `total_wins` | Integer | ✅ | ✅ | Career wins |
| `total_losses` | Integer | ✅ | ✅ | Career losses |
| `win_rate` | Decimal | ✅ | ✅ | Win percentage |
| **CS-Specific** |
| `total_kills` | Integer | ✅ | ❌ | Total kills |
| `total_deaths` | Integer | ✅ | ❌ | Total deaths |
| `kdr` | Decimal | ✅ | ❌ | Kill/death ratio |
| `avg_rating` | Decimal | ✅ | ❌ | HLTV rating 2.0 |
| `avg_adr` | Decimal | ✅ | ❌ | Average damage/round |
| `avg_kast` | Decimal | ✅ | ❌ | KAST percentage |
| `headshot_percentage` | Decimal | ✅ | ❌ | HS % |
| **Valorant-Specific** |
| `total_kills` | Integer | ❌ | ✅ | Total kills |
| `total_deaths` | Integer | ❌ | ✅ | Total deaths |
| `kdr` | Decimal | ❌ | ✅ | Kill/death ratio |
| `avg_acs` | Decimal | ❌ | ✅ | Average combat score |
| `avg_adr` | Decimal | ❌ | ✅ | Average damage/round |
| `first_bloods` | Integer | ❌ | ✅ | First kills |
| `clutches` | Integer | ❌ | ✅ | Clutches won |

---

### 4. Match

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | UUID | ✅ | Unique identifier | `"..."` |
| `game` | Enum | ✅ | Game type | `"cs"` |
| `tournament_id` | UUID | ✅ | Parent tournament | `"..."` |
| `tournament_name` | String | ✅ | Tournament name | `"PGL Major 2024"` |
| `stage` | String(50) | ❌ | Tournament stage | `"Playoffs"` |
| `round` | String(50) | ❌ | Specific round | `"Quarterfinals"` |
| `team_a` | TeamResult | ✅ | First team result | `{...}` |
| `team_b` | TeamResult | ✅ | Second team result | `{...}` |
| `winner_id` | UUID | ✅ | Winning team | `"..."` |
| `scheduled_date` | Timestamp | ✅ | Planned time | `"2024-03-20T15:00:00Z"` |
| `started_date` | Timestamp | ❌ | Actual start | `"2024-03-20T15:05:00Z"` |
| `ended_date` | Timestamp | ❌ | End time | `"2024-03-20T17:30:00Z"` |
| `status` | Enum | ✅ | Match state | `"completed"` |
| `format` | Enum | ✅ | Match format | `"bo3"` |
| `maps` | MapResult[] | ✅ | Map results | `[{...}]` |
| `player_stats` | PlayerMatchStats[] | ✅ | Individual stats | `[{...}]` |
| `vod_url` | URL | ❌ | Video on demand | `"https://youtube.com/..."` |
| `demo_url` | URL | ❌ | Demo file URL | `"https://...demo"` |
| `streams` | Stream[] | ❌ | Broadcast links | `[{...}]` |
| `liquipedia_url` | URL | ❌ | Liquipedia link | `"https://..."` |
| `hltv_url` | URL | ❌ | HLTV link | `"https://..."` |
| `vlr_url` | URL | ❌ | VLR link | `"https://..."` |

#### TeamResult Sub-Schema

| Field | Type | Description |
|-------|------|-------------|
| `team_id` | UUID | Team reference |
| `team_name` | String | Display name |
| `score` | Integer | Maps won |
| `is_winner` | Boolean | Won match |

#### MapResult Sub-Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `map_number` | Integer | ✅ | 1, 2, 3, etc. |
| `map_name` | String | ✅ | "Mirage", "Haven" |
| `team_a_score` | Integer | ✅ | Rounds won |
| `team_b_score` | Integer | ✅ | Rounds won |
| `winner_id` | UUID | ✅ | Map winner |
| `duration_seconds` | Integer | ❌ | Map length |
| `picked_by` | UUID | ❌ | Team that picked map |

#### Stream Sub-Schema

| Field | Type | Description |
|-------|------|-------------|
| `platform` | Enum | `twitch`, `youtube`, `hltv` |
| `url` | URL | Stream URL |
| `language` | String | ISO language code |

---

### 5. PlayerMatchStats

| Field | Type | Required | CS | Valorant | Description |
|-------|------|----------|----|----------|-------------|
| `player_id` | UUID | ✅ | ✅ | ✅ | Player reference |
| `player_name` | String | ✅ | ✅ | ✅ | Display name |
| `team_id` | UUID | ✅ | ✅ | ✅ | Team reference |
| **Common Stats** |
| `kills` | Integer | ✅ | ✅ | ✅ | Total kills |
| `deaths` | Integer | ✅ | ✅ | ✅ | Total deaths |
| `assists` | Integer | ✅ | ✅ | ✅ | Total assists |
| `kdr` | Decimal | ✅ | ✅ | ✅ | K/D ratio |
| **CS-Specific (cs_stats)** |
| `rating` | Decimal | ❌ | ✅ | ❌ | HLTV rating 2.0 |
| `adr` | Decimal | ❌ | ✅ | ❌ | Avg damage/round |
| `kast` | Decimal | ❌ | ✅ | ❌ | KAST % |
| `headshot_percentage` | Decimal | ❌ | ✅ | ❌ | HS % |
| `entry_kills` | Integer | ❌ | ✅ | ❌ | Opening kills |
| `entry_deaths` | Integer | ❌ | ✅ | ❌ | Opening deaths |
| `multikills` | Integer[] | ❌ | ✅ | ❌ | [1k, 2k, 3k, 4k, 5k] |
| `opening_kills` | Integer | ❌ | ✅ | ❌ | First kills |
| `opening_deaths` | Integer | ❌ | ✅ | ❌ | First deaths |
| **Valorant-Specific (valorant_stats)** |
| `agent` | String | ❌ | ❌ | ✅ | Agent played |
| `acs` | Integer | ❌ | ❌ | ✅ | Combat score |
| `adr` | Decimal | ❌ | ❌ | ✅ | Avg damage/round |
| `first_bloods` | Integer | ❌ | ❌ | ✅ | First kills |
| `first_deaths` | Integer | ❌ | ❌ | ✅ | First deaths |
| `plants` | Integer | ❌ | ❌ | ✅ | Spike plants |
| `defuses` | Integer | ❌ | ❌ | ✅ | Spike defuses |
| `clutches_won` | Integer | ❌ | ❌ | ✅ | Clutches won |
| `clutches_lost` | Integer | ❌ | ❌ | ✅ | Clutches lost |
| `multikills` | Integer[] | ❌ | ❌ | ✅ | [1k, 2k, 3k, 4k, 5k] |
| `econ_rating` | Decimal | ❌ | ❌ | ✅ | Economy rating |

---

## Enumerations

### Game
```typescript
type Game = 'cs' | 'valorant';
```

### Tier
```typescript
type Tier = 1 | 2;
// 1 = Tier 1 (Majors, Masters, Champions)
// 2 = Tier 2 (Challengers, Minors, qualifiers)
```

### Match Status
```typescript
type MatchStatus = 
  | 'scheduled'   // Planned, not started
  | 'live'        // Currently playing
  | 'completed'   // Finished
  | 'postponed'   // Delayed
  | 'cancelled';  // Cancelled
```

### Match Format
```typescript
type MatchFormat = 'bo1' | 'bo3' | 'bo5';
// bo1 = Best of 1
// bo3 = Best of 3
// bo5 = Best of 5
```

### Data Source
```typescript
type DataSource = 
  | 'liquipedia'   // Primary source
  | 'pandascore'   // API enrichment
  | 'hltv'         // CS-specific
  | 'vlr'          // Valorant-specific
  | 'manual';      // Curated corrections
```

### Data Quality
```typescript
type DataQuality = 
  | 'complete'    // All fields populated
  | 'partial'     // Some fields missing
  | 'estimated';  // Values interpolated
```

---

## Indexing Strategy

### Primary Keys
- All entities use UUID v4 primary keys

### Foreign Keys
- `Match.tournament_id` → `Tournament.id`
- `Match.team_a_id` → `Team.id`
- `Match.team_b_id` → `Team.id`
- `PlayerMatchStats.match_id` → `Match.id`
- `PlayerMatchStats.player_id` → `Player.id`
- `PlayerMatchStats.team_id` → `Team.id`

### Search Indexes (JSON/Static)
```typescript
// Player search index (lightweight)
interface PlayerIndex {
  id: UUID;
  name: string;
  slug: string;
  game: Game;
  current_team?: string;
  nationality: string;
}

// Tournament index
interface TournamentIndex {
  id: UUID;
  name: string;
  slug: string;
  game: Game;
  tier: Tier;
  start_date: Date;
  region: string;
}

// Team index
interface TeamIndex {
  id: UUID;
  name: string;
  slug: string;
  game: Game;
  region: string;
  is_active: boolean;
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| Ver001.000 | 2026-03-22 | Initial schema for CS and Valorant historical data |

---

*Reference*: Use with `DATA_ARCHITECTURE.md` for implementation guidance
