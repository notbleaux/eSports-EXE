[Ver001.000]

# Scout Agent S3 — Task 1: Prediction Market Architecture Design

**Agent:** S3 (Prediction Market Architect)  
**Assignment:** Betting Engine Architecture  
**Date:** 2026-03-15  
**Status:** ✅ Task 1 Complete

---

## Executive Summary

This document presents a comprehensive prediction market architecture for the Libre-X-eSport 4NJZ4 TENET Platform. The design integrates with existing OPERA tournament endpoints and the NJZ token economy to enable peer-to-peer wagering on esports matches.

### Key Design Decisions

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Odds Model** | Parimutuel (Pool-based) | No counterparty risk, automatic market making |
| **Fee Structure** | 5% House Fee | Sustainable platform economics |
| **Settlement** | Post-match automatic | Trustless payout distribution |
| **Token Integration** | NJZ tokens only | Single-currency simplicity |
| **Market Types** | Match Winner, Map Score, First Blood | Progressive complexity rollout |

---

## 1. Existing OPERA Tournament Endpoints Analysis

### 1.1 Current Endpoint Inventory

| Endpoint | Method | Auth | Purpose | Betting Relevance |
|----------|--------|------|---------|-------------------|
| `/opera/tournaments` | GET | None | List tournaments | ✅ Market discovery |
| `/opera/tournaments/{id}` | GET | None | Tournament details | ✅ Context for markets |
| `/opera/tournaments/{id}/schedule` | GET | None | Match schedule | ✅ Primary betting target |
| `/opera/patches` | GET | None | Patch versions | ⚠️ Meta analysis input |
| `/opera/circuits` | GET | None | Circuit listings | ✅ Filter markets |
| `/opera/health` | GET | None | Service health | ✅ Pre-bet validation |

### 1.2 Data Model Integration Points

```
OPERA Schedule Record (Existing)
├── tournament_id → Links to opera_tournaments
├── match_id → UNIQUE identifier for betting market
├── team_a_id / team_b_id → Betting outcomes
├── scheduled_at → Market open/close timing
├── status → Market state (scheduled=open, live=closed, completed=settled)
└── winner_team_id → Settlement resolution source
```

### 1.3 Betting-Specific Endpoints Required

```python
# New endpoints to add to opera_routes.py

@router.get("/matches/{match_id}/odds")
async def get_match_odds(match_id: str):
    """Get current odds for a match market."""
    pass

@router.post("/matches/{match_id}/bet")
async def place_bet(
    match_id: str,
    bet: BetPlacementRequest,
    current_user: TokenData = Depends(get_current_active_user)
):
    """Place a wager on a match outcome."""
    pass

@router.get("/bets/my")
async def get_my_bets(
    status: Optional[str] = Query(None),  # pending, won, lost
    current_user: TokenData = Depends(get_current_active_user)
):
    """Get user's betting history."""
    pass

@router.get("/markets/active")
async def list_active_markets(
    circuit: Optional[str] = None,
    game: str = Query("valorant")
):
    """List all open betting markets."""
    pass
```

---

## 2. Token Economy Integration Analysis

### 2.1 Existing Token System Capabilities

```python
# From token_models.py — Already supports betting transactions

class TransactionType(str, Enum):
    EARN = "earn"
    SPEND = "spend"
    BET_WIN = "bet_win"       # ✅ For payout
    BET_LOSS = "bet_loss"     # ✅ For loss record
    DAILY_CLAIM = "daily_claim"
    FANTASY_WIN = "fantasy_win"
    FANTASY_ENTRY = "fantasy_entry"
    SIMULATION_REWARD = "simulation_reward"
    COMMUNITY_REWARD = "community_reward"
```

### 2.2 Token Flow for Betting

