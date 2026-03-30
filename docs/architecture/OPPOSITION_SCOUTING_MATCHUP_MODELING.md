[Ver001.000] [Part: 1/1, Phase: 3/3, Progress: 10%, Status: On-Going]

# Opposition Scouting & Matchup Modeling
## Head-to-Head Bayesian Models with Map-Specific Adjustments

---

## 1. EXECUTIVE SUMMARY

**Objective:** Implement advanced matchup modeling comparable to baseball pitcher-batter predictions, including:
- Head-to-head Bayesian models
- Role-specific matchup analysis (Duelist vs Sentinel)
- Map-specific performance adjustments
- Home/away (side) advantage modeling

**Baseball Comparison:**
| Baseball | Esports |
|----------|---------|
| Pitcher vs Batter | Duelist vs Sentinel |
| Ballpark factor | Map-specific performance |
| Home field advantage | Attacker/Defender side |
| Splits vs LHP/RHP | Splits by role/map |

---

## 2. BAYESIAN MATCHUP MODELS

### 2.1 Hierarchical Bayesian Model

```python
# packages/shared/ml/matchup/bayesian_models.py
"""
Bayesian matchup models using PyMC for probabilistic inference.
"""
import numpy as np
import pymc as pm
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass


@dataclass
class MatchupPrediction:
    """Probabilistic matchup prediction."""
    player_a_win_prob: float
    player_b_win_prob: float
    expected_score_a: float
    expected_score_b: float
    uncertainty: float
    sample_size: int
    

def fit_duel_model(
    historical_duels: List[Dict],
    player_a_id: str,
    player_b_id: str
) -> MatchupPrediction:
    """
    Fit Bayesian model for head-to-head duel prediction.
    
    Model structure:
    - Player A skill ~ Normal(prior)
    - Player B skill ~ Normal(prior)
    - Duel outcome ~ Bernoulli(logit(skill_a - skill_b))
    """
    
    # Extract historical data between these players
    a_wins = sum(1 for d in historical_duels if d['winner'] == player_a_id)
    b_wins = len(historical_duels) - a_wins
    
    with pm.Model() as duel_model:
        # Priors (informative based on overall ratings)
        skill_a = pm.Normal("skill_a", mu=50, sigma=15)
        skill_b = pm.Normal("skill_b", mu=50, sigma=15)
        
        # Likelihood
        logit_p = skill_a - skill_b
        outcomes = pm.Bernoulli(
            "outcomes",
            logit_p=logit_p,
            observed=[1] * a_wins + [0] * b_wins
        )
        
        # Sample
        trace = pm.sample(2000, tune=1000, chains=4)
    
    # Extract predictions
    skill_a_samples = trace.posterior["skill_a"].values.flatten()
    skill_b_samples = trace.posterior["skill_b"].values.flatten()
    
    # Calculate win probability
    win_prob_a = np.mean(skill_a_samples > skill_b_samples)
    
    return MatchupPrediction(
        player_a_win_prob=win_prob_a,
        player_b_win_prob=1 - win_prob_a,
        expected_score_a=np.mean(skill_a_samples),
        expected_score_b=np.mean(skill_b_samples),
        uncertainty=np.std(skill_a_samples - skill_b_samples),
        sample_size=len(historical_duels)
    )
```

### 2.2 Role-Based Matchup Matrix

