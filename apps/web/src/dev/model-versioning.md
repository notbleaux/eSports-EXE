# [Ver001.000]

# ML Model Versioning Strategy

This document outlines the versioning and deployment strategy for TensorFlow.js models used in the Libre-X-eSport platform.

---

## Overview

The platform uses **Semantic Versioning (SemVer)** for ML model management with a structured promotion workflow from development to production.

---

## Semantic Versioning for Models

Model versions follow the format: `{major}.{minor}.{patch}` (e.g., `1.2.3`)

### Version Component Meanings

| Component | When to Increment | Example |
|-----------|-------------------|---------|
| **Major** | Breaking changes to input/output format, tensor shape changes, incompatible API changes | `1.x.x` → `2.0.0` |
| **Minor** | Accuracy improvements, new features, backward-compatible enhancements | `x.2.x` → `x.3.0` |
| **Patch** | Bug fixes, optimizations, quantization, non-breaking fixes | `x.x.3` → `x.x.4` |

### Version Change Scenarios

#### Major Version Bump (Breaking)
- Input tensor shape changes (e.g., `[3]` → `[5]`)
- Output format changes (e.g., single value → array)
- Data type changes (float32 → int32)
- Feature removal or renaming

#### Minor Version Bump (Feature/Accuracy)
- Model retraining with improved accuracy (+2% or more)
- New output heads or prediction capabilities
- Additional metadata or explanation features
- Performance optimizations (>10% inference speedup)

#### Patch Version Bump (Fix)
- Quantization (float32 → int8)
- Weight pruning
- Hot fixes for edge case bugs
- Documentation updates
- Non-breaking internal refactoring

---

## File Naming Convention

```
{model-name}-v{major}.{minor}.{patch}.json
```

Examples:
- `sator-v1.0.0.json` - Initial release
- `sator-v1.2.0.json` - Accuracy improvement
- `sator-v1.2.3.json` - Bug fix release
- `sator-v2.0.0.json` - Breaking API change

---

## Model Registry Format

The model registry (`src/dev/model-registry.json`) tracks all model versions:

```json
{
  "models": [
    {
      "id": "sator-v1",
      "version": "1.2.3",
      "url": "/models/sator-v1.2.3.json",
      "checksum": "sha256:abc123...",
      "accuracy": 0.94,
      "size": 125000,
      "deployedAt": "2026-03-13T18:00:00Z",
      "status": "production",
      "previousVersion": "1.2.2"
    }
  ],
  "version": "1.0.0",
  "lastUpdated": "2026-03-13T18:00:00Z"
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique model identifier |
| `version` | string | Semantic version (major.minor.patch) |
| `url` | string | Relative path to model.json |
| `checksum` | string | SHA-256 hash for integrity verification |
| `accuracy` | number | Model accuracy score (0-1) |
| `size` | number | Model size in bytes |
| `deployedAt` | string | ISO 8601 timestamp |
| `status` | enum | `staging`, `production`, or `archived` |
| `previousVersion` | string | Reference for rollback (optional) |

---

## Deployment Workflow

### Complete Pipeline: Develop → Validate → Stage → Promote

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Develop   │───→│   Validate  │───→│   Staging   │───→│ Production  │
│             │    │             │    │             │    │             │
│ Train Model │    │  CI Pipeline│    │  Integration│    │   Live API  │
│  Unit Tests │    │ Size Check  │    │    Tests    │    │   Serving   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Stage 1: Development
- Train and export TensorFlow.js model
- Run local unit tests
- Place model in `models/staging/` directory
- Create PR with model changes

### Stage 2: Validation (Automated CI)
Trigger: Pull Request opened/updated

Jobs executed:
1. **validate**: Run `scripts/validate-model.ts`
   - Verify model.json structure
   - Check weights manifest integrity
   - Run test predictions
   - Generate validation report

2. **benchmark**: Run accuracy benchmarks
   - Test dataset evaluation
   - Performance metrics collection
   - Regression detection

3. **size-check**: Verify size constraints
   - Full model: < 500KB
   - Quantized model: < 150KB
   - Fail if limits exceeded

### Stage 3: Staging Deployment
- Auto-deploy on validation pass
- Model served at staging environment
- Integration tests executed
- Manual QA approval gate

### Stage 4: Production Promotion
Command: `npx ts-node scripts/promote-model.ts <model-id>`

Actions:
1. Read current staging model
2. Increment patch version
3. Update status: `staging` → `production`
4. Archive old versions (keep last 3)
5. Store rollback reference
6. Update registry

---

## Rollback Procedures

### Automatic Rollback Triggers
- Production error rate > 5%
- Inference latency > 500ms (p99)
- Prediction NaN rate > 1%

### Manual Rollback

```bash
# Rollback to previous version
npx ts-node scripts/promote-model.ts sator-v1 --rollback
```

What happens:
1. Current production version archived
2. Previous version restored to production
3. Registry updated with rollback timestamp
4. Notification sent to team

### Emergency Rollback

For critical issues requiring immediate rollback:

```bash
# Direct registry edit (emergency only)
cd apps/website-v2/src/dev
# Edit model-registry.json manually
git commit -am "EMERGENCY: Rollback sator-v1 to v1.2.2"
git push origin main
```

⚠️ **Warning**: Manual edits bypass safety checks. Use only when automated rollback fails.

---

## Version Retention Policy

| Status | Retention | Action |
|--------|-----------|--------|
| Production | Last 3 versions | Auto-archive older |
| Staging | Last 5 versions | Manual cleanup |
| Archived | Last 10 versions | Auto-delete older |

---

## Best Practices

### Before Promoting to Production
- [ ] Validation CI passes (all 3 jobs)
- [ ] Benchmark accuracy ≥ previous version
- [ ] Size check passes
- [ ] Staging integration tests pass
- [ ] Manual QA sign-off (for major/minor)

### Model Checksum Verification
Always verify model integrity using SHA-256:

```bash
# Generate checksum
sha256sum models/sator-v1.2.3.json

# Verify against registry
grep -A5 "sator-v1" src/dev/model-registry.json
```

### Size Optimization

For models exceeding size limits:

```javascript
// Quantization example (TensorFlow.js)
await model.save('localstorage://quantized', {
  quantizationBytes: 1  // 8-bit quantization
});
```

---

## Example Workflows

### Scenario 1: Bug Fix Deployment

```bash
# 1. Fix bug in model training
# 2. Export new version (auto patch bump)
npx ts-node scripts/validate-model.ts models/sator-v1.2.4.json

# 3. Create PR - CI validates automatically
# 4. Merge to develop → staging deployed
# 5. Promote to production
npx ts-node scripts/promote-model.ts sator-v1
```

### Scenario 2: Accuracy Improvement

```bash
# 1. Retrain model with new data
# 2. Minor version bump (1.2.3 → 1.3.0)
# 3. Validate and benchmark
npx ts-node scripts/validate-model.ts models/sator-v1.3.0.json

# 4. Staging tests
# 5. QA approval required for minor bump
# 6. Promote
npx ts-node scripts/promote-model.ts sator-v1
```

### Scenario 3: Breaking Change

```bash
# 1. Architecture change requiring input shape change
# 2. Major version bump (1.2.3 → 2.0.0)
# 3. Update client code for new API
# 4. Full regression testing
# 5. Coordinated deployment with client update
```

---

## Related Documentation

- [Model Validation Script](../../scripts/validate-model.ts)
- [Model Promotion Script](../../scripts/promote-model.ts)
- [CI/CD Workflow](../../../.github/workflows/ml-model-deploy.yml)
- [TensorFlow.js Guide](https://www.tensorflow.org/js)

---

*Last Updated: 2026-03-13*
