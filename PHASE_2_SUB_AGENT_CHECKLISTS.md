[Ver001.000]

# Phase 2 Sub-Agent Checklists
## Pre-Spawn Verification & Post-Completion Validation

---

## Sub-Agent Alpha: Betting Routes

### Pre-Spawn Read-Only Verification
```bash
# CHECK 1: Verify odds_engine.py exists and is complete
[ -f "packages/shared/api/src/betting/odds_engine.py" ] && echo "✅ odds_engine.py exists" || echo "❌ MISSING"
wc -c packages/shared/api/src/betting/odds_engine.py | awk '$1 >= 9500 {print "✅ Size OK"} $1 < 9500 {print "❌ Too small"}'

# CHECK 2: Verify main.py structure
python -c "
import ast
with open('packages/shared/api/main.py', 'r') as f:
    tree = ast.parse(f.read())
imports = [node.names[0].name for node in ast.walk(tree) if isinstance(node, ast.ImportFrom)]
print('✅ main.py parseable' if 'src.sator.rar_routes' in str(imports) else '❌ main.py structure unclear')
"

# CHECK 3: Check database connection
python -c "
import sys
sys.path.insert(0, 'packages/shared/api')
try:
    from src.db_manager import db
    print('✅ DB manager importable')
except Exception as e:
    print(f'⚠️  DB import: {e}')
"

# CHECK 4: Verify test directory exists
[ -d "tests/unit/betting" ] || mkdir -p tests/unit/betting
echo "✅ Test directory ready"

# CHECK 5: Check FastAPI available
python -c "import fastapi; print(f'✅ FastAPI {fastapi.__version__}')"
```

### Spawn Brief for Sub-Agent Alpha

**Task:** Implement Betting API Routes  
**Duration:** 2 days  
**Priority:** P0

**Context Files:**
- `packages/shared/api/src/betting/odds_engine.py` - Complete odds engine
- `packages/shared/api/src/sator/rar_routes.py` - Reference for route structure
- `packages/shared/api/main.py` - Mount point

**Required Outputs:**
1. `packages/shared/api/src/betting/routes.py` (300+ lines)
2. `packages/shared/api/src/betting/schemas.py` (Pydantic models)
3. `packages/shared/api/src/betting/models.py` (DB models)
4. Mount integration in `main.py`
5. `tests/unit/betting/test_routes.py` (90%+ coverage)

**Endpoints to Implement:**
```python
GET    /api/betting/matches/{match_id}/odds
GET    /api/betting/matches/{match_id}/odds/history
POST   /api/betting/matches/{match_id}/odds/calculate
GET    /api/betting/leaderboard
GET    /api/betting/odds/formats
```

**Constraints:**
- Use existing OddsEngine from odds_engine.py
- Follow FastAPI patterns from rar_routes.py
- Include rate limiting (5/minute per IP)
- All functions must be async
- Use proper HTTP status codes

### Post-Completion Verification
```bash
# VERIFY 1: Syntax check
python -m py_compile packages/shared/api/src/betting/routes.py && echo "✅ Syntax OK"
python -m py_compile packages/shared/api/src/betting/schemas.py && echo "✅ Schemas OK"

# VERIFY 2: Import check
python -c "
import sys
sys.path.insert(0, 'packages/shared/api')
from src.betting.routes import router
print('✅ Router importable')
print(f'✅ Routes: {[r.path for r in router.routes]}')
"

# VERIFY 3: Type check
pip install mypy 2>/dev/null
mypy packages/shared/api/src/betting/ --ignore-missing-imports --quiet && echo "✅ Type check OK"

# VERIFY 4: Test execution
cd packages/shared/api
pytest tests/unit/betting/ -v --tb=short 2>&1 | tail -5

# VERIFY 5: Integration check
grep -q "betting_router" packages/shared/api/main.py && echo "✅ Router mounted" || echo "❌ Not mounted"

# VERIFY 6: Documentation
grep -q "betting" packages/shared/api/main.py && echo "✅ Documented"
```

---

## Sub-Agent Beta: WebSocket Gateway

