"""
Thompson Sampling

Bandit algorithm for exploration/exploitation in:
- Matchmaking optimization
- Feature experimentation
- Content recommendation
"""

import logging
from dataclasses import dataclass
from typing import List, Dict, Optional, Callable
import random

import numpy as np
from scipy import stats

logger = logging.getLogger(__name__)


@dataclass
class Arm:
    """A bandit arm (option to select)."""
    id: str
    alpha: float = 1.0  # Beta prior alpha
    beta: float = 1.0   # Beta prior beta
    successes: int = 0
    failures: int = 0
    
    @property
    def sample(self) -> float:
        """Sample from Beta posterior."""
        return np.random.beta(self.alpha + self.successes, self.beta + self.failures)
    
    @property
    def expected_value(self) -> float:
        """Expected value of the arm."""
        total = self.alpha + self.beta + self.successes + self.failures
        return (self.alpha + self.successes) / total


class ThompsonSampler:
    """
    Thompson Sampling for multi-armed bandit problems.
    
    Uses Beta-Bernoulli model for binary rewards.
    """
    
    def __init__(self, arms: Optional[List[Arm]] = None):
        self.arms = {arm.id: arm for arm in (arms or [])}
    
    def add_arm(self, arm_id: str, prior_alpha: float = 1.0, prior_beta: float = 1.0):
        """Add a new arm to the bandit."""
        self.arms[arm_id] = Arm(
            id=arm_id,
            alpha=prior_alpha,
            beta=prior_beta
        )
    
    def select_arm(self) -> str:
        """
        Select an arm using Thompson Sampling.
        
        Samples from each arm's posterior and selects the maximum.
        """
        if not self.arms:
            raise ValueError("No arms available")
        
        # Sample from each arm's posterior
        samples = {arm_id: arm.sample for arm_id, arm in self.arms.items()}
        
        # Select arm with highest sample
        return max(samples, key=samples.get)
    
    def select_arms_batch(self, n: int) -> List[str]:
        """Select n arms (with replacement for batch processing)."""
        return [self.select_arm() for _ in range(n)]
    
    def update(self, arm_id: str, reward: bool):
        """
        Update arm with observed reward.
        
        Args:
            arm_id: Arm that was selected
            reward: True for success, False for failure
        """
        if arm_id not in self.arms:
            logger.warning(f"Unknown arm: {arm_id}")
            return
        
        arm = self.arms[arm_id]
        if reward:
            arm.successes += 1
        else:
            arm.failures += 1
        
        logger.debug(f"Updated arm {arm_id}: successes={arm.successes}, failures={arm.failures}")
    
    def get_best_arm(self, use_expected: bool = False) -> str:
        """
        Get the best arm (for exploitation).
        
        Args:
            use_expected: If True, use expected value; else use MAP estimate
        """
        if not self.arms:
            raise ValueError("No arms available")
        
        if use_expected:
            return max(self.arms, key=lambda a: self.arms[a].expected_value)
        else:
            # MAP estimate
            def map_estimate(arm_id: str) -> float:
                arm = self.arms[arm_id]
                alpha = arm.alpha + arm.successes
                beta = arm.beta + arm.failures
                return (alpha - 1) / (alpha + beta - 2) if alpha + beta > 2 else 0.5
            
            return max(self.arms, key=map_estimate)
    
    def get_arm_stats(self) -> Dict[str, Dict]:
        """Get statistics for all arms."""
        return {
            arm_id: {
                "successes": arm.successes,
                "failures": arm.failures,
                "expected_value": arm.expected_value,
                "uncertainty": np.sqrt(
                    (arm.alpha + arm.successes) * (arm.beta + arm.failures) /
                    ((arm.alpha + arm.beta + arm.successes + arm.failures) ** 2 *
                     (arm.alpha + arm.beta + arm.successes + arm.failures + 1))
                )
            }
            for arm_id, arm in self.arms.items()
        }


