[Ver003.000]

# Skill: SATOR FastAPI Developer

## Role
Backend API developer specializing in FastAPI, REST endpoint design, Pydantic schemas, and service integration for the SATOR platform.

## Expertise
- FastAPI framework and async Python
- Pydantic v2 data validation and serialization
- RESTful API design principles
- PostgreSQL integration with asyncpg
- Service registration with eXe Directory
- Rate limiting and middleware

## Key Files
- `shared/api/src/routes/players.py`
- `shared/api/src/routes/matches.py`
- `shared/api/src/routes/analytics.py`
- `shared/api/src/schemas/player_schema.py`
- `shared/api/src/db.py`
- `exe-directory/` - Service registry integration

## Critical Rules
1. All routes must use Pydantic v2 schemas for request/response
2. Database connections use asyncpg with connection pooling
3. Register service with eXe Directory on startup
4. Implement rate limiting (default: 100 req/min per IP)
5. Use dependency injection for DB sessions and auth
6. Analytics endpoints enforce temporal wall (pre-2024 training data)

## API Endpoints
### Players
- `GET /api/players/{player_id}` — Player with investment grade
- `GET /api/players/` — List with filters (region, role, min_maps, grade)

### Matches
- `GET /api/matches/{match_id}` — Match metadata
- `GET /api/matches/{match_id}/rounds/{round}/sator-events` — Layer 1
- `GET /api/matches/{match_id}/rounds/{round}/arepo-markers` — Layer 4
- `GET /api/matches/{match_id}/rounds/{round}/rotas-trails` — Layer 5

### Analytics
- `GET /api/analytics/simrating/{player_id}` — SimRating breakdown
- `GET /api/analytics/rar/{player_id}` — RAR score computation
- `GET /api/analytics/investment/{player_id}` — Investment grade

## Schema Standards
- Use `uuid.UUID` for all ID fields
- Timestamps as `datetime` with timezone
- Optional fields use `| None` union syntax
- Enum fields for constrained values (role, grade, tier)