### Pre-Spawn Read-Only Verification
```bash
# CHECK 1: Verify gateway exists
[ -f "packages/shared/api/src/gateway/websocket_gateway.py" ] && echo "✅ gateway exists"
wc -c packages/shared/api/src/gateway/websocket_gateway.py | awk '$1 >= 13000 {print "✅ Size OK"}'

# CHECK 2: Check Redis availability
python -c "
try:
    import redis
    print('✅ Redis SDK available')
except:
    print('⚠️  Install redis: pip install redis')
"

# CHECK 3: Verify frontend structure
cd apps/website-v2
[ -f "src/components/TENET/store/index.ts" ] && echo "✅ TENET store exists"
[ -d "src/components/TENET/services" ] || mkdir -p src/components/TENET/services
echo "✅ Services directory ready"

# CHECK 4: Check WebSocket client availability
npm list ws 2>/dev/null | grep -q ws && echo "✅ ws package installed" || echo "⚠️  ws not installed"

# CHECK 5: Verify test structure
[ -f "tests/e2e/realtime.spec.ts" ] && echo "✅ E2E test exists" || echo "⚠️  Will create test"
```

### Spawn Brief for Sub-Agent Beta

**Task:** Activate WebSocket Gateway  
**Duration:** 2 days  
**Priority:** P0

**Context Files:**
- `packages/shared/api/src/gateway/websocket_gateway.py` - Gateway implementation
- `packages/shared/api/main.py` - Mount point
- `apps/website-v2/src/components/TENET/store/index.ts` - Zustand store

**Required Outputs:**
1. `packages/shared/api/src/gateway/routes.py` (HTTP management)
2. Mount in `main.py` at `/ws/gateway`
3. `apps/website-v2/src/components/TENET/services/websocket.ts`
4. `apps/website-v2/src/components/TENET/hooks/useWebSocket.ts`
5. Updated `TENET/store/index.ts` (WebSocket slice)
6. `tests/e2e/websocket.spec.ts` (E2E tests)

**Features to Implement:**
```typescript
// Client-side
- Auto-reconnect with exponential backoff
- Channel subscription management
- Presence tracking integration
- Message queue for offline support
- Heartbeat/ping-pong
```

```python
# Server-side
- Connection manager
- Channel pub/sub
- Presence tracking
- Message persistence (last 500)
- Broadcast capabilities
```

**Constraints:**
- Use existing WebSocketGateway class
- Integrate with existing Zustand store
- Support 5 channels: global, match:{id}, lobby:{id}, team:{id}, hub:{name}
- Handle disconnections gracefully

### Post-Completion Verification
```bash
# VERIFY 1: Backend syntax
python -m py_compile packages/shared/api/src/gateway/routes.py && echo "✅ Syntax OK"

# VERIFY 2: Frontend typecheck
cd apps/website-v2
npm run typecheck 2>&1 | grep -c "websocket\|WebSocket" | xargs -I {} sh -c '[ {} -eq 0 ] && echo "✅ No WS errors" || echo "⚠️  WS errors found"'

# VERIFY 3: Import checks
python -c "
import sys
sys.path.insert(0, 'packages/shared/api')
from src.gateway.websocket_gateway import WebSocketGateway
g = WebSocketGateway()
print('✅ Gateway importable')
print(f'✅ Channels: {list(g.channels.keys())}')
"

# VERIFY 4: Mount verification
grep -q "/ws/gateway" packages/shared/api/main.py && echo "✅ Endpoint mounted"

# VERIFY 5: E2E test execution
cd apps/website-v2
npx playwright test tests/e2e/websocket.spec.ts --project=chromium 2>&1 | tail -3
```

---

## Sub-Agent Gamma: UI Components

### Pre-Spawn Read-Only Verification
```bash
cd apps/website-v2

# CHECK 1: Verify tokens
[ -f "src/components/TENET/design-system/tokens.json" ] && echo "✅ Tokens exist"
python -c "import json; f=open('src/components/TENET/design-system/tokens.json'); d=json.load(f); print(f'✅ {len(d)} token categories')"

# CHECK 2: Check existing components
ls src/components/TENET/ui/**/*.tsx 2>/dev/null | wc -l | xargs -I {} echo "✅ {} components exist"

# CHECK 3: Verify Button/Input patterns
head -30 src/components/TENET/ui/primitives/Button.tsx

# CHECK 4: Check Tailwind config
[ -f "tailwind.config.js" ] && echo "✅ Tailwind configured"

# CHECK 5: TypeScript strict mode
grep -q '"strict": true' tsconfig.json && echo "✅ Strict mode enabled"
```

