[Ver001.000]

# Scout Agent S2 — Task 2: Cross-Review of S3's Prediction Market Architecture

**Agent:** S2 (Token Economy & Security Reviewer)  
**Assignment:** Cross-review S3's Prediction Market Architecture against existing Token Economy  
**Date:** 2026-03-15  
**Status:** ✅ Task 2 Complete

---

## Executive Summary

**VERDICT:** S3's prediction market architecture is **compatible** with the existing Token Economy with **minor modifications**. The existing `TokenService` can support S3's betting design, but there are gaps in atomic transaction handling, race condition protection, and security controls that must be addressed before implementation.

### Key Findings

| Aspect | Status | Notes |
|--------|--------|-------|
| TokenService Compatibility | ✅ Compatible | `deduct_tokens()` and `award_tokens()` support betting flows |
| Database Schema | ⚠️ Needs Refinement | Good foundation but missing constraints and FK relationships |
| Atomic Transactions | ❌ Gap Identified | S3's design lacks distributed transaction handling |
| Race Condition Protection | ⚠️ Partial | `FOR UPDATE` missing in key paths |
| Security Controls | ❌ Gaps Identified | Missing circuit breaker integration, rate limiting |
| Fantasy System Precedent | ✅ Validated | Similar pattern already working in production |

---

## 1. TokenService Compatibility Analysis

### 1.1 Existing TokenService Capabilities

The current `TokenService` in `packages/shared/api/src/tokens/token_service.py` already supports betting transactions:

```python
# From token_models.py - TransactionType enum
class TransactionType(str, Enum):
    EARN = "earn"
    SPEND = "spend"
    BET_WIN = "bet_win"       # ✅ Already exists for S3's use case
    BET_LOSS = "bet_loss"     # ✅ Already exists for S3's use case
    DAILY_CLAIM = "daily_claim"
    FANTASY_WIN = "fantasy_win"
    FANTASY_ENTRY = "fantasy_entry"  # Similar to betting entry
    SIMULATION_REWARD = "simulation_reward"
    COMMUNITY_REWARD = "community_reward"
```

### 1.2 Required TokenService Methods for Betting

**✅ EXISTING - `deduct_tokens()` for Bet Placement:**
```python
async def deduct_tokens(
    self, request: TokenDeductRequest, 
    tx_type: TransactionType = TransactionType.SPEND
) -> Tuple[bool, TokenBalance, str]:
    """Deduct tokens from a user."""
    # Uses FOR UPDATE locking for balance consistency
    # Returns success/failure with updated balance
```

**✅ EXISTING - `award_tokens()` for Payouts:**
```python
async def award_tokens(
    self, request: TokenAwardRequest, 
    tx_type: TransactionType = TransactionType.EARN
) -> TokenBalance:
    """Award tokens to a user."""
    # Can use TransactionType.BET_WIN for betting payouts
```

### 1.3 Fantasy System Precedent (Proof of Concept)

The existing Fantasy system in `packages/shared/api/src/fantasy/fantasy_service.py` already implements token wagering using the same TokenService:

```python
# Lines 160-171: Fantasy entry fee deduction
if league['entry_fee_tokens'] > 0 and self.token_service:
    from ..tokens.token_models import TokenDeductRequest
    deduct_req = TokenDeductRequest(
        user_id=owner_id,
        amount=league['entry_fee_tokens'],
        source='fantasy_entry',
        description=f"Entry fee for {league['name']}"
    )
    success, _, msg = await self.token_service.deduct_tokens(deduct_req)
    if not success:
        raise ValueError(f"Insufficient tokens: {msg}")
```

**Key Insight:** The Fantasy system demonstrates that TokenService can handle wagering flows. S3's prediction market can follow the same pattern.

### 1.4 TokenService Enhancement Required

**Gap Identified:** The existing TokenService lacks a method for **atomic bet placement** that coordinates with the prediction market tables.