```
User Places Bet (100 tokens on Team A)
├── 1. Deduct 100 from user_tokens.balance
├── 2. Record token_transaction:
│   ├── type: "spend"
│   ├── amount: -100
│   ├── source: "bet_placement"
│   └── description: "Wager on VCT-Match-12345"
└── 3. Create wager record in prediction_market.bets

Market Closes (Match Starts)
├── No token movement
└── Market status: "closed"

Match Completes (Team A Wins)
├── 4. Calculate winnings: 100 * (odds_at_placement)
├── 5. Apply 5% house fee: winnings * 0.95
├── 6. Credit user: balance += (winnings * 0.95)
├── 7. Record token_transaction:
│   ├── type: "bet_win"
│   ├── amount: +winnings
│   └── source: "match_id"
└── 8. Update wager status: "won"
```

### 2.3 Token Balance Validation

```python
# Pseudo-code for bet placement validation

async def validate_and_place_bet(
    user_id: str,
    match_id: str,
    amount: int,
    predicted_outcome: str
) -> BetResult:
    # 1. Check user balance
    balance = await token_service.get_balance(user_id)
    if balance < amount:
        raise InsufficientBalanceError()
    
    # 2. Validate match is open for betting
    match = await opera_client.get_match(match_id)
    if match.status != "scheduled":
        raise MarketClosedError()
    
    # 3. Check betting window (e.g., 5 min before start)
    if match.scheduled_at - now() < timedelta(minutes=5):
        raise BettingWindowClosedError()
    
    # 4. Record bet with atomic transaction
    async with db.transaction():
        await token_service.deduct(user_id, amount, "bet_placement")
        await prediction_market.place_bet(user_id, match_id, amount, predicted_outcome)
```

---

## 3. Odds Calculation Algorithm

### 3.1 Parimutuel Pool-Based Odds

**Concept:** All bets go into a common pool. After the house takes a fee, the remaining pool is distributed proportionally to winners.

### 3.2 Algorithm Pseudo-Code

```python
class ParimutuelOddsEngine:
    """
    Parimutuel odds calculation for esports prediction markets.
    Supports multiple outcomes per market.
    """
    
    HOUSE_FEE_PERCENT = 5.0  # 5% platform fee
    
    def __init__(self, market_id: str):
        self.market_id = market_id
        self.pools: Dict[str, int] = {}  # outcome -> total tokens
        self.total_pool = 0
    
    def place_wager(self, outcome: str, amount: int) -> float:
        """
        Record a wager and return the current implied odds.
        
        Args:
            outcome: The predicted outcome (e.g., "team_a_win")
            amount: Token amount wagered
            
        Returns:
            Current decimal odds for that outcome
        """
        # Add to outcome pool
        if outcome not in self.pools:
            self.pools[outcome] = 0
        self.pools[outcome] += amount
        self.total_pool += amount
        
        # Return current odds
        return self.calculate_odds(outcome)
    
    def calculate_odds(self, outcome: str) -> float:
        """
        Calculate decimal odds for an outcome.
        
        Formula: (Total Pool * (1 - House Fee)) / Outcome Pool
        
        Returns:
            Decimal odds (e.g., 2.5 means 1:1.5 payout)
        """
        if outcome not in self.pools or self.pools[outcome] == 0:
            return 1.0  # No bets, even money
        
        outcome_pool = self.pools[outcome]
        net_pool = self.total_pool * (1 - self.HOUSE_FEE_PERCENT / 100)
        
        odds = net_pool / outcome_pool
        return round(odds, 2)
    
    def calculate_payout(self, outcome: str, wager_amount: int) -> int:
        """
        Calculate potential payout for a wager.
        
        Returns:
            Total payout (stake + winnings)
        """
        odds = self.calculate_odds(outcome)
        return int(wager_amount * odds)
    
    def settle_market(self, winning_outcome: str) -> List[Payout]:
        """
        Settle the market and calculate all payouts.
        
        Returns:
            List of payouts to distribute
        """
        if winning_outcome not in self.pools:
            raise InvalidOutcomeError()
        
        winning_pool = self.pools[winning_outcome]
        net_pool = self.total_pool * (1 - self.HOUSE_FEE_PERCENT / 100)
        
        payouts = []
        for bet in self.get_bets_for_outcome(winning_outcome):
            # Proportional share of net pool
            share = bet.amount / winning_pool
            payout_amount = int(net_pool * share)
            
            payouts.append(Payout(
                user_id=bet.user_id,
                amount=payout_amount,
                original_bet=bet.amount,
                profit=payout_amount - bet.amount
            ))
        
        return payouts
    
    def get_all_odds(self) -> Dict[str, float]:
        """Get current odds for all outcomes."""
        return {
            outcome: self.calculate_odds(outcome)
            for outcome in self.pools.keys()
        }
```