```python
# packages/shared/ml/matchup/role_matchups.py
"""
Role-based matchup analysis (Duelist vs Sentinel, etc.).
"""
from enum import Enum
from typing import Dict, List
from collections import defaultdict
import pandas as pd


class ValorantRole(Enum):
    DUELIST = "duelist"
    INITIATOR = "initiator"
    CONTROLLER = "controller"
    SENTINEL = "sentinel"


class RoleMatchupAnalyzer:
    """
    Analyze performance based on role matchups.
    
    Example: How does a Duelist perform against Sentinels vs Controllers?
    """
    
    def __init__(self):
        self.matchup_matrix = defaultdict(lambda: defaultdict(list))
    
    def add_matchup_data(
        self,
        player_role: ValorantRole,
        opponent_role: ValorantRole,
        performance_score: float
    ):
        """Add single matchup observation."""
        self.matchup_matrix[player_role][opponent_role].append(performance_score)
    
    def get_matchup_stats(
        self,
        player_role: ValorantRole,
        opponent_role: ValorantRole
    ) -> Dict[str, float]:
        """Get statistics for specific matchup."""
        scores = self.matchup_matrix[player_role][opponent_role]
        
        if not scores:
            return {"count": 0, "mean": None, "std": None}
        
        return {
            "count": len(scores),
            "mean": np.mean(scores),
            "std": np.std(scores),
            "percentile_75": np.percentile(scores, 75),
            "percentile_25": np.percentile(scores, 25)
        }
    
    def get_adjustment_factor(
        self,
        player_role: ValorantRole,
        opponent_role: ValorantRole
    ) -> float:
        """
        Get performance adjustment factor for matchup.
        
        Returns multiplier (1.0 = neutral, >1.0 = favorable, <1.0 = unfavorable)
        """
        matchup_stats = self.get_matchup_stats(player_role, opponent_role)
        
        if matchup_stats["count"] < 10:
            return 1.0  # Insufficient data
        
        # Compare to player's overall average
        overall_scores = []
        for role in ValorantRole:
            overall_scores.extend(self.matchup_matrix[player_role][role])
        
        overall_mean = np.mean(overall_scores)
        matchup_mean = matchup_stats["mean"]
        
        # Calculate adjustment
        adjustment = matchup_mean / overall_mean if overall_mean > 0 else 1.0
        
        # Clamp to reasonable range
        return max(0.8, min(1.2, adjustment))
    
    def generate_matchup_heatmap(self) -> pd.DataFrame:
        """Generate matchup matrix heatmap data."""
        roles = list(ValorantRole)
        matrix = []
        
        for player_role in roles:
            row = []
            for opponent_role in roles:
                stats = self.get_matchup_stats(player_role, opponent_role)
                row.append(stats["mean"] if stats["mean"] else 0)
            matrix.append(row)
        
        return pd.DataFrame(
            matrix,
            index=[r.value for r in roles],
            columns=[r.value for r in roles]
        )


# Example matchup analysis
MATCHUP_INSIGHTS = {
    (ValorantRole.DUELIST, ValorantRole.SENTINEL): {
        "description": "Duelists struggle against Sentinel lockdown",
        "typical_adjustment": 0.92,
        "key_factors": ["Chamber OP", "Sage slow", "Killjoy utility"]
    },
    (ValorantRole.DUELIST, ValorantRole.CONTROLLER): {
        "description": "Duelists excel against Controller vision denial",
        "typical_adjustment": 1.08,
        "key_factors": ["Smoke pushes", "Flash timing"]
    },
    (ValorantRole.INITIATOR, ValorantRole.SENTINEL): {
        "description": "Initiators counter Sentinel setups",
        "typical_adjustment": 1.05,
        "key_factors": ["Sova recon", "Breach flashes"]
    }
}
```

---

## 3. MAP-SPECIFIC MODELING

### 3.1 Map Performance Database

