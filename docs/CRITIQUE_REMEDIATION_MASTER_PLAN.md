[Ver001.000] [Part: 1/1, Phase: 0/5, Progress: 0%, Status: On-Going]

# CRITIQUE REMEDIATION MASTER PLAN
## Response to Architecture & Analytics Critique

---

## EXECUTIVE SUMMARY

**Critique Source:** Senior MLB Analytics Architect + Senior Web Dev Assessment  
**Critical Finding:** 14 gaps identified across architecture, analytics, and infrastructure  
**Remediation Strategy:** 5-phase coordinated sub-agent deployment with checkpoint validation  

### Critical Gaps Summary

| Category | Count | Severity |
|----------|-------|----------|
| Architecture Anti-Patterns | 3 | 🔴 Critical |
| Analytics Weaknesses | 3 | 🔴 Critical |
| Missing Infrastructure | 6 | 🔴 Critical |
| Web Security/Maturity | 4 | 🟡 High |
| **Total** | **16** | — |

---

## PHASE 0: PLANNING & FRAMEWORK (Current)

### Foreman Responsibilities
1. **Master Plan Creation** (This document)
2. **Sub-Agent Framework Design** (Role definitions, task waves)
3. **Checkpoint System** (Success/failure criteria)
4. **Context File Generation** (Efficient tokenization)
5. **Coordination Protocol** (Communication standards)

### Sub-Agent Framework

```
┌─────────────────────────────────────────────────────────────────┐
│                    FOREMAN (Kimi/Claude)                        │
│         ┌─────────────────────────────────────┐                 │
│         │    Checkpoint Review & Validation   │                 │
│         │    (5 Recommendations per Phase)    │                 │
│         └──────────────────┬──────────────────┘                 │
│                            │                                    │
│    ┌───────────────────────┼───────────────────────┐            │
│    │                       │                       │            │
│    ▼                       ▼                       ▼            │
│ ┌──────────┐         ┌──────────┐         ┌──────────┐         │
│ │ Architect│         │ Analytics│         │ Platform │         │
│ │  Agent   │         │  Agent   │         │  Agent   │         │
│ └──────────┘         └──────────┘         └──────────┘         │
│    │                       │                       │            │
│    │    ┌──────────────┐   │    ┌──────────────┐   │            │
│    └───►│  Specialist  │   └───►│  Specialist  │   └───►...    │
│         │   Agents     │        │   Agents     │                │
│         └──────────────┘        └──────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

---

## PHASE 1: CRITICAL ARCHITECTURE REMEDIATION

### 1.1 Kitchen Sink Anti-Pattern Resolution

**Gap:** Monorepo combines data pipeline, web app, game engine, simulator

**Remediation:**
```
Current (Kitchen Sink):
eSports-EXE/
├── apps/web/              (React)
├── packages/shared/api/   (FastAPI)
├── platform/simulation/   (Godot)
└── data/pipeline/         (Python ETL)

Target (Separated):
njzitegeist-platform/      (Web + API only)
├── apps/web/
├── packages/api/
└── packages/types/

rotas-simulation-engine/   (Godot only - extracted)
├── src/
├── tests/
└── package.json (npm distribution)

axiom-data-pipeline/       (ETL only - extracted)
├── src/
├── jobs/
└── terraform/
```

**Sub-Tasks:**
1. Create separate repository blueprints
2. Define inter-service contracts (API schemas)
3. Migrate simulation to npm package
4. Extract data pipeline to standalone service
5. Update monorepo to use external packages

### 1.2 Deterministic Simulation at 20 TPS → 60 TPS

**Gap:** 20 TPS insufficient for professional analysis

**Remediation:**
```python
# Current
TARGET_TPS = 20  # 50ms per tick

# Target
TARGET_TPS = 60  # 16.67ms per tick (MLB standard)
MAX_TICK_TIME_MS = 16.0  # 0.67ms buffer

# Headless server mode
class HeadlessSimulationServer:
    def __init__(self):
        self.fixed_timestep = 1.0 / 60.0
        self.max_substeps = 3
        self.parallel_workers = os.cpu_count()
```

**Sub-Tasks:**
1. Optimize Godot physics settings
2. Implement headless server export
3. Create Kubernetes horizontal scaling
4. Add Monte Carlo batch processing
5. Benchmark performance metrics

### 1.3 Data Partition Firewall → Defense in Depth

**Gap:** Retroactive security patching vs. defense-in-depth

**Remediation:**
```python
# Current (Retroactive)
GAME_ONLY_FIELDS = ['internalAgentState', 'radarData']

