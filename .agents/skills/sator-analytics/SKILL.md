---
name: sator-analytics
description: "Esports analytics calculations for 4NJZ4 TENET Platform including SimRating, RAR, Investment Grading, advanced probability/statistics, and eSports-specific metrics. Language-agnostic mathematical reference. USE FOR: SimRating, RAR, investment grading, temporal analysis, confidence weighting, Bayesian inference, bootstrap resampling, rating systems, eSports KPIs. DO NOT USE FOR: general ML, non-esports analytics, real-time betting predictions."
license: MIT
metadata:
  author: SATOR Team
  version: "2.2.0"
---

# SATOR Analytics

> **⚠️ UNPROOFED — CALCULATIONS REQUIRE VALIDATION**
>
> All formulae in this skill are drafts. Numerical constants, weights, thresholds,
> and derived formulae have NOT been empirically validated against real VCT data.
> Treat every formula as a starting hypothesis. Run statistical validation before
> promoting any metric to production use.

> **OVERFITTING GUARDRAILS REQUIRED**
>
> Location: `packages/shared/axiom-esports-data/analytics/`
> Temporal wall: training data must predate 2024-01-01.
> Use `adjusted_kill_value`, not raw ACS.
> Confidence weighting mandatory for all metrics.

---

## Triggers

Activate this skill when working on:
- SimRating player performance scores
- RAR (Role-Adjusted Replacement) values
- Investment Grade classifications (A+ to D)
- Temporal analysis / age curves / decay weighting
- Confidence-weighted metric calculations
- Overfitting detection and guardrails
- Bayesian inference on sparse player data
- Bootstrap resampling for uncertainty estimation
- Elo / Glicko / TrueSkill-style rating updates
- eSports-specific KPIs (KAST, opening duels, clutch rates, economy)
- Probability distributions for in-game events
- Hypothesis testing on performance differences
- Regression and normalization across eras or patches

---

## Rules

1. **Temporal Wall** — Training data must predate 2024-01-01
2. **Adjusted Kill Value** — Use `adjusted_kill_value`, not raw ACS
3. **Confidence Weighting** — All metrics require confidence tiers
4. **No Hardcoded IDs** — Never hardcode player IDs in tests
5. **Range-Based Tests** — Test metric ranges, not exact values
6. **Z-Score Normalization** — Use for cross-era / cross-patch comparisons
7. **Unproofed Flag** — Mark any newly derived formula `# UNPROOFED` until validated
8. **Language Agnostic** — Express maths in notation first; implementation is secondary
9. **Sample Size Gate** — Do not surface metrics with N < 20 rounds without explicit uncertainty bounds

---

## WHEN to Use / DO NOT USE

| USE FOR | DO NOT USE FOR |
|---------|----------------|
| SimRating calculation | General machine learning pipelines |
| RAR decomposition | Real-time match prediction |
| Investment grading | Player betting odds |
| Temporal / age analysis | Future performance guarantees |
| Confidence weighting | Unweighted averages |
| Overfitting detection | Training models from scratch |
| Bayesian small-sample correction | Large-N frequentist studies |
| Bootstrap uncertainty bounds | Exact point estimates in isolation |
| eSports-specific KPIs | Generic sports analytics |

---

## Project Structure

```
packages/shared/axiom-esports-data/analytics/
├── src/
│   ├── simrating/          # SimRating (5-component composite)
│   ├── rar/                # Role-Adjusted Replacement
│   ├── investment/         # Investment grading
│   ├── temporal/           # Age curves, decay weights, temporal wall
│   ├── guardrails/         # Overfitting & leakage detection
│   ├── confidence/         # Confidence sampling & weighting
│   ├── probability/        # Distributions, Bayesian inference    [NEW]
│   ├── rating_systems/     # Elo, Glicko, TrueSkill variants      [NEW]
│   ├── hypothesis/         # Significance testing, effect size    [NEW]
│   └── esports_kpi/        # KAST, economy, clutch, duel KPIs     [NEW]
└── tests/
```

---

## Mathematical Foundations

### Notation Conventions

