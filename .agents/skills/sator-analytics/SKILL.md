---
name: sator-analytics
description: "Esports analytics calculations for 4NJZ4 TENET Platform including SimRating, RAR, and Investment Grading. USE FOR: SimRating calculation, RAR decomposition, investment grading, temporal analysis, confidence weighting. DO NOT USE FOR: general ML, non-esports analytics, real-time predictions."
license: MIT
metadata:
  author: SATOR Team
  version: "2.0.0"
---

# SATOR Analytics

> **OVERFITTING GUARDRAILS REQUIRED**
>
> Location: `packages/shared/axiom-esports-data/analytics/`
> Temporal wall: training data must predate 2024-01-01.
> Use adjusted_kill_value, not raw ACS.
> Confidence weighting mandatory for all metrics.

## Triggers

Activate this skill when user wants to:
- Calculate SimRating player performance scores
- Implement RAR (Role-Adjusted Replacement) values
- Create Investment Grade classifications (A+ to D)
- Build temporal analysis with age curves
- Implement confidence-weighted calculations
- Set up overfitting detection guardrails

## Rules

1. **Temporal Wall** — Training data must predate 2024-01-01
2. **Adjusted Kill Value** — Use adjusted_kill_value, not raw ACS
3. **Confidence Weighting** — All metrics require confidence tiers
4. **No Hardcoded IDs** — Never hardcode player IDs in tests
5. **Range-Based Tests** — Test metric ranges, not exact values
6. **Z-Score Normalization** — Use for cross-era comparisons

## WHEN to Use / DO NOT USE

| USE FOR | DO NOT USE FOR |
|---------|----------------|
| SimRating calculation | General machine learning |
| RAR decomposition | Real-time predictive models |
| Investment grading | Player betting odds |
| Temporal analysis | Future performance prediction |
| Confidence weighting | Unweighted averages |
| Overfitting detection | Model training from scratch |

## Project Structure

```
packages/shared/axiom-esports-data/analytics/
├── src/
│   ├── __init__.py
│   ├── simrating/              # SimRating calculations
│   │   ├── __init__.py
│   │   ├── calculator.py
│   │   ├── components.py       # 5 components
│   │   └── normalizer.py       # Z-score normalization
│   ├── rar/                    # RAR calculations
│   │   ├── __init__.py
│   │   ├── decomposer.py
│   │   ├── role_baselines.py
│   │   └── replacer.py
│   ├── investment/             # Investment grading
│   │   ├── __init__.py
│   │   └── grader.py
│   ├── temporal/               # Temporal analysis
│   │   ├── __init__.py
│   │   ├── age_curves.py
│   │   ├── decay_weights.py
│   │   └── temporal_wall.py
│   ├── guardrails/             # Overfitting prevention
│   │   ├── __init__.py
│   │   ├── integrity_checker.py
│   │   └── leakage_detector.py
│   └── confidence/             # Confidence weighting
│       ├── __init__.py
│       └── sampler.py
├── tests/
│   ├── test_simrating.py
│   ├── test_rar.py
│   └── test_guardrails.py
└── requirements.txt
```

## SimRating Calculation

