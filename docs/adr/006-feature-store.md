# ADR-006: Feature Store Architecture

[Ver001.000]

## Status

**Accepted**

## Context

The NJZiteGeisTe Platform requires a robust feature management system for ML model training and serving. Key requirements include:

1. **Point-in-time correctness**: Training data must reflect feature values as they existed at prediction time
2. **Low-latency serving**: Online inference requires sub-10ms feature retrieval
3. **Feature versioning**: Schema changes must be tracked and manageable
4. **Training/serving consistency**: Same feature definitions used in both contexts

Existing solutions like Tecton and Feast provide these capabilities but require significant infrastructure investment. We need a solution that balances capability with operational simplicity for our free-tier deployment model.

## Decision

We will implement a **dual-store feature store architecture** with:

### Online Store (Redis)
- **Purpose**: Low-latency feature serving for real-time inference
- **Data**: Current feature values only
- **TTL**: Configurable expiration (default 24 hours)
- **Latency target**: < 10ms p99
- **Key format**: `feature:{entity_type}:{entity_id}:{feature_name}`

### Offline Store (PostgreSQL/TimescaleDB)
- **Purpose**: Historical feature storage for training data generation
- **Data**: All feature values with timestamps
- **Retention**: Configurable (default 2 years)
- **Partitioning**: By time (monthly partitions)
- **Query pattern**: Point-in-time lookups for training data

### Key Components

```
services/api/src/njz_api/feature_store/
├── store.py        # Core store implementation
├── registry.py     # Feature definition management
└── schemas.py      # Pydantic models
```

## Consequences

### Positive

1. **Point-in-time correctness**: Historical queries use offline store with precise timestamp filtering
2. **Cost efficiency**: Redis used only for hot data, PostgreSQL for cold storage
3. **Simplicity**: No additional infrastructure (Kafka, Spark) required
4. **Flexibility**: Easy to migrate to Tecton/Feast later if needed
5. **Versioning**: Built-in feature definition versioning in registry

### Negative

1. **Complexity**: Application must write to both stores
2. **Consistency**: Eventual consistency between online/offline stores
3. **Scale limits**: Redis memory limits feature cardinality
4. **Manual backfill**: No automated pipeline for historical feature computation

### Migration Path

If we outgrow this implementation:
1. Feature definitions are compatible with Tecton/Feast
2. Offline store schema can be imported to S3 + Athena
3. Online store can be replaced with DynamoDB or Redis Cluster

## Implementation Details

### Feature Definition

```python
class FeatureDefinition(BaseModel):
    name: str
    version: str
    entity_type: str  # player, team, match
    feature_type: FeatureType  # numeric, categorical, etc.
    store_type: FeatureStoreType  # online, offline, both
    ttl_seconds: Optional[int]
    validation_rules: Dict[str, Any]
```

### Feature Value

```python
class FeatureValue(BaseModel):
    feature_name: str
    entity_id: UUID
    entity_type: str
    value: Union[float, int, str, bool, List[float]]
    computed_at: datetime
    event_timestamp: Optional[datetime]
    source_system: str  # pandascore, simulation, etc.
```

### Usage Example

```python
# Register a feature
registry = await get_feature_registry()
await registry.register_feature(FeatureDefinition(
    name="player_kd_ratio",
    entity_type="player",
    feature_type=FeatureType.NUMERIC,
    store_type=FeatureStoreType.BOTH,
))

# Write a feature value
store = await get_feature_store()
await store.write_feature(FeatureValue(
    feature_name="player_kd_ratio",
    entity_id=player_id,
    entity_type="player",
    value=1.5,
    computed_at=datetime.utcnow(),
))

# Get online features (for inference)
response = await store.get_online_features(
    "player", player_id, ["kd_ratio", "acs"]
)

# Get historical features (for training)
query = OfflineFeatureQuery(
    entity_type="player",
    feature_names=["kd_ratio"],
    start_time=start,
    end_time=end,
)
values = await store.get_offline_features(query)
```

## Related Decisions

- ADR-007: Model Registry Design (uses feature store for model inputs)
- ADR-008: Bayesian Analytics Integration (uses features for confidence scoring)

## References

- [Tecton Feature Store](https://www.tecton.ai/)
- [Feast Feature Store](https://feast.dev/)
- [ML Feature Stores: A Casual Tour](https://www.featurestore.org/)
