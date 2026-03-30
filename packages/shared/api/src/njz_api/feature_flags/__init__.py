"""
Feature Flags Module for NJZiteGeisTe Platform

Provides feature toggle capabilities using Unleash client with YAML fallback.
"""

from .client import FeatureFlags, get_flags

__all__ = ["FeatureFlags", "get_flags"]