### 3.3 Odds Calculation Example

```
Match: Team A vs Team B

Bets Placed:
├── User 1: 100 tokens on Team A
├── User 2: 200 tokens on Team A  
├── User 3: 150 tokens on Team B
└── User 4: 50 tokens on Draw

Pool State:
├── Team A Pool: 300 tokens
├── Team B Pool: 150 tokens
├── Draw Pool: 50 tokens
└── Total Pool: 500 tokens

Odds Calculation (5% house fee):
├── Team A Odds: (500 * 0.95) / 300 = 1.58
├── Team B Odds: (500 * 0.95) / 150 = 3.17
└── Draw Odds: (500 * 0.95) / 50 = 9.50

Payout Example (User 1 bet 100 on Team A, Team A wins):
├── Net Pool: 500 * 0.95 = 475 tokens
├── User 1 Share: 100 / 300 = 33.33%
├── User 1 Payout: 475 * 0.3333 = 158 tokens
└── User 1 Profit: 158 - 100 = 58 tokens (58% ROI)

Platform Revenue: 500 * 0.05 = 25 tokens
```

### 3.4 Dynamic Odds Updates

```python
# Real-time odds streaming via WebSocket

@router.websocket("/ws/markets/{match_id}/odds")
async def odds_stream(websocket: WebSocket, match_id: str):
    await websocket.accept()
    
    engine = ParimutuelOddsEngine(match_id)
    
    try:
        while True:
            # Send current odds every 5 seconds
            odds = engine.get_all_odds()
            await websocket.send_json({
                "match_id": match_id,
                "odds": odds,
                "total_pool": engine.total_pool,
                "timestamp": datetime.utcnow().isoformat()
            })
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        await websocket.close()
```

---

## 4. Database Schema for Wagers

### 4.1 Schema Design (PostgreSQL)