**Recommended Enhancement:**
```python
# Add to TokenService class
async def place_bet_with_escrow(
    self,
    user_id: str,
    market_id: int,
    amount: int,
    outcome: str,
    prediction_service: 'PredictionService'  # Circular import handling needed
) -> Tuple[bool, str, Optional[int]]:
    """
    Atomically deduct tokens and place bet in prediction market.
    
    Returns:
        (success, message, bet_id)
    """
    async with self.db.acquire() as conn:
        async with conn.transaction():
            # 1. Lock user balance
            row = await conn.fetchrow(
                "SELECT balance FROM user_tokens WHERE user_id = $1 FOR UPDATE",
                user_id
            )
            
            if not row or row['balance'] < amount:
                return False, "Insufficient balance", None
            
            # 2. Deduct tokens (existing method logic)
            new_balance = row['balance'] - amount
            await conn.execute(
                """UPDATE user_tokens 
                   SET balance = $1, total_spent = total_spent + $2, updated_at = $3
                   WHERE user_id = $4""",
                new_balance, amount, datetime.utcnow(), user_id
            )
            
            # 3. Record transaction
            await conn.execute(
                """INSERT INTO token_transactions 
                   (user_id, amount, type, source, description, balance_after)
                   VALUES ($1, $2, $3, $4, $5, $6)""",
                user_id, -amount, TransactionType.SPEND, 'bet_placement',
                f"Wager on market {market_id}", new_balance
            )
            
            # 4. Create bet record via prediction_service
            bet_id = await prediction_service._create_bet_internal(
                conn, user_id, market_id, amount, outcome
            )
            
            return True, "Bet placed successfully", bet_id
```

---

## 2. Database Schema Assessment

### 2.1 Schema Compatibility Matrix

| S3 Table | Existing Reference | Compatibility | Issues |
|----------|-------------------|---------------|--------|
| `prediction_markets` | `opera_schedules` (TiDB) | ⚠️ Partial | Cross-database FK not possible |
| `prediction_bets` | `user_tokens` | ✅ Compatible | Needs `ON DELETE CASCADE` |
| `prediction_bets` | `token_transactions` | ⚠️ Missing | No FK to transaction record |
| `prediction_outcome_pools` | `prediction_markets` | ✅ Compatible | Good design |
| `user_prediction_stats` | `user_tokens` | ⚠️ Partial | Consider materialized view |

### 2.2 Critical Schema Issues

#### Issue 1: Cross-Database Foreign Key (OPERA ↔ Prediction Markets)

**Problem:** `prediction_markets.match_id` references `opera_schedules` which is in **TiDB**, while prediction tables are in **PostgreSQL**.

**S3's Design:**
```sql
CREATE TABLE IF NOT EXISTS prediction_markets (
    market_id SERIAL PRIMARY KEY,
    match_id VARCHAR(50) NOT NULL UNIQUE,
    -- References: opera_schedules.match_id (TiDB - DIFFERENT DATABASE!)
```

**Assessment:** This is an architectural reality, not a bug. The NJZ platform uses:
- **TiDB/OPERA** for tournament data (external source)
- **PostgreSQL** for platform data (tokens, betting)

**Recommendation:** Soft reference with validation:
```sql
-- Add validation trigger
CREATE OR REPLACE FUNCTION validate_match_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Cannot do FK to TiDB; document as soft reference
    -- Application layer must validate match exists in OPERA
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON COLUMN prediction_markets.match_id IS 
    'Soft reference to opera_schedules.match_id in TiDB. Validate at application layer.';
```

#### Issue 2: Missing Transaction Reference in prediction_bets

**Problem:** S3's schema has `transaction_id` FK but it's not populated atomically.

**Current S3 Schema:**
```sql
CREATE TABLE IF NOT EXISTS prediction_bets (
    bet_id SERIAL PRIMARY KEY,
    -- ... fields ...
    transaction_id INTEGER REFERENCES token_transactions(id),  -- Nullable!
```

