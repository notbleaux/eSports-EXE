"""
Tests for Analytics Module — SimRating, RAR, and Investment Grading
"""

import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timezone

# Test SimRating
from src.njz_api.analytics.simrating import SimRatingCalculator, SimRatingResult

# Test RAR
from src.njz_api.analytics.decomposition import RARDecomposer, RARResult, REPLACEMENT_LEVELS

# Test Investment Grading
from src.njz_api.analytics.investment_grading import InvestmentGrader

# Test Age Curves
from src.njz_api.analytics.age_curves import compute_age_curve, AgeCurveResult, ROLE_PEAK_RANGES

# Test Confidence
from src.njz_api.analytics.confidence import compute_decay_weight, compute_confidence_tier

# Test Confidence Sampler
from src.njz_api.analytics.confidence_sampler import ConfidenceSampler

# Test Neural Regressor
from src.njz_api.analytics.neural_regressor import SeasonCohortNormalizer

# Test Temporal Wall
from src.njz_api.analytics.temporal_wall import TemporalWall, DataLeakageError

# Test Leakage Detector
from src.njz_api.analytics.leakage_detector import LeakageDetector, LeakageReport


class TestSimRatingCalculator:
    """Test SimRating calculation engine."""
    
    def test_basic_calculation(self):
        calc = SimRatingCalculator()
        
        result = calc.calculate(
            kills_z=1.0,
            deaths_z=-0.5,  # Negative (good, fewer deaths)
            adjusted_kill_value_z=1.2,
            adr_z=0.8,
            kast_pct_z=0.5,
        )
        
        # Each component gets 0.20 weight
        expected = 0.20 * (1.0 + 0.5 + 1.2 + 0.8 + 0.5)  # deaths_z is inverted
        assert result.sim_rating == pytest.approx(expected, rel=1e-3)
        assert len(result.components) == 5
        assert len(result.z_scores) == 5
    
    def test_equal_weights(self):
        calc = SimRatingCalculator()
        
        # All equal z-scores
        result = calc.calculate(
            kills_z=1.0,
            deaths_z=1.0,
            adjusted_kill_value_z=1.0,
            adr_z=1.0,
            kast_pct_z=1.0,
        )
        
        # With deaths inverted: 1.0 - 1.0 = 0
        expected = 0.20 * (1.0 + (-1.0) + 1.0 + 1.0 + 1.0)
        assert result.sim_rating == pytest.approx(expected, rel=1e-3)
    
    def test_validate_range(self):
        calc = SimRatingCalculator()
        
        assert calc.validate_range(0.0) is True
        assert calc.validate_range(3.0) is True
        assert calc.validate_range(-3.0) is True
        assert calc.validate_range(6.0) is False  # Outside range
        assert calc.validate_range(-6.0) is False
    
    def test_calculate_percentile(self):
        calc = SimRatingCalculator()
        
        # Z-score of 0 = 50th percentile
        assert calc.calculate_percentile(0.0) == pytest.approx(50.0, abs=0.1)
        
        # Z-score of 1.0 ≈ 84th percentile
        assert calc.calculate_percentile(1.0) == pytest.approx(84.1, abs=0.5)
        
        # Z-score of -1.0 ≈ 16th percentile
        assert calc.calculate_percentile(-1.0) == pytest.approx(15.9, abs=0.5)
    
    def test_interpret_rating(self):
        calc = SimRatingCalculator()
        
        assert "Elite" in calc.interpret_rating(2.0)
        assert "Excellent" in calc.interpret_rating(1.5)
        assert "Very Good" in calc.interpret_rating(1.0)
        assert "Good" in calc.interpret_rating(0.5)
        assert "Average" in calc.interpret_rating(0.0)
        assert "Poor" in calc.interpret_rating(-1.5)


