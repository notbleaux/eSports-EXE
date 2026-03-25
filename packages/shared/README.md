[Ver001.000]

# Shared Packages — NJZiteGeisTe Platform

**Location:** `packages/shared/`  
**Purpose:** Shared libraries and components for the SATOR platform

---

## 📁 Package Structure

```
packages/shared/
├── api/                          # Shared API components
│   ├── README.md
│   ├── cache.py                  # Redis caching utilities
│   ├── circuit_breaker.py        # Fault tolerance
│   ├── database.py               # PostgreSQL connection pooling
│   ├── features.py               # Feature flags
│   └── pandascore_client.py      # Pandascore API client
│
├── axiom-esports-data/           # Data pipeline & API
│   ├── api/                      # FastAPI application
│   │   ├── main.py               # API entry point
│   │   ├── src/
│   │   │   ├── db.py             # Database queries
│   │   │   ├── routes/           # API routes
│   │   │   │   ├── players.py
│   │   │   │   ├── matches.py
│   │   │   │   ├── analytics.py
│   │   │   │   ├── search.py
│   │   │   │   └── websocket.py
│   │   │   ├── schemas/          # Pydantic schemas
│   │   │   └── middleware/       # Firewall, auth
│   │   └── tests/                # API tests
│   │
│   ├── pipeline/                 # ETL pipeline
│   │   ├── coordinator/          # Job coordination
│   │   ├── extractors/           # Data extractors
│   │   │   ├── cs/               # Counter-Strike
│   │   │   └── valorant/         # Valorant
│   │   ├── verification/         # Data validation
│   │   └── monitoring/           # Pipeline monitoring
│   │
│   ├── extraction/               # Web scraping
│   │   └── src/
│   │       ├── scrapers/
│   │       └── parsers/
│   │
│   ├── analytics/                # Analytics engine
│   │   ├── simrating.py          # SimRating calculation
│   │   ├── rar.py                # RAR calculation
│   │   └── investment_grader.py  # Investment grading
│   │
│   ├── infrastructure/           # Database migrations
│   │   └── migrations/
│   │       ├── 001_initial_schema.sql
│   │       ├── 002_sator_layers.sql
│   │       ├── 003_dual_storage.sql
│   │       └── ...
│   │
│   └── docs/                     # Documentation
│       ├── API_REFERENCE.md
│       ├── DATA_DICTIONARY.md
│       └── SATOR_ARCHITECTURE.md
│
├── apps/                         # Shared applications
│   ├── sator-web/                # Web components
│   └── radiantx-game/            # Godot export modules
│
└── packages/                     # NPM packages
    ├── api-client/               # TypeScript API client
    ├── data-partition-lib/       # Firewall library
    └── stats-schema/             # TypeScript schemas
```

---

## 🔧 Components

### API Components (`api/`)

#### Database (`database.py`)
Connection pool management for PostgreSQL with asyncpg.

```python
from packages.shared.api import init_pool, get_pool

# Initialize
init_pool(os.getenv("DATABASE_URL"))

# Use in code
pool = get_pool()
results = await pool.fetch("SELECT * FROM players")
```

#### Cache (`cache.py`)
Redis caching with automatic serialization.

```python
from packages.shared.api import cached, init_cache

@cached(ttl=3600)
async def get_expensive_data():
    return await calculate_data()
```

#### Circuit Breaker (`circuit_breaker.py`)
Fault tolerance for external API calls.

```python
from packages.shared.api import circuit_breaker

@circuit_breaker(name="vlr_api", failure_threshold=3)
async def fetch_vlr_data():
    return await requests.get("...")
```

#### Feature Flags (`features.py`)
Gradual rollouts and A/B testing.

```python
from packages.shared.api import feature_flag

@feature_flag("new_algorithm")
async def new_algorithm(user_id: str):
    return await calculate_v2(user_id)
```

#### Pandascore Client (`pandascore_client.py`)
Official Pandascore API integration for legal esports data.

```python
from packages.shared.api import PandascoreClient, HybridDataSource

# Direct usage
async with PandascoreClient() as client:
    matches = await client.get_valorant_matches()

# Hybrid (Pandascore + fallback)
async with HybridDataSource() as source:
    matches = await source.get_matches()
```