```python
# packages/shared/ml/matchup/map_performance.py
"""
Map-specific performance tracking and adjustments.
"""
from typing import Dict, List, Optional
from dataclasses import dataclass
from collections import defaultdict
import numpy as np


@dataclass
class MapPerformance:
    """Player performance on specific map."""
    map_name: str
    matches_played: int
    wins: int
    avg_combat_score: float
    avg_kda: float
    win_rate: float
    side_performance: Dict[str, float]  # "attack" vs "defense"


class MapPerformanceTracker:
    """Track and predict map-specific performance."""
    
    VALORANT_MAPS = [
        "Haven", "Bind", "Split", "Ascent",
        "Icebox", "Breeze", "Fracture", "Pearl", "Lotus", "Sunset"
    ]
    
    def __init__(self):
        self.player_map_stats = defaultdict(lambda: defaultdict(list))
        self.map_meta_strengths = {}  # Overall map difficulty
    
    def record_performance(
        self,
        player_id: str,
        map_name: str,
        side: str,  # "attack" or "defense"
        combat_score: float,
        won: bool
    ):
        """Record single match performance."""
        self.player_map_stats[player_id][map_name].append({
            "side": side,
            "combat_score": combat_score,
            "won": won
        })
    
    def get_map_performance(
        self,
        player_id: str,
        map_name: str
    ) -> Optional[MapPerformance]:
        """Get aggregated performance on specific map."""
        matches = self.player_map_stats[player_id].get(map_name, [])
        
        if len(matches) < 3:
            return None  # Insufficient data
        
        wins = sum(1 for m in matches if m["won"])
        scores = [m["combat_score"] for m in matches]
        
        # Side-specific performance
        attack_scores = [m["combat_score"] for m in matches if m["side"] == "attack"]
        defense_scores = [m["combat_score"] for m in matches if m["side"] == "defense"]
        
        return MapPerformance(
            map_name=map_name,
            matches_played=len(matches),
            wins=wins,
            avg_combat_score=np.mean(scores),
            avg_kda=0,  # Would calculate from full stats
            win_rate=wins / len(matches),
            side_performance={
                "attack": np.mean(attack_scores) if attack_scores else 0,
                "defense": np.mean(defense_scores) if defense_scores else 0
            }
        )
    
    def get_map_adjustment(
        self,
        player_id: str,
        map_name: str,
        side: Optional[str] = None
    ) -> float:
        """
        Get performance adjustment factor for map.
        
        Returns multiplier based on player's historical performance.
        """
        performance = self.get_map_performance(player_id, map_name)
        
        if not performance or performance.matches_played < 5:
            return 1.0  # Neutral if insufficient data
        
        # Compare to player's overall average
        all_scores = []
        for map_data in self.player_map_stats[player_id].values():
            all_scores.extend([m["combat_score"] for m in map_data])
        
        overall_avg = np.mean(all_scores)
        
        # Use side-specific or overall map performance
        if side and side in performance.side_performance:
            map_avg = performance.side_performance[side]
        else:
            map_avg = performance.avg_combat_score
        
        adjustment = map_avg / overall_avg if overall_avg > 0 else 1.0
        
        # Confidence weighting (more matches = more confident)
        confidence = min(1.0, performance.matches_played / 20)
        weighted_adjustment = 1.0 + (adjustment - 1.0) * confidence
        
        return max(0.85, min(1.15, weighted_adjustment))


# Map-specific strategic insights
MAP_STRATEGIC_FACTORS = {
    "Haven": {
        "description": "Three-site map favors coordinated team play",
        "strong_roles": ["controller", "initiator"],
        "side_bias": 0.02,  # Slight attacker advantage
        "key_skills": ["rotation timing", "site control"]
    },
    "Bind": {
        "description": "Teleport mechanics reward map control",
        "strong_roles": ["controller", "sentinel"],
        "side_bias": -0.03,  # Slight defender advantage
        "key_skills": ["teleport usage", "flank denial"]
    },
    "Split": {
        "description": "Verticality rewards aggressive duelists",
        "strong_roles": ["duelist"],
        "side_bias": 0.05,  # Attacker advantage
        "key_skills": ["vertical play", "rope usage"]
    },
    "Ascent": {
        "description": "Open mid rewards vision control",
        "strong_roles": ["initiator", "controller"],
        "side_bias": 0.0,  # Balanced
        "key_skills": ["mid control", "utility usage"]
    }
}
```

### 3.2 Side Advantage (Home/Away)