```sql
-- [Ver001.000]
-- Prediction Market Database Schema
-- Extends existing OPERA and Token Economy systems

-- ============================================================================
-- TABLE 1: prediction_markets
-- Purpose: Market definition for each bettable match/event
-- ============================================================================
CREATE TABLE IF NOT EXISTS prediction_markets (
    market_id           SERIAL PRIMARY KEY,
    match_id            VARCHAR(50) NOT NULL UNIQUE,
                        -- References: opera_schedules.match_id
    
    market_type         VARCHAR(30) NOT NULL DEFAULT 'match_winner',
                        -- 'match_winner', 'map_score', 'first_blood', 'over_under'
    
    status              VARCHAR(20) NOT NULL DEFAULT 'open',
                        -- 'open', 'closed', 'settled', 'cancelled', 'suspended'
    
    outcomes            JSONB NOT NULL,
                        -- ["team_a_win", "team_b_win", "draw"]
    
    winning_outcome     VARCHAR(50),
                        -- Set when status = 'settled'
    
    house_fee_percent   DECIMAL(4,2) NOT NULL DEFAULT 5.00,
                        -- Platform fee (default 5%)
    
    min_bet_amount      INTEGER NOT NULL DEFAULT 10,
                        -- Minimum wager in tokens
    
    max_bet_amount      INTEGER NOT NULL DEFAULT 10000,
                        -- Maximum wager in tokens
    
    total_pool          INTEGER NOT NULL DEFAULT 0,
                        -- Sum of all bets
    
    total_volume        INTEGER NOT NULL DEFAULT 0,
                        -- Historical betting volume
    
    opens_at            TIMESTAMP,
                        -- When market opens for betting
    
    closes_at           TIMESTAMP,
                        -- When market closes (match start time)
    
    settled_at          TIMESTAMP,
                        -- When market was settled
    
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_house_fee CHECK (house_fee_percent >= 0 AND house_fee_percent <= 20),
    CONSTRAINT chk_bet_limits CHECK (min_bet_amount > 0 AND max_bet_amount >= min_bet_amount),
    
    -- Indexes
    INDEX idx_markets_status (status),
    INDEX idx_markets_match (match_id),
    INDEX idx_markets_closes (closes_at),
    INDEX idx_markets_created (created_at DESC)
);

COMMENT ON TABLE prediction_markets IS 'Betting market definitions linked to OPERA matches';

-- ============================================================================
-- TABLE 2: prediction_bets
-- Purpose: Individual wager records
-- ============================================================================
CREATE TABLE IF NOT EXISTS prediction_bets (
    bet_id              SERIAL PRIMARY KEY,
    
    market_id           INTEGER NOT NULL REFERENCES prediction_markets(market_id),
    
    user_id             VARCHAR(50) NOT NULL,
                        -- References: user_tokens.user_id
    
    outcome             VARCHAR(50) NOT NULL,
                        -- The predicted outcome (e.g., "team_a_win")
    
    amount              INTEGER NOT NULL CHECK (amount > 0),
                        -- Tokens wagered
    
    odds_at_placement   DECIMAL(6,2) NOT NULL,
                        -- Decimal odds at time of bet
    
    potential_payout    INTEGER NOT NULL,
                        -- Calculated: amount * odds_at_placement
    
    status              VARCHAR(20) NOT NULL DEFAULT 'pending',
                        -- 'pending', 'won', 'lost', 'cancelled', 'refunded'
    
    actual_payout       INTEGER,
                        -- Final payout amount (null until settled)
    
    profit_loss         INTEGER,
                        -- actual_payout - amount (null until settled)
    
    placed_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    settled_at          TIMESTAMP,
    
    -- Transaction reference for audit trail
    transaction_id      INTEGER REFERENCES token_transactions(id),
    
    -- Indexes
    INDEX idx_bets_market (market_id),
    INDEX idx_bets_user (user_id),
    INDEX idx_bets_status (status),
    INDEX idx_bets_placed (placed_at DESC),
    INDEX idx_bets_user_status (user_id, status),
    UNIQUE(market_id, user_id, placed_at)  -- Prevent duplicate bets
);

COMMENT ON TABLE prediction_bets IS 'Individual wager records with full audit trail';

-- ============================================================================
-- TABLE 3: prediction_outcome_pools
-- Purpose: Track token pools per outcome for odds calculation
-- ============================================================================
CREATE TABLE IF NOT EXISTS prediction_outcome_pools (
    pool_id             SERIAL PRIMARY KEY,
    
    market_id           INTEGER NOT NULL REFERENCES prediction_markets(market_id),
    
    outcome             VARCHAR(50) NOT NULL,
                        -- e.g., "team_a_win"
    
    total_amount        INTEGER NOT NULL DEFAULT 0,
                        -- Sum of all bets on this outcome
    
    bet_count           INTEGER NOT NULL DEFAULT 0,
                        -- Number of bets on this outcome
    
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(market_id, outcome),
    
    -- Indexes
    INDEX idx_pools_market (market_id)
);

COMMENT ON TABLE prediction_outcome_pools IS 'Running totals per outcome for real-time odds';

-- ============================================================================
-- TABLE 4: prediction_market_odds_history
-- Purpose: Track odds changes over time (analytics)
-- ============================================================================
CREATE TABLE IF NOT EXISTS prediction_market_odds_history (
    history_id          BIGSERIAL PRIMARY KEY,
    
    market_id           INTEGER NOT NULL REFERENCES prediction_markets(market_id),
    
    outcome             VARCHAR(50) NOT NULL,
    
    odds                DECIMAL(6,2) NOT NULL,
                        -- Decimal odds at this point in time
    
    pool_total          INTEGER NOT NULL,
                        -- Total market pool at this point
    
    outcome_pool        INTEGER NOT NULL,
                        -- Pool for this outcome at this point
    
    recorded_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_odds_history_market (market_id),
    INDEX idx_odds_history_time (recorded_at)
);

COMMENT ON TABLE prediction_market_odds_history IS 'Time-series odds data for analytics';

-- ============================================================================
-- TABLE 5: user_prediction_stats
-- Purpose: User betting statistics (materialized view alternative)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_prediction_stats (
    user_id             VARCHAR(50) PRIMARY KEY REFERENCES user_tokens(user_id),
    
    total_bets          INTEGER DEFAULT 0,
    won_bets            INTEGER DEFAULT 0,
    lost_bets           INTEGER DEFAULT 0,
    
    total_wagered       INTEGER DEFAULT 0,
    total_won           INTEGER DEFAULT 0,
    total_lost          INTEGER DEFAULT 0,
    net_profit_loss     INTEGER DEFAULT 0,
    
    win_rate            DECIMAL(5,2) DEFAULT 0.00,
                        -- Percentage (e.g., 65.50 = 65.5%)
    
    avg_odds_taken      DECIMAL(6,2) DEFAULT 0.00,
    
    best_win            INTEGER DEFAULT 0,
    worst_loss          INTEGER DEFAULT 0,
    
    current_streak      INTEGER DEFAULT 0,
                        -- Positive = win streak, Negative = loss streak
    
    longest_win_streak  INTEGER DEFAULT 0,
    longest_loss_streak INTEGER DEFAULT 0,
    
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_stats_win_rate (win_rate DESC),
    INDEX idx_stats_profit (net_profit_loss DESC)
);

COMMENT ON TABLE user_prediction_stats IS 'Aggregated betting statistics per user';

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_prediction_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DROP TRIGGER IF EXISTS update_markets_updated_at ON prediction_markets;
CREATE TRIGGER update_markets_updated_at
    BEFORE UPDATE ON prediction_markets
    FOR EACH ROW EXECUTE FUNCTION update_prediction_updated_at();

-- Function to update outcome pools on new bet
CREATE OR REPLACE FUNCTION update_outcome_pool()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO prediction_outcome_pools (market_id, outcome, total_amount, bet_count)
    VALUES (NEW.market_id, NEW.outcome, NEW.amount, 1)
    ON CONFLICT (market_id, outcome)
    DO UPDATE SET
        total_amount = prediction_outcome_pools.total_amount + NEW.amount,
        bet_count = prediction_outcome_pools.bet_count + 1,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Update market total pool
    UPDATE prediction_markets
    SET total_pool = total_pool + NEW.amount,
        total_volume = total_volume + NEW.amount,
        updated_at = CURRENT_TIMESTAMP
    WHERE market_id = NEW.market_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_pool_on_bet ON prediction_bets;
CREATE TRIGGER trg_update_pool_on_bet
    AFTER INSERT ON prediction_bets
    FOR EACH ROW EXECUTE FUNCTION update_outcome_pool();

-- Function to record odds history
CREATE OR REPLACE FUNCTION record_odds_history()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO prediction_market_odds_history (
        market_id, outcome, odds, pool_total, outcome_pool
    )
    SELECT 
        NEW.market_id,
        NEW.outcome,
        (SELECT total_pool * (1 - house_fee_percent/100) / NEW.total_amount 
         FROM prediction_markets WHERE market_id = NEW.market_id),
        (SELECT total_pool FROM prediction_markets WHERE market_id = NEW.market_id),
        NEW.total_amount;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update user stats on bet settlement
CREATE OR REPLACE FUNCTION update_user_prediction_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'won' THEN
        INSERT INTO user_prediction_stats (user_id, total_bets, won_bets, total_wagered, total_won, net_profit_loss)
        VALUES (NEW.user_id, 1, 1, NEW.amount, NEW.actual_payout, NEW.profit_loss)
        ON CONFLICT (user_id)
        DO UPDATE SET
            total_bets = user_prediction_stats.total_bets + 1,
            won_bets = user_prediction_stats.won_bets + 1,
            total_wagered = user_prediction_stats.total_wagered + NEW.amount,
            total_won = user_prediction_stats.total_won + NEW.actual_payout,
            net_profit_loss = user_prediction_stats.net_profit_loss + NEW.profit_loss,
            win_rate = (user_prediction_stats.won_bets + 1.0) / (user_prediction_stats.total_bets + 1) * 100,
            current_streak = CASE 
                WHEN user_prediction_stats.current_streak >= 0 
                THEN user_prediction_stats.current_streak + 1
                ELSE 1
            END,
            longest_win_streak = GREATEST(
                user_prediction_stats.longest_win_streak,
                CASE WHEN user_prediction_stats.current_streak >= 0 
                     THEN user_prediction_stats.current_streak + 1
                     ELSE 1
                END
            ),
            updated_at = CURRENT_TIMESTAMP;
    ELSIF NEW.status = 'lost' THEN
        INSERT INTO user_prediction_stats (user_id, total_bets, lost_bets, total_wagered, total_lost, net_profit_loss)
        VALUES (NEW.user_id, 1, 1, NEW.amount, NEW.amount, -NEW.amount)
        ON CONFLICT (user_id)
        DO UPDATE SET
            total_bets = user_prediction_stats.total_bets + 1,
            lost_bets = user_prediction_stats.lost_bets + 1,
            total_wagered = user_prediction_stats.total_wagered + NEW.amount,
            total_lost = user_prediction_stats.total_lost + NEW.amount,
            net_profit_loss = user_prediction_stats.net_profit_loss - NEW.amount,
            win_rate = user_prediction_stats.won_bets::DECIMAL / (user_prediction_stats.total_bets + 1) * 100,
            current_streak = CASE 
                WHEN user_prediction_stats.current_streak <= 0 
                THEN user_prediction_stats.current_streak - 1
                ELSE -1
            END,
            longest_loss_streak = GREATEST(
                user_prediction_stats.longest_loss_streak,
                ABS(CASE WHEN user_prediction_stats.current_streak <= 0 
                     THEN user_prediction_stats.current_streak - 1
                     ELSE -1
                END)
            ),
            updated_at = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_stats_on_settle ON prediction_bets;
CREATE TRIGGER trg_update_stats_on_settle
    AFTER UPDATE OF status ON prediction_bets
    FOR EACH ROW
    WHEN (OLD.status = 'pending' AND NEW.status IN ('won', 'lost'))
    EXECUTE FUNCTION update_user_prediction_stats();
```

