"""
Bayesian Analytics Module

Uncertainty quantification and Bayesian methods for esports analytics:
- Bayesian confidence scoring
- Credible intervals for predictions
- Probabilistic rating systems
- Thompson sampling for matchmaking
"""

from .confidence import BayesianConfidenceScorer, get_confidence_scorer
from .ratings import BayesianRatingSystem, get_rating_system
from .uncertainty import UncertaintyQuantifier, get_uncertainty_quantifier
from .thompson import ThompsonSampler, get_thompson_sampler

__all__ = [
    "BayesianConfidenceScorer",
    "get_confidence_scorer",
    "BayesianRatingSystem",
    "get_rating_system",
    "UncertaintyQuantifier",
    "get_uncertainty_quantifier",
    "ThompsonSampler",
    "get_thompson_sampler",
]