### Spawn Brief for Sub-Agent Gamma

**Task:** Implement 33 Remaining UI Components  
**Duration:** 4 days  
**Priority:** P2 (parallel batches)

**Context Files:**
- `src/components/TENET/design-system/tokens.json` - Design tokens
- `src/components/TENET/ui/primitives/Button.tsx` - Reference pattern
- `src/components/TENET/ui/primitives/Input.tsx` - Reference pattern

**Batch Delivery Schedule:**
```
Day 1: Primitives (9 components)
  - Checkbox, Radio, Switch, Select, Textarea
  - Slider, DatePicker, FileUpload, ColorPicker

Day 2: Composite (8 components)  
  - Accordion, Tabs, Breadcrumb, Pagination
  - Dropdown, Tooltip, Popover, Drawer

Day 3: Layout (8 components)
  - Container, Grid, Flex, Spacer
  - Divider, AspectRatio, Center, SimpleGrid

Day 4: Feedback (8 components)
  - Alert, Progress, CircularProgress
  - Skeleton, Spinner, Badge, Avatar, Rating
```

**Component Template:**
```typescript
/** [Ver001.000] */
export interface ComponentProps extends React.HTMLAttributes<HTMLElement> {
  variant?: string;
  size?: string;
  // ... specific props
}

export const Component = React.forwardRef<HTMLElement, ComponentProps>(
  ({ variant = 'default', ...props }, ref) => {
    // Implementation using design tokens
  }
);
Component.displayName = 'Component';
```

**Constraints:**
- Must use design tokens (tokens.json)
- Must forward refs
- Must have TypeScript interfaces
- Must support className extension
- Accessibility attributes required

### Post-Completion Verification (Per Batch)
```bash
# VERIFY 1: Component count
ls src/components/TENET/ui/**/*.tsx | wc -l | awk '{print ($1 == 50) ? "✅ 50 components" : "⚠️ " $1 " components"}'

# VERIFY 2: TypeScript check
npm run typecheck 2>&1 | grep -E "TENET/ui" | wc -l | awk '{print ($1 == 0) ? "✅ No type errors" : "❌ " $1 " errors"}'

# VERIFY 3: Export verification
grep -r "export" src/components/TENET/ui/*/index.tsx 2>/dev/null | wc -l | awk '{print "✅ " $1 " exports"}'

# VERIFY 4: Design token usage
grep -r "tokens\." src/components/TENET/ui/ 2>/dev/null | wc -l | awk '{print "✅ " $1 " token references"}'

# VERIFY 5: Ref forwarding
grep -r "forwardRef" src/components/TENET/ui/**/*.tsx | wc -l | awk '{print "✅ " $1 " forwarded refs"}'
```

---

## Sub-Agent Delta: OAuth & 2FA

### Pre-Spawn Read-Only Verification
```bash
# CHECK 1: Verify auth structure
[ -f "packages/shared/api/src/auth/auth_routes.py" ] && echo "✅ Auth routes exist"
[ -f "packages/shared/api/src/auth/auth_utils.py" ] && echo "✅ Auth utils exist"
[ -f "packages/shared/api/src/auth/auth_schemas.py" ] && echo "✅ Auth schemas exist"

# CHECK 2: Check JWT configuration
python -c "
import sys
sys.path.insert(0, 'packages/shared/api')
from src.auth.auth_utils import create_access_token
print('✅ JWT utilities working')
"

# CHECK 3: Verify user table supports OAuth
python -c "
# Check if users table has oauth columns
# This would need DB connection - placeholder
print('⚠️  Manual: Verify users table has oauth_provider, oauth_id columns')
"

# CHECK 4: Check frontend auth placeholder
grep -q "AuthProvider" apps/website-v2/src/components/TENET/index.tsx && echo "✅ Frontend placeholder exists"

# CHECK 5: Dependencies
grep -q "authlib" packages/shared/requirements.txt 2>/dev/null && echo "✅ authlib listed" || echo "⚠️  Will add authlib"
grep -q "pyotp" packages/shared/requirements.txt 2>/dev/null && echo "✅ pyotp listed" || echo "⚠️  Will add pyotp"
```