```
N          = sample size (number of rounds / matches)
μ          = population / sample mean
σ          = standard deviation
σ²         = variance
z          = z-score  (z = (x - μ) / σ)
p          = probability (0–1)
P(A|B)     = conditional probability of A given B
E[X]       = expected value of random variable X
Var[X]     = variance of X
CI(α)      = confidence interval at significance level α
β          = regression coefficient / decay rate (context-dependent)
θ          = model parameter (generic)
∝          = "proportional to"
~          = "distributed as"
```

---

## 1. SimRating (5-Component Composite)

### 1.1 Formula

```
SimRating = Σ(wᵢ · Cᵢ)   for i ∈ {combat, economy, clutch, support, entry}

Weights (UNPROOFED):
  w_combat   = 0.30
  w_economy  = 0.20
  w_clutch   = 0.20
  w_support  = 0.15
  w_entry    = 0.15
  Σwᵢ        = 1.00

Each component Cᵢ ∈ [0, 100]
```

### 1.2 Component Definitions (UNPROOFED)

```
C_combat  = min(100,  KD · 25  +  ADR / 3  +  FK_rate · 200 )
  KD       = kills / deaths
  ADR      = average damage per round
  FK_rate  = first kills per round

C_economy = min(100,  buy_efficiency · 100  +  save_rate · 50 )
  buy_efficiency = credits spent on wins / total credits spent
  save_rate      = rounds where weapon saved after loss

C_clutch  = min(100,  clutch_win_rate · 100  +  min(clutches_won, 20) )
  clutch_win_rate = 1vN rounds won / 1vN rounds entered

C_support = min(100,  assists_per_round · 100  +  utility_usage · 50 )
  utility_usage  = utility abilities that dealt damage or disrupted / total cast

C_entry   = min(100,  entry_success_rate · 100 · role_multiplier )
  role_multiplier:
    duelist    = 1.20
    initiator  = 1.00
    controller = 0.80
    sentinel   = 0.70
```

### 1.3 Confidence Gate

```
if confidence < confidence_floor (default 0.50):
    SimRating = NULL   // do not surface to UI
else:
    apply confidence-weighted adjustment (see §6)
```

### 1.4 Z-Score Cross-Era Normalisation

```
SimRating_normalised = (SimRating_raw - μ_era) / σ_era

μ_era, σ_era computed from all players in the same competitive season/patch window.
Use this when comparing players across different metas.
```

---

## 2. RAR (Role-Adjusted Replacement)

### 2.1 Formula

```
WAR_equivalent  = SimRating / 100 · 2.0          // UNPROOFED scale factor

replacement_val = WAR_equivalent - baseline_role

RAR             = replacement_val · role_scarcity_factor

baseline_role (UNPROOFED):
  duelist    = 0.80
  initiator  = 0.70
  controller = 0.60
  sentinel   = 0.65

role_scarcity_factor (UNPROOFED):
  duelist    = 1.00   // high supply
  sentinel   = 1.10
  initiator  = 1.15
  controller = 1.20   // lower supply
```

### 2.2 Interpretation

```
RAR > 0   →  above replacement level (net positive)
RAR = 0   →  replacement level (median performance for role)
RAR < 0   →  below replacement (roster liability)
```

---

## 3. Investment Grading

### 3.1 Combined Score (UNPROOFED)

```
combined_score = ( RAR · 0.6  +  (SimRating / 100) · 0.4 )
                 · age_factor(age)
                 · trend_multiplier(trend)

trend_multiplier:
  rising    = 1.10
  stable    = 1.00
  declining = 0.90
```

### 3.2 Age Factor Curve (UNPROOFED)

```
age_factor(age):
  age < 18          →  0.80   // developmental risk
  18 ≤ age < 22     →  0.90 + (age - 18) · 0.025   // rising
  22 ≤ age ≤ 24     →  1.00   // peak window
  24 < age ≤ 28     →  1.00 - (age - 24) · 0.030   // gradual decline
  age > 28          →  0.70   // significant decline risk
```

### 3.3 Grade Thresholds (UNPROOFED)

```
combined_score ≥ 2.50  →  A+
combined_score ≥ 2.00  →  A
combined_score ≥ 1.50  →  B
combined_score ≥ 1.00  →  C
combined_score  < 1.00  →  D
```

---

## 4. Temporal Analysis

