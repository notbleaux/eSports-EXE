"""
RAR (Risk-Adjusted Rating) Module — SATOR Crown Jewel Analytics.

Provides investment-grade player ratings combining:
- SimRating (performance quality)
- Volatility (stability assessment)
- Consistency (reliability bonus)
- Role adjustment (position context)

[Ver001.000]
"""

from .rar_calculator import RARCalculator, CompleteRARResult, calculate_rar
from .volatility import VolatilityCalculator, VolatilityResult, calculate_volatility
from .decomposer import RARDecomposer, RARResult

__all__ = [
    # Main Calculator
    "RARCalculator",
    "CompleteRARResult",
    "calculate_rar",
    # Volatility
    "VolatilityCalculator",
    "VolatilityResult",
    "calculate_volatility",
    # Role Decomposition
    "RARDecomposer",
    "RARResult",
]
