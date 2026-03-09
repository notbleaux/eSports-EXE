[Ver003.000]

# Free eSports Data Sources Report: Counter-Strike & Valorant

**Research Date:** March 4, 2026  
**Budget Constraint:** FREE / 0-cost only  
**Focus:** Counter-Strike 2 (CS2) & Valorant

---

## Executive Summary

| Priority | Data Source | Cost | Best For |
|----------|-------------|------|----------|
| 1 | Riot Games API (Valorant) | FREE | Official Valorant match data, player stats |
| 2 | Steam Web API | FREE | CS2 player counts, basic game stats |
| 3 | Kaggle Datasets | FREE | Historical match data for both games |
| 4 | GRID Open Access | FREE (non-commercial) | Official CS:GO/Dota2 esports data |
| 5 | HLTV Unofficial API | FREE (scraping) | CS2 match results, player statistics |

---

## 1. GRID Esports Data Platform

### Overview
GRID is an official data platform for major esports titles including League of Legends, VALORANT, Rainbow Six Siege, PUBG, CS2, and Dota 2.

### Cost
**FREE** - Open Access Program for non-commercial use

### Data Coverage (Free Tier)
- CS:GO and Dota 2 datasets available for free
- Match schedules and results
- Basic player and team statistics
- Tournament information
- For other titles (including Valorant), need to email for access

### Access Method
- API with SDK-based integration
- Apply at: https://grid.gg/get-access/
- Eligible users: Early-stage startups, students, independent developers, researchers, esports fans

### Rate Limits/Restrictions
- Non-commercial use only for free tier
- Commercial use requires paid plans (custom pricing)
- Application-based approval required

### Example Data Structure
```json
{
  "match": {
    "id": "string",
    "startTime": "ISO8601 datetime",
    "endTime": "ISO8601 datetime",
    "format": {"short": "BO3", "long": "Best of 3"},
    "status": {"preMatch": true, "live": false, "postMatch": false},
    "participants": [
      {"id": "string", "name": "Team A", "logo": "url"},
      {"id": "string", "name": "Team B", "logo": "url"}
    ],
    "event": {"id": "string", "name": "Tournament Name", "logo": "url"},
    "result": {
      "participant1Score": "2",
      "participant2Score": "1",
      "winnerId": "string"
    }
  }
}
```

### Recommendation Priority: **4/5**
**Pros:** Official data source, high data quality  
**Cons:** Limited free tier (CS:GO/Dota2 only), Valorant requires special request

---

## 2. HLTV.org (Counter-Strike)

### Overview
HLTV.org is the primary source for Counter-Strike esports data. While there's no official public API, an unofficial mobile API exists and several scraping libraries are available.

### Cost
**FREE** - Unofficial API access and web scraping

### Data Coverage
- Match schedules (upcoming and past)
- Live match scores
- Detailed player statistics (K/D, ADR, rating, etc.)
- Team rankings
- Event/tournament information
- Map results and veto information
- Player career statistics

### Access Method
**Option A: Unofficial Mobile API**
- Discovered via mobile app traffic analysis
- Returns JSON with match data
- Requires TLS fingerprint emulation (e.g., curl_cffi) to avoid 403 errors
- Endpoint pattern: Mobile-specific API routes (not publicly documented)

**Option B: Python Scraping Library**
```bash
pip install hltv-async-api
```

**Option C: Direct Web Scraping**
- BeautifulSoup + requests
- Respect robots.txt

### Rate Limits/Restrictions
- **CRITICAL:** HLTV robots.txt blocks many automated endpoints:
  - `/stats?maps*` - Blocked
  - `/results?*` - Blocked with query parameters
  - `/matches?*` - Blocked
  - `/fantasy/*` - Blocked
- Recommendation: Scrape at 1 request per 1-2 seconds maximum
- Use proper User-Agent headers
- Cache results to minimize repeated requests

### Example Data Structure (from hltv-async-api)
```python
# Match results
[
  {
    'id': '2370931',
    'team1': 'MOUZ',
    'team2': 'FaZe',
    'score1': '0',
    'score2': '2',
    'rating': 0,
    'event': 'IEM Chengdu 2024'
  }
]

# Match info with player stats
(
  '2370931',           # match ID
  '0', '2',            # scores
  'Match over',        # status
  [                    # map results
    {'mapname': 'Overpass', 'r_team1': '10', 'r_team2': '13'},
    {'mapname': 'Nuke', 'r_team1': '6', 'r_team2': '13'}
  ],
  [                    # player statistics
    {'id': '18850', 'nickname': 'Jimpphat', 'kd': '33-29', 'adr': '80.9', 'rating': '1.08'},
    # ... more players
  ]
)
```

### Recommendation Priority: **5/5** (for CS2 specifically)
**Pros:** Most comprehensive CS2 data available, completely free  
**Cons:** Unofficial API (may break), requires careful rate limiting, scraping restrictions in robots.txt

---