### 4.1 Temporal Wall

```
TRAINING_CUTOFF = 2024-01-01

training_set = { record | record.date < TRAINING_CUTOFF }
test_set     = { record | record.date ≥ TRAINING_CUTOFF }

Validation: max(training_set.date) < min(test_set.date)
```

### 4.2 Exponential Recency Decay

```
weight(t) = exp( -λ · Δt )

Δt  = days between event and reference date (today or match date)
λ   = decay rate (UNPROOFED default: 0.005 ≈ half-life ~139 days)

Decayed metric = Σ( weight(tᵢ) · metricᵢ ) / Σ weight(tᵢ)
```

### 4.3 Patch Meta Correction

```
// Normalise within patch window to remove systematic meta bias
metric_normalised = (metric_raw - μ_patch) / σ_patch

Apply before cross-patch comparisons.
Patch boundary dates sourced from Pandascore API metadata.
```

---

## 5. Overfitting Guardrails

### 5.1 Train/Validation/Test Split

```
Recommended split (time-ordered, no shuffling):
  training   60%  (pre-2023-07-01)
  validation 20%  (2023-07-01 – 2023-12-31)
  test       20%  (2024-01-01+, temporal wall)
```

### 5.2 Leakage Detection Checklist

```
□ No future data in training features
□ No player identity features that implicitly encode future performance
□ Normalisation statistics (μ, σ) computed on training set only
□ Age computed relative to match date, not today
□ No label-derived features in training
```

### 5.3 Regularisation (UNPROOFED)

```
For regression models predicting SimRating components:
  Ridge (L2):  loss = MSE + α · Σθᵢ²
  Lasso (L1):  loss = MSE + α · Σ|θᵢ|
  ElasticNet:  loss = MSE + α₁ · Σ|θᵢ| + α₂ · Σθᵢ²

Recommended α search range: [0.001, 0.1] via cross-validation on validation set.
```

---

## 6. Confidence Weighting

### 6.1 Confidence Tiers

```
Tier 1 (High)   confidence ∈ [0.80, 1.00]  — ≥ 100 rounds, recent data, LAN event
Tier 2 (Medium) confidence ∈ [0.50, 0.80)  — 20–99 rounds, or online data
Tier 3 (Low)    confidence ∈ [0.00, 0.50)  — < 20 rounds → surface with warning, gate from grading

Confidence drivers (UNPROOFED weights):
  sample_size_factor  = min(1.0,  N / 100)
  recency_factor      = exp(-λ · days_since_last_match)     // λ = 0.005
  event_tier_factor   = { LAN International: 1.0, LAN Regional: 0.85, Online: 0.70 }

  confidence = sample_size_factor · recency_factor · event_tier_factor
```

### 6.2 Weighted Average

```
weighted_avg       = Σ( confidenceᵢ · valueᵢ ) / Σ confidenceᵢ
effective_confidence = mean(confidences)
```

### 6.3 Weighted Sampling

```
P(select recordᵢ) = confidenceᵢ / Σ confidenceⱼ
Sample without replacement using these probabilities.
```

---

## 7. Probability & Statistical Distributions

### 7.1 Kill Events — Poisson Model

```
Kills per round ~ Poisson(λ_role)

λ_role (mean kills/round, UNPROOFED estimates):
  duelist    ≈ 0.85
  initiator  ≈ 0.70
  controller ≈ 0.60
  sentinel   ≈ 0.65

P(k kills in round) = (λᵏ · e^(-λ)) / k!

Use for:
  - Expected kill counts over N rounds
  - Detecting statistically anomalous performance
  - Deriving kill-rate confidence intervals
```

### 7.2 Win Rates & Binary Events — Beta Distribution

```
For any binary event with observed s successes in N trials:
  prior   ~ Beta(α₀, β₀)       // uninformative: α₀ = β₀ = 1
  posterior ~ Beta(α₀ + s,  β₀ + N - s)

Posterior mean  = (α₀ + s) / (α₀ + β₀ + N)
Posterior mode  = (α₀ + s - 1) / (α₀ + β₀ + N - 2)   // valid if α,β > 1

95% Credible Interval: 2.5th–97.5th percentile of Beta(α₀+s, β₀+N-s)

Apply to:
  - First-duel win rate
  - Clutch success rate
  - Save rate
  - Opening round win rate
```