### Spawn Brief for Sub-Agent Delta

**Task:** OAuth Integration & 2FA Implementation  
**Duration:** 3 days  
**Priority:** P1

**Context Files:**
- `packages/shared/api/src/auth/auth_routes.py` - Existing auth
- `packages/shared/api/src/auth/auth_utils.py` - JWT utilities
- `packages/shared/api/src/auth/auth_schemas.py` - Schemas
- `apps/website-v2/src/components/TENET/index.tsx` - Frontend placeholder

**Required Outputs:**
1. `packages/shared/api/src/auth/oauth.py` (OAuth handlers)
2. `packages/shared/api/src/auth/oauth_routes.py` (OAuth endpoints)
3. `packages/shared/api/src/auth/two_factor.py` (TOTP implementation)
4. Updated `auth_routes.py` (2FA login flow)
5. `apps/website-v2/src/components/TENET/components/auth/OAuthButtons.tsx`
6. `apps/website-v2/src/components/TENET/components/auth/TwoFactorSetup.tsx`
7. `apps/website-v2/src/components/TENET/components/auth/TwoFactorVerify.tsx`

**OAuth Providers:**
- Discord (priority 1)
- Google (priority 2)
- GitHub (priority 3)

**2FA Features:**
- TOTP QR code generation
- TOTP verification
- Backup codes (10 single-use)
- 2FA disable with verification

**Endpoints:**
```python
GET  /api/auth/oauth/{provider}/login
GET  /api/auth/oauth/{provider}/callback
POST /api/auth/2fa/setup
POST /api/auth/2fa/verify
POST /api/auth/2fa/disable
GET  /api/auth/2fa/backup-codes
```

**Constraints:**
- OAuth state parameter required (CSRF protection)
- TOTP secrets encrypted at rest
- Backup codes hashed (not plaintext)
- Link OAuth to existing accounts by email

### Post-Completion Verification
```bash
# VERIFY 1: OAuth endpoints
curl -s http://localhost:8000/api/auth/oauth/discord/login 2>&1 | grep -q "redirect" && echo "✅ Discord OAuth responding"

# VERIFY 2: 2FA flow
python -c "
import sys
sys.path.insert(0, 'packages/shared/api')
from src.auth.two_factor import generate_totp_secret
secret = generate_totp_secret()
print(f'✅ TOTP generation works: {secret[:10]}...')
"

# VERIFY 3: Frontend components
ls apps/website-v2/src/components/TENET/components/auth/*.tsx 2>/dev/null | wc -l | awk '{print ($1 >= 3) ? "✅ " $1 " auth components" : "⚠️  Only " $1 " components"}'

# VERIFY 4: Type check
npm run typecheck 2>&1 | grep -c "auth\|OAuth\|2FA" | awk '{print ($1 == 0) ? "✅ No auth errors" : "⚠️ " $1 " errors"}'

# VERIFY 5: Schema validation
python -c "
import sys
sys.path.insert(0, 'packages/shared/api')
from src.auth.auth_schemas import UserLogin, Token
print('✅ Schemas valid')
"
```

---

## Sub-Agent Echo: Push Notifications

### Pre-Spawn Read-Only Verification
```bash
# CHECK 1: Verify notification store exists
grep -q "notifications" apps/website-v2/src/components/TENET/store/index.ts && echo "✅ Store has notifications slice"

# CHECK 2: Check service worker structure
[ -f "apps/website-v2/public/service-worker.js" ] && echo "✅ SW exists" || echo "⚠️  Will create SW"
[ -d "apps/website-v2/public" ] && echo "✅ Public directory exists"

# CHECK 3: Check manifest
[ -f "apps/website-v2/public/manifest.json" ] && echo "✅ Manifest exists"

# CHECK 4: Verify VAPID can be generated
python -c "
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
print('✅ Cryptography available for VAPID')
"

# CHECK 5: Check if pywebpush available
python -c "import pywebpush" 2>/dev/null && echo "✅ pywebpush available" || echo "⚠️  Will install pywebpush"
```

### Spawn Brief for Sub-Agent Echo

**Task:** Push Notification System  
**Duration:** 2 days  
**Priority:** P1

