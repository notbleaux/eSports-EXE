[Ver001.000]

# eSports-EXE — Data Architecture & Historical Data Strategy

**Date**: 2026-03-22  
**Status**: Planning  
**Scope**: CS (2012-2025) + Valorant (2020-2025) Tier 1-2 Professional Data  
**Constraint**: Zero-cost infrastructure, static hosting compatible

---

## Executive Summary

This document outlines the strategy for collecting, storing, and serving 13+ years of Counter-Strike and 5+ years of Valorant professional esports data without live API dependencies. The architecture prioritizes:

1. **Static-first delivery** (GitHub Pages compatible)
2. **Pre-computed datasets** (no runtime queries)
3. **Tiered storage** (hot JSON + cold archive)
4. **Incremental updates** (batch processing)

---

## 1. Data Source Assessment

### 1.1 Primary Sources

| Source | Game | Data Available | API/Access | Rate Limits | Reliability |
|--------|------|----------------|------------|-------------|-------------|
| **Liquipedia** | CS, Valorant | Tournaments, teams, players, matches | MediaWiki API | 200 req/min | ⭐⭐⭐⭐⭐ |
| **HLTV.org** | CS | Matches, stats, rankings | Unofficial/scraping | Aggressive blocks | ⭐⭐⭐ |
| **VLR.gg** | Valorant | Matches, stats, events | Unofficial/scraping | Moderate | ⭐⭐⭐⭐ |
| **Pandascore** | Both | Live + historical | Official API (freemium) | 1000 req/day free | ⭐⭐⭐⭐⭐ |

### 1.2 Recommended Collection Strategy

**Phase 1 (Immediate)**: Liquipedia bulk export
- MediaWiki API for structured data
- Tournament results, team rosters, match outcomes
- 2012-2025 CS:GO/CS2 major history
- 2020-2025 VCT history

**Phase 2 (Enhancement)**: Pandascore free tier
- Live match updates (1000 req/day = ~40 matches)
- Player statistics enrichment
- Event coverage gaps

**Phase 3 (Ongoing)**: Community curation
- Coach/analyst contributed data
- Manual corrections for edge cases
- Local tournament coverage

---

## 2. Data Volume Estimation

### 2.1 Counter-Strike (2012-2025)

| Metric | Estimate | Notes |
|--------|----------|-------|
| Major Tournaments | ~150 | Majors, Minors, Premier events |
| Total Matches | ~50,000 | Tier 1-2 professional |
| Unique Players | ~8,000 | Professional scene |
| Teams | ~2,000 | Including disbanded |
| **Raw Data Size** | ~500 MB | JSON, uncompressed |
| **Compressed** | ~75 MB | gzip/brotli |

### 2.2 Valorant (2020-2025)

| Metric | Estimate | Notes |
|--------|----------|-------|
| VCT Events | ~200 | International, Challengers, Game Changers |
| Total Matches | ~35,000 | Tier 1-2 |
| Unique Players | ~6,000 | Professional scene |
| Teams | ~1,500 | Including disbanded |
| **Raw Data Size** | ~350 MB | JSON, uncompressed |
| **Compressed** | ~50 MB | gzip/brotli |

### 2.3 Total Storage Requirements

| Tier | Size | Storage Solution |
|------|------|------------------|
| Hot (2023-2025) | ~100 MB | GitHub repo + CDN |
| Warm (2018-2022) | ~150 MB | GitHub LFS or Supabase |
| Cold (2012-2017) | ~275 MB | Archive branch + compressed |
| **Total** | **~525 MB** | Distributed |

---

## 3. Database Architecture Options

### 3.1 Option A: Static JSON (Recommended for MVP)

**Architecture**: Pre-generated JSON files served statically

