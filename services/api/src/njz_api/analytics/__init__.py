"""
Analytics Module — SimRating, RAR, and Investment Grading

Migrated from satorXrotas to eSports-EXE
Provides comprehensive esports analytics calculations:
- SimRating: 5-component player performance rating
- RAR: Role-Adjusted Replacement value
- Investment Grading: A+ to D investment prospect classification
- Guardrails: ML overfitting prevention and data leakage detection
"""

from .simrating import SimRatingCalculator, SimRatingResult
from .decomposition import RARDecomposer, RARResult
from .investment_grading import InvestmentGrader
from .confidence import compute_decay_weight
from .age_curves import compute_age_curve, AgeCurveResult
from .confidence_sampler import ConfidenceSampler
from .neural_regressor import SeasonCohortNormalizer
from .overfitting_guard import OverfittingGuard, OverfittingReport, OverfittingAlert
from .leakage_detector import LeakageDetector, LeakageReport
from .temporal_wall import TemporalWall, DataLeakageError

__all__ = [
    # SimRating
    "SimRatingCalculator",
    "SimRatingResult",
    # RAR
    "RARDecomposer",
    "RARResult",
    # Investment Grading
    "InvestmentGrader",
    # Confidence & Temporal
    "compute_decay_weight",
    "compute_age_curve",
    "AgeCurveResult",
    "ConfidenceSampler",
    # ML Guardrails
    "SeasonCohortNormalizer",
    "OverfittingGuard",
    "OverfittingReport",
    "OverfittingAlert",
    "LeakageDetector",
    "LeakageReport",
    "TemporalWall",
    "DataLeakageError",
]