---

## 🚀 API Layer (`axiom-esports-data/api/`)

### Running the API

```bash
cd packages/shared/axiom-esports-data/api

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload

# Run production server
uvicorn main:app --host 0.0.0.0 --port 8000
```

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /v1/players/{id}` | Get player by ID |
| `GET /v1/players/` | List players with filters |
| `GET /v1/matches/{id}` | Get match by ID |
| `GET /v1/matches/` | List matches |
| `GET /v1/analytics/simrating/{id}` | SimRating breakdown |
| `GET /v1/analytics/leaderboard` | Leaderboard rankings |
| `GET /v1/search/` | Unified search |
| `WS /v1/ws` | WebSocket real-time |

See [API Documentation](../../docs/API_V1_DOCUMENTATION.md) for complete reference.

### Environment Variables

```bash
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/sator
REDIS_URL=redis://localhost:6379

# Optional
PANDASCORE_API_KEY=pc_live_xxxxxxxx
APP_ENVIRONMENT=development
LOG_LEVEL=INFO
```

---

## 📊 Data Pipeline (`axiom-esports-data/pipeline/`)

### Pipeline Stages

1. **Discover** — Find new matches/events
2. **Fetch** — Download raw data
3. **Verify** — Checksum and integrity
4. **Parse** — Extract structured data
5. **Transform** — Map to KCRITR schema
6. **Crossref** — Validate against external sources
7. **Store** — Write to PostgreSQL
8. **Index** — Update extraction_log

### Running the Pipeline

```bash
# Run coordinator
cd packages/shared/axiom-esports-data
python -m pipeline.coordinator

# Run specific extractor
python -m pipeline.extractors.valorant.extractor
```

---

## 🧪 Testing

```bash
# API tests
cd packages/shared/axiom-esports-data/api
pytest tests/ -v

# Pipeline tests
pytest tests/integration/test_pipeline_e2e.py

# Firewall tests
cd packages/shared/packages/data-partition-lib
npm test
```

---

## 📦 NPM Packages

### `@sator/api-client`
TypeScript API client for the SATOR API.

```bash
cd packages/shared/packages/api-client
npm install
npm run build
```

### `@sator/data-partition-lib`
Data partition firewall library.

```bash
cd packages/shared/packages/data-partition-lib
npm install
npm test
```

### `@sator/stats-schema`
TypeScript schemas for player statistics.

```bash
cd packages/shared/packages/stats-schema
npm install
npm run validate:schema
```

---

## 🔐 Security

### Data Partition Firewall

**CRITICAL:** Game simulation data and web platform data are strictly separated.

```python
# Enforce data partition
from firewall import sanitize_for_web

web_safe_data = sanitize_for_web(game_data)
```

**GAME_ONLY_FIELDS (Blocked from web):**
- `internalAgentState` — AI decision tree
- `radarData` — Real-time positions
- `detailedReplayFrameData` — Per-tick frames
- `simulationTick` — Engine counter
- `seedValue` — RNG seed
- `visionConeData` — Agent vision
- `smokeTickData` — Smoke state
- `recoilPattern` — Weapon recoil

---

## 📝 Development

### Code Style

| Language | Tool | Configuration |
|----------|------|---------------|
| Python | Black | `--line-length=100` |
| Python | Ruff | Fix enabled |
| Python | mypy | `--ignore-missing-imports` |
| TypeScript | ESLint | `@typescript-eslint` |
| TypeScript | Prettier | Default |

### Pre-commit

```bash
# Install pre-commit
pip install pre-commit
pre-commit install

# Run manually
pre-commit run --all-files
```

---

## 📚 Documentation

- [API Reference](../../docs/API_V1_DOCUMENTATION.md)
- [Architecture](../../docs/ARCHITECTURE_V2.md)
- [Data Dictionary](axiom-esports-data/docs/DATA_DICTIONARY.md)
- [SATOR Architecture](axiom-esports-data/docs/SATOR_ARCHITECTURE.md)

---

**Libre-X-eSport Shared Packages** — *Core infrastructure for the 4NJZ4 TENET Platform*

*Last Updated: March 15, 2026*