```
public/api/v1/
├── manifest.json              # Index of all datasets
├── tournaments/
│   ├── cs/
│   │   ├── 2024.json        # Year-based chunks
│   │   ├── 2023.json
│   │   └── index.json       # Tournament list
│   └── valorant/
│       ├── 2024.json
│       └── index.json
├── teams/
│   ├── cs/
│   │   ├── index.json       # Team list
│   │   └── astralis.json    # Per-team stats
│   └── valorant/
├── players/
│   ├── cs/
│   │   ├── index.json
│   │   └── s1mple.json
│   └── valorant/
└── matches/
    ├── cs/
    │   └── 2024/
    │       └── matches.json  # Chunked by month
    └── valorant/
```

**Pros**:
- ✅ Zero backend cost (GitHub Pages compatible)
- ✅ CDN-cached globally
- ✅ Simple versioning
- ✅ No database maintenance

**Cons**:
- ❌ No runtime queries (pre-computed only)
- ❌ Large files for complex aggregations
- ❌ Update requires redeploy

**Best For**: MVP, read-heavy workloads, simple filters

---

### 3.2 Option B: Supabase PostgreSQL (Recommended for Scale)

**Architecture**: Managed PostgreSQL with REST API

**Free Tier Limits**:
- 500 MB database
- 2 GB bandwidth/month
- 100k API calls/day
- Row-level security

**Schema Design**:
```sql
-- Core tables
CREATE TABLE tournaments (
    id UUID PRIMARY KEY,
    game VARCHAR(10) CHECK (game IN ('cs', 'valorant')),
    name VARCHAR(255),
    tier INTEGER CHECK (tier IN (1, 2)),
    start_date DATE,
    end_date DATE,
    region VARCHAR(50),
    prize_pool_usd INTEGER,
    liquipedia_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE teams (
    id UUID PRIMARY KEY,
    game VARCHAR(10),
    name VARCHAR(255),
    slug VARCHAR(100) UNIQUE,
    region VARCHAR(50),
    founded_date DATE,
    disbanded_date DATE,
    liquipedia_url TEXT
);

CREATE TABLE players (
    id UUID PRIMARY KEY,
    game VARCHAR(10),
    name VARCHAR(255),
    slug VARCHAR(100),
    real_name VARCHAR(255),
    nationality VARCHAR(100),
    birth_date DATE,
    current_team_id UUID REFERENCES teams(id),
    role VARCHAR(50),
    liquipedia_url TEXT
);

CREATE TABLE matches (
    id UUID PRIMARY KEY,
    game VARCHAR(10),
    tournament_id UUID REFERENCES tournaments(id),
    team_a_id UUID REFERENCES teams(id),
    team_b_id UUID REFERENCES teams(id),
    team_a_score INTEGER,
    team_b_score INTEGER,
    winner_id UUID REFERENCES teams(id),
    match_date TIMESTAMP,
    format VARCHAR(20), -- 'bo1', 'bo3', 'bo5'
    maps_played JSONB,
    vod_url TEXT,
    liquipedia_url TEXT
);

CREATE TABLE player_stats (
    id UUID PRIMARY KEY,
    match_id UUID REFERENCES matches(id),
    player_id UUID REFERENCES players(id),
    team_id UUID REFERENCES teams(id),
    map_number INTEGER,
    kills INTEGER,
    deaths INTEGER,
    assists INTEGER,
    -- CS-specific
    headshot_percentage DECIMAL(5,2),
    adr DECIMAL(6,2),
    kast DECIMAL(5,2),
    rating DECIMAL(4,2),
    -- Valorant-specific
    agent VARCHAR(50),
    acs INTEGER,
    -- Common
    raw_stats JSONB -- Flexible storage
);
```

**Pros**:
- ✅ Complex queries (aggregations, filters)
- ✅ Real-time updates
- ✅ Relational integrity
- ✅ 500 MB fits historical data

**Cons**:
- ❌ Requires API layer
- ❌ Rate limits on free tier
- ❌ Database maintenance

**Best For**: Complex analytics, dynamic filtering, scale

---

