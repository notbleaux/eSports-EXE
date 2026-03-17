[Ver001.000]
# Week 1 Implementation Plan
**Libre-X-eSport 4NJZ4 TENET Platform**
**Date:** March 15, 2026

---

## Current State Assessment

| System | Status | Notes |
|--------|--------|-------|
| **Token System** | ✅ Backend Complete | Routes, service, models ready |
| **Forum System** | ✅ Backend Complete | Routes, service, models ready |
| **Fantasy System** | ✅ Backend Complete | Routes, service, models ready |
| **Challenge System** | ✅ Backend Complete | Routes, service, models ready |
| **Wiki System** | ✅ Backend Complete | Routes, service, models ready |
| **Authentication** | ❌ Missing | No JWT, no auth middleware |
| **Rate Limiting** | ❌ Missing | No rate limit protection |
| **Betting System** | ❌ Missing | Not implemented |
| **WebSocket Chat** | ❌ Missing | No real-time messaging |

---

## Phase 1: Security Foundation (Days 1-2)

### Day 1: JWT Authentication

#### 1.1 Create Auth Service
```
packages/shared/api/src/auth/
├── __init__.py
├── auth_service.py       # JWT token generation/validation
├── auth_models.py        # Pydantic models for auth
├── auth_routes.py        # Login/register endpoints
└── auth_middleware.py    # FastAPI dependency for protected routes
```

**Implementation:**
```python
# auth_models.py
class UserLogin(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
```

**Routes to protect:**
| Endpoint | Method | Protection Level |
|----------|--------|------------------|
| `/tokens/claim-daily` | POST | Authenticated |
| `/tokens/transfer` | POST | Authenticated |
| `/forum/threads` | POST | Authenticated |
| `/forum/replies` | POST | Authenticated |
| `/fantasy/leagues` | POST | Authenticated |
| `/fantasy/teams` | POST | Authenticated |
| `/challenges/submit` | POST | Authenticated |
| `/wiki/articles` | POST | Authenticated (editor+) |

#### 1.2 Database Migration
```sql
-- 018_auth_system.sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(32) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user', -- user, moderator, admin
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
```

### Day 2: Rate Limiting & Security

#### 2.1 Rate Limiting Middleware
```python
# middleware/rate_limit.py
from fastapi import Request, HTTPException
import redis.asyncio as redis

class RateLimiter:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
    
    async def check_rate_limit(
        self, 
        key: str, 
        limit: int, 
        window: int = 60
    ) -> bool:
        """Check if request is within rate limit."""
        current = await self.redis.get(key)
        if current and int(current) >= limit:
            return False
        
        pipe = self.redis.pipeline()
        pipe.incr(key)
        pipe.expire(key, window)
        await pipe.execute()
        return True

# Standard: 100 req/min
# Premium: 1000 req/min
```

#### 2.2 Security Headers & CSRF
```python
# middleware/security.py
from fastapi import Request, Response
from fastapi.middleware.trustedhost import TrustedHostMiddleware

# Add security headers
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response
```

#### 2.3 Content Sanitization
```python
# utils/sanitize.py
import bleach
from bleach.css_sanitizer import CSS_Sanitizer

def sanitize_forum_content(content: str) -> str:
    """Sanitize forum post content."""
    allowed_tags = [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3',
        'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre'
    ]
    allowed_attrs = {
        'a': ['href', 'title'],
        '*': ['class']
    }
    
    return bleach.clean(
        content,
        tags=allowed_tags,
        attributes=allowed_attrs,
        strip=True
    )
```

---

## Phase 2: Feature Implementation (Days 3-7)

### Day 3-4: Betting System

#### 3.1 Betting Service Architecture
```
packages/shared/api/src/betting/
├── __init__.py
├── betting_service.py
├── betting_models.py
├── betting_routes.py
└── odds_calculator.py
```