class ContextualThompsonSampler:
    """
    Contextual Thompson Sampling with linear payoffs.
    
    Uses Bayesian linear regression for contextual bandits.
    """
    
    def __init__(self, n_features: int, alpha: float = 1.0):
        """
        Args:
            n_features: Number of context features
            alpha: Prior precision (inverse variance)
        """
        self.n_features = n_features
        self.alpha = alpha  # Prior precision
        
        # Bayesian linear regression parameters
        # Posterior: N(mu, Sigma)
        self.mu = np.zeros(n_features)
        self.Sigma = np.eye(n_features) / alpha  # Prior covariance
        
        # Precision matrix (Sigma^{-1})
        self.precision = np.eye(n_features) * alpha
    
    def sample_parameters(self) -> np.ndarray:
        """Sample parameters from posterior."""
        return np.random.multivariate_normal(self.mu, self.Sigma)
    
    def select_arm(self, contexts: Dict[str, np.ndarray]) -> str:
        """
        Select arm given contexts.
        
        Args:
            contexts: Dict mapping arm_id -> context vector
            
        Returns:
            Selected arm_id
        """
        theta = self.sample_parameters()
        
        # Predict reward for each arm
        predicted_rewards = {
            arm_id: np.dot(context, theta)
            for arm_id, context in contexts.items()
        }
        
        return max(predicted_rewards, key=predicted_rewards.get)
    
    def update(self, context: np.ndarray, reward: float):
        """
        Update posterior with observed reward.
        
        Uses Bayesian linear regression update.
        """
        # Update precision matrix
        self.precision += np.outer(context, context)
        
        # Update covariance
        self.Sigma = np.linalg.inv(self.precision)
        
        # Update mean
        self.mu = self.Sigma @ (self.precision @ self.mu + context * reward)


class MatchmakingOptimizer:
    """
    Use Thompson Sampling for optimal matchmaking.
    
    Balances:
    - Match quality (evenly matched teams)
    - Queue time
    - Regional preferences
    """
    
    def __init__(self):
        # Bandit for matchmaking strategies
        self.sampler = ThompsonSampler()
        
        # Add arms for different strategies
        self.sampler.add_arm("strict_skill", prior_alpha=10, prior_beta=5)
        self.sampler.add_arm("balanced", prior_alpha=10, prior_beta=5)
        self.sampler.add_arm("fast_queue", prior_alpha=5, prior_beta=10)
    
    def select_matchmaking_strategy(
        self,
        queue_time: float,
        player_count: int
    ) -> str:
        """
        Select matchmaking strategy based on queue state.
        
        Args:
            queue_time: Current queue wait time
            player_count: Number of players in queue
            
        Returns:
            Strategy name
        """
        # Context-aware selection
        # If queue time is high, favor faster strategies
        if queue_time > 60:  # 1 minute
            # Force fast queue if waiting too long
            return "fast_queue"
        
        if player_count < 10:
            # Not enough players, be more lenient
            return "balanced"
        
        # Use Thompson sampling for strategy selection
        return self.sampler.select_arm()
    
    def report_match_quality(
        self,
        strategy: str,
        match_quality: float,  # 0-1, higher is better
        player_satisfaction: float  # 0-1
    ):
        """
        Report match outcome for strategy optimization.
        
        Args:
            strategy: Strategy used
            match_quality: Quality of match (0-1)
            player_satisfaction: Player satisfaction (0-1)
        """
        # Combined reward
        reward = (match_quality + player_satisfaction) / 2 > 0.6
        
        self.sampler.update(strategy, reward)


# Global instances
_thompson_sampler: Optional[ThompsonSampler] = None
_matchmaking_optimizer: Optional[MatchmakingOptimizer] = None


def get_thompson_sampler() -> ThompsonSampler:
    """Get the global Thompson sampler."""
    global _thompson_sampler
    if _thompson_sampler is None:
        _thompson_sampler = ThompsonSampler()
    return _thompson_sampler


def get_matchmaking_optimizer() -> MatchmakingOptimizer:
    """Get the global matchmaking optimizer."""
    global _matchmaking_optimizer
    if _matchmaking_optimizer is None:
        _matchmaking_optimizer = MatchmakingOptimizer()
    return _matchmaking_optimizer
