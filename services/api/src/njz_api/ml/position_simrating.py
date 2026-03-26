"""[Ver001.000] Position-based SimRating — role-specific score modifiers for Valorant."""
from __future__ import annotations

# Valorant roles and their scoring weight profiles
# Weights: [kd_weight, acs_weight, consistency_weight, precision_weight]
POSITION_WEIGHTS: dict[str, list[float]] = {
    "duelist":    [0.35, 0.30, 0.20, 0.15],  # High frag, high ACS
    "initiator":  [0.25, 0.25, 0.30, 0.20],  # Consistency matters most
    "controller": [0.20, 0.25, 0.35, 0.20],  # Consistency + utility
    "sentinel":   [0.20, 0.20, 0.35, 0.25],  # Precision + consistency
    "flex":       [0.25, 0.25, 0.25, 0.25],  # Equal weights (default)
}


def calculate_position_simrating(
    kd_score: float,
    acs_score: float,
    consistency_score: float,
    precision_score: float,
    position: str = "flex",
) -> dict[str, float]:
    """
    Calculate overall SimRating plus position-specific modifiers.

    Args:
        kd_score: K/D component (0-25)
        acs_score: ACS component (0-25)
        consistency_score: Consistency component (0-25)
        precision_score: HS% precision component (0-25)
        position: Player role (duelist/initiator/controller/sentinel/flex)

    Returns:
        Dict with 'overall' and per-role scores (0-100)
    """
    components = [kd_score, acs_score, consistency_score, precision_score]
    overall = sum(components)  # 0-100 base score

    results: dict[str, float] = {"overall": round(overall, 1)}

    for role, weights in POSITION_WEIGHTS.items():
        score = sum(c * w for c, w in zip(components, weights)) * 4  # Scale to 0-100
        results[role] = round(score, 1)

    # Tag the primary role rating
    pos = position.lower() if position.lower() in POSITION_WEIGHTS else "flex"
    results["primary_role"] = pos
    results["role_rating"] = results[pos]

    return results


def _synthetic_position_data():
    """Generate synthetic training data with position labels."""
    import numpy as np
    rng = np.random.default_rng(42)
    n = 2000
    positions = ["duelist", "initiator", "controller", "sentinel", "flex"]
    X = rng.uniform(0, 25, (n, 4)).astype("float32")
    pos_labels = rng.choice(positions, n)
    results = []
    for i in range(n):
        r = calculate_position_simrating(*X[i], position=pos_labels[i])
        results.append(r)
    return X, pos_labels, results


if __name__ == "__main__":
    # Quick smoke test
    result = calculate_position_simrating(18, 20, 22, 16, "duelist")
    print("Position SimRating test:", result)