**Gap:** The transaction_id is populated after the fact, not atomically during bet placement.

**Recommended Fix:**
```sql
-- Make transaction_id NOT NULL to enforce audit trail
ALTER TABLE prediction_bets 
    ALTER COLUMN transaction_id SET NOT NULL;

-- Add bet_reference to token_transactions for bi-directional lookup
ALTER TABLE token_transactions 
    ADD COLUMN bet_id INTEGER REFERENCES prediction_bets(bet_id);
```

#### Issue 3: Constraint Naming Collisions

**Problem:** S3 uses generic trigger names that may conflict with existing triggers.

**S3's Triggers:**
```sql
CREATE TRIGGER update_markets_updated_at  -- May conflict
CREATE TRIGGER trg_update_pool_on_bet     -- Better naming
```

**Existing Token Triggers:**
```sql
-- From 013_token_system.sql
CREATE TRIGGER update_user_tokens_updated_at  -- Different table, safe
```

**Assessment:** Safe for now, but recommend more specific naming:
```sql
-- Recommended naming convention
CREATE TRIGGER trg_prediction_markets_updated_at
CREATE TRIGGER trg_prediction_bets_update_pool
CREATE TRIGGER trg_prediction_bets_settle_stats
```

### 2.3 Recommended Schema Enhancements

```sql
-- ============================================================================
-- ENHANCEMENTS FOR S3 SCHEMA
-- ============================================================================

-- 1. Add escrow state to user_tokens for pending bets
ALTER TABLE user_tokens 
    ADD COLUMN escrow_balance INTEGER DEFAULT 0 CHECK (escrow_balance >= 0);

COMMENT ON COLUMN user_tokens.escrow_balance IS 
    'Tokens locked in pending/pending bets';

-- 2. Add composite index for common query patterns
CREATE INDEX idx_prediction_bets_user_market 
    ON prediction_bets(user_id, market_id);

-- 3. Add market settlement tracking
ALTER TABLE prediction_markets
    ADD COLUMN settled_by VARCHAR(50),  -- Admin or system ID
    ADD COLUMN settlement_source VARCHAR(50);  -- 'opera_api', 'manual', 'system'

-- 4. Add audit fields for compliance
ALTER TABLE prediction_bets
    ADD COLUMN ip_address INET,
    ADD COLUMN user_agent TEXT;
```

---

## 3. Gaps in Token Economy for Betting Support

### 3.1 Missing: Escrow/Reserved Balance Tracking

**Current State:** `user_tokens` only tracks `balance`.  
**Gap:** No distinction between available balance and locked (bet) balance.

**Impact:** User could bet more than they have across multiple simultaneous bets.

**Example Race Condition:**
```
Time T1: User has 100 tokens
Time T2: Bet A checks balance (100 >= 50) ✓
Time T3: Bet B checks balance (100 >= 60) ✓  -- Race condition!
Time T4: Bet A deducts 50, balance = 50
Time T5: Bet B deducts 60, balance = -10  -- Negative balance!
```

**Solution:** Add escrow tracking:
```python
# Enhanced balance check
async def get_available_balance(self, user_id: str) -> int:
    """Get balance minus locked escrow."""
    row = await conn.fetchrow(
        "SELECT balance, escrow_balance FROM user_tokens WHERE user_id = $1",
        user_id
    )
    return row['balance'] - row['escrow_balance']
```

### 3.2 Missing: Batch Settlement Support

**Current State:** `award_tokens()` handles single awards.  
**Gap:** No efficient batch payout for market settlement.

**Solution:** Add batch settlement method:
```python
async def batch_award_winners(
    self, 
    payouts: List[Tuple[str, int, str]]  # (user_id, amount, bet_id)
) -> Dict[str, Any]:
    """Award multiple winners in a single transaction."""
    async with self.db.acquire() as conn:
        async with conn.transaction():
            results = []
            for user_id, amount, bet_id in payouts:
                # Batch update logic
                pass
```