def sanitize(data):
    return {k: v for k, v in data.items() if k not in GAME_ONLY_FIELDS}

# Target (Defense in Depth)
class SimulationDataVault:
    """Zero-trust data compartmentalization."""
    
    ENCLAVE_LEVELS = {
        'CORE': 0,      # Simulation internals only
        'ANALYTICS': 1, # ML training data
        'PUBLIC': 2,    # API-exposed aggregates
    }
    
    def read(self, entity_id, field, enclave_required):
        if self.current_enclave > enclave_required:
            raise SecurityException("Insufficient clearance")
        return self._secure_read(entity_id, field)
```

---

## PHASE 2: DATA INTEGRITY & PROVENANCE

### 2.1 VLR.gg Scraping Replacement

**Gap:** Unofficial scraping lacks data lineage, confidence, sanction

**Remediation:**
```python
# Current (Unacceptable)
async def scrape_vlr():
    soup = BeautifulSoup(requests.get('vlr.gg').text)
    return parse_matches(soup)  # Fragile, no lineage

# Target (MLB-Standard)
class OfficialDataIngestion:
    """
    Official Pandascore API with full provenance.
    """
    
    async def ingest_match(self, match_id: str):
        # 1. Fetch from official API
        raw_data = await self.pandascore_client.get_match(match_id)
        
        # 2. Validate against schema
        validated = MatchSchema.validate(raw_data)
        
        # 3. Create lineage record
        provenance = DataProvenance(
            source="pandascore.co",
            source_version="v2.1",
            ingestion_timestamp=utcnow(),
            raw_checksum=sha256(raw_data),
            validation_status="passed",
            confidence_score=1.0,  # Official data = 100%
        )
        
        # 4. Store with UUID
        match = Match(
            id=generate_uuid(),
            data=validated,
            provenance=provenance,
        )
        
        return match
```

### 2.2 Data Lineage Tracking

**Gap:** No UUID-based provenance like MLB Statcast

**Remediation:**
```sql
-- Every data point has full provenance
CREATE TABLE data_lineage (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50),      -- 'match', 'player', 'prediction'
    entity_id UUID,
    
    -- Source tracking
    source_system VARCHAR(100),   -- 'pandascore', 'simulation', 'manual'
    source_version VARCHAR(20),   -- API version
    source_timestamp TIMESTAMPTZ, -- Original timestamp
    
    -- Ingestion tracking
    ingestion_id UUID,            -- Batch/job ID
    ingestion_timestamp TIMESTAMPTZ,
    ingestion_method VARCHAR(50), -- 'webhook', 'api', 'cdc'
    
    -- Validation
    schema_version VARCHAR(20),
    validation_status VARCHAR(20), -- 'passed', 'warning', 'failed'
    validation_errors JSONB,
    
    -- Quality
    confidence_score DECIMAL(3,2), -- 0.00-1.00
    checksum VARCHAR(64),          -- SHA-256
    
    -- Transformations
    parent_uuids UUID[],           -- Upstream dependencies
    transformation_logic TEXT,     -- SQL/code used
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for lineage queries
CREATE INDEX idx_lineage_entity ON data_lineage(entity_type, entity_id);
CREATE INDEX idx_lineage_source ON data_lineage(source_system, source_timestamp);
```

### 2.3 Sensor Fusion & Cross-Validation

**Gap:** Single-source scraping with no cross-validation

**Remediation:**
```python
class MultiSourceValidator:
    """
    Cross-validate data from multiple sources.
    MLB uses Hawkeye + TrackMan redundancy.
    """
    
    SOURCES = {
        'pandascore': {'priority': 1, 'weight': 0.7},
        'riot_api': {'priority': 2, 'weight': 0.2},
        'manual_entry': {'priority': 3, 'weight': 0.1},
    }
    
    def validate_match_score(self, match_id: str):
        """Get match score from multiple sources and detect discrepancies."""
        
        results = {}
        for source, config in self.SOURCES.items():
            try:
                data = self.fetch_from_source(source, match_id)
                results[source] = {
                    'score_a': data.score_a,
                    'score_b': data.score_b,
                    'timestamp': data.timestamp,
                    'weight': config['weight']
                }
            except Exception as e:
                results[source] = {'error': str(e)}
        
        # Detect discrepancies
        scores = [(r['score_a'], r['score_b']) for r in results.values() if 'error' not in r]
        if len(set(scores)) > 1:
            # Discrepancy detected - alert
            self.alert_discrepancy(match_id, results)
            
            # Use weighted consensus
            consensus = self.weighted_consensus(results)
            return consensus
        
        return scores[0]
