[Ver001.000]

# API Package

This package contains shared API components for the SATOR platform.

## Components

### Database (`database.py`)
Connection pool management for PostgreSQL with asyncpg.

```python
from packages.shared.api import init_pool, get_pool

# Initialize
init_pool(os.getenv("DATABASE_URL"))

# Use in code
pool = get_pool()
results = await pool.fetch("SELECT * FROM players")
```

### Cache (`cache.py`)
Redis caching with automatic serialization.

```python
from packages.shared.api import cached, init_cache

@cached(ttl=3600)
async def get_expensive_data():
    return await calculate_data()
```

### Circuit Breaker (`circuit_breaker.py`)
Fault tolerance for external API calls.

```python
from packages.shared.api import circuit_breaker

@circuit_breaker(name="vlr_api", failure_threshold=3)
async def fetch_vlr_data():
    return await requests.get("...")
```

### Feature Flags (`features.py`)
Gradual rollouts and A/B testing.

```python
from packages.shared.api import feature_flag

@feature_flag("new_algorithm")
async def new_algorithm(user_id: str):
    return await calculate_v2(user_id)
```