## 3. Riot Games API (Valorant)

### Overview
Official API from Riot Games for Valorant data. Requires developer account registration.

### Cost
**FREE** - Three tiers of API keys available

### Data Coverage
- Account information (level, name, tag, PUUID)
- Match history (via HenrikDev API - third party wrapper)
- MMR/rank history
- Stored match data

### Access Method
**Step 1:** Register at https://developer.riotgames.com/

**Step 2:** Choose API Key Type:
- **Development API Key:** Auto-granted, expires every 24 hours, for prototyping
- **Personal API Key:** For personal/small private use (bots, personal stats, research)
- **Production API Key:** For public applications (requires approval)

**Step 3:** For Valorant-specific match data, use HenrikDev API wrapper:
- Docs: https://docs.henrikdev.xyz/valorant/
- Free tier available
- Simplifies access to Valorant endpoints

### Rate Limits (Personal API Key)
- 20 requests every 1 second
- 100 requests every 2 minutes
- Limits enforced per region

### Rate Limit Headers
```
X-Rate-Limit-Type: application/method/service
X-Rate-Limit-Remaining: <count>
```

### Example Data Structure
```json
// Account endpoint
{
  "puuid": "abc123...",
  "gameName": "PlayerName",
  "tagLine": "TAG",
  "accountLevel": 150
}

// Stored matches
{
  "matches": [
    {
      "matchId": "uuid",
      "map": "Ascent",
      "mode": "Competitive",
      "score": "13-11",
      "agent": "Jett",
      "kills": 25,
      "deaths": 15,
      "assists": 8
    }
  ]
}
```

### Recommendation Priority: **1/5**
**Pros:** Official API, reliable, well-documented  
**Cons:** Limited direct Valorant match endpoints (third-party wrappers needed), restrictive rate limits for personal use

---

## 4. Steam Web API (Counter-Strike)

### Cost
**FREE** - No authentication required for basic endpoints

### Data Coverage
- Current player counts (real-time)
- Peak player counts
- Game reviews (positive/negative)
- Game metadata (genres, price, release date)
- **Note:** Does NOT provide individual player match history or detailed stats

### Access Method
```bash
# Get player count for CS2 (App ID: 730)
curl "https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=730"

# Get game schema (limited stats)
curl "https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?appid=730&key=YOUR_KEY"
```

**Popular App IDs:**
- Counter-Strike 2: `730`
- Counter-Strike: Source: `240`
- Original Counter-Strike: `10`

### Rate Limits/Restrictions
- Basic endpoints: No authentication required, reasonable rate limits
- Advanced endpoints: Require Steam API key (free registration)
- No individual player match history available
- Only aggregate player count data

### Example Data Structure
```json
{
  "response": {
    "player_count": 1418437,
    "result": 1
  }
}
```

### Output Fields (from Steam Game Stats)
| Field | Description |
|-------|-------------|
| `gameName` | Name of the Steam game |
| `appId` | Steam application ID |
| `currentPlayers` | Current number of players online |
| `peakPlayers` | Peak concurrent player count |
| `positiveReviews` | Total positive review count |
| `negativeReviews` | Total negative review count |
| `price` | Current price or "Free" |
| `genres` | Game genres |

### Recommendation Priority: **2/5**
**Pros:** Completely free, no auth needed for basic data, reliable  
**Cons:** Very limited esports-specific data (no match results, no player stats)

---

## 5. Open Data Sources (Kaggle)

### Overview
Multiple free datasets available on Kaggle for both CS2 and Valorant.

### Cost
**FREE** - Requires free Kaggle account

### Available Datasets

#### Counter-Strike 2
| Dataset | Size | Description |
|---------|------|-------------|
| CS2 HLTV Professional Match Statistics | 8 MB | Match stats scraped from HLTV |
| HLTV Match Results CS2 | Varies | Team scores, tournament info, dates |

#### Valorant
| Dataset | Size | Description |
|---------|------|-------------|
| Valorant Pro Matches (April 2021+) | 50+ MB | Scraped from vlr.gg |
| Valorant VCT Esports Data | Varies | Economy data, matches |
| Valorant Champion Tour 2021-2025 | Large | Matches, agents, players |
| Valorant Pro Matches - Full Data | Multi-table | Matches, Game, Game_Rounds, Game_Scoreboard |

### Data Coverage (Valorant Example)
```
name: player name
team: team name
agent: agent played
rating: match rating
acs: average combat score
k: kills
d: deaths
a: assists
tkmd: total kills minus deaths
kast: kill, assist, survive, trade %
adr: average damage per round
hs: headshot %
fk: first kills
fd: first deaths
fkmd: first kills minus first deaths
```

### Access Method
1. Create free Kaggle account: https://www.kaggle.com/
2. Search for "Counter-Strike 2" or "Valorant"
3. Download CSV/JSON files directly

### Rate Limits/Restrictions
- Static data only (not live)
- Update frequency varies by dataset
- Some datasets may be outdated
- License varies (check individual dataset)

