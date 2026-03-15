[Ver001.000]

# Scout Agent S2 — Task 3: Final Read-Only Observation Pass

**Agent:** S2 (Token Economy & Betting Integration)  
**Date:** 2026-03-15  
**Status:** ✅ Task 3 Complete - Final Synthesis  
**Scope:** Cross-domain analysis of Token Economy, Prediction Market, and OPERA Betting

---

## Executive Summary

This document synthesizes findings from three scout domains to validate betting integration readiness. The analysis confirms **architectural compatibility** between all three domains but identifies **critical implementation gaps** that must be resolved before deployment.

### Synthesis Verdict

| Domain | Status | Readiness |
|--------|--------|-----------|
| Token Economy (S2) | ✅ Operational | Ready for betting integration |
| Prediction Market (S3) | ⚠️ Designed | Needs escrow/rate limiting fixes |
| OPERA Betting (S1) | ❌ Not Implemented | Requires full implementation |

**Overall Assessment:** The three domains are **design-aligned** but **implementation-incomplete**. The Token Economy provides a solid foundation, S3's Prediction Market design is compatible with minor corrections, and S1 confirms no betting functionality currently exists.

---

## 1. Domain Analysis Summary

### 1.1 Token Economy (Original Domain - S2 Task 1)

**Current State:**
- 7 operational endpoints (`token_routes.py:14-273`)
- Transaction types pre-wired for betting (`token_models.py:18-19`)
- Fantasy system demonstrates wagering pattern (`fantasy_service.py:160-171`)
- Atomic operations with `FOR UPDATE` locking (`token_service.py:66`)

**Integration Assets:**
```python
# Existing transaction types ready for betting
token_models.py:18  BET_WIN = "bet_win"
token_models.py:19  BET_LOSS = "bet_loss"
token_models.py:17  SPEND = "spend"  # For wager placement

# Existing methods for betting integration
token_service.py:194-236  deduct_tokens() - For wager placement
token_service.py:82-157   award_tokens() - For payouts
```

### 1.2 Prediction Market (Cross-Review Domain - S2 Task 2)

**S3's Design Highlights:**
- Parimutuel odds algorithm (`SCOUT_S3_TASK1.md:179-274`)
- 5-table schema with triggers (`SCOUT_S3_TASK1.md:339-682`)
- Token flow integration defined (`SCOUT_S3_TASK1.md:110-136`)

**Critical Gaps Identified by S2:**
- No escrow balance tracking (race condition risk)
- Missing rate limiting on bet placement
- Migration file collision (014 vs 014_forum_system.sql)
- No circuit breaker integration

### 1.3 OPERA Betting (S1's Domain)

**S1's Findings:**
- Zero betting endpoints in OPERA routes (`opera_routes.py:1-273`)
- BET_WIN/BET_LOSS transaction types unused (`token_models.py:18-19`)
- No odds calculation system exists
- No wager placement API

---

## 2. Token Economy + Betting Integration Synthesis

### 2.1 Design Alignment Matrix

| Component | Token Economy | Prediction Market | OPERA | Alignment |
|-----------|--------------|-------------------|-------|-----------|
| **Transaction Types** | BET_WIN, BET_LOSS defined | Uses BET_WIN/BET_LOSS | Expects these types | ✅ Aligned |
| **Token Flow** | deduct() → award() | Deduct on place, award on win | Same pattern | ✅ Aligned |
| **Database** | PostgreSQL user_tokens | PostgreSQL prediction_* | TiDB opera_schedules | ⚠️ Cross-DB FK issue |
| **Match Reference** | N/A | match_id VARCHAR(50) | match_id VARCHAR(50) | ✅ Aligned |
| **Escrow/Reservation** | ❌ Not implemented | Assumes it exists | ❌ Not implemented | ❌ Gap |

### 2.2 Integration Flow Validation

**Validated Flow:**
```
User Places Bet
├── Token Economy: deduct_tokens() [token_service.py:194-236]
├── Prediction Market: Create bet record [S3 schema prediction_bets]
└── OPERA: Validate match exists [tidb_client.py:425-617]

Match Completes
├── OPERA: winner_team_id confirmed [opera_schedules table]
├── Prediction Market: Calculate payouts [S3 odds_engine]
└── Token Economy: award_tokens() with BET_WIN [token_service.py:82-157]
```

**Flow Status:** ✅ Validated - All three domains use compatible patterns

### 2.3 Cross-Domain Data Consistency