### 3.3 Option C: Hybrid (Recommended Final Architecture)

**Architecture**: Static hot data + Supabase warm queries

```
┌─────────────────────────────────────────────┐
│           GitHub Pages (Static)             │
│  ┌─────────────┐      ┌─────────────────┐  │
│  │ Hot JSON    │      │ Pre-computed    │  │
│  │ (2023-2025) │      │ Aggregations    │  │
│  └─────────────┘      └─────────────────┘  │
└─────────────────────────────────────────────┘
                    │
                    ▼ (fallback)
┌─────────────────────────────────────────────┐
│          Supabase (PostgreSQL)              │
│  ┌─────────────┐      ┌─────────────────┐  │
│  │ Historical  │      │ Complex         │  │
│  │ (2012-2022) │      │ Queries         │  │
│  └─────────────┘      └─────────────────┘  │
└─────────────────────────────────────────────┘
```

**Implementation**:
- Recent data (2023-2025): Static JSON for speed
- Historical data (2012-2022): Supabase for deep queries
- Aggregations: Pre-computed static files
- Complex filters: Supabase API

---

## 4. Data Schema Design

### 4.1 Tournament Schema

```typescript
interface Tournament {
  id: string;                    // UUID
  game: 'cs' | 'valorant';
  name: string;                  // "PGL Major Copenhagen 2024"
  slug: string;                  // "pgl-major-copenhagen-2024"
  tier: 1 | 2;                   // 1 = Tier 1 (Majors, Masters), 2 = Tier 2
  series?: string;               // "Major", "Masters", "Challengers"
  season?: string;               // "2024", "VCT 2024"
  
  // Dates
  startDate: string;             // ISO 8601
  endDate: string;
  
  // Location
  region: string;                // "EU", "NA", "BR", "KR", "CN", "INT"
  location?: string;             // "Copenhagen, Denmark"
  
  // Metadata
  prizePoolUsd?: number;
  currency?: string;
  organizer?: string;
  
  // Stats
  teamCount: number;
  matchCount: number;
  
  // External links
  liquipediaUrl?: string;
  hltvUrl?: string;              // CS only
  vlrUrl?: string;               // Valorant only
  
  // Relationships
  teams: string[];               // Team IDs
  matches: string[];             // Match IDs
  
  // System
  createdAt: string;
  updatedAt: string;
  dataSource: 'liquipedia' | 'pandascore' | 'manual';
  dataQuality: 'complete' | 'partial' | 'estimated';
}
```

### 4.2 Team Schema

```typescript
interface Team {
  id: string;
  game: 'cs' | 'valorant';
  name: string;
  slug: string;
  
  // Identity
  region: string;
  nationality?: string;
  
  // Timeline
  foundedDate?: string;
  disbandedDate?: string;
  isActive: boolean;
  
  // Current roster (if active)
  currentRoster: TeamMember[];
  
  // Historical rosters
  rosterHistory: HistoricalRoster[];
  
  // Stats
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  
  // Achievements
  achievements: Achievement[];
  
  // External links
  liquipediaUrl?: string;
  hltvUrl?: string;
  vlrUrl?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    website?: string;
  };
}

interface TeamMember {
  playerId: string;
  name: string;
  role: 'player' | 'coach' | 'analyst' | 'manager';
  joinDate: string;
  isActive: boolean;
}

interface HistoricalRoster {
  startDate: string;
  endDate: string;
  players: string[]; // Player IDs
}

interface Achievement {
  tournamentId: string;
  tournamentName: string;
  placement: number; // 1 = 1st, 2 = 2nd, etc.
  date: string;
  prizeMoneyUsd?: number;
}
```

### 4.3 Player Schema

