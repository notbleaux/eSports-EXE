# Scout Agent S1 - Task 1: OPERA Betting Systems Analysis

**Agent:** S1 (Betting Systems - OPERA Module)  
**Date:** 2026-03-15  
**Status:** Task 1 Complete - Read-Only Analysis  
**Files Analyzed:**
- `packages/shared/api/src/opera/opera_routes.py` (238 lines)
- `packages/shared/api/src/opera/tidb_client.py` (1079 lines)
- `packages/shared/api/src/tokens/token_routes.py` (294 lines)
- `packages/shared/api/src/tokens/token_service.py` (394 lines)
- `packages/shared/api/src/tokens/token_models.py` (159 lines)

---

## Summary of Current Betting Capabilities

### Token Economy (Fully Implemented)
| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Daily Claims | ✅ Complete | `token_routes.py:32-56` | 100 base + 10/streak, milestone bonuses |
| Balance Tracking | ✅ Complete | `token_service.py:31-58` | Per-user with streak calculation |
| Transaction History | ✅ Complete | `token_routes.py:99-158` | Paginated with type filtering |
| Leaderboard | ✅ Complete | `token_routes.py:197-217` | Global rankings with percentile |
| Admin Controls | ✅ Complete | `token_routes.py:222-273` | Award/deduct with audit logging |

### Transaction Types (Preparing for Betting)
```python
# From token_models.py:14-25
class TransactionType(str, Enum):
    BET_WIN = "bet_win"      # Reserved but unused
    BET_LOSS = "bet_loss"    # Reserved but unused
    FANTASY_WIN = "fantasy_win"
    FANTASY_ENTRY = "fantasy_entry"
    # ... other types
```

### OPERA Module (Tournament Metadata ONLY)
| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Tournament CRUD | ✅ Complete | `tidb_client.py:217-419` | Full lifecycle management |
| Match Scheduling | ✅ Complete | `tidb_client.py:425-617` | Status tracking, scores |
| Patch Tracking | ⚠️ Partial | `opera_routes.py:120-143` | Mock data only (line 134) |
| Circuit Listings | ✅ Complete | `opera_routes.py:148-166` | Hardcoded VCT/VCL/GC |
| SATOR Sync | ✅ Complete | `tidb_client.py:987-1072` | Cross-reference support |

### Betting System Status: ❌ NOT IMPLEMENTED
- **Zero betting endpoints** in OPERA routes
- **No odds calculation** system
- **No wager placement** API
- **No payout engine** automation
- **No betting history** tracking

---

## Missing Features Identified

### Critical Gaps (Blocking Betting Launch)

1. **Prediction Market Core**
   - No odds calculation algorithm
   - No betting pool tracking
   - No probability-to-decimal conversion
   - No volume-adjusted odds

2. **Wager Placement System**
   - No `POST /opera/matches/{id}/bet` endpoint
   - No bet validation against match status
   - No balance pre-authorization
   - No minimum/maximum bet limits

3. **Payout Distribution**
   - No automated winner calculation
   - No house fee deduction (5% recommended)
   - No batch payout processing
   - No failed payout retry mechanism

4. **Betting Data Model**
   - No `bets` table schema
   - No bet status lifecycle (pending → won/lost → paid)
   - No market/outcome definitions
   - No user bet history aggregation

5. **OPERA-Token Integration**
   - No token balance check before bet acceptance
   - No token reservation/escrow during match
   - No transaction logging for bet_win/bet_loss

---

## 3 Specific Recommendations

### Recommendation 1: Implement Core Betting Data Models
**Priority:** HIGH  
**Location:** New file `packages/shared/api/src/opera/betting_models.py`

```python
# Required models:
class BetStatus(str, Enum):
    PENDING = "pending"      # Match not started
    LIVE = "live"           # Match in progress
    WON = "won"             # Bet won, pending payout
    LOST = "lost"           # Bet lost
    PAID = "paid"           # Payout completed
    CANCELLED = "cancelled" # Match cancelled

class MarketType(str, Enum):
    MATCH_WINNER = "match_winner"
    MAP_WINNER = "map_winner"
    CORRECT_SCORE = "correct_score"

class Bet(BaseModel):
    bet_id: str
    user_id: str
    match_id: str
    market: MarketType
    selection: str          # team_a, team_b, etc.
    odds: Decimal           # At time of placement
    stake: int              # Token amount
    potential_payout: int
    status: BetStatus
    created_at: datetime
    settled_at: Optional[datetime]
```

