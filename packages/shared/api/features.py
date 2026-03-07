"""Feature flag management for gradual rollouts and A/B testing."""
import json
import hashlib
from typing import Dict, Any, Optional, List
from pathlib import Path
from functools import wraps


class FeatureManager:
    """Manages feature flags with percentage-based rollouts."""
    
    def __init__(self, config_path: str = "packages/shared/config/features.json"):
        self.config_path = Path(config_path)
        self._config: Dict[str, Any] = {}
        self._load_config()

    def _load_config(self):
        """Load feature configuration from file."""
        if self.config_path.exists():
            with open(self.config_path) as f:
                data = json.load(f)
                self._config = data.get("features", {})

    def reload(self):
        """Reload configuration from file."""
        self._load_config()

    def is_enabled(self, feature_name: str, user_id: Optional[str] = None) -> bool:
        """Check if feature is enabled for user."""
        feature = self._config.get(feature_name)
        if not feature:
            return False

        # Check if fully enabled
        if feature.get("enabled") and feature.get("rollout_percentage", 0) == 100:
            return True

        # Check if feature is disabled
        if not feature.get("enabled", False):
            return False

        # Check specific user access
        allowed_users = feature.get("allowed_users", [])
        if user_id and user_id in allowed_users:
            return True

        # Percentage-based rollout
        if user_id:
            user_hash = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
            rollout = feature.get("rollout_percentage", 0)
            return (user_hash % 100) < rollout

        # No user_id, check if fully rolled out
        return feature.get("rollout_percentage", 0) == 100

    def get_feature_config(self, feature_name: str) -> Optional[Dict[str, Any]]:
        """Get full configuration for a feature."""
        return self._config.get(feature_name)

    def get_all_features(self) -> Dict[str, Any]:
        """Get all feature configurations."""
        return self._config.copy()

    def list_enabled_features(self, user_id: Optional[str] = None) -> List[str]:
        """List all features enabled for user."""
        return [
            name for name in self._config.keys()
            if self.is_enabled(name, user_id)
        ]


# Global instance
_feature_manager: Optional[FeatureManager] = None


def init_features(config_path: str = "packages/shared/config/features.json"):
    """Initialize global feature manager."""
    global _feature_manager
    _feature_manager = FeatureManager(config_path)


def get_features() -> FeatureManager:
    """Get global feature manager."""
    if _feature_manager is None:
        init_features()
    return _feature_manager


def feature_flag(feature_name: str):
    """Decorator to gate functions behind feature flags."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, user_id: Optional[str] = None, **kwargs):
            if not get_features().is_enabled(feature_name, user_id):
                raise FeatureNotEnabled(f"Feature '{feature_name}' is not enabled")
            return await func(*args, user_id=user_id, **kwargs)
        return wrapper
    return decorator


class FeatureNotEnabled(Exception):
    """Raised when feature is not enabled."""
    pass