### Recommendation Priority: **3/5**
**Pros:** Completely free, downloadable, good for historical analysis, no API rate limits  
**Cons:** Static data only, not real-time, data quality varies

---

## 6. Scraping Legality & robots.txt Analysis

### HLTV.org robots.txt
```
User-agent: *
Disallow: /stats?maps*
Disallow: /results?startDate*
Disallow: /results?content*
Disallow: /matches?*
Disallow: /stats?matchType*
Disallow: /fantasy/*/league/*?*
Disallow: /download/demo*
# ... many more restrictions
```

**Key Findings:**
- Query-parameterized URLs are largely blocked
- Stats pages with filters: **DISALLOWED**
- Match result pages with filters: **DISALLOWED**
- Basic match pages: **ALLOWED** (no Disallow rule)
- Sitemaps available for discovery

**Recommendation:** Scrape main match pages directly, avoid filtered/sorted views. Rate limit to 1 req/sec.

### Liquipedia robots.txt
```
User-agent: GPTBot
User-agent: ClaudeBot
User-agent: ChatGPT-User
# ... many AI bots
Disallow: /

User-agent: *
Disallow: /counterstrike/Special:*
Disallow: /counterstrike/api.php
Disallow: /valorant/Special:*
Disallow: /valorant/api.php
Disallow: /stats/
Disallow: /statistics/
```

**Key Findings:**
- **ALL major AI bots are blocked** (GPTBot, ClaudeBot, etc.)
- API endpoints: **DISALLOWED**
- Special pages (templates, queries): **DISALLOWED**
- Stats pages: **DISALLOWED**
- Content pages: **ALLOWED** with restrictions

**Recommendation:** Liquipedia is more restrictive. Content scraping may be possible but API access is blocked.

### General Scraping Best Practices
1. **Always check robots.txt first**
2. **Respect rate limits:** 1-2 requests per second for most sites
3. **Use proper User-Agent** with contact info
4. **Cache data** to avoid repeated requests
5. **Scrape responsibly:** Avoid peak hours, implement backoff on 429/503 errors
6. **Check Terms of Service** in addition to robots.txt
7. **Consider legal implications:** CFAA (US) may apply to unauthorized access

---

## 7. Additional Free Resources

### Third-Party APIs

#### HenrikDev Valorant API
- **Cost:** Free tier available
- **URL:** https://docs.henrikdev.xyz/valorant/
- **Coverage:** Account info, match history, MMR, stored matches
- **Rate Limits:** Personal limits apply (check headers)

#### PandaScore (Esports API)
- **Cost:** FREE tier - 1,000 requests/hour
- **Coverage:** Multiple games including CS, Valorant
- **URL:** https://www.pandascore.co/pricing
- **Limitation:** Basic data only (schedules, teams, players)

### Summary Table: All Free Data Sources

| Source | Game(s) | Data Type | Rate Limit | Auth Required |
|--------|---------|-----------|------------|---------------|
| Riot Games API | Valorant | Account, limited match | 20/sec, 100/2min | Yes |
| Steam Web API | CS2 | Player counts, metadata | Reasonable | No (basic) |
| HLTV (unofficial) | CS2 | Full match stats | ~1 req/sec | No |
| GRID Open Access | CS:GO/Dota2 | Official esports data | Application | Yes |
| Kaggle Datasets | Both | Historical CSV | N/A (download) | Yes (account) |
| HenrikDev API | Valorant | Match history | Varies | Yes |
| PandaScore | Both | Schedules, basic stats | 1K/hour | Yes |

---

## Recommendations by Use Case

### For Live Match Tracking
1. **HLTV** (CS2) - Best real-time data
2. **Riot API + HenrikDev** (Valorant) - Official but limited

### For Historical Analysis
1. **Kaggle Datasets** - Download bulk data
2. **GRID Open Access** - Official CS:GO data

### For Player Statistics
1. **HLTV** (CS2) - Comprehensive player stats
2. **HenrikDev API** (Valorant) - Match history and MMR

### For Research/Academic
1. **Kaggle Datasets** - Easy CSV access
2. **GRID Open Access** - High-quality official data
3. **Steam Web API** - Player count trends

---

## Important Notes

1. **All listed sources are FREE** as requested. No paid tiers required for basic access.

2. **Commercial use restrictions:** GRID Open Access and most free tiers are for non-commercial use only.

3. **Data freshness:** APIs provide real-time data; Kaggle datasets are static snapshots.

4. **Legal compliance:** Always review robots.txt and Terms of Service before scraping. robots.txt is not legally binding but violating it may result in IP bans or legal action under CFAA (US).

5. **API key management:** Rotate keys regularly, never commit keys to public repositories.

6. **Rate limiting:** Implement exponential backoff when receiving 429 (Too Many Requests) responses.

---

*Report compiled on March 4, 2026. Data sources and policies may change; always verify current terms before use.*