```python
# packages/shared/ml/matchup/side_advantage.py
"""
Model attacker/defender side advantage (analogous to home field).
"""
from typing import Dict, Tuple
import numpy as np
from scipy import stats


class SideAdvantageModel:
    """
    Calculate side advantage for each map.
    
    Similar to baseball home field advantage (typically ~4% win rate boost).
    """
    
    def __init__(self):
        self.map_side_stats = {}
    
    def calculate_side_advantage(self, map_name: str) -> Dict[str, float]:
        """
        Calculate win rate differential between attack and defense.
        
        Returns:
            {
                "attack_win_rate": 0.52,
                "defense_win_rate": 0.48,
                "advantage": 0.04,  # 4% attacker advantage
                "significance": 0.03  # p-value
            }
        """
        # Query historical match data
        attack_wins, attack_total = self._get_side_stats(map_name, "attack")
        defense_wins, defense_total = self._get_side_stats(map_name, "defense")
        
        attack_wr = attack_wins / attack_total if attack_total > 0 else 0.5
        defense_wr = defense_wins / defense_total if defense_total > 0 else 0.5
        
        # Statistical significance test
        contingency = [[attack_wins, attack_total - attack_wins],
                       [defense_wins, defense_total - defense_wins]]
        
        _, p_value = stats.fisher_exact(contingency)
        
        return {
            "attack_win_rate": round(attack_wr, 3),
            "defense_win_rate": round(defense_wr, 3),
            "advantage": round(attack_wr - defense_wr, 3),
            "significance": round(p_value, 4),
            "sample_size": attack_total + defense_total,
            "is_significant": p_value < 0.05
        }
    
    def predict_with_side(
        self,
        base_prediction: float,
        map_name: str,
        team_a_side: str,  # "attack" or "defense"
        team_b_side: str
    ) -> Tuple[float, Dict]:
        """
        Adjust prediction based on side assignment.
        
        Args:
            base_prediction: Baseline win probability for team A
            map_name: Map being played
            team_a_side: Which side team A starts on
            team_b_side: Which side team B starts on
            
        Returns:
            Adjusted prediction and metadata
        """
        side_stats = self.calculate_side_advantage(map_name)
        
        if not side_stats["is_significant"]:
            return base_prediction, {"adjustment": 0, "reason": "No significant side advantage"}
        
        # Apply adjustment
        advantage = side_stats["advantage"]
        
        if team_a_side == "attack":
            adjustment = advantage / 2  # Half the advantage (sides switch)
        else:
            adjustment = -advantage / 2
        
        adjusted = np.clip(base_prediction + adjustment, 0.05, 0.95)
        
        return adjusted, {
            "adjustment": round(adjustment, 3),
            "attack_win_rate": side_stats["attack_win_rate"],
            "side_advantage_significant": True
        }


# Historical side advantage data (example)
SIDE_ADVANTAGE_HISTORY = {
    "Haven": {"attack_wr": 0.51, "defense_wr": 0.49, "n": 1500},
    "Bind": {"attack_wr": 0.48, "defense_wr": 0.52, "n": 1200},
    "Split": {"attack_wr": 0.54, "defense_wr": 0.46, "n": 1300},
    "Ascent": {"attack_wr": 0.50, "defense_wr": 0.50, "n": 2000},
    "Icebox": {"attack_wr": 0.52, "defense_wr": 0.48, "n": 900},
    "Breeze": {"attack_wr": 0.49, "defense_wr": 0.51, "n": 800},
    "Fracture": {"attack_wr": 0.53, "defense_wr": 0.47, "n": 600},
    "Pearl": {"attack_wr": 0.50, "defense_wr": 0.50, "n": 700},
    "Lotus": {"attack_wr": 0.51, "defense_wr": 0.49, "n": 500},
    "Sunset": {"attack_wr": 0.50, "defense_wr": 0.50, "n": 400}
}
```

---

## 4. INTEGRATED MATCHUP PREDICTION