### 7.3 Composite Scores — Normal Approximation

```
By CLT, SimRating (sum of many components) approximates:
  SimRating ~ N(μ_role, σ_role²)

Use Normal for:
  - Z-score normalisation (§1.4)
  - Cross-era comparison
  - Percentile ranking within role pool
```

### 7.4 Round Outcome Sequences — Geometric / Negative Binomial

```
Rounds until first win ~ Geometric(p)
  E[rounds until win] = 1/p

Rounds until k-th win ~ NegBin(k, p)
  Use for: expected rounds to reach match point given current win probability p
```

---

## 8. Bayesian Inference (Small-Sample Correction)

### 8.1 Prior Selection

```
Recommended priors (UNPROOFED):
  SimRating prior:     N(μ_role_median, σ=15)     // role peer group
  KD ratio prior:      Gamma(shape=4, rate=4)      // mean≈1.0, plausible range
  Win rate prior:      Beta(2, 2)                  // weak, symmetric around 0.5
  Kill rate prior:     Gamma(shape=λ_role·10, rate=10)
```

### 8.2 Bayesian Update (Conjugate Pairs)

```
// Normal likelihood, known σ (SimRating update):
posterior_μ = (μ_prior/σ_prior² + N·x̄/σ_likelihood²)
              / (1/σ_prior² + N/σ_likelihood²)

posterior_σ² = 1 / (1/σ_prior² + N/σ_likelihood²)


// Poisson likelihood (kill rate update):
  prior:      Gamma(α, β)
  posterior:  Gamma(α + Σkᵢ,  β + N)
  posterior mean kill rate = (α + Σkᵢ) / (β + N)


// Binomial likelihood (win rate, clutch rate, etc.):
  prior:      Beta(α, β)
  posterior:  Beta(α + s,  β + N - s)
```

### 8.3 When to Apply Bayesian Correction

```
Apply when N < 50 rounds:
  raw_metric       →  posterior_mean(prior, observations)

Apply when N ≥ 50 rounds:
  frequentist mean is acceptable; Bayesian optional for uncertainty quantification
```

---

## 9. Bootstrap Resampling

### 9.1 Purpose

```
Estimate uncertainty on any metric M without assuming a parametric distribution.
Especially useful for composite metrics like SimRating.
```

### 9.2 Algorithm

```
INPUT:  data = [round_1, round_2, ..., round_N]
        B    = number of bootstrap samples (recommended: 1000–10000)
        M    = metric function

FOR b = 1 to B:
    sample_b   = draw N records from data WITH replacement
    estimate_b = M(sample_b)

bootstrap_distribution = [estimate_1, ..., estimate_B]

point_estimate = mean(bootstrap_distribution)
SE_bootstrap   = std(bootstrap_distribution)
CI_95          = [percentile(2.5), percentile(97.5)] of bootstrap_distribution
```

### 9.3 Application to SimRating

```
Use bootstrap CI to display uncertainty bands in the SATOR hub UI.
Surface as:  SimRating = 74.3  [95% CI: 70.1 – 78.6]
Gate display: only show CI when N ≥ 30 rounds (otherwise CI too wide to be informative).
```

---

## 10. Rating Systems

### 10.1 Elo (Baseline)

```
Expected score:  E_A = 1 / (1 + 10^((R_B - R_A) / 400))

Rating update:   R_A' = R_A + K · (S_A - E_A)
  S_A = 1 (win), 0.5 (draw), 0 (loss)
  K   = K-factor (UNPROOFED: 32 for new players, 16 for established)

Limitations: assumes constant player strength; no uncertainty modelling.
```

### 10.2 Glicko-2 (Recommended Over Elo)