```python
# src/simrating/calculator.py
from typing import Dict, List
from dataclasses import dataclass
import numpy as np

@dataclass
class SimRatingComponents:
    """Five-component SimRating structure."""
    combat: float      # Kill/death efficiency
    economy: float     # Resource management
    clutch: float      # High-pressure performance
    support: float     # Team assistance
    entry: float       # Opening duel success
    
    @property
    def overall(self) -> float:
        """Weighted composite score."""
        weights = [0.30, 0.20, 0.20, 0.15, 0.15]
        components = [self.combat, self.economy, self.clutch, self.support, self.entry]
        return sum(w * c for w, c in zip(weights, components))

class SimRatingCalculator:
    """Calculate 5-component SimRating for players."""
    
    def __init__(self, confidence_floor: float = 0.5):
        self.confidence_floor = confidence_floor
    
    def calculate(
        self,
        player_stats: Dict[str, float],
        role: str,
        confidence: float = 1.0
    ) -> SimRatingComponents:
        """
        Calculate SimRating components.
        
        Args:
            player_stats: Raw player statistics
            role: Player role (duelist, sentinel, controller, initiator)
            confidence: Data quality confidence (0.0-1.0)
        """
        if confidence < self.confidence_floor:
            # Return null ratings for low confidence
            return SimRatingComponents(0, 0, 0, 0, 0)
        
        # Use adjusted_kill_value, NOT raw ACS
        adjusted_kills = player_stats.get('adjusted_kill_value', 0)
        
        components = SimRatingComponents(
            combat=self._calculate_combat(player_stats),
            economy=self._calculate_economy(player_stats),
            clutch=self._calculate_clutch(player_stats),
            support=self._calculate_support(player_stats),
            entry=self._calculate_entry(player_stats, role),
        )
        
        return components
    
    def _calculate_combat(self, stats: Dict[str, float]) -> float:
        """Combat efficiency component."""
        kd = stats.get('kd_ratio', 1.0)
        adr = stats.get('adr', 150)
        fk = stats.get('first_kills_per_round', 0.1)
        
        # Normalize to 0-100 scale
        return min(100, (kd * 25) + (adr / 3) + (fk * 200))
    
    def _calculate_economy(self, stats: Dict[str, float]) -> float:
        """Economy management component."""
        buy_efficiency = stats.get('buy_efficiency', 0.5)
        save_rate = stats.get('save_rate', 0.2)
        
        return min(100, (buy_efficiency * 100) + (save_rate * 50))
    
    def _calculate_clutch(self, stats: Dict[str, float]) -> float:
        """Clutch performance component."""
        clutch_success = stats.get('clutch_success_rate', 0.2)
        clutches_won = stats.get('clutches_won', 0)
        
        return min(100, (clutch_success * 100) + min(clutches_won, 20))
    
    def _calculate_support(self, stats: Dict[str, float]) -> float:
        """Team support component."""
        assists = stats.get('assists_per_round', 0.2)
        utility_usage = stats.get('utility_usage', 0.5)
        
        return min(100, (assists * 100) + (utility_usage * 50))
    
    def _calculate_entry(self, stats: Dict[str, float], role: str) -> float:
        """Entry fragging component (role-adjusted)."""
        entry_success = stats.get('entry_success_rate', 0.5)
        
        # Role-specific expectations
        role_multipliers = {
            'duelist': 1.2,
            'initiator': 1.0,
            'controller': 0.8,
            'sentinel': 0.7,
        }
        
        multiplier = role_multipliers.get(role, 1.0)
        return min(100, entry_success * 100 * multiplier)
```

## RAR (Role-Adjusted Replacement)

```python
# src/rar/decomposer.py
from typing import Dict
from dataclasses import dataclass

@dataclass
class RARValue:
    """Role-Adjusted Replacement value."""
    raw_score: float
    role_adjusted: float
    replacement_value: float
    confidence: float

class RARDecomposer:
    """Calculate RAR values for player valuation."""
    
    # Role baseline WAR (Wins Above Replacement)
    ROLE_BASELINES = {
        'duelist': 0.8,
        'initiator': 0.7,
        'controller': 0.6,
        'sentinel': 0.65,
    }
    
    def __init__(self):
        self.baselines = self.ROLE_BASELINES
    
    def calculate(
        self,
        player_stats: Dict[str, float],
        role: str,
        simrating: float,
        confidence: float = 1.0
    ) -> RARValue:
        """
        Calculate RAR value.
        
        RAR = (Player Performance - Replacement Level) * Role Factor
        """
        baseline = self.baselines.get(role, 0.5)
        
        # Normalize SimRating to WAR-like scale
        war_equivalent = simrating / 100 * 2.0
        
        # Calculate replacement value
        replacement_value = war_equivalent - baseline
        
        # Role adjustment
        role_factor = self._get_role_factor(role)
        role_adjusted = replacement_value * role_factor
        
        return RARValue(
            raw_score=war_equivalent,
            role_adjusted=role_adjusted,
            replacement_value=replacement_value,
            confidence=confidence,
        )
    
    def _get_role_factor(self, role: str) -> float:
        """Get role scarcity factor."""
        factors = {
            'duelist': 1.0,      # High supply
            'sentinel': 1.1,     # Medium supply
            'controller': 1.2,   # Lower supply
            'initiator': 1.15,   # Medium-low supply
        }
        return factors.get(role, 1.0)
```

