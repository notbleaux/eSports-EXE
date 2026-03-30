# ADR-008: Bayesian Analytics Integration

[Ver001.000]

## Status

**Accepted**

## Context

The NJZiteGeisTe Platform requires probabilistic methods for:

1. **Player ratings**: Uncertainty-aware skill estimation
2. **Match predictions**: Win probability with confidence intervals
3. **Confidence scoring**: How much to trust predictions and ratings
4. **A/B testing**: Statistical significance for model comparisons

Traditional frequentist approaches provide point estimates but fail to quantify uncertainty. This is critical for esports analytics where:
- New players have high uncertainty (few matches)
- Team performance varies with roster changes
- Upsets are common and should be modeled

## Decision

We will implement a **Bayesian analytics module** with three core components:

### 1. Confidence Scoring (`confidence.py`)
- Beta-Binomial for binary outcomes (wins/losses, headshot %)
- Normal-Inverse-Gamma for continuous metrics (ACS, K/D)
- Credible intervals for all estimates
- Sample size-aware confidence decay

### 2. Rating System (`ratings.py`)
- TrueSkill-inspired Gaussian rating distributions
- Team rating aggregation
- Match outcome prediction with uncertainty
- Dynamic rating updates (Bayesian inference)

### 3. Uncertainty Quantification (`uncertainty.py`)
- Bootstrap confidence intervals
- Monte Carlo dropout for neural networks
- Ensemble uncertainty aggregation
- Calibration metrics (ECE)

### Architecture

```
services/api/src/njz_api/analytics/bayesian/
├── __init__.py
├── confidence.py      # Bayesian confidence scoring
├── ratings.py         # TrueSkill-style rating system
├── uncertainty.py     # Uncertainty quantification
└── thompson.py        # Thompson sampling (future)
```

## Consequences

### Positive

1. **Proper uncertainty**: Confidence intervals for all predictions
2. **New player handling**: High initial variance, decreases with matches
3. **Interpretability**: "75% win probability (95% CI: 60%-90%)"
4. **Decision making**: Conservative ratings for matchmaking (mean - 2σ)
5. **A/B testing**: Built-in statistical significance testing

### Negative

1. **Complexity**: More complex than Elo or simple averages
2. **Computation**: Bayesian updates require more computation
3. **Tuning**: Hyperparameters (β, τ) need tuning per game mode
4. **Education**: Team needs to understand Bayesian concepts

### Comparison with Alternatives

| Method | Uncertainty | New Player | Team Games | Complexity |
|--------|-------------|------------|------------|------------|
| Elo | ❌ | Poor | ❌ | Low |
| Glicko | ✅ (σ) | Good | ❌ | Medium |
| TrueSkill | ✅ | Good | ✅ | Medium |
| Our System | ✅ | Good | ✅ | Medium |

## Mathematical Foundation

### Beta-Binomial (Binary Outcomes)

For binary outcomes (wins/losses), we use Beta prior with Binomial likelihood:

```
Prior:    θ ~ Beta(α, β)
Likelihood: k|θ ~ Binomial(n, θ)
Posterior: θ|k ~ Beta(α + k, β + n - k)
```

Confidence score combines:
- Expected value: E[θ] = (α + k) / (α + β + n)
- Precision: 1 - CI_width
- Sample size penalty: min(1, n / 100)

### Normal-Inverse-Gamma (Continuous Metrics)

For continuous metrics (ACS, K/D):

```
Prior:    μ ~ N(μ₀, σ²/κ₀)
          σ² ~ IG(α₀, β₀)
Posterior: μ|x ~ Student-t(νₙ, μₙ, σ²ₙ/κₙ)
```

### TrueSkill-Inspired Rating

Player rating: R ~ N(μ, σ²)

Team rating: R_team ~ N(Σμᵢ/n, Σσᵢ²/n²)

Win probability: P(win) = Φ((μ_A - μ_B) / √(σ²_A + σ²_B + 2β²))

Rating update: Kalman filter-style update based on outcome

## Implementation Details

### Confidence Scoring Example