```
State per player:  (μ, φ, σ)
  μ   = rating (scale: 0–3000, default 1500)
  φ   = rating deviation (uncertainty; default 350, floor 30)
  σ   = rating volatility (default 0.06)

Step 1 — Convert to Glicko-2 scale:
  μ'  = (μ - 1500) / 173.7178
  φ'  = φ / 173.7178

Step 2 — Compute g(φⱼ) for each opponent j:
  g(φⱼ) = 1 / sqrt(1 + 3φⱼ² / π²)

Step 3 — Expected score vs opponent j:
  E(μ', μⱼ', φⱼ) = 1 / (1 + exp(-g(φⱼ) · (μ' - μⱼ')))

Step 4 — Compute v (estimated variance):
  v = 1 / Σⱼ [ g(φⱼ)² · E · (1 - E) ]

Step 5 — Compute Δ (performance rating):
  Δ = v · Σⱼ [ g(φⱼ) · (sⱼ - E) ]

Steps 6–8: Update σ (volatility via Illinois algorithm), then φ, then μ.
(Full derivation: Glickman 2012 — implement from spec, do not simplify.)

Application: Team-level Glicko-2 for match prediction.
             Player-level Glicko-2 for RAR baseline calibration.
```

### 10.3 TrueSkill (Team Adaptation, UNPROOFED)

```
Each player: skill ~ N(μ, σ²)    (μ=25, σ=25/3 default)
Team skill:  T = Σ player μ values (simplified; ignores covariance)

Win probability:  P(team A beats team B) = Φ( (μ_A - μ_B) / sqrt(2β² + Σσᵢ²) )
  β  = performance noise constant (UNPROOFED: β = 4.167)
  Φ  = standard normal CDF

Update rules follow factor graph message passing (complex; use established library).
Use TrueSkill only for team-composition analysis, not individual player rating.
```

---

## 11. Hypothesis Testing

### 11.1 Comparing Two Players / Populations

```
// Independent samples t-test (assumes normality, N > 30 per group)
t = (x̄₁ - x̄₂) / sqrt( s₁²/N₁ + s₂²/N₂ )
df ≈ (s₁²/N₁ + s₂²/N₂)² / ( (s₁²/N₁)²/(N₁-1) + (s₂²/N₂)²/(N₂-1) )   // Welch

p-value: two-tailed lookup against t-distribution with df degrees of freedom.
Significance threshold: α = 0.05 (standard); use α = 0.01 for metric promotion decisions.

// Non-parametric alternative (preferred for small N or skewed distributions):
Mann-Whitney U test — no normality assumption.
```

### 11.2 Effect Size

```
Cohen's d = (x̄₁ - x̄₂) / s_pooled
  s_pooled = sqrt( ((N₁-1)s₁² + (N₂-1)s₂²) / (N₁+N₂-2) )

Interpretation (UNPROOFED for esports context):
  |d| < 0.2  →  negligible
  |d| < 0.5  →  small
  |d| < 0.8  →  medium
  |d| ≥ 0.8  →  large

Do not surface "statistically significant" differences with |d| < 0.2 to users.
```

### 11.3 Multiple Comparisons Correction

```
When testing K metrics simultaneously (e.g. all 5 SimRating components):
  Bonferroni: α_adjusted = α / K       // conservative
  BH (Benjamini-Hochberg): controls False Discovery Rate  // recommended

Sort p-values: p_(1) ≤ p_(2) ≤ ... ≤ p_(K)
BH reject H₀ for all p_(i) ≤ (i/K) · α
```

### 11.4 A/B Testing for Feature Flags

```
// SimRating v2 vs v1 comparison
Null hypothesis H₀: μ_new = μ_old  (no difference in rating quality)

Use paired t-test if same player pool is rated by both systems.
Use Welch's t-test if different cohorts.
Minimum detectable effect: calculate required N before running test.

Required N per group (two-sided, equal sizes):
  N ≈ 2 · ( (z_(α/2) + z_β) / (μ₁ - μ₂) · σ )²
  For α=0.05, power=0.80:  z_(α/2) = 1.96,  z_β = 0.84
```

---

## 12. eSports-Specific KPIs

> All thresholds UNPROOFED. Calibrate against VCT professional dataset.

### 12.1 KAST Rate

```
KAST = rounds where player had at least one of:
         K — Kill
         A — Assist (weapon assist or flash assist)
         S — Survived (alive at round end)
         T — Traded (died but killed within ~3 seconds by teammate)

KAST_rate = KAST_rounds / total_rounds

Professional baseline (UNPROOFED): μ ≈ 0.72–0.76 depending on role
```