### 3.3 Missing: Transaction Reversal Capability

**Current State:** No way to reverse a bet if market is cancelled.  
**Gap:** S3's `REFUND_MODE` requires token service support.

**Solution:** Add refund method:
```python
async def refund_bet(
    self,
    user_id: str,
    amount: int,
    bet_id: int,
    reason: str
) -> TokenBalance:
    """Refund a cancelled bet."""
    request = TokenAwardRequest(
        user_id=user_id,
        amount=amount,
        source='bet_refund',
        description=f"Refund for cancelled bet {bet_id}: {reason}",
        admin_id='system'
    )
    return await self.award_tokens(request, TransactionType.BET_WIN)
```

### 3.4 Missing: Circuit Breaker Integration

**Current State:** Circuit breaker exists (`packages/shared/api/circuit_breaker.py`) but not integrated with TokenService.

**Gap:** S3's `BettingCircuitBreaker` needs to coordinate with token operations.

**Existing Circuit Breaker:**
```python
# From circuit_breaker.py
class CircuitBreaker:
    """Circuit breaker pattern for external service resilience."""
    # ... implementation
```

**Recommendation:** Create betting-specific circuit breaker:
```python
class BettingCircuitBreaker:
    """Emergency controls for betting system."""
    
    EMERGENCY_MODES = {
        "NORMAL": "normal_operations",
        "SUSPEND_NEW": "no_new_bets",
        "SUSPEND_ALL": "all_bets_paused",
        "REFUND_MODE": "auto_refund_all"
    }
    
    async def can_place_bet(self, user_id: str, amount: int) -> Tuple[bool, str]:
        """Check if betting is allowed at system level."""
        mode = await self.get_emergency_mode()
        if mode == "SUSPEND_ALL":
            return False, "Betting temporarily suspended"
        if mode == "SUSPEND_NEW":
            return False, "New bets not accepted"
        return True, "OK"
```

---

## 4. Security Considerations for Wager Handling

### 4.1 Race Condition Vulnerabilities

#### Vulnerability: Double-Spending via Concurrent Bets

**Attack Vector:**
```python
# Attacker places two bets simultaneously
async def exploit():
    await asyncio.gather(
        place_bet(user_id, market_a, 100),  # Check: 100 >= 100 ✓
        place_bet(user_id, market_b, 100),  # Check: 100 >= 100 ✓ (same time!)
    )
    # Both pass check, both deduct, balance goes negative
```

**S3's Current Protection:**
```python
# S3 uses FOR UPDATE in pseudo-code
async with db.transaction():
    balance = await conn.fetchrow(
        "SELECT balance FROM user_tokens WHERE user_id = $1 FOR UPDATE",
        user_id
    )
```

**Assessment:** ✅ Good - `FOR UPDATE` row lock prevents concurrent modifications.

**Gap:** The lock must be held for the entire transaction including bet recording:
```python
# Correct pattern
async with conn.transaction():
    # Lock acquired
    balance = await conn.fetchrow("... FOR UPDATE", user_id)
    
    # All operations must happen before lock released
    await deduct_tokens(conn, user_id, amount)
    await create_bet_record(conn, user_id, market_id, amount)
    # Lock released on transaction commit
```

### 4.2 Odds Manipulation Attack

#### Vulnerability: Flash Loan-Style Odds Manipulation

**Attack Vector:**
```
1. Match has small pool: Team A (100), Team B (100)
2. Attacker bets 10,000 on Team B (odds: 200/10100 = 1.98)
3. Attacker gets others to bet on Team A (pool grows)
4. If Team B wins, attacker gets huge payout
```

**S3's Protection:**
```python
HOUSE_FEE_PERCENT = 5.0  # Reduces profitability
```

**Gap:** No maximum bet limits relative to pool size.

