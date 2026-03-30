[CONTEXT] ANALYTICS AGENT - Statistical Methods Hardening
[Source: docs/CRITIQUE_REMEDIATION_MASTER_PLAN.md Phase 4]

=== CRITICAL GAPS ===
1. No uncertainty quantification (point estimates only)
2. Missing temporal consistency (no data lifecycle)
3. No Bayesian prior updating (no recency weighting)

=== MLB STANDARDS TO IMPLEMENT ===
- Baseball Prospectus / FanGraphs confidence intervals
- Marcel/ZIPS Bayesian projections
- Hot/Warm/Cold data tiering

=== DELIVERABLES ===

1. UNCERTAINTY QUANTIFICATION
   ```python
   @dataclass
   class UncertainEstimate:
       point_estimate: float
       ci_lower: float
       ci_upper: float
       confidence_level: float
       std_error: float
   
   # Bootstrap for SimRating
   # Display: "SimRating 84.3 [82.1, 86.5]"
   ```

2. TEMPORAL DATA LIFECYCLE
   - HOT: Current season (TimescaleDB uncompressed)
   - WARM: Last 2 years (TimescaleDB compressed)
   - COLD: 2-10 years (S3 Parquet)
   - Continuous aggregates for performance

3. BAYESIAN FORM TRACKING
   ```python
   class BayesianFormTracker:
       def update_posterior(self, observations, weights):
           # Exponential decay weighting
           # Return: mean, std, reliability
   ```

=== IMPLEMENTATION FILES ===
- packages/shared/ml/uncertainty/
- packages/shared/ml/temporal/
- packages/shared/ml/bayesian/

=== SUCCESS CRITERIA ===
- [ ] Bootstrap CI implemented for SimRating
- [ ] TimescaleDB tiering configured
- [ ] Bayesian tracker with recency weights
- [ ] Tests with 95% coverage
- [ ] Documentation with examples
