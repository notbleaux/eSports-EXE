[Ver001.000]

# Integration Test Cases — Phase 2.4

**Purpose:** End-to-end test scenarios for service interactions and data flow

**Scope:** Test cases for verified execution of Phase 2 services and their interactions

**Update Policy:** Add test case after executing successfully; mark as VERIFIED

---

## Integration Test Suite

### Category: TeneT Verification → Data Flow

#### Test Case IT-01: Verify Match with Single Source
**Objective:** Test verification with one high-trust source
**Setup:**
1. Start TeneT Verification service
2. Create match data: {entity_id: "match_001", game: "valorant", sources: [{sourceType: "vlr", trustLevel: "MEDIUM", weight: 1.0, data: {team_a_score: 13, team_b_score: 11}}]}
**Steps:**
1. POST /v1/verify with match data
2. Verify response contains {status: "ACCEPTED", confidence_score: >= 0.90}
3. Check database: verification record created with status ACCEPTED
**Expected Result:** ✅ Match accepted with high confidence
**Status:** 🟡 Ready for implementation

---

#### Test Case IT-02: Verify Match with Multiple Agreeing Sources
**Objective:** Test confidence increase with source agreement
**Setup:**
1. TeneT Verification running
2. Match data with 2 sources, identical scores
**Steps:**
1. POST /v1/verify with {sources: [{vlr data}, {liquidpedia data}]} both showing 13-11
2. Verify response contains confidence_score > single source confidence
3. Check record stored with both sources logged
**Expected Result:** ✅ Higher confidence with multiple agreeing sources
**Status:** 🟡 Ready for implementation

---

#### Test Case IT-03: Detect Conflict and Flag for Review
**Objective:** Test conflict detection triggers FLAGGED status
**Setup:**
1. TeneT Verification running
2. Match data with conflicting scores: VLR 13-11, Liquidpedia 13-15 (4 point diff, below threshold)
3. Then test VLR 13-11, Liquidpedia 13-21 (10+ point diff, triggers conflict)
**Steps:**
1. POST /v1/verify with conflicting sources
2. Verify status is FLAGGED when difference > 10 points
3. Check review queue: item created for this match
**Expected Result:** ✅ Conflicts detected, flagged for manual review
**Status:** 🟡 Ready for implementation

---

#### Test Case IT-04: Rate Limiting Enforcement
**Objective:** Test 100 req/min rate limit on /v1/verify
**Setup:**
1. TeneT Verification running
2. Verification request ready
**Steps:**
1. Send 100 requests rapidly
2. Verify all return 200
3. Send 101st request
4. Verify returns 429 with Retry-After: 60
5. Wait 60+ seconds
6. Send 102nd request
7. Verify returns 200
**Expected Result:** ✅ Rate limit enforced at 100/min boundary
**Status:** 🟡 Ready for implementation

---

### Category: WebSocket → Real-Time Updates

#### Test Case IT-05: WebSocket Connection and Heartbeat
**Objective:** Test WebSocket connection lifecycle
**Setup:**
1. WebSocket service running
2. Client ready to connect
**Steps:**
1. Connect to ws://localhost:8002/ws/match/match_001
2. Wait 30 seconds
3. Verify HEARTBEAT message received with serverTime and activeConnections
4. Send PONG response
5. Wait 60+ seconds without PONG
6. Verify connection auto-disconnected
**Expected Result:** ✅ Heartbeat sent every 30s, client auto-disconnected after 60s inactivity
**Status:** 🟡 Ready for implementation

---

#### Test Case IT-06: Message Deduplication
**Objective:** Test duplicate messages not sent twice
**Setup:**
1. WebSocket service running
2. Connected client to match
3. Duplicate message (same message_id) prepared
**Steps:**
1. Broadcast message_id=UUID1 with match update
2. Verify client receives message once
3. Broadcast same message_id again
4. Verify client does NOT receive duplicate
5. Wait 1.1 seconds (dedup window expired)
6. Broadcast same message_id again
7. Verify client receives message
**Expected Result:** ✅ Messages deduplicated within 1s window, allowed after window expires
**Status:** 🟡 Ready for implementation

---

#### Test Case IT-07: Backpressure Handling
**Objective:** Test queue backpressure when client is slow
**Setup:**
1. WebSocket service running
2. Connected client that reads slowly
3. 1000+ messages queued for delivery
**Steps:**
1. Broadcast messages rapidly (> 1000/second)
2. Verify queue reaches max (1000 messages)
3. Verify older messages dropped, new messages queued
4. Verify client eventually catches up and receives recent messages
5. Check logs for backpressure warnings
**Expected Result:** ✅ Backpressure handled gracefully, oldest dropped, recent preserved
**Status:** 🟡 Ready for implementation

---

### Category: Legacy Compiler → Data Aggregation

#### Test Case IT-08: Circuit Breaker Protection
**Objective:** Test circuit breaker opens and recovers
**Setup:**
1. Legacy Compiler running
2. VLR.gg endpoint mocked to fail
3. Circuit breaker configured: 5 failures, 60s recovery
**Steps:**
1. Send compilation request (triggers VLR scrape)
2. Mock VLR returns error
3. Repeat step 1-2 five times
4. Verify circuit breaker state = OPEN
5. Next request fails fast without retrying
6. Wait 60 seconds
7. Circuit breaker transitions to HALF_OPEN
8. Mock VLR returns success
9. Verify circuit breaker state = CLOSED
**Expected Result:** ✅ Circuit breaker prevents cascading failures, recovers automatically
**Status:** 🟡 Ready for implementation

---