## Investment Grading

```python
# src/investment/grader.py
from enum import Enum
from typing import Dict
from dataclasses import dataclass

class InvestmentGrade(Enum):
    """Investment grade from A+ to D."""
    A_PLUS = "A+"
    A = "A"
    B = "B"
    C = "C"
    D = "D"

@dataclass
class InvestmentAssessment:
    """Complete investment assessment."""
    grade: InvestmentGrade
    simrating: float
    rar: float
    age_factor: float
    trend: str
    confidence: float

class InvestmentGrader:
    """Grade player investment potential."""
    
    # Grade thresholds
    GRADE_THRESHOLDS = {
        InvestmentGrade.A_PLUS: 2.5,
        InvestmentGrade.A: 2.0,
        InvestmentGrade.B: 1.5,
        InvestmentGrade.C: 1.0,
        InvestmentGrade.D: 0.0,
    }
    
    def grade(
        self,
        simrating: float,
        rar: float,
        age: int,
        recent_trend: str,
        confidence: float
    ) -> InvestmentAssessment:
        """
        Calculate investment grade.
        
        Args:
            simrating: Player SimRating (0-100)
            rar: RAR value
            age: Player age
            recent_trend: 'rising', 'stable', or 'declining'
            confidence: Data confidence (0-1)
        """
        # Age curve adjustment
        age_factor = self._age_factor(age)
        
        # Combined score
        combined_score = (rar * 0.6 + (simrating / 100) * 0.4) * age_factor
        
        # Trend adjustment
        trend_multipliers = {
            'rising': 1.1,
            'stable': 1.0,
            'declining': 0.9,
        }
        combined_score *= trend_multipliers.get(recent_trend, 1.0)
        
        # Determine grade
        grade = self._score_to_grade(combined_score)
        
        return InvestmentAssessment(
            grade=grade,
            simrating=simrating,
            rar=rar,
            age_factor=age_factor,
            trend=recent_trend,
            confidence=confidence,
        )
    
    def _age_factor(self, age: int) -> float:
        """Age curve factor (peak at 22-24)."""
        if 22 <= age <= 24:
            return 1.0
        elif age < 18:
            return 0.8  # Too young
        elif age < 22:
            return 0.9 + (age - 18) * 0.025  # Improving
        elif age <= 28:
            return 1.0 - (age - 24) * 0.03  # Declining slowly
        else:
            return 0.7  # Significant decline
    
    def _score_to_grade(self, score: float) -> InvestmentGrade:
        """Convert score to grade."""
        for grade, threshold in sorted(
            self.GRADE_THRESHOLDS.items(),
            key=lambda x: x[1],
            reverse=True
        ):
            if score >= threshold:
                return grade
        return InvestmentGrade.D
```

## Temporal Wall

```python
# src/temporal/temporal_wall.py
from datetime import datetime
from typing import Dict, List

class TemporalWall:
    """
    Enforce temporal boundaries for train/test splits.
    Prevents future data leakage in training.
    """
    
    TRAINING_CUTOFF = datetime(2024, 1, 1)
    
    @classmethod
    def filter_training_data(cls, data: List[Dict]) -> List[Dict]:
        """Filter data to only include training period."""
        return [
            record for record in data
            if record.get('date', datetime.min) < cls.TRAINING_CUTOFF
        ]
    
    @classmethod
    def filter_test_data(cls, data: List[Dict]) -> List[Dict]:
        """Filter data to only include test period."""
        return [
            record for record in data
            if record.get('date', datetime.max) >= cls.TRAINING_CUTOFF
        ]
    
    @classmethod
    def validate_no_leakage(
        cls,
        training_data: List[Dict],
        test_data: List[Dict]
    ) -> bool:
        """Validate no temporal leakage between sets."""
        training_max = max(
            (r.get('date', datetime.min) for r in training_data),
            default=datetime.min
        )
        test_min = min(
            (r.get('date', datetime.max) for r in test_data),
            default=datetime.max
        )
        
        return training_max < test_min
```