| Data Element | Source of Truth | Consumers | Consistency Check |
|--------------|-----------------|-----------|-------------------|
| `match_id` | OPERA (TiDB) | Prediction Market | Soft reference required |
| `user_id` | Token Economy (PostgreSQL) | Prediction Market | FK validated |
| `balance` | Token Economy | Prediction Market | Via deduct_tokens() |
| `odds` | Prediction Market | User display | Calculated real-time |

---

## 3. Risk Assessment by Finding

### 3.1 Critical Risks (Deployment Blocking)

| Finding | Domain | Risk Level | Impact | Mitigation |
|---------|--------|------------|--------|------------|
| **No escrow balance tracking** | Token Economy | 🔴 HIGH | Double-spending via concurrent bets | Add `escrow_balance` column to `user_tokens` |
| **Missing rate limiting** | Prediction Market | 🔴 HIGH | Bot manipulation, system overload | Implement per-user bet rate limiting |
| **No betting endpoints exist** | OPERA | 🔴 HIGH | Zero betting functionality | Implement full betting API |
| **Cross-database FK impossible** | Architecture | 🔴 HIGH | Referential integrity between OPERA and Prediction Market | Application-layer validation |

### 3.2 High Risks (Pre-Launch Required)

| Finding | Domain | Risk Level | Impact | Mitigation |
|---------|--------|------------|--------|------------|
| **Migration number collision** | Prediction Market | 🟠 HIGH | 014_prediction_market.sql conflicts with 014_forum_system.sql | Renumber to 019_prediction_market.sql |
| **No circuit breaker** | Prediction Market | 🟠 HIGH | No emergency stop for betting | Implement BettingCircuitBreaker class |
| **Inline imports in token routes** | Token Economy | 🟠 MEDIUM | Performance degradation | Move imports to top-level |
| **No idempotency keys** | Token Economy | 🟠 MEDIUM | Duplicate claims on retry | Add idempotency key check |

### 3.3 Medium Risks (Post-Launch OK)

| Finding | Domain | Risk Level | Impact | Mitigation |
|---------|--------|------------|--------|------------|
| **Hardcoded token values** | Token Economy | 🟡 MEDIUM | No runtime economy tuning | Move to configuration table |
| **Missing audit fields** | Prediction Market | 🟡 MEDIUM | Compliance/fraud detection gaps | Add IP, user_agent columns |
| **No batch settlement** | Token Economy | 🟡 MEDIUM | Slow payout processing | Add batch_award_winners() method |
| **No multi-source oracle** | Prediction Market | 🟡 MEDIUM | Single point of failure for results | Cross-reference with Pandascore |

---

## 4. Design Alignment Validation

### 4.1 Architectural Consistency Check

| Design Principle | Token Economy | Prediction Market | OPERA | Verdict |
|------------------|---------------|-------------------|-------|---------|
| **Async/Await** | ✅ Full async | ✅ Full async | ✅ Full async | ✅ Consistent |
| **Pydantic Models** | ✅ All endpoints | ✅ Proposed | ✅ Some | ✅ Compatible |
| **FOR UPDATE Locking** | ✅ Implemented | ✅ Planned | N/A | ✅ Compatible |
| **Transaction Safety** | ✅ asyncpg transactions | ✅ Planned | N/A | ✅ Compatible |
| **Error Handling** | HTTP exceptions | Circuit breaker | HTTP exceptions | ⚠️ Needs unification |

### 4.2 API Contract Validation

**S3's Proposed Endpoints vs S1's Expected Endpoints:**

| Endpoint | S3 Proposal | S1 Expectation | Match |
|----------|-------------|----------------|-------|
| `GET /matches/{id}/odds` | ✅ `SCOUT_S3_TASK1.md:56-60` | ✅ `SCOUT_S1_TASK1.md:146` | ✅ Match |
| `POST /matches/{id}/bet` | ✅ `SCOUT_S3_TASK1.md:63-70` | ✅ `SCOUT_S1_TASK1.md:152` | ✅ Match |
| `GET /bets/my` | ✅ `SCOUT_S3_TASK1.md:72-78` | ✅ `SCOUT_S1_TASK1.md:153` | ✅ Match |
| `GET /markets/active` | ✅ `SCOUT_S3_TASK1.md:80-86` | ❌ Not listed | 🆕 S3 addition |

**Verdict:** ✅ S3's design covers all S1's requirements plus adds market discovery

### 4.3 Token Transaction Type Usage

**Planned vs Reserved:**