### 12.2 Opening Duel Metrics

```
opening_duel_rate     = opening_duels_fought / rounds_played
opening_win_rate      = opening_duels_won / opening_duels_fought
opening_attempt_rate  = opening_duels_attempted / rounds_played   // aggression proxy

// Net opening impact
opening_delta = opening_duels_won - opening_duels_lost

// Posterior win rate (Beta-Binomial, small-sample corrected):
posterior_opening_wr = (α₀ + wins) / (α₀ + β₀ + N)
  prior: Beta(3, 3)  →  shrinks toward 0.5, allows ≥6 data points to dominate
```

### 12.3 Clutch Performance

```
clutch_entry_rate  = 1vN_rounds_entered / total_rounds
clutch_win_rate    = 1vN_rounds_won / 1vN_rounds_entered

// Difficulty-adjusted clutch value (UNPROOFED):
clutch_value = Σᵢ (  (win_i ? 1 : 0)  ·  (opponents_remaining_i / 5)  )

// 1v1 through 1v5 weights (UNPROOFED):
clutch_difficulty_weight:
  1v1 = 1.0
  1v2 = 2.5
  1v3 = 5.0
  1v4 = 9.0
  1v5 = 15.0
```

### 12.4 Economy Metrics

```
// Credits-spent efficiency (per round)
economy_efficiency = damage_dealt_round / credits_spent_round

// Team economy synchronisation  (UNPROOFED)
eco_sync_score = 1 - std(team_credits) / mean(team_credits)
  Higher score → team buying at similar levels → better-coordinated economy

// Save decision quality
save_quality = (weapons_saved_that_won_subsequent_rounds) / weapons_saved

// Average combat score per credit
ACS_per_credit = ACS / average_credits_spent_per_round
```

### 12.5 Map-Specific Normalisation

```
// Some maps favour attackers; normalise win rates accordingly
adjusted_win_rate = win_rate - map_side_bias[map][side]

map_side_bias estimated by: (avg_attacker_WR - 0.5) per map across all pro matches.
Do not compare cross-map win rates without this correction.
```

### 12.6 Multi-Kill Rounds

```
multi_kill_rate(k) = rounds_with_≥k_kills / total_rounds

k=1: single   (≈ E[Poisson(λ)])
k=2: double
k=3: triple
k=4: quad
k=5: ace

// Expected multi-kill rates under Poisson assumption:
P(≥k kills) = 1 - Σᵢ₌₀ᵏ⁻¹ Poisson(i; λ)

Use deviation from Poisson expectation as a clutch-performance signal.
```

### 12.7 Headshot Rate

```
hs_rate = headshot_kills / total_kills

// Normalize by weapon distribution (rifles ≠ pistols ≠ shotguns)
hs_rate_normalized = Σⱼ ( weapon_kill_share_j · hs_rate_j )

LAN professional baseline (UNPROOFED): hs_rate ≈ 0.20–0.35
```

### 12.8 Assists Breakdown

```
flash_assists    = rounds where player flash led directly to teammate kill
weapon_assists   = rounds where player did damage, teammate secured kill
vision_assists   = scout/recon utility that led to teammate kill

effective_assists = flash_assists + weapon_assists + 0.5 · vision_assists
                    (UNPROOFED weights)
```

---

## 13. Regression & Prediction

### 13.1 Linear Regression for Component Prediction

```
SimRating_component = β₀ + β₁·x₁ + β₂·x₂ + ... + ε

Fit using Ordinary Least Squares (OLS):
  β = (XᵀX)⁻¹ Xᵀy

Regularised (Ridge):
  β = (XᵀX + αI)⁻¹ Xᵀy

Always check:
  - R² on held-out validation set (not training set)
  - Residual plot for heteroscedasticity
  - VIF for multicollinearity (VIF > 10 → consider dropping feature)
```

### 13.2 Logistic Regression for Win Probability

```
P(win) = σ(β₀ + Σᵢ βᵢ·xᵢ)
  σ(z) = 1 / (1 + e^(-z))   // sigmoid

Features (UNPROOFED candidates):
  team_avg_SimRating, economy_advantage, map_side, team_Glicko_μ_diff

Calibration: use Platt scaling or isotonic regression to calibrate raw probabilities.
Brier score: B = (1/N) Σ (P̂ᵢ - yᵢ)²  — lower is better.
```

