# SATOR Master Cross-Reference Index (Sample)

## Player Analytics
| ID | Component | Type | File | Line | Related |
|----|-----------|------|------|------|---------|
| PA-001 | SimRating | Schema | `base_schema.sql` | 145 | PA-002, PA-003 |
| PA-002 | RAR Score | Schema | `base_schema.sql` | 146 | PA-001, PA-004 |
| PA-003 | Investment Grade | Enum | `schemas/enums.py` | 23 | PA-001 |
| PA-004 | Confidence Tier | Enum | `schemas/enums.py` | 24 | PA-002 |

## API Endpoints
| ID | Endpoint | Method | File | Line | Schema |
|----|----------|--------|------|------|--------|
| API-001 | /api/players/{id} | GET | `routes/players.py` | 45 | PS-001 |
| API-002 | /api/players/ | GET | `routes/players.py` | 78 | PS-002 |
| API-003 | /api/analytics/simrating/{id} | GET | `routes/analytics.py` | 112 | PA-001 |

## Frontend Components
| ID | Component | Layer | File | Line | Hook |
|----|-----------|-------|------|------|------|
| UI-001 | SatorLayer | L1 | `SatorLayer.tsx` | 1 | useSpatialData |
| UI-002 | OperaLayer | L2 | `OperaLayer.tsx` | 1 | useSpatialData |
| UI-003 | TenetLayer | L3 | `TenetLayer.tsx` | 1 | useSpatialData |

## Database Schema
| ID | Table | Type | File | Line | Related |
|----|-------|------|------|------|---------|
| DB-001 | raws_players | RAWS | `raws_schema.sql` | 56 | DB-002 |
| DB-002 | base_players | BASE | `base_schema.sql` | 89 | DB-001 |

## Usage Example
To find all items related to Player Analytics:
1. Start with ID (e.g., PA-001)
2. Look up related IDs in Related column
3. Cross-reference with Component column for type filtering
4. Navigate directly to File:Line for implementation
