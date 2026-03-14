# WEEK 0: FOUNDATION & INFRASTRUCTURE
## AREPO Social + OPERA Live/Betting Foundation

**Version:** [Ver001.000]  
**Duration:** 7 days  
**Goal:** Establish core infrastructure for token economy, forums, live streams, rankings, and simulator

---

## Day 1-2: Token Economy Backend

### Database Schema (PostgreSQL Component B)

```sql
-- Token system tables
CREATE TABLE user_tokens (
    user_id VARCHAR(50) PRIMARY KEY,
    balance INTEGER DEFAULT 0 NOT NULL CHECK (balance >= 0),
    total_earned INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    last_daily_claim TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE token_transactions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES user_tokens(user_id),
    amount INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('earn', 'spend', 'bet_win', 'bet_loss', 'daily_claim')),
    source VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX idx_token_transactions_created_at ON token_transactions(created_at DESC);
CREATE INDEX idx_token_transactions_type ON token_transactions(type);

-- Daily claim tracking
CREATE TABLE daily_claims (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    claim_date DATE NOT NULL DEFAULT CURRENT_DATE,
    streak_count INTEGER DEFAULT 1,
    tokens_awarded INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, claim_date)
);
```

### FastAPI Backend

```
/packages/shared/api/src/tokens/
├── __init__.py
├── token_service.py       # Core token operations
├── token_routes.py        # FastAPI endpoints
└── token_models.py        # Pydantic models
```

**Endpoints:**
- `POST /api/v1/tokens/claim-daily` — Claim daily login bonus (24h cooldown)
- `GET /api/v1/tokens/balance` — Get user balance
- `GET /api/v1/tokens/history` — Paginated transaction history
- `POST /api/v1/tokens/award` — Admin: award tokens
- `POST /api/v1/tokens/deduct` — Internal: deduct tokens
- `GET /api/v1/tokens/stats` — User token statistics

**Features:**
- Atomic balance updates
- 24-hour daily claim cooldown
- Streak bonus (consecutive days = more tokens)
- Transaction logging for audit

---

## Day 3: AREPO Forum Foundation

### Components

```
/apps/website-v2/src/hub-3-arepo/components/Forum/
├── ForumLayout.tsx          # Container with sidebar
├── ForumCategoryList.tsx    # Category browser
├── ForumThreadList.tsx      # Thread list with pagination
├── ForumThreadView.tsx      # Full thread with posts
├── ForumPost.tsx            # Individual post display
├── ForumReply.tsx           # Reply component
├── ForumEditor.tsx          # Create post/thread
└── ForumSearch.tsx          # Search threads/posts
```

**Features:**
- Categories: Getting Started, VCT Discussion, Strategy, Off-Topic
- Thread list: Title, author, replies, views, last activity
- Thread view: OP + replies, pagination
- Reply editor: Markdown support, preview
- User avatars, timestamps, reputation badges
- Real-time updates (30s polling)

**Backend:**
- `POST /api/v1/forum/categories` — List categories
- `GET /api/v1/forum/threads` — List threads (paginated)
- `GET /api/v1/forum/threads/:id` — Get thread with posts
- `POST /api/v1/forum/threads` — Create thread
- `POST /api/v1/forum/threads/:id/reply` — Reply to thread

---

## Day 4: OPERA Live Stream Foundation

### Components

```
/apps/website-v2/src/hub-4-opera/components/Live/
├── LiveStreamViewer.tsx      # Twitch/YouTube embed
├── LiveChat.tsx              # Chat UI (read-only v1)
├── LiveMatchTicker.tsx       # Score ticker bar
├── LiveEventList.tsx         # Current/upcoming matches
└── LiveStreamCard.tsx        # Stream thumbnail/card
```

**Features:**
- Embedded stream viewer (Twitch iframe, YouTube embed)
- Match ticker: Live scores, map counts, round info
- Event list: Current/upcoming from TiDB OPERA schema
- Chat UI placeholder (read-only for v1, WebSocket in Week 1)

**Stream Sources:**
- Thinking Man's Valorant (YouTube)
- Official VCT Broadcasts (Twitch)
- Configurable community casters

**Backend:**
- `GET /api/v1/opera/live-events` — Current/upcoming matches
- `GET /api/v1/opera/streams` — Active stream URLs
- `GET /api/v1/opera/matches/:id/live` — Live match data (polling)

---

## Day 5: OPERA Rankings Foundation

### Components

```
/apps/website-v2/src/hub-4-opera/components/Rankings/
├── OrganizationRankings.tsx  # Org standings
├── TeamRankings.tsx          # Team tier lists
├── PlayerRankings.tsx        # Individual leaderboards
├── RankingTable.tsx          # Reusable sortable table
├── ELOBadge.tsx              # ELO rating display
├── GradeBadge.tsx            # S/A/B/C/D/F grade
└── RankingsFilter.tsx        # Filter controls
```

**Ranking Types:**
- **Organizations**: By team performance, investment, longevity
- **Teams**: By match wins, tournament placements, tier list
- **Players**: By individual stats, ELO rating, role