```

---

## PHASE 3: PRODUCTION INFRASTRUCTURE

### 3.1 CDC/Event Sourcing (Kafka)

**Gap:** No CDC mechanism for automatic recalibration

**Remediation:**
```yaml
# Kafka Connect CDC configuration
connectors:
  - name: postgres-cdc-connector
    class: io.debezium.connector.postgresql.PostgresConnector
    config:
      database.hostname: db.njzitegeist.com
      database.port: 5432
      database.user: ${DB_USER}
      database.password: ${DB_PASSWORD}
      database.dbname: njz_platform
      
      # Capture changes from these tables
      table.include.list: public.matches,public.player_stats
      
      # Publish to these topics
      topic.prefix: njz.db
      
      # Capture schema changes
      include.schema.changes: true

# Auto-trigger recalibration on weapon patch
triggers:
  - name: weapon-patch-recalibration
    condition: |
      message.payload.table == 'weapon_stats' AND
      message.payload.op == 'u'  # Update
    action: |
      enqueue_job('simulation.recalibrate', 
                  patch_version=message.payload.after.patch_version)
```

### 3.2 Feature Store (Tecton-Style)

**Gap:** No feature registry, versioning, or online/offline separation

**Remediation:**
```python
# Feature registry with versioning
class FeatureRegistry:
    """Tecton-style feature store."""
    
    def define_feature(
        self,
        name: str,
        entity: str,
        computation: callable,
        online_store: bool = True,
        offline_store: bool = True,
        ttl: timedelta = timedelta(hours=24),
        version: str = "1.0.0"
    ):
        """
        Define a feature with full lineage.
        """
        feature_def = {
            'name': name,
            'entity': entity,
            'version': version,
            'fingerprint': self.compute_fingerprint(computation),
            'stores': {
                'online': online_store,   # Redis
                'offline': offline_store, # S3/Parquet
            },
            'ttl': ttl,
            'schema': self.infer_schema(computation),
            'owner': get_current_user(),
            'created_at': utcnow(),
        }
        
        # Register
        self.registry[feature_def['fingerprint']] = feature_def
        
        return feature_def

# Usage
@registry.define_feature(
    name="player_combat_score_avg_7d",
    entity="player",
    online_store=True,
    offline_store=True,
)
def compute_combat_score_avg(player_id: str) -> float:
    """7-day rolling average combat score."""
    matches = get_matches(player_id, days=7)
    return mean(m.combat_score for m in matches)
```

### 3.3 Model Registry (MLflow)

**Gap:** No model versioning, drift monitoring, governance

**Remediation:**
```python
import mlflow

class ModelGovernance:
    """MLflow-based model lifecycle management."""
    
    def train_and_register(
        self,
        model_name: str,
        training_data_version: str,
        hyperparameters: dict,
    ):
        """
        Train model with full lineage and register.
        """
        with mlflow.start_run():
            # Log parameters
            mlflow.log_params(hyperparameters)
            mlflow.log_param("training_data.version", training_data_version)
            mlflow.log_param("training_data.count", len(training_data))
            
            # Train
            model = train_model(training_data, hyperparameters)
            
            # Evaluate
            metrics = evaluate_model(model, validation_data)
            mlflow.log_metrics(metrics)
            
            # Register
            mlflow.sklearn.log_model(
                model,
                artifact_path="model",
                registered_model_name=model_name,
            )
            
            # Create model card
            model_card = {
                'model_name': model_name,
                'version': mlflow.active_run().info.run_id,
                'training_date': utcnow(),
                'training_data': {
                    'version': training_data_version,
                    'date_range': [min_date, max_date],
                    'count': len(training_data),
                },
                'performance': metrics,
                'features': get_feature_list(model),
                'limitations': self.identify_limitations(model),
                'drift_monitoring': {
                    'enabled': True,
                    'features_to_monitor': ['simrating', 'kda_ratio'],
                    'alert_threshold': 3.0,  # sigma
                }
            }
            
            mlflow.log_dict(model_card, "model_card.json")
            
            return model_card
```

### 3.4 Data Quality (Great Expectations)

**Gap:** No automated validation suites

**Remediation:**
```python
import great_expectations as gx

