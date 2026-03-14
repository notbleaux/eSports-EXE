[Ver001.000]

# ML Model Registry

The ML Model Registry provides centralized management of machine learning models, including versioning, deployment tracking, metrics collection, and A/B testing capabilities.

## Overview

The ML Model Registry integrates with the existing ML infrastructure in the 4NJZ4 TENET Platform to provide:

- **Model Versioning**: Track model versions and lineage
- **Deployment Management**: Deploy models to different environments
- **Metrics Tracking**: Record and visualize model performance metrics
- **A/B Testing**: Compare models with statistical significance
- **Registry UI**: Visual interface for model management

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    4NJZ4 TENET Platform                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  ML Model       │  │  ML Model       │  │   A/B Test  │ │
│  │  Registry UI    │  │  Manager Hook   │  │   Manager   │ │
│  │  (React)        │  │  (withRegistry) │  │             │ │
│  └────────┬────────┘  └────────┬────────┘  └──────┬──────┘ │
│           │                    │                   │        │
│           └────────────────────┼───────────────────┘        │
│                                │                            │
│                    ┌───────────▼───────────┐                │
│                    │   ML Registry API     │                │
│                    │   (/v1/ml/models)     │                │
│                    └───────────┬───────────┘                │
│                                │                            │
└────────────────────────────────┼────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    PostgreSQL Database   │
                    │  - ml_models             │
                    │  - model_metrics         │
                    │  - model_deployments     │
                    │  - ab_tests              │
                    └─────────────────────────┘
```

## Database Schema

### ml_models
Core table for model metadata and versioning:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(100) | Model name |
| version | VARCHAR(20) | Semantic version |
| type | VARCHAR(50) | Model type (classification, regression, etc.) |
| status | VARCHAR(20) | development, staging, production, archived, deprecated |
| artifact_url | VARCHAR(500) | URL to model file |
| framework | VARCHAR(50) | onnx, tensorflow, pytorch, sklearn |
| accuracy | NUMERIC(6,4) | Primary accuracy metric |
| parent_model_id | UUID | For model lineage |

### model_metrics
Time-series metrics for models:

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| model_id | UUID | Reference to model |
| metric_name | VARCHAR(50) | accuracy, latency, throughput, etc. |
| metric_value | NUMERIC(12,6) | Metric value |
| environment | VARCHAR(20) | development, staging, production |
| recorded_at | TIMESTAMPTZ | Timestamp |

### model_deployments
Track model deployments:

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| model_id | UUID | Reference to model |
| environment | VARCHAR(20) | deployment environment |
| status | VARCHAR(20) | pending, active, retired, failed |
| traffic_percentage | NUMERIC(5,2) | For canary deployments |

### ab_tests
A/B testing configurations:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(100) | Test name |
| model_a_id | UUID | First model |
| model_b_id | UUID | Second model |
| status | VARCHAR(20) | draft, running, paused, completed |
| winner_model_id | UUID | Winning model |

## API Endpoints

### Models

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/ml/models` | List all models |
| GET | `/v1/ml/models/{id}` | Get model details |
| POST | `/v1/ml/models` | Register new model |
| PUT | `/v1/ml/models/{id}` | Update model |
| POST | `/v1/ml/models/{id}/deploy` | Deploy model |
| POST | `/v1/ml/models/{id}/metrics` | Record metric |
| GET | `/v1/ml/models/{id}/metrics` | Get metrics history |
| GET | `/v1/ml/models/{a}/compare/{b}` | Compare two models |

### A/B Tests

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/ml/ab-tests` | List A/B tests |
| GET | `/v1/ml/ab-tests/{id}` | Get test details |
| POST | `/v1/ml/ab-tests` | Create test |
| POST | `/v1/ml/ab-tests/{id}/start` | Start test |
| POST | `/v1/ml/ab-tests/{id}/complete` | Complete test |

### Deployments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/ml/deployments/active` | List active deployments |

## Frontend Components

### MLModelRegistry
Main registry UI component located in `apps/website-v2/src/components/hub-2-rotas/MLModelRegistry.tsx`.