#### Test Case IT-09: Exponential Backoff Retry
**Objective:** Test retry logic with exponential backoff
**Setup:**
1. Legacy Compiler running
2. VLR endpoint mocked to fail twice, then succeed
3. Backoff configured: 1s base, 2^n formula
**Steps:**
1. Send compilation request (triggers VLR scrape)
2. Mock VLR fails (attempt 1)
3. Verify delay ~1s, then retry (attempt 2)
4. Mock VLR fails (attempt 2)
5. Verify delay ~2s, then retry (attempt 3)
6. Mock VLR succeeds (attempt 3)
7. Verify response includes aggregated data
**Expected Result:** ✅ Retries with exponential backoff (1s, 2s, 4s), succeeds on 3rd attempt
**Status:** 🟡 Ready for implementation

---

#### Test Case IT-10: Conflict Detection and Reporting
**Objective:** Test conflict detection in aggregated data
**Setup:**
1. Legacy Compiler running
2. VLR and Liquidpedia mocked with conflicting data
3. VLR: team_a_score = 13, Liquidpedia: team_a_score = 23 (10+ point diff)
**Steps:**
1. POST /v1/compile with match_id
2. Verify response includes conflicts object
3. Verify has_conflicts = true, conflict_count = 1
4. Verify conflicts[0] shows field, values, sources, difference
5. Verify confidence_impact = 0.1 (one conflict)
**Expected Result:** ✅ Conflicts detected and reported with impact assessment
**Status:** 🟡 Ready for implementation

---

### Category: End-to-End Integration

#### Test Case IT-11: Complete Pipeline - Legacy → TeneT → Review Queue
**Objective:** Test full data flow from compilation through verification to review
**Setup:**
1. All three services running
2. Match data with conflicting sources prepared
3. TeneT and Legacy Compiler connected via HTTP
**Steps:**
1. POST to Legacy Compiler /v1/compile
2. Receives aggregated data with conflict_analysis
3. POST aggregated data to TeneT Verification /v1/verify
4. TeneT detects conflict, returns status = FLAGGED
5. TeneT creates ReviewQueueItem
6. GET /v1/review-queue returns flagged item
7. Admin reviews, POST decision to /v1/review-queue/{id}/decide with ACCEPT
8. Item status updated to CLOSED
9. Original verification status updated to MANUAL_OVERRIDE
**Expected Result:** ✅ Complete flow: compile → verify → flag → review → decide → override
**Status:** 🟡 Ready for implementation

---

#### Test Case IT-12: WebSocket Updates After TeneT Decision
**Objective:** Test WebSocket clients notified of verification decisions
**Setup:**
1. All services running
2. WebSocket client connected to match
3. Flagged verification in review queue
**Steps:**
1. Admin submits review decision ACCEPT
2. WebSocket service broadcasts VERIFICATION_DECIDED message
3. Connected client receives message with updated status
4. Verify message includes decision and reviewer info
**Expected Result:** ✅ Real-time notification of verification decisions to connected clients
**Status:** 🟡 Ready for implementation

---

### Category: Performance and Load

#### Test Case IT-13: Sustained Rate Limiting
**Objective:** Test rate limiter maintains 100 req/min under load
**Setup:**
1. TeneT Verification running
2. Load generator configured: 150 requests/min for 2 minutes
**Steps:**
1. Generate load for 60 seconds
2. Verify rate limit triggered: requests 101-150 return 429
3. Continue for next 60 seconds
4. Verify rate limit reset after 60s, new batch accepted (1-100)
5. Monitor CPU, memory during test
**Expected Result:** ✅ Rate limit consistently enforced, no performance degradation
**Status:** 🟡 Ready for implementation

---

#### Test Case IT-14: Circuit Breaker Under Concurrent Load
**Objective:** Test circuit breaker behavior with concurrent requests
**Setup:**
1. Legacy Compiler running
2. VLR endpoint configured to fail
3. Circuit breaker: 5 failures, 60s recovery
4. Load generator: 20 concurrent requests
**Steps:**
1. Trigger 20 concurrent requests
2. Verify circuit opens after 5 fail
3. Remaining 15 fail fast without retry
4. Verify logs show circuit breaker state transitions
5. Verify no cascading failures or resource exhaustion
**Expected Result:** ✅ Circuit breaker efficiently prevents cascading failures under load
**Status:** 🟡 Ready for implementation

---

### Category: Error Handling

#### Test Case IT-15: Graceful Degradation - Partial Source Failure
**Objective:** Test service continues with partial source failures
**Setup:**
1. Legacy Compiler running
2. VLR and Liquidpedia mocked, Pandascore fails
**Steps:**
1. POST /v1/compile
2. Verify response includes data from VLR and Liquidpedia
3. Verify Pandascore failure logged but not fatal
4. Verify sourceCount = 2, not 3
5. Verify confidence calculated from available sources
**Expected Result:** ✅ Service gracefully degraded with 2/3 sources available
**Status:** 🟡 Ready for implementation

---

## Test Execution Summary

**Total Test Cases:** 15
**Categories:**
- TeneT Verification: 4 tests
- WebSocket: 3 tests
- Legacy Compiler: 3 tests
- End-to-End: 2 tests
- Performance/Load: 2 tests
- Error Handling: 1 test

**Estimated Execution Time:** 30-45 minutes (with manual review time)

**Success Criteria:**
- All 15 test cases show ✅ status
- No critical failures logged
- Performance metrics within acceptable ranges
- Rate limiting and circuit breaker function as designed

---

## Notes

- All test cases assume services running on localhost with default ports
- Mock endpoints required for deterministic test execution
- Load tests benefit from running on isolated VM to avoid network interference
- Rate limiting tests should disable token bucket reset between test runs
- Circuit breaker tests require ability to control external API behavior (mocking)

---

**End of Integration Test Cases**