class DataQualitySuite:
    """Automated data validation."""
    
    def create_expectations(self):
        context = gx.get_context()
        
        suite = context.create_expectation_suite(
            "player_stats_validation"
        )
        
        # Completeness
        suite.add_expectation(
            gx.expectations.ExpectColumnValuesToNotBeNull(
                column="player_id"
            )
        )
        
        # Range validation
        suite.add_expectation(
            gx.expectations.ExpectColumnValuesToBeBetween(
                column="combat_score",
                min_value=0,
                max_value=1000
            )
        )
        
        # Uniqueness
        suite.add_expectation(
            gx.expectations.ExpectColumnValuesToBeUnique(
                column="match_id"
            )
        )
        
        # Statistical distribution
        suite.add_expectation(
            gx.expectations.ExpectColumnMeanToBeBetween(
                column="kda_ratio",
                min_value=0.8,
                max_value=2.0
            )
        )
        
        return suite
```

### 3.5 Observability (OpenTelemetry)

**Gap:** Partial observability, no distributed tracing

**Remediation:**
```python
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor

# Initialize tracing
trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)

otlp_exporter = OTLPSpanExporter(endpoint="otel-collector:4317")
span_processor = BatchSpanProcessor(otlp_exporter)
trace.get_tracer_provider().add_span_processor(span_processor)

# Instrument FastAPI
FastAPIInstrumentor.instrument_app(app)
RedisInstrumentor().instrument()

# Custom spans for SimRating calculation
@tracer.start_as_current_span("simrating.calculate")
async def calculate_simrating(player_id: str):
    current_span = trace.get_current_span()
    current_span.set_attribute("player.id", player_id)
    
    with tracer.start_as_current_span("fetch_player_data"):
        data = await get_player_data(player_id)
        current_span.set_attribute("data.matches_count", len(data))
    
    with tracer.start_as_current_span("compute_rating"):
        rating = compute_rating(data)
        current_span.set_attribute("rating.result", rating)
    
    return rating
```

---

## PHASE 4: ANALYTICS HARDENING

### 4.1 Uncertainty Quantification

**Gap:** Point estimates without confidence intervals

**Remediation:**
```python
from dataclasses import dataclass
import numpy as np
from scipy import stats

@dataclass
class UncertainEstimate:
    """Probabilistic estimate with confidence intervals."""
    point_estimate: float
    confidence_level: float
    ci_lower: float
    ci_upper: float
    std_error: float
    sample_size: int
    
    def __str__(self):
        return f"{self.point_estimate:.1f} [{self.ci_lower:.1f}, {self.ci_upper:.1f}]"

class BootstrapEstimator:
    """Bootstrap confidence intervals for any metric."""
    
    def estimate(
        self,
        data: list,
        statistic_func: callable,
        n_bootstrap: int = 1000,
        confidence: float = 0.95
    ) -> UncertainEstimate:
        """
        Compute bootstrap confidence interval.
        """
        # Original statistic
        point = statistic_func(data)
        
        # Bootstrap samples
        n = len(data)
        bootstrap_stats = []
        
        for _ in range(n_bootstrap):
            sample = np.random.choice(data, size=n, replace=True)
            bootstrap_stats.append(statistic_func(sample))
        
        # Confidence interval
        alpha = 1 - confidence
        ci_lower = np.percentile(bootstrap_stats, alpha/2 * 100)
        ci_upper = np.percentile(bootstrap_stats, (1 - alpha/2) * 100)
        
        return UncertainEstimate(
            point_estimate=point,
            confidence_level=confidence,
            ci_lower=ci_lower,
            ci_upper=ci_upper,
            std_error=np.std(bootstrap_stats),
            sample_size=n
        )

# Usage
estimator = BootstrapEstimator()
simrating_uncertain = estimator.estimate(
    data=player_match_history,
    statistic_func=lambda x: np.mean([m.combat_score for m in x])
)

