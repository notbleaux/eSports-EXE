# Analytics Module

Migrated from satorXrotas to eSports-EXE

## Overview

Advanced analytics calculations including SimRating, RAR, Investment Grading, and ML guardrails.

## Components

| File | Purpose |
|------|---------|
| `simrating.py` | SimRating calculation engine (5-component equal weight) |
| `decomposition.py` | RAR (Role-Adjusted Replacement) decomposition |
| `investment_grading.py` | Investment grade calculations (A+ to D) |
| `age_curves.py` | Player age curve analysis by role |
| `confidence.py` | Temporal decay weighting |
| `confidence_sampler.py` | Inverse confidence sampling for ML training |
| `neural_regressor.py` | Season/role cohort normalization |
| `overfitting_guard.py` | Adversarial validation for leakage detection |
| `leakage_detector.py` | Data leakage pattern detection |
| `temporal_wall.py` | Temporal train/test split enforcement |
| `router.py` | FastAPI REST endpoints |

## Key Metrics

### SimRating
- Equal 5-component weighting (0.20 each)
- Uses adjusted_kill_value, NOT raw ACS
- Z-score based within season/role cohorts
- Range: typically -3.0 to +3.0

### RAR (Role-Adjusted Replacement)
- Replacement levels by role:
  - Entry: 1.15
  - IGL: 0.95
  - Controller: 1.00
  - Initiator: 1.05
  - Sentinel: 0.98

### Investment Grades
- A+: RAR >= 1.30 (Elite)
- A: RAR >= 1.15 (All-Star)
- B: RAR >= 1.00 (Starter)
- C: RAR >= 0.85 (Below avg)
- D: RAR < 0.85 (Replacement)

## API Endpoints

- `POST /api/v1/analytics/simrating/calculate` - Calculate SimRating
- `POST /api/v1/analytics/rar/calculate` - Calculate RAR
- `POST /api/v1/analytics/investment/grade` - Grade investment prospect
- `POST /api/v1/analytics/investment/grade/batch` - Batch grade players
- `GET /api/v1/analytics/age-curve/{role}/{age}` - Get age curve
- `GET /api/v1/analytics/roles` - List available roles
- `GET /api/v1/analytics/health` - Health check

## Usage

```python
from src.njz_api.analytics import SimRatingCalculator, RARDecomposer, InvestmentGrader

# SimRating
calc = SimRatingCalculator()
result = calc.calculate(
    kills_z=1.0,
    deaths_z=-0.5,
    adjusted_kill_value_z=1.2,
    adr_z=0.8,
    kast_pct_z=0.5,
)

# RAR
rar = RARDecomposer()
result = rar.compute(raw_rating=1.20, role="Entry")

# Investment Grading
grader = InvestmentGrader()
grade = grader.grade(raw_rating=1.20, role="Entry", age=22)
```

## Dependencies

- pandas >= 2.0.0
- numpy >= 1.24.0
- scipy >= 1.10.0
- scikit-learn >= 1.3.0