**Recommendation:** Add pool ratio limits:
```python
MAX_BET_POOL_RATIO = 0.25  # Max 25% of total pool

async def validate_bet_amount(market_id: int, amount: int):
    pool = await get_total_pool(market_id)
    if amount > pool * MAX_BET_POOL_RATIO:
        raise BetTooLargeError(f"Max bet: {pool * MAX_BET_POOL_RATIO}")
```

### 4.3 Oracle Attack (Match Result Manipulation)

#### Vulnerability: Compromised Match Data Source

**Risk:** If OPERA data is compromised, wrong payouts occur.

**S3's Protection:**
- Uses official OPERA match results
- Manual admin override for disputes

**Gap:** No multi-source validation.

**Recommendation:** Add result confirmation:
```python
class SettlementOracle:
    """Multi-source match result validation."""
    
    async def get_confirmed_result(self, match_id: str) -> Optional[str]:
        # Check multiple sources
        opera_result = await self.opera_client.get_result(match_id)
        pandascore_result = await self.pandascore_client.get_result(match_id)
        
        if opera_result == pandascore_result:
            return opera_result
        
        # Dispute - require manual resolution
        await self.flag_for_manual_review(match_id, opera_result, pandascore_result)
        return None
```

### 4.4 Rate Limiting Gaps

**Gap:** No per-user rate limiting on bet placement.

**Attack Vector:** Bot placing thousands of micro-bets to manipulate odds.

**Recommendation:** Add rate limiting:
```python
# In prediction_service.py
BET_RATE_LIMIT = 10  # bets per minute per user

async def check_rate_limit(user_id: str) -> bool:
    """Check if user has exceeded bet rate limit."""
    recent_bets = await conn.fetchval(
        """SELECT COUNT(*) FROM prediction_bets 
           WHERE user_id = $1 AND placed_at > NOW() - INTERVAL '1 minute'""",
        user_id
    )
    return recent_bets < BET_RATE_LIMIT
```

### 4.5 Missing Audit Trail Fields

**Gap:** S3's schema lacks security audit fields.

**Required Additions:**
```sql
ALTER TABLE prediction_bets ADD COLUMN (
    placed_from_ip INET,           -- For fraud detection
    user_agent_hash VARCHAR(64),   -- Device fingerprinting
    geo_country VARCHAR(2),        -- For geo-blocking compliance
    risk_score INTEGER DEFAULT 0   -- Calculated risk score
);
```

---

## 5. Integration Recommendations

### 5.1 Service Layer Integration

**Recommended Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│                    PREDICTION SERVICE                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Betting   │  │    Odds     │  │  Settlement │         │
│  │   Engine    │  │   Engine    │  │   Service   │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                │
│         └────────────────┼────────────────┘                │
│                          ▼                                 │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              TokenService (Existing)                │  │
│  │  - deduct_tokens() for bet placement               │  │
│  │  - award_tokens() for payouts                      │  │
│  │  - NEW: place_bet_with_escrow()                    │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Code Placement

**S3's Proposed Structure:**
```
packages/shared/api/src/
└── prediction/                 # 🆕 NEW MODULE
    ├── __init__.py
    ├── prediction_routes.py
    ├── prediction_service.py
    ├── prediction_models.py
    ├── odds_engine.py
    └── settlement_service.py
```

**Validated:** This structure is consistent with existing modules (fantasy/, tokens/, challenges/). ✅

### 5.3 Migration File

**S3's Proposed Migration:** `014_prediction_market.sql`

**Conflict:** Migration 014 already exists (`014_forum_system.sql`).

**Corrected Migration Number:** `019_prediction_market.sql`

**Migration Order:**
```
013_token_system.sql      ✅ Exists
014_forum_system.sql      ✅ Exists
015_daily_challenges.sql  ✅ Exists
016_wiki_system.sql       ✅ Exists
017_fantasy_system.sql    ✅ Exists
018_users_auth.sql        ✅ Exists
019_prediction_market.sql 🆕 S3's migration (renumbered)
```