**Context Files:**
- `apps/website-v2/src/components/TENET/store/index.ts` - Notification state
- `apps/website-v2/public/` - Static assets
- `packages/shared/api/main.py` - Route mounting

**Required Outputs:**
1. `packages/shared/api/src/notifications/push_service.py`
2. `packages/shared/api/src/notifications/routes.py`
3. `packages/shared/api/src/notifications/models.py`
4. `scripts/generate_vapid_keys.py`
5. `apps/website-v2/public/service-worker.js`
6. `apps/website-v2/src/components/TENET/services/pushNotifications.ts`
7. `apps/website-v2/src/components/TENET/components/settings/NotificationPreferences.tsx`
8. `.env.example` updates (VAPID keys)

**Features:**
```python
# Backend
- VAPID key generation
- Subscription storage
- Push dispatch queue
- Notification preferences
```

```typescript
// Frontend
- Service worker registration
- Permission request flow
- Subscription management
- Notification click handling
- Badge count updates
```

**Endpoints:**
```python
POST /api/notifications/subscribe
POST /api/notifications/unsubscribe
GET  /api/notifications/preferences
PUT  /api/notifications/preferences
POST /api/notifications/test  # Admin only
```

**Constraints:**
- VAPID keys must be kept secret
- Support Safari, Chrome, Firefox
- Graceful degradation if denied
- Handle subscription expiration

### Post-Completion Verification
```bash
# VERIFY 1: VAPID keys generated
[ -f ".vapid_keys.json" ] && echo "✅ VAPID keys exist"

# VERIFY 2: Service worker registered
grep -q "self.addEventListener('push'" apps/website-v2/public/service-worker.js && echo "✅ Push handler in SW"

# VERIFY 3: Routes mounted
grep -q "notifications" packages/shared/api/main.py && echo "✅ Routes mounted"

# VERIFY 4: Frontend service
[ -f "apps/website-v2/src/components/TENET/services/pushNotifications.ts" ] && echo "✅ Frontend service exists"

# VERIFY 5: Test notification
python scripts/test_push.py 2>&1 | grep -q "sent\|delivered" && echo "✅ Test notification sent"
```

---

## Sudo Tech: Integration & Coordination

### Responsibilities by Phase

**Wave 1 (Days 1-2):**
- [ ] Execute all pre-spawn read-only checks
- [ ] Spawn Alpha, Beta, Gamma agents
- [ ] Evening review of deliverables
- [ ] Run post-completion verifications
- [ ] Merge approved code

**Wave 2 (Days 3-4):**
- [ ] Execute pre-spawn checks for Delta, Echo
- [ ] Spawn Delta, Echo agents
- [ ] Continue Gamma batches
- [ ] Evening review and feedback
- [ ] Merge approved code

**Wave 3 (Days 5-7):**
- [ ] Cross-service integration (OAuth + WS)
- [ ] E2E test suite completion
- [ ] Performance optimization
- [ ] Documentation updates
- [ ] Final verification
- [ ] Production readiness check

### Daily Checklist Template

```markdown
## Day X - Date

### Morning (Spawn Phase)
- [ ] Run pre-spawn read-only checks
- [ ] Document current state
- [ ] Spawn assigned agents
- [ ] Provide context and constraints

### During Day (Monitor)
- [ ] Available for agent questions
- [ ] Track progress in AGENT_REPORTs
- [ ] Note blockers

### Evening (Review Phase)
- [ ] Collect AGENT_VERIFICATION.md
- [ ] Run post-completion checks
- [ ] Code review
- [ ] Approve or request changes
- [ ] Update integration status

### Sign-off
- [ ] All deliverables checked
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Ready for next wave
```

---

## Cross-Agent Dependency Matrix

| Task | Depends On | Blocks |
|------|------------|--------|
| Alpha (Betting) | None | None |
| Beta (WebSocket) | None | None |
| Gamma (UI) | None | None |
| Delta (OAuth) | Beta (for WS auth) | None |
| Echo (Push) | None | None |
| Sudo Integration | All above | Production |

**Note:** All Wave 1 tasks are independent and can run in parallel.

---

*Checklist Version: 001.000*
*Use with: PHASE_2_EXECUTION_PLAN.md*