print(f"SimRating: {simrating_uncertain}")
# Output: SimRating: 84.3 [82.1, 86.5]
```

### 4.2 Temporal Consistency Models

**Gap:** Naive time-series handling

**Remediation:**
```python
class TemporalDataLifecycle:
    """
    MLB-style data tiering:
    Hot (current season) → Warm (last 2 years) → Cold (archival)
    """
    
    TIERS = {
        'HOT': {
            'retention_days': 365,
            'storage': 'timescaledb',
            'compression': False,
            'query_priority': 'high',
        },
        'WARM': {
            'retention_days': 365 * 2,
            'storage': 'timescaledb',
            'compression': True,
            'query_priority': 'medium',
        },
        'COLD': {
            'retention_days': 365 * 10,
            'storage': 's3_parquet',
            'compression': True,
            'query_priority': 'batch_only',
        }
    }
    
    def tier_data(self, data_point):
        """Assign data to appropriate tier based on age."""
        age_days = (utcnow() - data_point.timestamp).days
        
        if age_days <= 365:
            return 'HOT'
        elif age_days <= 365 * 3:
            return 'WARM'
        else:
            return 'COLD'
    
    def continuous_aggregation(self):
        """TimescaleDB continuous aggregates."""
        return """
        CREATE MATERIALIZED VIEW player_stats_hourly
        WITH (timescaledb.continuous) AS
        SELECT
            time_bucket('1 hour', timestamp) as bucket,
            player_id,
            AVG(combat_score) as avg_combat_score,
            MAX(combat_score) as max_combat_score
        FROM player_stats
        GROUP BY bucket, player_id;
        
        SELECT add_continuous_aggregate_policy('player_stats_hourly',
            start_offset => INTERVAL '1 month',
            end_offset => INTERVAL '1 hour',
            schedule_interval => INTERVAL '1 hour'
        );
        """
```

### 4.3 Bayesian Prior Updating

**Gap:** No recency weighting or form decay

**Remediation:**
```python
class BayesianFormTracker:
    """
    Marcel/ZIPS-style Bayesian projections with recency weighting.
    """
    
    def __init__(self):
        self.prior_mean = 50.0  # League average
        self.prior_precision = 0.1  # Low confidence initially
    
    def update_posterior(self, observations: list, weights: list = None):
        """
        Update belief about player skill with new observations.
        
        Args:
            observations: List of performance scores
            weights: Recency weights (higher = more recent)
        """
        if weights is None:
            # Exponential decay weighting
            n = len(observations)
            weights = [0.95 ** (n - i - 1) for i in range(n)]
        
        # Weighted likelihood
        weighted_mean = np.average(observations, weights=weights)
        weighted_var = np.average(
            (np.array(observations) - weighted_mean) ** 2,
            weights=weights
        )
        
        # Bayesian update
        likelihood_precision = 1 / weighted_var if weighted_var > 0 else 1.0
        
        posterior_precision = self.prior_precision + likelihood_precision
        posterior_mean = (
            (self.prior_precision * self.prior_mean + 
             likelihood_precision * weighted_mean) / posterior_precision
        )
        
        return {
            'mean': posterior_mean,
            'std': np.sqrt(1 / posterior_precision),
            'reliability': min(1.0, len(observations) / 100)
        }
```

---

## PHASE 5: WEB SECURITY & RATE LIMITING

### 5.1 Professional Rate Limiting

**Gap:** 30 req/min is insufficient for production

**Remediation:**
```python
from slowapi import Limiter
from slowapi.util import get_remote_address
from enum import Enum

class Tier(Enum):
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"

TIER_LIMITS = {
    Tier.FREE: {
        "per_minute": 30,
        "per_hour": 500,
        "burst": 5,
    },
    Tier.PRO: {
        "per_minute": 1000,
        "per_hour": 10000,
        "burst": 50,
    },
    Tier.ENTERPRISE: {
        "per_minute": 10000,
        "per_hour": 1000000,
        "burst": 500,
    }
}

# Token bucket with priority
class PriorityRateLimiter:
    """
    MLB Statcast-style rate limiting with request prioritization.
    """
    
    PRIORITIES = {
        'realtime': 10,    # Live match data
        'interactive': 5,  # User interactions
        'batch': 1,        # Background jobs
    }
    
    def allow_request(self, api_key: str, priority: str = 'interactive'):
        tier = self.get_tier(api_key)
        limits = TIER_LIMITS[tier]
        
        # Priority multiplier
        priority_mult = self.PRIORITIES.get(priority, 1)
        
        # Check token bucket
        bucket_key = f"ratelimit:{api_key}:{priority}"
        tokens = self.redis.get(bucket_key) or limits['burst']
        
        if tokens >= 1:
            self.redis.decr(bucket_key)
            return True
        else:
            # Log rate limit hit
            self.metrics.increment('ratelimit.hit', 
                                  tags={'tier': tier, 'priority': priority})
            return False