### 4.2 Entity Relationship Diagram

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│   OPERA Schedules   │     │  Prediction Markets  │     │   Token Economy     │
│   (TiDB / OPERA)    │     │    (PostgreSQL)      │     │   (PostgreSQL)      │
├─────────────────────┤     ├──────────────────────┤     ├─────────────────────┤
│ match_id (PK)       │◄────┤ match_id (FK)        │     │ user_id (PK)        │
│ tournament_id       │     │ market_id (PK)       │     │ balance             │
│ team_a_id           │     │ status               │     │ total_earned        │
│ team_b_id           │     │ outcomes[]           │     │ total_spent         │
│ winner_team_id      │────►│ winning_outcome      │     └─────────────────────┘
│ scheduled_at        │     │ total_pool           │              ▲
│ status              │     │ house_fee_percent    │              │
└─────────────────────┘     └──────────────────────┘              │
            ▲                           │                         │
            │                           │                         │
            │                    ┌──────▼─────────────────────────┘
            │                    │
            │           ┌────────┴───────────────┐
            │           │   Prediction Bets      │
            │           ├────────────────────────┤
            │           │ bet_id (PK)            │
            └───────────┤ market_id (FK)         │
                        │ user_id (FK)           │
                        │ outcome                │
                        │ amount                 │
                        │ odds_at_placement      │
                        │ status                 │
                        │ actual_payout          │
                        │ transaction_id (FK) ───┼──► token_transactions
                        └────────────────────────┘