**Models:**
```python
class BetType(str, Enum):
    MATCH_WINNER = "match_winner"
    MAP_WINNER = "map_winner"
    TOTAL_ROUNDS = "total_rounds"
    FIRST_BLOOD = "first_blood"
    PLAYER_KILLS = "player_kills"

class BetStatus(str, Enum):
    PENDING = "pending"
    WON = "won"
    LOST = "lost"
    CANCELLED = "cancelled"
    CASHED_OUT = "cashed_out"

class BetPlacement(BaseModel):
    user_id: str
    match_id: str
    bet_type: BetType
    selection: str  # team_id or player_id
    amount: int     # NJZ tokens
    odds: float     # At time of placement
    potential_winnings: int
```

**Odds Calculation:**
```python
class OddsCalculator:
    """Calculate betting odds using weighted metrics."""
    
    @staticmethod
    def calculate_match_odds(team_a_stats: dict, team_b_stats: dict) -> tuple[float, float]:
        """
        Returns (team_a_odds, team_b_odds)
        
        Factors:
        - Recent win rate (30%)
        - Head-to-head history (25%)
        - Current form (last 5 matches) (25%)
        - Map pool strength (20%)
        """
        pass
```

**Database Migration:**
```sql
-- 019_betting_system.sql
CREATE TABLE betting_markets (
    market_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id VARCHAR(50) NOT NULL,
    market_type VARCHAR(30) NOT NULL,
    odds_home DECIMAL(5,2) NOT NULL,
    odds_away DECIMAL(5,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'open',
    closes_at TIMESTAMP NOT NULL,
    result VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bets (
    bet_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    market_id UUID NOT NULL REFERENCES betting_markets(market_id),
    amount INTEGER NOT NULL,
    selection VARCHAR(50) NOT NULL, -- 'home' or 'away'
    odds_at_placement DECIMAL(5,2) NOT NULL,
    potential_winnings INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    placed_at TIMESTAMP DEFAULT NOW(),
    settled_at TIMESTAMP
);

CREATE INDEX idx_bets_user ON bets(user_id);
CREATE INDEX idx_bets_market ON bets(market_id);
CREATE INDEX idx_bets_status ON bets(status);
```

### Day 5-6: Fantasy League Enhancements

#### 4.1 Draft System
```python
class DraftManager:
    """Manage live fantasy drafts."""
    
    async def start_draft(self, league_id: str) -> DraftState:
        """Initialize draft with snake order."""
        pass
    
    async def make_pick(self, league_id: str, team_id: str, player_id: str) -> DraftPick:
        """Process a draft pick."""
        pass
    
    async def auto_pick(self, league_id: str, team_id: str) -> DraftPick:
        """CPU auto-pick based on rankings."""
        pass
```

#### 4.2 Scoring Algorithm
```python
class FantasyScoring:
    """Calculate fantasy points from match stats."""
    
    VALORANT_SCORING = {
        'kill': 1.0,
        'death': -0.5,
        'assist': 0.5,
        'acs': 0.01,      # Per ACS point
        'first_blood': 2.0,
        'clutch_won': 3.0,
        'ace': 5.0,
        'mvp': 3.0,
    }
    
    CS2_SCORING = {
        'kill': 1.0,
        'death': -0.5,
        'assist': 0.3,
        'adr': 0.05,      # Per ADR point
        'kast': 2.0,      # If > 70%
        'first_kill': 2.0,
        'awp_kill': 1.5,
        'clutch_won': 3.0,
    }
    
    @staticmethod
    def calculate_score(game_type: str, stats: dict) -> float:
        pass
```

#### 4.3 Leaderboards
```python
class LeaderboardService:
    """Generate and cache fantasy leaderboards."""
    
    async def get_weekly_leaderboard(self, league_id: str, week: int) -> list[LeaderboardEntry]:
        pass
    
    async def get_season_leaderboard(self, league_id: str) -> list[LeaderboardEntry]:
        pass
```

### Day 7: WebSocket Chat System