### Recommendation 2: Create Betting Service Layer
**Priority:** HIGH  
**Location:** New file `packages/shared/api/src/opera/betting_service.py`

**Key Methods Required:**
- `place_bet(user_id, match_id, market, selection, stake)` - Validate and create bet
- `calculate_odds(match_id, market)` - Dynamic odds based on betting volume
- `settle_bets(match_id, result)` - Post-match settlement
- `process_payouts(match_id)` - Distribute winnings
- `get_user_bets(user_id, status)` - Betting history

**Integration Points:**
- Call `TokenService.deduct_tokens()` on bet placement
- Call `TokenService.award_tokens()` with `TransactionType.BET_WIN` on payout
- Query `TiDBOperaClient.get_schedule_for_tournament()` for match validation

### Recommendation 3: Add Betting Endpoints with Safety Controls
**Priority:** HIGH  
**Location:** Extend `packages/shared/api/src/opera/opera_routes.py`

**Required Endpoints:**
```python
# Public endpoints
GET  /opera/matches/{id}/odds          # Current betting odds
GET  /opera/matches/{id}/bets          # Public bet volume (anonymized)

# Authenticated endpoints
POST /opera/bets                       # Place wager
GET  /opera/bets/my                    # User betting history
GET  /opera/bets/{bet_id}              # Bet details
DELETE /opera/bets/{bet_id}            # Cancel (before match start)

# Admin endpoints
POST /opera/admin/matches/{id}/settle  # Settle market
POST /opera/admin/bets/payout          # Trigger payouts
```

**Safety Controls:**
- Minimum bet: 10 tokens
- Maximum bet: 10,000 tokens or 10% of user balance
- Close betting 5 minutes before match start
- Cancel all bets if match postponed/cancelled

---

## Lines of Concern (with Line Numbers)

### Critical Issues

| Line | File | Issue | Risk |
|------|------|-------|------|
| 44-50 | `tidb_client.py` | mysql-connector optional import | TiDB features fail silently if not installed |
| 129-133 | `tidb_client.py` | ImportError raised in constructor | Runtime crash if mysql-connector missing |
| 134 | `opera_routes.py` | Mock patch data returned | Clients receive fake data |
| 172-188 | `opera_routes.py` | Admin create_tournament no audit | No record of who created tournaments |
| 191-208 | `opera_routes.py` | Admin add_schedule no audit | No record of schedule modifications |

### Warning Issues

| Line | File | Issue | Risk |
|------|------|-------|------|
| 48 | `token_routes.py` | Inline import `DailyClaimRequest` | Minor performance degradation |
| 113 | `token_routes.py` | Inline import `TransactionType` | Minor performance degradation |
| 145-146 | `token_models.py` | `BET_WIN`/`BET_LOSS` unused | Dead code, placeholder only |
| 31 | `token_routes.py` | Hardcoded token values | No configuration flexibility |
| 163 | `tidb_client.py` | `autocommit=False` but no explicit rollback on context exit | Potential connection state issues |

### Advisory Issues

| Line | File | Issue | Risk |
|------|------|-------|------|
| 157-166 | `opera_routes.py` | Hardcoded circuits list | Requires code change for new circuits |
| 248 | `opera_routes.py` | `tournament_data: dict` no validation | Accepts arbitrary JSON |
| 194 | `opera_routes.py` | `schedule_item: dict` no validation | Accepts arbitrary JSON |
| 586-590 | `tidb_client.py` | Dynamic SQL construction in `update_match_status` | SQL injection risk (though field list is whitelisted) |

---

## Cross-Reference with Foreman Pass 0

| Foreman Finding | Status | Notes |
|-----------------|--------|-------|
| Betting Engine NOT IMPLEMENTED | ✅ Confirmed | No betting code exists |
| Line 44-50 tidb_client.py | ✅ Confirmed | Optional import concern valid |
| Line 172-188 opera_routes.py | ✅ Confirmed | Missing audit logging |
| BET_WIN/BET_LOSS in TransactionType | ✅ Confirmed | Reserved but unused |

---

## Next Steps

1. **Await Trade with S2** - Ready to receive S2's assigned modules for cross-review
2. **S2 Assignment Expected:** Token economy deep-dive or Prediction market architecture

---

**Scout S1 Sign-Off:** Task 1 Complete  
**Ready for Trade:** YES