```

---

## 5. Integration Plan with Existing Tokens

### 5.1 Component Integration Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     PREDICTION MARKET INTEGRATION                           │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         API LAYER                                   │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │ OPERA Routes │  │ Token Routes │  │ Prediction   │  (NEW)       │   │
│  │  │  (existing)  │  │  (existing)  │  │   Routes     │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      SERVICE LAYER                                  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │ TiDB Client  │  │Token Service │  │ Prediction   │  (NEW)       │   │
│  │  │  (existing)  │  │  (existing)  │  │   Service    │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      DATABASE LAYER                                 │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │ OPERA Schema │  │ Token Schema │  │ Prediction   │  (NEW)       │   │
│  │  │  (TiDB - D)  │  │(PostgreSQL)  │  │   Schema     │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 File Structure for New Components

```
packages/shared/api/src/
├── tokens/                     # ✅ Existing
│   ├── token_routes.py
│   ├── token_service.py
│   └── token_models.py
├── opera/                      # ✅ Existing
│   ├── opera_routes.py         # ← Add betting endpoints
│   └── tidb_client.py
└── prediction/                 # 🆕 NEW MODULE
    ├── __init__.py
    ├── prediction_routes.py    # Betting API endpoints
    ├── prediction_service.py   # Business logic
    ├── prediction_models.py    # Pydantic schemas
    ├── odds_engine.py          # Parimutuel algorithm
    └── settlement_service.py   # Post-match settlement