```typescript
interface Player {
  id: string;
  game: 'cs' | 'valorant';
  name: string;                  // In-game name
  slug: string;
  
  // Personal info
  realName?: string;
  nationality: string;
  birthDate?: string;
  
  // Current status
  currentTeamId?: string;
  currentTeamName?: string;
  role?: string;
  
  // Valorant-specific
  primaryAgent?: string;
  agentPool?: string[];
  
  // Career stats
  careerStats: CareerStats;
  
  // Match history
  matches: string[]; // Match IDs (limited to recent for size)
  
  // External links
  liquipediaUrl?: string;
  hltvUrl?: string;
  vlrUrl?: string;
  socialLinks?: {
    twitter?: string;
    twitch?: string;
    youtube?: string;
  };
}

interface CareerStats {
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  
  // CS-specific
  csStats?: {
    totalKills: number;
    totalDeaths: number;
    kdr: number;
    avgRating: number;
    avgAdr: number;
    avgKast: number;
    headshotPercentage: number;
  };
  
  // Valorant-specific
  valorantStats?: {
    totalKills: number;
    totalDeaths: number;
    kdr: number;
    avgAcs: number;
    avgAdr: number;
    firstBloods: number;
    clutches: number;
  };
}
```

### 4.4 Match Schema

```typescript
interface Match {
  id: string;
  game: 'cs' | 'valorant';
  
  // Context
  tournamentId: string;
  tournamentName: string;
  stage?: string;               // "Group Stage", "Playoffs", "Finals"
  round?: string;               // "Round of 16", "Quarterfinals"
  
  // Teams
  teamA: TeamResult;
  teamB: TeamResult;
  winnerId: string;
  
  // Schedule
  scheduledDate: string;
  startedDate?: string;
  endedDate?: string;
  status: 'scheduled' | 'live' | 'completed' | 'postponed' | 'cancelled';
  
  // Format
  format: 'bo1' | 'bo3' | 'bo5';
  maps: MapResult[];
  
  // Stats
  playerStats: PlayerMatchStats[];
  
  // Media
  vodUrl?: string;
  demoUrl?: string;
  streams?: Stream[];
  
  // External links
  liquipediaUrl?: string;
  hltvUrl?: string;
  vlrUrl?: string;
}

interface TeamResult {
  teamId: string;
  teamName: string;
  score: number;
  isWinner: boolean;
}

interface MapResult {
  mapNumber: number;
  mapName: string;
  teamAScore: number;
  teamBScore: number;
  winnerId: string;
  durationSeconds?: number;
  pickedBy?: string; // Team ID
}

interface PlayerMatchStats {
  playerId: string;
  playerName: string;
  teamId: string;
  
  // Common
  kills: number;
  deaths: number;
  assists: number;
  kdr: number;
  
  // CS-specific
  csStats?: {
    rating: number;
    adr: number;
    kast: number;
    headshotPercentage: number;
    entryKills: number;
    entryDeaths: number;
    multikills: number[]; // [1k, 2k, 3k, 4k, 5k]
    openingKills: number;
    openingDeaths: number;
    savedByTeammate: number;
    savedTeammate: number;
  };
  
  // Valorant-specific
  valorantStats?: {
    agent: string;
    acs: number;
    adr: number;
    firstBloods: number;
    firstDeaths: number;
    plants: number;
    defuses: number;
    clutchesWon: number;
    clutchesLost: number;
    multikills: number[];
    econRating: number;
  };
}

interface Stream {
  platform: 'twitch' | 'youtube' | 'hltv' | 'other';
  url: string;
  language?: string;
}
```

---

## 5. File Management & Scaffolding

### 5.1 Repository Structure