---

## 6. Summary & Action Items

### 6.1 Can TokenService Support S3's Design?

**ANSWER: YES, with enhancements.**

The existing TokenService provides the foundation for betting operations:
- ✅ `deduct_tokens()` → Bet placement with SPEND transaction type
- ✅ `award_tokens()` → Payout with BET_WIN transaction type
- ✅ Transaction history tracking via `token_transactions`
- ✅ Balance locking with `FOR UPDATE`

**Required Enhancements:**
1. Add `place_bet_with_escrow()` for atomic bet+token operation
2. Add `batch_award_winners()` for efficient settlement
3. Add `refund_bet()` for cancelled markets
4. Add `escrow_balance` column to `user_tokens`

### 6.2 Critical Gaps Requiring Attention

| Priority | Issue | Impact | Fix Complexity |
|----------|-------|--------|----------------|
| 🔴 High | Escrow balance tracking | Financial integrity | Medium |
| 🔴 High | Rate limiting | Abuse prevention | Low |
| 🟡 Medium | Batch settlement | Performance | Medium |
| 🟡 Medium | Multi-source oracle | Settlement accuracy | Medium |
| 🟢 Low | Audit trail fields | Compliance | Low |

### 6.3 Recommended Implementation Sequence

**Phase 1 (Token Service Enhancements):**
1. Add `escrow_balance` to `user_tokens`
2. Add `place_bet_with_escrow()` method
3. Add `refund_bet()` method

**Phase 2 (Prediction Market Schema):**
1. Create `019_prediction_market.sql` (renumbered from 014)
2. Add audit trail fields
3. Add missing indexes

**Phase 3 (Security Hardening):**
1. Implement rate limiting
2. Add circuit breaker integration
3. Add pool ratio limits

**Phase 4 (Settlement System):**
1. Implement batch settlement
2. Add multi-source oracle
3. Add manual override UI

### 6.4 Final Assessment

S3's prediction market architecture is **well-designed** and **compatible** with the existing Token Economy. The parimutuel odds algorithm is sound, the database schema is comprehensive, and the integration points are correctly identified.

**Key Strengths:**
- Clear separation of concerns between OPERA, Token Economy, and Prediction Market
- Parimutuel model eliminates counterparty risk
- Comprehensive trigger-based automation
- Good use of existing transaction types

**Critical Improvements Needed:**
1. Escrow balance tracking (prevents over-betting)
2. Rate limiting (prevents abuse)
3. Migration renumbering (014 → 019)
4. Circuit breaker integration

---

**Scout Agent S2 — Task 2 Complete**

*"S2 Task 2 complete, S3 architecture validated with reservations"*

---

## Appendix A: Existing Token Economy API for Reference

### Current Token Endpoints
```
POST /tokens/claim-daily        - Daily login bonus
GET  /tokens/balance            - Current user balance
GET  /tokens/balance/{user_id}  - Any user balance (public)
GET  /tokens/history            - Transaction history
GET  /tokens/stats              - Token statistics
GET  /tokens/leaderboard        - Balance leaderboard
```

### Transaction Types (from token_models.py)
```python
TransactionType.BET_WIN   # For payout recording
TransactionType.BET_LOSS  # For loss recording
TransactionType.SPEND     # For bet placement
```

---

## Appendix B: Fantasy System Precedent Details

### Token Integration Pattern (from fantasy_service.py)
```python
# Entry fee collection
if league['entry_fee_tokens'] > 0 and self.token_service:
    deduct_req = TokenDeductRequest(
        user_id=owner_id,
        amount=league['entry_fee_tokens'],
        source='fantasy_entry',
        description=f"Entry fee for {league['name']}"
    )
    success, _, msg = await self.token_service.deduct_tokens(deduct_req)
    if not success:
        raise ValueError(f"Insufficient tokens: {msg}")
```

This pattern should be replicated for prediction market entry (bet placement).