```python
scorer = get_confidence_scorer()

# Binary confidence (K/D ratio)
result = scorer.calculate_binary_confidence(
    successes=150,  # kills
    trials=250,     # kills + deaths
    prior_alpha=2.0,
    prior_beta=2.0,
)
print(f"K/D confidence: {result.score:.2f}")
print(f"95% CI: {result.credible_interval}")

# Continuous confidence (ACS)
result = scorer.calculate_continuous_confidence(
    values=[200, 210, 190, 205, 195],
    prior_mean=200.0,
    prior_variance=10000.0,
)
```

### Rating System Example

```python
ratings = get_rating_system()

# Get player rating
rating = ratings.get_rating("player_123")
print(f"Rating: {rating.mean:.0f} ± {rating.std:.0f}")
print(f"Conservative: {rating.conservative_rating:.0f}")

# Predict match
prediction = ratings.predict_match(
    team_a_players=["p1", "p2", "p3", "p4", "p5"],
    team_b_players=["p6", "p7", "p8", "p9", "p10"],
)
print(f"Team A win: {prediction.team_a_win_prob:.1%}")
print(f"Confidence: {prediction.prediction_confidence:.1%}")

# Update after match
ratings.update_ratings(
    team_a_players=["p1", "p2", "p3", "p4", "p5"],
    team_b_players=["p6", "p7", "p8", "p9", "p10"],
    outcome="team_a_win",
    score_diff=5,  # 13-8
)
```

### Uncertainty Quantification Example

```python
quantifier = get_uncertainty_quantifier()

# Bootstrap uncertainty
estimate = quantifier.bootstrap_uncertainty(
    predictions=[0.7, 0.75, 0.72, 0.78, 0.73],
)
print(f"Mean: {estimate.mean_prediction:.2f}")
print(f"Total uncertainty: {estimate.total_uncertainty:.3f}")
print(f"Epistemic: {estimate.epistemic_uncertainty:.3f}")
print(f"Aleatoric: {estimate.aleatoric_uncertainty:.3f}")

# Calibration check
predicted_probs = [0.8, 0.6, 0.9, 0.4, 0.7]
actual_outcomes = [True, False, True, False, True]
ece = quantifier.expected_calibration_error(
    predicted_probs, actual_outcomes
)
print(f"ECE: {ece:.3f} (lower is better)")
```

## Hyperparameter Tuning

### Rating System

- `default_rating`: 1500 (standard starting point)
- `default_variance`: 10000 (high initial uncertainty)
- `beta`: 200 (skill class width, determines rating change magnitude)
- `tau`: 0.5 (dynamic factor, rating volatility)

Tuning guidelines:
- Decrease `beta` for more stable ratings
- Increase `tau` for faster adaptation to meta changes

### Confidence Scoring

- `prior_alpha`, `prior_beta`: 1.0 (uniform prior) to 10.0 (strong prior)
- Higher values = more regularization toward prior

## Integration Points

### SimRating Calculation

Bayesian confidence is used in SimRating to weight player contributions:

```python
player_confidence = scorer.calculate_player_confidence(player_stats)
weighted_rating = base_rating * player_confidence["sample_size"].score
```

### Match Prediction Display

Frontend shows predictions with uncertainty:

```
Team A: 65% win probability
       (95% confidence: 55%-75%)
```

### Model Evaluation

A/B testing uses Bayesian confidence intervals:

```python
comparison = ModelComparison(
    baseline_name="model_v1",
    baseline_version=1,
    challenger_name="model_v2",
    challenger_version=2,
    metric_improvements={"mae": -0.02},
    is_statistically_significant=True,
    recommendation="promote",
)
```

## Future Work

1. **Thompson Sampling**: For exploration/exploitation in matchmaking
2. **Hierarchical Models**: Team-level effects on player ratings
3. **Time Decay**: Recent matches weighted more heavily
4. **Game Mode Specific**: Separate ratings per game mode

## References

- [TrueSkill Paper](https://proceedings.neurips.cc/paper/2006/file/f22e4747da1aa27e363d86d40ff442fe-Paper.pdf)
- [Beta Distribution](https://en.wikipedia.org/wiki/Beta_distribution)
- [Conjugate Priors](https://en.wikipedia.org/wiki/Conjugate_prior)
- [Calibration in ML](https://arxiv.org/abs/1706.04599)