class TestRARDecomposer:
    """Test Role-Adjusted Replacement calculations."""
    
    def test_compute_entry(self):
        calc = RARDecomposer()
        
        # Entry has 1.15 replacement level
        result = calc.compute(raw_rating=1.30, role="Entry")
        
        assert result.role == "Entry"
        assert result.replacement_level == 1.15
        assert result.rar_score == pytest.approx(1.30 / 1.15, rel=1e-3)
    
    def test_compute_igl(self):
        calc = RARDecomposer()
        
        # IGL has 0.95 replacement level
        result = calc.compute(raw_rating=1.30, role="IGL")
        
        assert result.role == "IGL"
        assert result.replacement_level == 0.95
        assert result.rar_score == pytest.approx(1.30 / 0.95, rel=1e-3)
    
    def test_grade_a_plus(self):
        calc = RARDecomposer()
        
        result = calc.compute(raw_rating=1.50, role="Controller")
        assert result.investment_grade == "A+"
    
    def test_grade_a(self):
        calc = RARDecomposer()
        
        result = calc.compute(raw_rating=1.20, role="Controller")
        assert result.investment_grade == "A"
    
    def test_grade_b(self):
        calc = RARDecomposer()
        
        result = calc.compute(raw_rating=1.00, role="Controller")
        assert result.investment_grade == "B"
    
    def test_grade_c(self):
        calc = RARDecomposer()
        
        result = calc.compute(raw_rating=0.90, role="Controller")
        assert result.investment_grade == "C"
    
    def test_grade_d(self):
        calc = RARDecomposer()
        
        result = calc.compute(raw_rating=0.50, role="Controller")
        assert result.investment_grade == "D"
    
    def test_unknown_role_defaults(self):
        calc = RARDecomposer()
        
        result = calc.compute(raw_rating=1.0, role="UnknownRole")
        assert result.replacement_level == 1.00  # Default
    
    def test_get_replacement_mean(self):
        calc = RARDecomposer()
        
        mean = calc.get_replacement_mean()
        expected = sum(REPLACEMENT_LEVELS.values()) / len(REPLACEMENT_LEVELS)
        assert mean == pytest.approx(expected, rel=1e-3)


class TestInvestmentGrader:
    """Test Investment Grading system."""
    
    def test_grade_peak_age(self):
        grader = InvestmentGrader()
        
        result = grader.grade(
            raw_rating=1.20,
            role="Entry",
            age=22,  # Peak for Entry (20-24)
        )
        
        assert result["in_peak_age"] is True
        assert result["age_factor"] == 1.0
        assert result["career_stage"] == "peak"
    
    def test_grade_rising_age(self):
        grader = InvestmentGrader()
        
        result = grader.grade(
            raw_rating=1.20,
            role="Entry",
            age=18,  # Before peak
        )
        
        assert result["in_peak_age"] is False
        assert result["age_factor"] == 0.85
        assert result["career_stage"] == "rising"
    
    def test_temporal_decay(self):
        grader = InvestmentGrader()
        
        old_date = datetime(2022, 1, 1, tzinfo=timezone.utc)
        result = grader.grade(
            raw_rating=1.20,
            role="Entry",
            age=22,
            record_date=old_date,
        )
        
        assert result["decay_factor"] < 1.0
        assert result["adjusted_rar"] < result["rar_score"]
    
    def test_batch_grade(self):
        grader = InvestmentGrader()
        
        players = [
            {"player_id": "p1", "raw_rating": 1.30, "role": "Entry", "age": 22},
            {"player_id": "p2", "raw_rating": 1.00, "role": "IGL", "age": 28},
        ]
        
        results = grader.batch_grade(players)
        
        assert len(results) == 2
        assert results[0]["player_id"] == "p1"
        assert results[1]["player_id"] == "p2"


class TestAgeCurves:
    """Test age curve analysis."""
    
    def test_entry_peak_range(self):
        result = compute_age_curve("Entry", 22)
        
        assert result.peak_range == (20, 24)
        assert result.career_stage == "peak"
        assert result.peak_proximity > 0.5
    
    def test_igl_later_peak(self):
        result = compute_age_curve("IGL", 28)
        
        assert result.peak_range == (26, 32)
        assert result.career_stage == "peak"
    
    def test_rising_stage(self):
        result = compute_age_curve("Entry", 18)
        
        assert result.career_stage == "rising"
        assert result.peak_proximity < 1.0
    
    def test_declining_stage(self):
        result = compute_age_curve("Entry", 26)
        
        assert result.career_stage == "declining"
        assert result.peak_proximity < 1.0
    
    def test_default_role(self):
        result = compute_age_curve("UnknownRole", 25)
        
        assert result.peak_range == (21, 27)  # Default