| Type | Reserved In | Planned Use By | Status |
|------|-------------|----------------|--------|
| `BET_WIN` | `token_models.py:18` | S3 settlement | ✅ Aligned |
| `BET_LOSS` | `token_models.py:19` | S3 settlement | ✅ Aligned |
| `SPEND` | `token_models.py:17` | S3 wager placement | ✅ Aligned |

---

## 5. Final 3 Prioritized Recommendations

### Recommendation 1: Implement Escrow Balance System (CRITICAL)

**Priority:** 🔴 P0 - Deployment Blocking  
**Files:** `token_service.py`, `013_token_system.sql`  
**Lines:** Add to `token_service.py:1-394`, schema at `013_token_system.sql:1-`

**Problem:** Current system allows double-spending through concurrent bets:
```
T1: Check balance (100 tokens) ✓
T2: Check balance (100 tokens) ✓  -- Race condition!
T3: Deduct 60 for Bet A
T4: Deduct 60 for Bet B → Balance = -20 (INVALID!)
```

**Solution:**
```sql
-- Add to 013_token_system.sql or new migration
ALTER TABLE user_tokens 
    ADD COLUMN escrow_balance INTEGER DEFAULT 0 CHECK (escrow_balance >= 0);
```

```python
# Add to token_service.py
async def get_available_balance(self, user_id: str) -> int:
    """Get balance minus locked escrow."""
    row = await self.db.fetchrow(
        "SELECT balance, escrow_balance FROM user_tokens WHERE user_id = $1",
        user_id
    )
    return row['balance'] - row['escrow_balance']

async def lock_escrow(self, user_id: str, amount: int) -> bool:
    """Lock tokens for pending bet."""
    async with self.db.acquire() as conn:
        async with conn.transaction():
            row = await conn.fetchrow(
                """UPDATE user_tokens 
                   SET escrow_balance = escrow_balance + $1
                   WHERE user_id = $2 
                   AND (balance - escrow_balance) >= $1
                   RETURNING user_id""",
                amount, user_id
            )
            return row is not None
```

**Risk if Not Fixed:** Financial integrity compromise, negative balances

---

### Recommendation 2: Add Rate Limiting to Bet Placement (CRITICAL)

**Priority:** 🔴 P0 - Pre-Launch Required  
**Files:** `prediction_routes.py` (new), `prediction_service.py` (new)  
**Location:** New prediction module as per S3's design

**Problem:** No protection against bot manipulation or flash betting:
```python
# Attack scenario
async def exploit():
    for i in range(10000):
        await place_bet(user_id, match_id, 1)  # Micro-bets to manipulate odds
```

**Solution:**
```python
# prediction_service.py
BET_RATE_LIMIT = 10  # bets per minute per user
BET_COOLDOWN_SECONDS = 5  # minimum time between bets

async def check_rate_limit(self, user_id: str) -> Tuple[bool, str]:
    """Check if user has exceeded bet rate limit."""
    async with self.db.acquire() as conn:
        # Check recent bet count
        recent_count = await conn.fetchval(
            """SELECT COUNT(*) FROM prediction_bets 
               WHERE user_id = $1 AND placed_at > NOW() - INTERVAL '1 minute'""",
            user_id
        )
        if recent_count >= BET_RATE_LIMIT:
            return False, f"Rate limit exceeded: max {BET_RATE_LIMIT} bets/minute"
        
        # Check last bet time
        last_bet = await conn.fetchval(
            """SELECT placed_at FROM prediction_bets 
               WHERE user_id = $1 ORDER BY placed_at DESC LIMIT 1""",
            user_id
        )
        if last_bet and (datetime.utcnow() - last_bet).seconds < BET_COOLDOWN_SECONDS:
            return False, f"Please wait {BET_COOLDOWN_SECONDS}s between bets"
        
        return True, "OK"
```

**Risk if Not Fixed:** Odds manipulation, system abuse, unfair advantages

---

### Recommendation 3: Fix Migration Number Collision (HIGH)

**Priority:** 🟠 P1 - Pre-Launch Required  
**Files:** Rename `014_prediction_market.sql` → `019_prediction_market.sql`

**Problem:** S3's design uses `014_prediction_market.sql` but `014_forum_system.sql` already exists.

**Current Migration Order:**
```
013_token_system.sql      ✅ Exists
014_forum_system.sql      ✅ Exists
015_daily_challenges.sql  ✅ Exists
016_wiki_system.sql       ✅ Exists
017_fantasy_system.sql    ✅ Exists
018_users_auth.sql        ✅ Exists
014_prediction_market.sql ❌ CONFLICT!
```