packages/shared/api/migrations/
├── 013_token_system.sql        # ✅ Existing
└── 014_prediction_market.sql   # 🆕 NEW MIGRATION
```

### 5.3 Implementation Phases

#### Phase 1: Core Infrastructure (Week 1)
- [ ] Create `prediction/` module structure
- [ ] Implement database schema (Migration 014)
- [ ] Build `ParimutuelOddsEngine` class
- [ ] Create Pydantic models for betting

#### Phase 2: API Integration (Week 2)
- [ ] Add betting endpoints to OPERA routes
- [ ] Implement bet placement with token validation
- [ ] Build odds streaming WebSocket
- [ ] Add user betting history endpoint

#### Phase 3: Settlement System (Week 3)
- [ ] Build automated settlement service
- [ ] Integrate with match result webhooks
- [ ] Implement payout distribution
- [ ] Add transaction logging

#### Phase 4: UI Integration (Week 4)
- [ ] Build betting interface in OPERA hub
- [ ] Add odds display components
- [ ] Create bet slip workflow
- [ ] Add betting history view

---

## 6. Risk Mitigation

### 6.1 Identified Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Oracle Problem** | High | Use official match results from OPERA; manual admin override for disputes |
| **Low Liquidity** | Medium | Start with popular matches only; seed initial markets with house bets |
| **Arbitrage Attacks** | Medium | Odds lock 5 min before match; no same-user opposing bets |
| **Regulatory** | High | Implement geo-blocking; clear T&C; age verification |
| **Smart Contract Bugs** | High | Extensive testing; phased rollout; circuit breakers |

### 6.2 Circuit Breaker Design

```python
class BettingCircuitBreaker:
    """Emergency controls for betting system."""
    
    EMERGENCY_MODES = {
        "NORMAL": "normal_operations",
        "SUSPEND_NEW": "no_new_bets",      # Allow settlements only
        "SUSPEND_ALL": "all_bets_paused",  # Emergency stop
        "REFUND_MODE": "auto_refund_all"   # Return all stakes
    }
    
    def check_circuit(self, market_id: str) -> bool:
        """Returns True if betting is allowed."""
        mode = self.get_emergency_mode()
        if mode == "SUSPEND_ALL":
            return False
        if mode == "SUSPEND_NEW":
            return False
        return True
```

---

## 7. Summary

### Architecture Deliverables

1. ✅ **OPERA Endpoint Review** — Identified 6 existing endpoints for integration, proposed 4 new betting-specific endpoints

2. ✅ **Token Economy Analysis** — Confirmed `BET_WIN`/`BET_LOSS` transaction types exist; designed complete token flow for wagering lifecycle

3. ✅ **Odds Algorithm** — Designed parimutuel pool-based system with 5% house fee, pseudo-code implementation, and dynamic odds calculation

4. ✅ **Database Schema** — Created comprehensive 5-table schema with triggers, indexes, and user statistics tracking

5. ✅ **Integration Plan** — 4-phase implementation roadmap with file structure and component mapping

### Next Steps

- **S3 → S1 Trade:** Ready to receive S1's OPERA endpoint findings for cross-review
- **Implementation:** Pending scout team consensus
- **Foreman Review:** Architecture ready for approval

---

**Scout Agent S3 — Task 1 Complete**

*"S3 Task 1 complete, ready for trade"*