Features:
- Model list with filtering and search
- Model details view with metrics charts
- Model comparison table
- A/B test management
- Deployment status

Usage:
```tsx
import { MLModelRegistry } from './components/hub-2-rotas/MLModelRegistry'

function App() {
  return <MLModelRegistry hub="ROTAS" />
}
```

### useMLModelManagerWithRegistry Hook
Enhanced hook that integrates with the registry:

```tsx
import { useMLModelManagerWithRegistry } from './hooks/useMLModelManagerWithRegistry'

function MyComponent() {
  const {
    // Base manager state
    models,
    activeModelId,
    
    // Registry state
    registryModels,
    isSyncing,
    
    // Actions
    loadFromRegistry,
    syncWithRegistry,
    deployModel
  } = useMLModelManagerWithRegistry({
    autoSync: true,
    syncInterval: 30000 // 30 seconds
  })
  
  // Load a model from registry
  const handleLoad = async (modelId: string) => {
    await loadFromRegistry(modelId, { quantization: 8 })
  }
  
  return (
    <div>
      {registryModels.map(m => (
        <button key={m.id} onClick={() => handleLoad(m.id)}>
          Load {m.name}
        </button>
      ))}
    </div>
  )
}
```

## TypeScript Types

All types are defined in `apps/website-v2/src/types/mlRegistry.ts`:

```typescript
interface MLModel {
  id: string
  name: string
  version: string
  type: ModelType
  status: ModelStatus
  artifact_url?: string
  framework?: string
  accuracy?: number
  // ... more fields
}

interface ModelMetric {
  id: number
  model_id: string
  metric_name: string
  metric_value: number
  recorded_at: string
}

interface ABTest {
  id: string
  name: string
  model_a_id: string
  model_b_id: string
  status: ABTestStatus
  winner_model_id?: string
}
```

## Integration with Existing ML Infrastructure

### With useMLInference
The registry integrates seamlessly with `useMLInference`:

```tsx
const { loadModel } = useMLInference()
const { registryModels } = useMLModelManagerWithRegistry()

// Load from registry
const model = registryModels[0]
await loadModel(model.artifact_url!, model.quantization === 'int8' ? 8 : 32)
```

### With mlCacheStore
Model metadata from registry is used to populate cache store:

```tsx
const cacheStore = useMLCacheStore()

// After loading from registry
cacheStore.cacheModel(model.id, model.artifact_url!, model.size_bytes || 0, {
  name: `${model.name} v${model.version}`,
  tags: model.tags
})
```

## Deployment Workflow

1. **Register Model**: Upload model artifacts and register in registry
2. **Test in Staging**: Deploy to staging environment
3. **A/B Test**: Run A/B test against current production model
4. **Promote**: Deploy winning model to production
5. **Monitor**: Record metrics and track performance

```
Development → Staging → A/B Test → Production
     ↑                                    ↓
     └────────── Rollback ←───────────────┘
```

## Migration

Run the migration to create ML registry tables:

```bash
cd packages/shared/axiom-esports-data
python scripts/run_migrations.py
```

Or apply directly:

```bash
psql $DATABASE_URL -f infrastructure/migrations/011_ml_model_registry.sql
```

## Environment Variables

No additional environment variables required. Uses existing:
- `DATABASE_URL` - PostgreSQL connection
- `API_BASE_URL` - Backend API endpoint

## Testing

Run tests for the ML registry API:

```bash
cd packages/shared/axiom-esports-data
pytest api/tests/test_ml_models.py -v
```

## Future Enhancements

- [ ] Model artifact storage (S3/R2 integration)
- [ ] Automated A/B test evaluation
- [ ] Model drift detection
- [ ] Feature store integration
- [ ] Model explainability tracking

## References

- [ML Model Registry API](../packages/shared/axiom-esports-data/api/src/routes/ml_models.py)
- [Database Migration](../packages/shared/axiom-esports-data/infrastructure/migrations/011_ml_model_registry.sql)
- [Frontend Types](../apps/website-v2/src/types/mlRegistry.ts)
- [API Client](../apps/website-v2/src/api/mlRegistry.ts)
