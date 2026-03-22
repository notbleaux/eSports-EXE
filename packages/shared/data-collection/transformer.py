"""Data Transformer - Normalize scraped data + compute SATOR metrics"""

import pandas as pd
from typing import Dict, List
from dataclasses import dataclass
import numpy as np


@dataclass
class SATORMetrics:
    sim_rating: float
    rar: float  # Runs Above Replacement
    performance_index: float
    confidence: float


class DataTransformer:
    def __init__(self):
        self.team_ratings = pd.read_csv("team_ratings.csv")  # Precomputed

    def normalize_match(self, raw_match: dict) -> Dict:
        """Normalize VLR match to standard schema"""
        normalized = {
            "match_id": raw_match["match_id"],
            "tenet": "Valorant",
            "hub": "OPERA",
            "timestamp_utc": pd.to_datetime(raw_match["timestamp"]),
            "teams": {
                "home": raw_match["team_a"],
                "away": raw_match["team_b"],
                "home_score": raw_match["score_a"],
                "away_score": raw_match["score_b"],
            },
            "sator_metrics": self.compute_sator(raw_match),
        }
        return normalized

    def batch_normalize(self, matches: List[dict]) -> List[Dict]:
        """Batch process matches"""
        return [self.normalize_match(m) for m in matches]

    def compute_sator(self, match: dict) -> SATORMetrics:
        """Compute SimRating and RAR"""
        # Placeholder SimRating formula
        score_diff = abs(match["score_a"] - match["score_b"])
        base_rating = 1500

        sim_rating_home = base_rating + (match["score_a"] * 25 - score_diff * 10)
        sim_rating_away = base_rating + (match["score_b"] * 25 - score_diff * 10)

        rar_home = (
            (match["score_a"] - match["score_b"]) / max(1, match["score_b"]) * 100
        )

        return SATORMetrics(
            sim_rating=sim_rating_home,
            rar=rar_home,
            performance_index=0.85,  # ML model placeholder
            confidence=0.92,
        )

    def save_to_db(self, normalized_data: List[Dict], table: str):
        """Store normalized data (PostgreSQL placeholder)"""
        df = pd.DataFrame(normalized_data)
        df.to_sql(table, con=self.engine, if_exists="append", index=False)
        print(f"Saved {len(df)} records to {table}")


# Example usage
if __name__ == "__main__":
    transformer = DataTransformer()

    sample_match = {
        "match_id": "12345",
        "team_a": "Sentinels",
        "team_b": "Gen.G",
        "score_a": 13,
        "score_b": 11,
        "timestamp": "2024-06-01",
    }

    normalized = transformer.normalize_match(sample_match)
    print("Normalized:", normalized)

    metrics = transformer.compute_sator(sample_match)
    print("SATOR Metrics:", metrics)