```
data/
├── raw/                          # Raw scraped data (gitignored)
│   ├── liquipedia/
│   │   ├── cs/
│   │   └── valorant/
│   └── pandascore/
├── processed/                    # Cleaned data
│   ├── tournaments/
│   ├── teams/
│   ├── players/
│   └── matches/
├── aggregations/                 # Pre-computed stats
│   ├── leaderboards/
│   ├── team-rankings/
│   └── player-trends/
└── exports/                      # Public JSON exports
    ├── v1/                       # API version 1
    │   ├── manifest.json
    │   ├── tournaments/
│   │   ├── teams/
│   │   ├── players/
│   │   └── matches/
    └── archive/                  # Yearly archives
        ├── cs-2012-2017.json.gz
        └── valorant-2020-2022.json.gz

scripts/
├── data-pipeline/
│   ├── collectors/               # Data source collectors
│   │   ├── liquipedia.py
│   │   └── pandascore.py
│   ├── cleaners/                 # Data cleaning
│   │   ├── normalize.py
│   │   └── validate.py
│   ├── generators/               # Export generators
│   │   ├── generate-manifest.py
│   │   └── generate-aggregations.py
│   └── sync.py                   # Master sync script
└── database/
    ├── migrations/
    └── seed.py

docs/
├── DATA_ARCHITECTURE.md          # This document
├── SCHEMA_REFERENCE.md           # Complete field documentation
└── DATA_COLLECTION_GUIDE.md      # How to add new data
```

### 5.2 Data Pipeline Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA PIPELINE                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   COLLECT    │───▶│    CLEAN     │───▶│   VALIDATE   │  │
│  │              │    │              │    │              │  │
│  │ • Liquipedia │    │ • Normalize  │    │ • Schema     │  │
│  │ • Pandascore │    │ • Deduplicate│    │ • Integrity  │  │
│  │ • Manual     │    │ • Enrich     │    │ • Coverage   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                              │                               │
│                              ▼                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │    MERGE     │◀───│    STORE     │───▶│   GENERATE   │  │
│  │              │    │              │    │              │  │
│  │ • Deltas     │    │ • PostgreSQL │    │ • JSON       │  │
│  │ • Conflicts  │    │ • JSON       │    │ • Manifests  │  │
│  │ • History    │    │ • Archive    │    │ • Indexes    │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                              │                               │
│                              ▼                               │
│                       ┌──────────────┐                       │
│                       │    DEPLOY    │                       │
│                       │              │                       │
│                       │ • Git commit │                       │
│                       │ • GitHub     │                       │
│                       │ • CDN purge  │                       │
│                       └──────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. User Pathing & Query Patterns

### 6.1 Primary User Flows

#### Flow 1: Discover → Tournament → Match
```
Home
  └── Tournament List (by year/region)
        └── Tournament Detail
              ├── Bracket/Schedule
              └── Match Detail
                    ├── Scoreboard
                    ├── Player Stats
                    └── VOD
```

**Data Requirements**:
- Tournament index (lightweight)
- Tournament detail with team list
- Match list with scores
- Full match stats

---

#### Flow 2: Player Search → Profile → Career
```
Search
  └── Player Profile
        ├── Current Team
        ├── Career Stats
        ├── Recent Matches
        └── Historical Teams
```

**Data Requirements**:
- Player search index
- Player detail with stats
- Match history (paginated)
- Team history

---

#### Flow 3: Team → Roster → Matches
```
Team List
  └── Team Profile
        ├── Current Roster
        ├── Recent Matches
        ├── Tournament History
        └── Head-to-Head
```

**Data Requirements**:
- Team list/index
- Team detail with roster
- Match history
- Tournament achievements

---

### 6.2 Pivot Table Schemes

#### Scheme 1: Tournament Results Matrix

```typescript
interface TournamentResultsMatrix {
  // Rows: Teams
  // Columns: Matches/Stages
  // Cells: Results
  
  tournamentId: string;
  teams: {
    teamId: string;
    teamName: string;
    matches: {
      matchId: string;
      opponentId: string;
      opponentName: string;
      result: 'win' | 'loss' | 'draw';
      score: string; // "16-14"
      mapScore: string; // "2-1"
    }[];
  }[];
}
```

**Use Case**: Bracket visualization, Swiss stage tracking

---

#### Scheme 2: Player Performance Leaderboard

