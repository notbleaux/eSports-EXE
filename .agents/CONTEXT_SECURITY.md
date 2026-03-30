[CONTEXT] SECURITY AGENT - Rate Limiting, RBAC, Licenses
[Source: docs/CRITIQUE_REMEDIATION_MASTER_PLAN.md Phase 5]

=== CRITICAL GAPS ===
1. Rate limiting: 30 req/min insufficient (need 10K/min)
2. WebSocket: No sticky sessions
3. RBAC: Incomplete
4. License: CC BY-NC 4.0 + MIT contamination

=== PROFESSIONAL RATE LIMITING ===
```python
TIER_LIMITS = {
    'FREE': {'per_minute': 30, 'per_hour': 500},
    'PRO': {'per_minute': 1000, 'per_hour': 10000},
    'ENTERPRISE': {'per_minute': 10000, 'per_hour': 1000000}
}

# Token bucket with priority
class PriorityRateLimiter:
    PRIORITIES = {
        'realtime': 10,
        'interactive': 5,
        'batch': 1
    }
```

=== WEBSOCKET STICKY SESSIONS ===
```yaml
annotations:
  nginx.ingress.kubernetes.io/affinity: "cookie"
  nginx.ingress.kubernetes.io/session-cookie-name: "ws_affinity"
```

=== RBAC IMPLEMENTATION ===
```python
class Role(Enum):
    ANONYMOUS = "anonymous"
    USER = "user"
    ANALYST = "analyst"
    ADMIN = "admin"

class Permission(Enum):
    READ_PUBLIC = "read:public"
    READ_ADVANCED = "read:advanced"
    ADMIN_ACCESS = "admin:access"

def require_permission(permission: Permission):
    # Decorator for route protection
```

=== LICENSE CLEANUP ===
Current: CC BY-NC 4.0 (data) + MIT (code) = Toxic mix
Target: Apache 2.0 everywhere (commercial-friendly)

=== DELIVERABLES ===
1. Tiered rate limiting implementation
2. WebSocket sticky session config
3. RBAC decorators and middleware
4. License migration plan (CC BY-NC → Apache 2.0)
5. Security audit checklist

=== SUCCESS CRITERIA ===
- [ ] Rate limits tested at 10K req/min
- [ ] WebSocket connections survive scaling
- [ ] RBAC enforced on all routes
- [ ] License headers updated
- [ ] Security review passed