```python
# packages/shared/ml/matchup/integrated_predictor.py
"""
Integrated matchup prediction combining all factors.
"""
from typing import Dict, List, Optional
from dataclasses import dataclass

from .bayesian_models import fit_duel_model
from .role_matchups import RoleMatchupAnalyzer, ValorantRole
from .map_performance import MapPerformanceTracker
from .side_advantage import SideAdvantageModel


@dataclass
class ComprehensiveMatchup:
    """Complete matchup analysis."""
    predicted_winner: str
    win_probability: float
    confidence: str
    
    # Factor breakdown
    base_rating_diff: float
    role_matchup_adjustment: float
    map_performance_adjustment: float
    side_advantage_adjustment: float
    h2h_history_adjustment: float
    
    # Explanations
    key_factors: List[str]
    player_advantages: Dict[str, List[str]]


class IntegratedMatchupPredictor:
    """
    Combine all matchup factors into unified prediction.
    """
    
    def __init__(self):
        self.role_analyzer = RoleMatchupAnalyzer()
        self.map_tracker = MapPerformanceTracker()
        self.side_model = SideAdvantageModel()
    
    async def predict_matchup(
        self,
        player_a: Dict,  # {id, role, rating}
        player_b: Dict,
        map_name: str,
        side_a: str,  # "attack" or "defense"
        side_b: str,
        historical_duels: Optional[List[Dict]] = None
    ) -> ComprehensiveMatchup:
        """
        Generate comprehensive matchup prediction.
        """
        explanations = []
        adjustments = []
        
        # 1. Base rating comparison
        base_diff = player_a["rating"] - player_b["rating"]
        base_prob = self._rating_to_probability(base_diff)
        explanations.append(f"Base rating difference: {base_diff:+.1f}")
        
        # 2. Role matchup adjustment
        role_adj = self.role_analyzer.get_adjustment_factor(
            ValorantRole(player_a["role"]),
            ValorantRole(player_b["role"])
        )
        adjustments.append(("role", role_adj))
        if role_adj != 1.0:
            direction = "favors" if role_adj > 1.0 else "disadvantages"
            explanations.append(f"Role matchup {direction} {player_a['id']}")
        
        # 3. Map performance adjustment
        map_adj_a = self.map_tracker.get_map_adjustment(
            player_a["id"], map_name, side_a
        )
        map_adj_b = self.map_tracker.get_map_adjustment(
            player_b["id"], map_name, side_b
        )
        map_adj = map_adj_a / map_adj_b if map_adj_b > 0 else 1.0
        adjustments.append(("map", map_adj))
        if abs(map_adj - 1.0) > 0.05:
            better = player_a["id"] if map_adj > 1.0 else player_b["id"]
            explanations.append(f"{better} has stronger {map_name} history")
        
        # 4. Side advantage
        side_prob, side_meta = self.side_model.predict_with_side(
            0.5, map_name, side_a, side_b
        )
        side_adj = side_prob / 0.5  # Convert to multiplier
        adjustments.append(("side", side_adj))
        if side_meta.get("side_advantage_significant"):
            adv_side = "attack" if side_adj > 1.0 else "defense"
            explanations.append(f"{adv_side} side has significant advantage on {map_name}")
        
        # 5. Head-to-head history
        h2h_adj = 1.0
        if historical_duels and len(historical_duels) >= 3:
            h2h_model = fit_duel_model(historical_duels, player_a["id"], player_b["id"])
            h2h_prob = h2h_model.player_a_win_prob
            h2h_adj = h2h_prob / 0.5
            adjustments.append(("h2h", h2h_adj))
            explanations.append(f"Head-to-head history ({len(historical_duels)} matches) considered")
        
        # Combine all adjustments
        final_prob = base_prob
        for factor, adj in adjustments:
            # Weighted combination
            weight = self._get_factor_weight(factor)
            final_prob = final_prob * (1 - weight) + (final_prob * adj) * weight
        
        final_prob = max(0.05, min(0.95, final_prob))
        
        # Determine confidence
        confidence_data_points = sum([
            1 for adj in [role_adj, map_adj, h2h_adj] if abs(adj - 1.0) > 0.02
        ])
        confidence = ["Low", "Moderate", "High", "Very High"][min(confidence_data_points, 3)]
        
        winner = player_a["id"] if final_prob > 0.5 else player_b["id"]
        
        return ComprehensiveMatchup(
            predicted_winner=winner,
            win_probability=max(final_prob, 1 - final_prob),
            confidence=confidence,
            base_rating_diff=base_diff,
            role_matchup_adjustment=role_adj - 1.0,
            map_performance_adjustment=map_adj - 1.0,
            side_advantage_adjustment=side_adj - 1.0,
            h2h_history_adjustment=h2h_adj - 1.0,
            key_factors=explanations,
            player_advantages={
                player_a["id"]: [e for e in explanations if player_a["id"] in e],
                player_b["id"]: [e for e in explanations if player_b["id"] in e]
            }
        )
    
    def _rating_to_probability(self, rating_diff: float) -> float:
        """Convert rating difference to win probability using logistic function."""
        import math
        return 1 / (1 + math.exp(-rating_diff / 10))
    
    def _get_factor_weight(self, factor: str) -> float:
        """Get weight for each factor type."""
        weights = {
            "role": 0.15,
            "map": 0.20,
            "side": 0.10,
            "h2h": 0.25
        }
        return weights.get(factor, 0.1)
```

---

## 5. IMPLEMENTATION TIMELINE

### Week 1: Role Matchups
- [ ] Implement `RoleMatchupAnalyzer`
- [ ] Create matchup matrix visualization
- [ ] Add role adjustment to predictions

### Week 2: Map Performance
- [ ] Implement `MapPerformanceTracker`
- [ ] Add map-specific adjustments
- [ ] Create map heatmap UI

### Week 3: Side Advantage
- [ ] Calculate historical side advantages
- [ ] Implement `SideAdvantageModel`
- [ ] Add to prediction pipeline

### Week 4: Integration
- [ ] Build `IntegratedMatchupPredictor`
- [ ] Add to match cards
- [ ] Create scouting report UI

---

## 6. DOCUMENT CONTROL

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 001.000 | 2026-03-30 | ML Team | Opposition scouting implementation |

---

*End of Opposition Scouting & Matchup Modeling*