```typescript
interface PlayerLeaderboard {
  game: 'cs' | 'valorant';
  metric: 'rating' | 'kdr' | 'adr' | 'acs';
  timeframe: 'all-time' | '2024' | 'last-90-days';
  filters: {
    region?: string;
    tier?: 1 | 2;
    minMatches?: number;
  };
  
  entries: {
    rank: number;
    playerId: string;
    playerName: string;
    teamName?: string;
    value: number;
    matches: number;
    trend: 'up' | 'down' | 'stable';
  }[];
}
```

**Use Case**: Stats pages, rankings, trend analysis

---

#### Scheme 3: Head-to-Head Matrix

```typescript
interface HeadToHeadMatrix {
  teamA: { id: string; name: string; };
  teamB: { id: string; name: string; };
  
  summary: {
    totalMatches: number;
    teamAWins: number;
    teamBWins: number;
    winRateA: number;
    lastMatch: string;
    currentStreak: { team: string; length: number; };
  };
  
  matches: {
    matchId: string;
    date: string;
    tournament: string;
    winner: string;
    score: string;
    format: string;
  }[];
  
  mapBreakdown: {
    mapName: string;
    played: number;
    teamAWins: number;
    teamBWins: number;
  }[];
}
```

**Use Case**: Match previews, rivalry pages, team analysis

---

#### Scheme 4: Agent/Weapon Usage Stats (Valorant)

```typescript
interface AgentUsageStats {
  timeframe: string;
  game: 'valorant';
  
  byAgent: {
    agent: string;
    picks: number;
    pickRate: number;
    wins: number;
    winRate: number;
    avgAcs: number;
    byMap: {
      map: string;
      picks: number;
      winRate: number;
    }[];
    byTier: {
      tier: 1 | 2;
      picks: number;
      winRate: number;
    }[];
  }[];
  
  byMap: {
    map: string;
    agentDistribution: { agent: string; picks: number; }[];
  }[];
}
```

**Use Case**: Meta analysis, team composition strategy

---

## 7. Implementation Roadmap

### Phase 0: Foundation (1 week)
- [ ] Set up data repository structure
- [ ] Implement Liquipedia collector
- [ ] Create base schemas
- [ ] Set up Supabase project (optional)

### Phase 1: CS Historical Data (2 weeks)
- [ ] Collect 2012-2025 Major tournaments
- [ ] Normalize team/player data
- [ ] Generate JSON exports
- [ ] Build tournament index

### Phase 2: Valorant Historical Data (2 weeks)
- [ ] Collect 2020-2025 VCT data
- [ ] Normalize agent stats
- [ ] Generate JSON exports
- [ ] Build tournament index

### Phase 3: Aggregations & API (1 week)
- [ ] Generate leaderboards
- [ ] Build pivot tables
- [ ] Create manifest/index files
- [ ] Deploy to GitHub Pages

### Phase 4: Integration (1 week)
- [ ] Connect to frontend components
- [ ] Implement search indexing
- [ ] Add caching layer
- [ ] Performance optimization

---

## 8. Cost Analysis

### Zero-Cost Stack

| Service | Use Case | Free Tier | Monthly Cost |
|---------|----------|-----------|--------------|
| **GitHub Pages** | Static hosting | 1 GB storage, 100 GB bandwidth | $0 |
| **GitHub LFS** | Large data files | 1 GB storage | $0 |
| **Supabase** | Database (optional) | 500 MB, 100k API calls/day | $0 |
| **Cloudflare** | CDN (optional) | Unlimited | $0 |
| **Total** | | | **$0** |

---

## 9. Next Steps

1. **Approve architecture** (Static JSON vs Supabase vs Hybrid)
2. **Set up data repository** structure
3. **Begin CS data collection** (2012-2025)
4. **Begin Valorant data collection** (2020-2025)
5. **Update sprint backlog** with data infrastructure tickets

---

*Document Owner*: Data Architect  
*Last Updated*: 2026-03-22