## Confidence Weighting

```python
# src/confidence/sampler.py
import numpy as np
from typing import List, Dict, Tuple

class ConfidenceSampler:
    """Sample data with confidence weighting."""
    
    def sample(
        self,
        data: List[Dict],
        n_samples: int,
        confidence_key: str = 'confidence'
    ) -> List[Dict]:
        """
        Sample data weighted by confidence scores.
        
        Higher confidence records are more likely to be selected.
        """
        if len(data) <= n_samples:
            return data
        
        confidences = np.array([d.get(confidence_key, 0.5) for d in data])
        
        # Normalize to probabilities
        if confidences.sum() == 0:
            probabilities = np.ones(len(data)) / len(data)
        else:
            probabilities = confidences / confidences.sum()
        
        # Weighted sampling without replacement
        indices = np.random.choice(
            len(data),
            size=n_samples,
            replace=False,
            p=probabilities
        )
        
        return [data[i] for i in indices]
    
    def weighted_average(
        self,
        values: List[float],
        confidences: List[float]
    ) -> Tuple[float, float]:
        """
        Calculate confidence-weighted average.
        
        Returns:
            (weighted_average, effective_confidence)
        """
        if not values:
            return 0.0, 0.0
        
        weights = np.array(confidences)
        values_arr = np.array(values)
        
        weighted_avg = np.average(values_arr, weights=weights)
        effective_confidence = weights.mean()
        
        return weighted_avg, effective_confidence
```

## Testing

```python
# tests/test_simrating.py
import pytest
from analytics.src.simrating.calculator import SimRatingCalculator

class TestSimRatingCalculator:
    """Test SimRating calculations with range-based assertions."""
    
    def test_combat_component_range(self):
        """Combat component should be 0-100."""
        calc = SimRatingCalculator()
        
        stats = {'kd_ratio': 2.0, 'adr': 200, 'first_kills_per_round': 0.2}
        components = calc.calculate(stats, 'duelist')
        
        assert 0 <= components.combat <= 100
    
    def test_overall_calculation(self):
        """Overall should be weighted average of components."""
        calc = SimRatingCalculator()
        
        stats = {
            'adjusted_kill_value': 250,  # Use this, not raw ACS
            'kd_ratio': 1.5,
            'adr': 180,
            'first_kills_per_round': 0.15,
            'buy_efficiency': 0.7,
            'save_rate': 0.25,
            'clutch_success_rate': 0.25,
            'clutches_won': 10,
            'assists_per_round': 0.25,
            'utility_usage': 0.6,
            'entry_success_rate': 0.6,
        }
        
        components = calc.calculate(stats, 'duelist', confidence=0.9)
        
        # Range-based test, not exact value
        assert 50 <= components.overall <= 95
        assert components.confidence >= 0.5
    
    def test_low_confidence_handling(self):
        """Low confidence should return null ratings."""
        calc = SimRatingCalculator(confidence_floor=0.5)
        
        components = calc.calculate({}, 'duelist', confidence=0.3)
        
        assert components.combat == 0
        assert components.overall == 0
```

## Commands

```bash
cd packages/shared/axiom-esports-data

# Run analytics tests
pytest analytics/tests/ -v

# Calculate SimRating for player
python -m analytics.scripts.calculate_simrating --player-id=player123

# Generate investment report
python -m analytics.scripts.investment_report --output=report.csv

# Validate guardrails
python -m analytics.scripts.validate_guardrails
```

## References

- [AXIOM.md](../../../docs/AXIOM.md)
- [DATA_DICTIONARY.md](../../../docs/DATA_DICTIONARY.md)