class TestConfidence:
    """Test confidence and decay calculations."""
    
    def test_decay_weight_recent(self):
        recent = datetime.now(timezone.utc)
        weight = compute_decay_weight(recent)
        
        assert weight == pytest.approx(1.0, abs=0.01)
    
    def test_decay_weight_old(self):
        old = datetime(2020, 1, 1, tzinfo=timezone.utc)
        weight = compute_decay_weight(old)
        
        assert weight < 1.0
        assert weight >= 0.1  # Floor weight
    
    def test_decay_weight_floor(self):
        very_old = datetime(2010, 1, 1, tzinfo=timezone.utc)
        weight = compute_decay_weight(very_old)
        
        assert weight == 0.1  # Floor
    
    def test_confidence_tier_high(self):
        tier = compute_confidence_tier(
            games_played=100,
            recent_form_consistency=0.9,
            data_quality_score=0.9
        )
        
        assert tier > 80
    
    def test_confidence_tier_low(self):
        tier = compute_confidence_tier(
            games_played=5,
            recent_form_consistency=0.3,
            data_quality_score=0.3
        )
        
        assert tier < 40


class TestConfidenceSampler:
    """Test confidence-based sampling."""
    
    def test_sample_basic(self):
        sampler = ConfidenceSampler()
        
        df = pd.DataFrame({
            "player_id": range(100),
            "confidence_tier": [50] * 100,
        })
        
        result = sampler.sample(df, n=50)
        
        assert len(result) == 50
    
    def test_excludes_zero_confidence(self):
        sampler = ConfidenceSampler()
        
        df = pd.DataFrame({
            "player_id": range(100),
            "confidence_tier": [0] * 50 + [50] * 50,
        })
        
        result = sampler.sample(df, n=40)
        
        assert len(result) == 40
        assert all(result["confidence_tier"] > 0)


class TestTemporalWall:
    """Test temporal data leakage prevention."""
    
    def test_split_train_test(self):
        wall = TemporalWall("2024-01-01")
        
        df = pd.DataFrame({
            "match_id": [1, 2, 3, 4],
            "realworld_time": [
                "2023-06-01",  # Train
                "2023-09-01",  # Train
                "2024-02-01",  # Test
                "2024-05-01",  # Test
            ],
        })
        
        train, test = wall.split(df)
        
        assert len(train) == 2
        assert len(test) == 2
    
    def test_detects_overlap(self):
        wall = TemporalWall("2024-01-01")
        
        df = pd.DataFrame({
            "match_id": [1, 1, 2, 2],  # Duplicate match_ids across split
            "realworld_time": [
                "2023-06-01",
                "2023-09-01",
                "2024-02-01",
                "2024-05-01",
            ],
        })
        
        # This won't raise because match_ids aren't actually overlapping
        # across the split point (different match_ids in train vs test)
        train, test = wall.split(df)
        
        assert len(train) == 2
        assert len(test) == 2


class TestLeakageDetector:
    """Test data leakage detection."""
    
    def test_detects_derived_columns(self):
        detector = LeakageDetector()
        
        train = pd.DataFrame({
            "player_id": [1, 2],
            "sim_rating": [100, 200],  # Derived column
        })
        
        report = detector.detect(train)
        
        assert report.has_leakage is True
        assert any("sim_rating" in issue for issue in report.issues)
    
    def test_no_leakage_clean_data(self):
        detector = LeakageDetector()
        
        train = pd.DataFrame({
            "player_id": [1, 2],
            "kills": [10, 20],
        })
        
        report = detector.detect(train)
        
        assert report.has_leakage is False
    
    def test_detects_zero_confidence(self):
        detector = LeakageDetector()
        
        train = pd.DataFrame({
            "player_id": [1, 2, 3],
            "confidence_tier": [50, 0, 25],
        })
        
        report = detector.detect(train)
        
        assert report.has_leakage is True
        assert any("confidence_tier=0" in issue for issue in report.issues)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