**ELO System:**
- Base: 1500
- K-factor: 32 (standard)
- Volatility: Glicko-2 style adjustment
- Updates after each official match

**Grades:**
- S: Elite (top 1%)
- A: Excellent (top 5%)
- B: Good (top 15%)
- C: Average (middle 50%)
- D: Below Average (bottom 25%)
- F: Poor (bottom 5%)

**Backend:**
- `GET /api/v1/rankings/organizations` — Org rankings
- `GET /api/v1/rankings/teams` — Team rankings
- `GET /api/v1/rankings/players` — Player rankings
- `GET /api/v1/rankings/elo/:player_id` — Player ELO history

---

## Day 6: Simple Simulator UI

### Components

```
/apps/website-v2/src/hub-4-opera/components/Simulator/
├── SimulatorPanel.tsx        # Main container
├── TeamH2HCompare.tsx        # Team vs Team
├── PlayerH2HCompare.tsx      # Player vs Player
├── DuelPredictor.tsx         # Kill probability
├── WinProbabilityGauge.tsx   # Visual gauge component
├── PredictionHistory.tsx     # Past predictions
└── SimulatorSettings.tsx     # Algorithm params
```

**Algorithms (Simplified v1):**

```typescript
// Team H2H win probability
function calculateTeamWinProbability(teamA, teamB) {
  const ratingDiff = teamA.avgRating - teamB.avgRating;
  const formDiff = teamA.recentForm - teamB.recentForm;
  const rawProb = sigmoid(ratingDiff / 200 + formDiff * 0.1);
  return Math.max(0.05, Math.min(0.95, rawProb)); // Clamp 5%-95%
}

// First blood probability
function calculateFirstBloodProb(playerA, playerB) {
  const totalFBRate = playerA.fbRate + playerB.fbRate;
  return totalFBRate > 0 ? playerA.fbRate / totalFBRate : 0.5;
}

// Clutch probability
function calculateClutchProb(player, situation) {
  const baseProb = player.clutchRate;
  const difficultyMod = 1 / situation.enemiesAlive; // 1v1=1.0, 1v2=0.5, etc.
  return Math.min(0.8, baseProb * difficultyMod * situation.hpPercent);
}
```

**Features:**
- Team selection dropdowns
- Win probability gauge (visual)
- Player stat comparison
- Duel predictor (first blood, 1v1s)
- Prediction history

---

## Day 7: Integration & Polish

### Tasks

1. **Zustand Store Integration**
   - Token balance in global state
   - User profile state
   - Forum/Chat state

2. **API Connections**
   - Wire all frontend to backend
   - Error handling
   - Loading states

3. **UI Polish**
   - Responsive design pass
   - Dark theme consistency
   - Error boundaries
   - Loading skeletons

4. **Verification Checklist**
   - [ ] Token balance shows in header
   - [ ] Daily claim works (24h cooldown)
   - [ ] Forum accessible from AREPO
   - [ ] Live streams load in OPERA
   - [ ] Rankings display data
   - [ ] Simulator functional
   - [ ] All 182 tests passing
   - [ ] Build successful

---

## File Creation Summary

| Day | Category | Files | Lines Est. |
|-----|----------|-------|------------|
| 1-2 | Token Backend | 4 Python | ~800 |
| 3 | Forum Frontend | 8 TSX | ~1,200 |
| 4 | Live Stream | 5 TSX | ~800 |
| 5 | Rankings | 7 TSX | ~1,000 |
| 6 | Simulator | 7 TSX | ~900 |
| 7 | Integration | Various | ~500 |
| **Total** | | **~31 files** | **~5,200** |

---

## Success Metrics

### Functional Requirements
- [ ] Users can earn tokens (daily claim)
- [ ] Users can view token balance
- [ ] Users can browse forum categories
- [ ] Users can view forum threads
- [ ] Users can create forum replies
- [ ] Users can watch live streams
- [ ] Users can view match tickers
- [ ] Users can see rankings (org/team/player)
- [ ] Users can run team H2H comparisons
- [ ] Users can view win probabilities

### Technical Requirements
- [ ] All 182 existing tests pass
- [ ] Build completes without errors
- [ ] TypeScript strict mode passes
- [ ] API endpoints documented
- [ ] Database migrations applied

---

## Architecture Alignment

| Component | Database | Purpose |
|-----------|----------|---------|
| Token System | PostgreSQL B | User wallets, transactions |
| Forum | PostgreSQL B | Categories, threads, posts |
| Rankings | PostgreSQL B | ELO, grades, standings |
| Live Events | TiDB D | Tournament schedules, matches |
| Simulator | SATOR B | Player stats for predictions |

---

## Next Steps (Week 1-2)

After Week 0 foundation:

1. **Week 1**: Live chat (WebSocket), full betting system, fantasy league draft
2. **Week 2**: Daily challenges, VOD review, advanced simulator features
3. **Week 3**: Simulation game integration, cross-hub data flows

---

*Foundation plan ready for execution*
