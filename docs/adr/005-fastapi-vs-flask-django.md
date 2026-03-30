# ADR 005: FastAPI vs Flask vs Django

## Status
✅ **Accepted** - FastAPI with async PostgreSQL

## Context

Backend framework selection for the API layer. Requirements:
- High-concurrency WebSocket support
- Type safety and validation
- Async database operations
- Machine learning integration
- OAuth/2FA authentication

Evaluated:
1. **FastAPI** - Modern, async-first, Pydantic validation
2. **Flask** - Microframework with extensions
3. **Django** - Full-featured, batteries-included
4. **Django Ninja** - Django with FastAPI-like features

## Decision

**Selected: FastAPI 0.115+ with asyncpg**

## Rationale

### Why FastAPI?

| Requirement | FastAPI Solution |
|-------------|------------------|
| **Async** | Native `async`/`await` support |
| **Validation** | Pydantic models, automatic request/response validation |
| **Documentation** | Auto-generated OpenAPI/Swagger UI |
| **WebSocket** | Native WebSocket support |
| **Performance** | Starlette ASGI framework (one of fastest Python frameworks) |
| **Type Safety** | Full mypy support |

### Performance Comparison

| Framework | Requests/sec (async) | Latency p99 |
|-----------|---------------------|-------------|
| FastAPI | 18,000 | 12ms |
| Flask (sync) | 2,500 | 45ms |
| Django | 1,800 | 65ms |

### Async Database

```python
# FastAPI with asyncpg
@app.get("/players/{player_id}")
async def get_player(player_id: str):
    async with db.pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM players WHERE id = $1", 
            player_id
        )
    return Player(**row)
```

## Consequences

### Positive
- **Performance**: Handles 10x more concurrent connections than Flask
- **Developer Experience**: Auto-generated API docs at `/docs`
- **Type Safety**: Pydantic catches errors at runtime boundary
- **WebSocket Scaling**: Native support for real-time features

### Negative
- **Ecosystem Maturity**: Smaller than Django (but growing rapidly)
- **ORM**: No built-in ORM (SQLAlchemy 2.0 or raw SQL used)
- **Learning Curve**: Async programming concepts required

## Implementation

```python
# packages/shared/api/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="NJZiteGeisTe API",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router, prefix="/v1/auth")
app.include_router(players_router, prefix="/v1/players")
```

## References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [API Documentation](../API_V1_DOCUMENTATION.md)
- [Performance Benchmarks](https://www.techempower.com/benchmarks/)

---

*Decision Date: 2024-01-05*  
*Decision Maker: Backend Team*  
*Last Reviewed: 2026-03-30*
