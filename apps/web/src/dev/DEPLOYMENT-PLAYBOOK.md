# ML Model Deployment Playbook

[Ver001.000]

## Model Versioning Strategy

### Semantic Versioning

```
{major}.{minor}.{patch}

Example: sator-v1.2.3.json
```

- **Major**: Breaking changes (input/output format changes)
- **Minor**: Accuracy improvements, new features
- **Patch**: Bug fixes, optimizations

### Version Naming Convention

```
{model-name}-v{major}.{minor}.{patch}[-{prerelease}].json

Examples:
- sator-v1.0.0.json        (production)
- sator-v1.1.0-beta.json   (beta/staging)
- sator-v2.0.0-rc1.json    (release candidate)
```

## Staging → Production Workflow

### 1. Develop Model

```bash
# Train and export model
# Save to: models/sator-v1.2.0.json
```

### 2. Create Pull Request

```bash
git checkout -b feature/sator-v1.2.0
git add models/sator-v1.2.0.json
git commit -m "feat(models): Add sator v1.2.0 - 5% accuracy improvement"
git push origin feature/sator-v1.2.0
# Create PR to develop branch
```

### 3. Automated Validation

GitHub Actions automatically:
- Validates model structure
- Runs accuracy benchmarks
- Checks size (< 500KB full, < 150KB quantized)
- Deploys to staging on pass

### 4. Manual Testing (Staging)

```bash
# Test in staging environment
# Verify predictions work correctly
# Check performance metrics
```

### 5. Promote to Production

```bash
cd apps/website-v2
npx ts-node scripts/promote-model.ts sator-v1.2.0
```

This:
- Updates model-registry.json
- Sets status to "production"
- Keeps last 3 versions available
- Tags release in git

### 6. Verify Production

```bash
# Check registry
cat src/dev/model-registry.json

# Verify streaming uses new model
# Check ROTAS hub shows new model in comparison
```

## Rollback Procedures

### Standard Rollback (Previous Version)

```bash
# Rollback to previous production version
npx ts-node scripts/promote-model.ts --rollback sator-v1.2.0

# Or manually edit registry:
# src/dev/model-registry.json
# Change "production": "sator-v1.1.0"
```

### Emergency Rollback (Any Version)

```bash
# Immediate rollback without validation
# 1. Edit registry directly
vi src/dev/model-registry.json

# 2. Update production pointer
{
  "production": "sator-v1.1.0",  // Change this
  ...
}

# 3. Commit and push
git add src/dev/model-registry.json
git commit -m "hotfix: Rollback to sator-v1.1.0"
git push origin main
```

### Rollback Verification

```bash
# Verify old model is active
curl https://api.libre-x-esport.com/models/current

# Check prediction version in app
# Look at prediction.modelId in browser console
```

## Emergency Procedures

### Model Corruption Detected

1. **Immediately stop deployments**
   ```bash
   # Disable auto-deploy in GitHub Actions
   # (requires admin access)
   ```

2. **Rollback to last known good**
   ```bash
   npx ts-node scripts/promote-model.ts --rollback
   ```

3. **Notify team**
   ```bash
   # Post in #incidents channel
   # Include: model version, error details, rollback status
   ```

4. **Investigate**
   ```bash
   # Check validation logs
   cat validation-report.json
   
   # Review model file
   npx ts-node scripts/validate-model.ts models/corrupted-model.json
   ```

### High Error Rate in Production

1. **Check model health**
   ```bash
   # View ML analytics in ROTAS hub
   # Check error rate chart
   ```

2. **If error rate > 5%**
   - Trigger emergency rollback
   - Enable fallback model

3. **Monitor recovery**
   - Watch error rate drop
   - Verify predictions resume

## Common Issues & Solutions

### Validation Fails

**Issue**: `validate-model.ts` returns exit code 1

**Solutions**:
- Check model.json structure (modelTopology, weightsManifest)
- Verify weight files exist and match manifest
- Test with known input: `[0.5, 0.5, 0.5]`
- Check file size (< 500KB)

### Size Check Fails

**Issue**: Model exceeds size limit

**Solutions**:
- Use INT8 quantization (75% size reduction)
- Prune unused weights
- Use weight sharing techniques

### Promotion Fails

**Issue**: Registry not updating

**Solutions**:
- Check file permissions
- Verify JSON syntax in registry
- Ensure model exists in staging

## Monitoring Checklist

Post-deployment, monitor for 1 hour:

- [ ] Prediction latency stable
- [ ] Error rate < 1%
- [ ] Memory usage stable
- [ ] No spike in support tickets
- [ ] Analytics dashboard updating

## Version Retention Policy

- **Production**: Keep last 3 versions
- **Staging**: Keep last 5 versions
- **Development**: Unlimited (clean up periodically)

## Contact

- **On-call**: #ml-ops-oncall
- **Escalation**: ml-team-lead@libre-x-esport.com
- **Emergency**: +1-555-ML-OPS-1