### 13.3 Performance Trajectory (Simple Time Series)

```
// Rolling window average (recency-weighted)
metric_smoothed(t) = Σ_{i=0}^{W-1}  weight(i) · metric(t-i)  /  Σ weight(i)
  weight(i) = exp(-λ·i)   // exponential decay, λ UNPROOFED = 0.3

// Trend direction classification:
slope = OLS coefficient on metric ~ time (last W matches)
trend = "rising"   if slope >  threshold_rise
      = "declining" if slope < -threshold_rise
      = "stable"   otherwise
threshold_rise (UNPROOFED) = 0.5 SimRating points per match
```

---

## 14. Testing Patterns

```
// Always test metric ranges, never exact values
assert 0 ≤ SimRating ≤ 100
assert 0 ≤ confidence ≤ 1
assert KAST_rate ≥ 0 and KAST_rate ≤ 1
assert len(bootstrap_CI) == 2 and CI[0] < CI[1]

// Test edge cases
- N = 0 rounds        → return NULL / empty result, not crash
- confidence = 0      → return NULL rating
- all kills = 0       → components default to 0, not error
- single round        → Bayesian prior dominates, surface low-confidence flag

// Test invariants
- SimRating(player_A) > SimRating(player_B) with identical stats except KD
  → player_A.KD > player_B.KD must hold
- Bayesian posterior mean with N=100 ≈ frequentist mean (prior washout)
- bootstrap CI width decreases as N increases
```

---

## 15. Commands Reference

```bash
# Run all analytics tests
pytest packages/shared/axiom-esports-data/analytics/tests/ -v

# Run with coverage
pytest packages/shared/axiom-esports-data/analytics/tests/ --cov=analytics --cov-report=term

# Validate guardrails
python -m analytics.scripts.validate_guardrails

# Calculate SimRating for a player
python -m analytics.scripts.calculate_simrating --player-id=<id>

# Generate investment report
python -m analytics.scripts.investment_report --output=report.csv

# Bootstrap uncertainty report
python -m analytics.scripts.bootstrap_uncertainty --player-id=<id> --B=1000
```

---

## 16. Changelog

### v2.2.0 (2026-03-25) — Current
- **Language-agnostic** rewrite: all formulae in mathematical notation; implementation secondary
- Added **⚠️ UNPROOFED** warnings throughout; no formula validated against real VCT data yet
- Added §7 Probability Distributions (Poisson, Beta, Normal, Geometric)
- Added §8 Bayesian Inference with conjugate pair update rules
- Added §9 Bootstrap Resampling algorithm and SimRating CI application
- Added §10 Rating Systems: Elo, Glicko-2 (full step reference), TrueSkill team adaptation
- Added §11 Hypothesis Testing: t-test, Mann-Whitney, Cohen's d, Bonferroni/BH correction, A/B testing
- Added §12 eSports KPIs: KAST, opening duels, clutch difficulty weights, economy metrics, map normalisation, multi-kill Poisson model, headshot normalisation, assists breakdown
- Added §13 Regression & Prediction: OLS, Ridge, logistic, time-series trajectory
- Enhanced §4 Temporal Analysis with exponential decay and patch meta correction
- Enhanced §5 Overfitting Guardrails with regularisation reference
- Enhanced §6 Confidence Weighting with LAN/Online event tier factors
- Added §14 Testing Patterns with edge case and invariant guidance

### v2.1.0
- Initial skill: SimRating, RAR, Investment Grading, Temporal Wall, Confidence Weighting

---

## References

- [AXIOM.md](../../../docs/AXIOM.md)
- [DATA_DICTIONARY.md](../../../docs/DATA_DICTIONARY.md)
- [memory/CURRENT_FOCUS.md](../../../memory/CURRENT_FOCUS.md)
- Glickman (2012) — Glicko-2 Rating System specification
- Herbrich et al. (2007) — TrueSkill: A Bayesian Skill Rating System
- Benjamini & Hochberg (1995) — Controlling the False Discovery Rate