#### 5.1 WebSocket Architecture
```
packages/shared/api/src/chat/
├── __init__.py
├── chat_server.py        # WebSocket endpoint
├── chat_service.py       # Message handling
├── chat_models.py        # Message types
└── moderation.py         # Auto-moderation
```

**Implementation:**
```python
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List

class ChatConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, room: str):
        await websocket.accept()
        if room not in self.active_connections:
            self.active_connections[room] = []
        self.active_connections[room].append(websocket)
    
    async def disconnect(self, websocket: WebSocket, room: str):
        self.active_connections[room].remove(websocket)
    
    async def broadcast(self, message: dict, room: str):
        for connection in self.active_connections.get(room, []):
            await connection.send_json(message)

@app.websocket("/ws/chat/{room}")
async def chat_endpoint(websocket: WebSocket, room: str):
    await manager.connect(websocket, room)
    try:
        while True:
            data = await websocket.receive_json()
            # Validate message
            # Check rate limit
            # Apply moderation
            await manager.broadcast(data, room)
    except WebSocketDisconnect:
        await manager.disconnect(websocket, room)
```

**Moderation:**
```python
class ChatModerator:
    """Auto-moderation for chat messages."""
    
    BANNED_WORDS = [...]  # Load from config
    
    async def check_message(self, content: str, user_id: str) -> tuple[bool, str]:
        """
        Returns (is_allowed, reason_if_blocked)
        """
        # Check banned words
        # Check spam patterns
        # Check user reputation
        pass
```

---

## Implementation Schedule

| Day | Focus | Deliverables |
|-----|-------|--------------|
| **Day 1** | JWT Auth | Auth service, login/register endpoints, protected routes |
| **Day 2** | Security | Rate limiting, CSRF protection, content sanitization |
| **Day 3** | Betting Core | Betting models, odds calculator, place bet endpoint |
| **Day 4** | Betting UI | Betting panel, odds display, bet history |
| **Day 5** | Fantasy Draft | Live draft system, pick management |
| **Day 6** | Fantasy Scoring | Scoring algorithm, leaderboards |
| **Day 7** | WebSocket Chat | Real-time chat, moderation, presence |

---

## Dependencies to Install

```bash
# Authentication
pip install python-jose[cryptography] passlib[bcrypt]

# Rate Limiting
pip install redis slowapi

# Security
pip install bleach python-multipart

# WebSocket
pip install websockets

# Testing
pip install pytest-asyncio httpx
```

---

## Success Criteria

### Day 2 (Security)
- [ ] JWT tokens generated and validated
- [ ] All user-modifying endpoints protected
- [ ] Rate limiting working (100 req/min)
- [ ] Forum content sanitized

### Day 4 (Betting)
- [ ] Users can place bets with NJZ tokens
- [ ] Odds calculated dynamically
- [ ] Bet history displayed
- [ ] Winnings auto-distributed

### Day 6 (Fantasy)
- [ ] Live draft system functional
- [ ] Scoring calculated from real match data
- [ ] Leaderboards updated weekly
- [ ] Captain/vice-captain multipliers working

### Day 7 (Chat)
- [ ] Real-time messaging working
- [ ] Auto-moderation filtering spam
- [ ] User presence indicators
- [ ] Message history persisted

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| JWT implementation bugs | Use well-tested library (python-jose) |
| Rate limiting performance | Use Redis for distributed rate limiting |
| WebSocket scalability | Implement connection pooling |
| Betting integrity | All bets logged immutably, audit trail |
| Chat abuse | Multi-layer moderation: auto + manual |

---

## Next Week Preview (Week 2)

- **Day 8-9:** Admin dashboard, user management
- **Day 10-11:** Advanced analytics, reporting
- **Day 12-13:** Mobile app API endpoints
- **Day 14:** Performance optimization, load testing

---

*Plan prepared: March 15, 2026*  
*Target completion: March 22, 2026*