```

### 5.2 WebSocket Connection Affinity

**Gap:** WebSocket drops during horizontal scaling

**Remediation:**
```yaml
# Kubernetes sticky sessions for WebSocket
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: njz-websocket
  annotations:
    nginx.ingress.kubernetes.io/affinity: "cookie"
    nginx.ingress.kubernetes.io/session-cookie-name: "ws_affinity"
    nginx.ingress.kubernetes.io/session-cookie-expires: "172800"
    nginx.ingress.kubernetes.io/session-cookie-max-age: "172800"
spec:
  rules:
  - host: ws.njzitegeist.com
    http:
      paths:
      - path: /ws
        backend:
          service:
            name: websocket-service
            port:
              number: 80
```

### 5.3 RBAC Implementation

**Gap:** "Auth Ready" but RBAC incomplete

**Remediation:**
```python
from functools import wraps
from enum import Enum

class Role(Enum):
    ANONYMOUS = "anonymous"
    USER = "user"
    ANALYST = "analyst"
    ADMIN = "admin"

class Permission(Enum):
    READ_PUBLIC = "read:public"
    READ_PREDICTIONS = "read:predictions"
    WRITE_PREDICTIONS = "write:predictions"
    READ_ADVANCED = "read:advanced"
    ADMIN_ACCESS = "admin:access"

ROLE_PERMISSIONS = {
    Role.ANONYMOUS: [Permission.READ_PUBLIC],
    Role.USER: [Permission.READ_PUBLIC, Permission.READ_PREDICTIONS],
    Role.ANALYST: [
        Permission.READ_PUBLIC, 
        Permission.READ_PREDICTIONS,
        Permission.WRITE_PREDICTIONS,
        Permission.READ_ADVANCED
    ],
    Role.ADMIN: list(Permission),  # All permissions
}

def require_permission(permission: Permission):
    """Decorator for permission-based access control."""
    def decorator(func):
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            user = request.state.user
            user_role = Role(user.get('role', 'anonymous'))
            
            if permission not in ROLE_PERMISSIONS[user_role]:
                raise HTTPException(
                    status_code=403,
                    detail=f"Missing permission: {permission.value}"
                )
            
            return await func(request, *args, **kwargs)
        return wrapper
    return decorator

# Usage
@app.get("/api/v1/advanced-analytics")
@require_permission(Permission.READ_ADVANCED)
async def get_advanced_analytics(request: Request):
    ...
```

### 5.4 License Cleanup

**Gap:** CC BY-NC 4.0 + MIT contamination

**Remediation:**
```
Current (Toxic):
├── data/pipeline/     (CC BY-NC 4.0)  ← Commercial use prohibited
├── apps/web/          (MIT)
└── platform/simulation/ (MIT)

Target (Clean):
├── njz-platform/      (MIT or Apache 2.0)
│   ├── apps/web/
│   └── packages/api/
├── axiom-pipeline/    (Apache 2.0)  ← Commercial-friendly
└── rotas-simulation/  (MIT)

Recommendation: Migrate all to Apache 2.0 for maximum commercial compatibility.
```

---

## SUB-AGENT DEPLOYMENT FRAMEWORK

### Agent Roles

| Role | Responsibility | Deliverables |
|------|----------------|--------------|
| **Foreman** (Me) | Coordination, checkpoint review, final validation | Phase sign-off, 5 recommendations |
| **Architect Agent** | Repository separation, service boundaries | Migration plans, API contracts |
| **Analytics Agent** | Statistical methods, uncertainty, Bayesian | Implementation code, validation |
| **Platform Agent** | Infrastructure, Kafka, Feature Store | Terraform, K8s manifests |
| **Data Engineer** | Lineage, provenance, quality | Schemas, validation suites |
| **Security Agent** | Rate limiting, RBAC, license cleanup | Security configs, policies |

### Checkpoint System

**Each Phase Ends With:**
1. Sub-agent deliverable submission
2. Foreman review (5 recommendations minimum)
3. Recommendation implementation
4. Sign-off before Phase N+1

**Success Criteria:**
- All critical gaps addressed
- Code compiles/tests pass
- Documentation complete
- Security review passed

**Failure Criteria:**
- Critical gaps unaddressed
- Breaking changes without migration plan
- Security vulnerabilities introduced
- Tests failing

---

## DOCUMENT CONTROL

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 001.000 | 2026-03-30 | Foreman | Initial master plan |

---

*End of Critique Remediation Master Plan*
