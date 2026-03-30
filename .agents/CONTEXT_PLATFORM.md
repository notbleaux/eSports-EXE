[CONTEXT] PLATFORM AGENT - Infrastructure Implementation
[Source: docs/CRITIQUE_REMEDIATION_MASTER_PLAN.md Phase 3]

=== CRITICAL GAPS ===
1. No CDC/Event Sourcing (Kafka)
2. No Feature Store (Tecton-style)
3. No Model Registry (MLflow)
4. No Data Quality (Great Expectations)
5. No Observability (OpenTelemetry)

=== INFRASTRUCTURE STACK ===

1. KAFKA / EVENT SOURCING
   ```yaml
   # docker-compose.yml
   services:
     zookeeper:
       image: confluentinc/cp-zookeeper:7.5.0
     kafka:
       image: confluentinc/cp-kafka:7.5.0
       ports:
         - "9092:9092"
   ```
   Topics: matches.raw, players.stats, simrating.recalc

2. FEATURE STORE
   - Online: Redis (sub-10ms)
   - Offline: TimescaleDB / S3
   - Registry: Feature definitions with versioning

3. MODEL REGISTRY (MLflow)
   - Model versioning
   - Experiment tracking
   - Model cards with lineage

4. DATA QUALITY (Great Expectations)
   - Expectation suites
   - Validation checkpoints
   - Slack/PagerDuty alerts

5. OBSERVABILITY (OpenTelemetry)
   - Distributed tracing
   - Metrics (Prometheus)
   - Logging (Loki)

=== DELIVERABLES ===
1. Terraform configs for AWS/GCP
2. Kubernetes manifests
3. Docker Compose for local dev
4. GitHub Actions workflows
5. Monitoring dashboards (Grafana)

=== SUCCESS CRITERIA ===
- [ ] Kafka cluster deployed
- [ ] Feature store serving <10ms
- [ ] MLflow tracking working
- [ ] GE validation running
- [ ] OpenTelemetry traces visible