**Solution:**
```bash
# Rename S3's migration file
mv 014_prediction_market.sql 019_prediction_market.sql
```

**Corrected Migration Order:**
```
013_token_system.sql      ✅ Exists
014_forum_system.sql      ✅ Exists
015_daily_challenges.sql  ✅ Exists
016_wiki_system.sql       ✅ Exists
017_fantasy_system.sql    ✅ Exists
018_users_auth.sql        ✅ Exists
019_prediction_market.sql 🆕 S3's migration (renumbered)
```

**Risk if Not Fixed:** Migration failure, schema inconsistency, deployment blockage

---

## 6. Implementation Priority Matrix

### Phase 1: Foundation (Week 1)
| Task | Domain | Complexity | Risk |
|------|--------|------------|------|
| Add escrow_balance column | Token Economy | Low | Critical |
| Rename migration to 019 | Prediction Market | Low | High |
| Implement rate limiting | Prediction Market | Medium | Critical |

### Phase 2: Core Betting (Week 2-3)
| Task | Domain | Complexity | Risk |
|------|--------|------------|------|
| Create prediction module | Prediction Market | High | High |
| Implement odds engine | Prediction Market | Medium | High |
| Add betting endpoints | OPERA | Medium | High |

### Phase 3: Settlement (Week 4)
| Task | Domain | Complexity | Risk |
|------|--------|------------|------|
| Implement settlement service | Prediction Market | High | High |
| Integrate payout with TokenService | Token Economy | Medium | Medium |
| Add batch settlement | Token Economy | Medium | Medium |

### Phase 4: Hardening (Week 5)
| Task | Domain | Complexity | Risk |
|------|--------|------------|------|
| Circuit breaker integration | Prediction Market | Medium | High |
| Multi-source oracle | Prediction Market | Medium | Medium |
| Audit trail fields | Prediction Market | Low | Medium |

---

## 7. Cross-Reference Summary

### S2 Task 1 → Task 3 Validation
| Original Finding | Validated? | Task 3 Status |
|------------------|------------|---------------|
| TokenService ready for betting | ✅ | Confirmed compatible with S3's design |
| Fantasy pattern proves wagering works | ✅ | S3 should replicate this pattern |
| Security issues identified | ✅ | Added to risk assessment |

### S2 Task 2 → Task 3 Validation
| Original Finding | Validated? | Task 3 Status |
|------------------|------------|---------------|
| S3 architecture compatible | ✅ | Design alignment confirmed |
| Escrow gap critical | ✅ | Recommendation #1 |
| Migration collision | ✅ | Recommendation #3 |
| Rate limiting needed | ✅ | Recommendation #2 |

### S1 Task 1 → Task 3 Validation
| Original Finding | Validated? | Task 3 Status |
|------------------|------------|---------------|
| No betting endpoints exist | ✅ | Confirmed - requires full implementation |
| BET_WIN/BET_LOSS reserved | ✅ | S3 design uses these correctly |
| Token integration needed | ✅ | Architecture validated |

---

## 8. Conclusion

### Final Assessment

The three domains (Token Economy, Prediction Market, OPERA Betting) are **architecturally aligned** and **technically compatible**. The betting integration is feasible with the existing TokenService foundation.

### Key Success Factors
1. ✅ Transaction types already defined
2. ✅ Fantasy system proves wagering pattern
3. ✅ Parimutuel odds algorithm is sound
4. ✅ Database schemas are compatible

### Critical Blockers
1. ❌ Escrow balance tracking missing
2. ❌ Rate limiting not implemented
3. ❌ Migration number collision

### Recommended Action
Proceed with implementation following the Phase 1-4 priority matrix. The three recommendations in this document must be completed before betting functionality is deployed to production.

---

**Scout Agent S2 — Task 3 Complete**

*"Cross-domain analysis complete. Token Economy, Prediction Market, and OPERA Betting are design-aligned. Three critical recommendations identified for pre-launch implementation."*

**Line Numbers Referenced:**
- `token_models.py:14-25` - Transaction types
- `token_service.py:31-58` - Balance operations
- `token_service.py:82-157` - Award tokens
- `token_service.py:194-236` - Deduct tokens
- `fantasy_service.py:160-171` - Entry fee pattern
- `opera_routes.py:1-273` - No betting endpoints
- `tidb_client.py:425-617` - Match validation
