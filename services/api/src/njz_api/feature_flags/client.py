"""
Feature Flags Client

Supports:
- YAML file-based configuration (default)
- Unleash server integration (when configured)
- Environment variable overrides
"""

import os
import yaml
from typing import Dict, Any, Optional
from functools import lru_cache
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class FlagConfig:
    """Configuration for a single feature flag."""
    name: str
    enabled: bool
    description: str
    strategies: list
    
    @classmethod
    def from_dict(cls, name: str, data: Dict[str, Any]) -> "FlagConfig":
        return cls(
            name=name,
            enabled=data.get("enabled", False),
            description=data.get("description", ""),
            strategies=data.get("strategies", [])
        )


class FeatureFlags:
    """
    Feature flags client with multiple backend support.
    
    Priority order (highest to lowest):
    1. Environment variable override (FEATURE_FLAG_<NAME>)
    2. Unleash server (if configured)
    3. YAML configuration file
    4. Default (False)
    """
    
    def __init__(
        self,
        config_path: Optional[str] = None,
        unleash_url: Optional[str] = None,
        unleash_token: Optional[str] = None,
        app_name: str = "njz-platform"
    ):
        self.app_name = app_name
        self._flags: Dict[str, FlagConfig] = {}
        self._unleash_client = None
        
        # Load YAML configuration
        self._load_yaml_config(config_path or "config/features.yml")
        
        # Initialize Unleash if configured
        if unleash_url and unleash_token:
            self._init_unleash(unleash_url, unleash_token)
    
    def _load_yaml_config(self, path: str) -> None:
        """Load feature flags from YAML file."""
        try:
            # Try multiple paths
            paths_to_try = [
                path,
                os.path.join(os.getcwd(), path),
                os.path.join(os.getcwd(), "..", "..", "..", "..", "..", path),
                os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "..", path),
            ]
            
            yaml_path = None
            for p in paths_to_try:
                if os.path.exists(p):
                    yaml_path = p
                    break
            
            if not yaml_path:
                logger.warning(f"Feature flags config not found at {path}, using defaults")
                return
            
            with open(yaml_path, 'r') as f:
                data = yaml.safe_load(f)
            
            for name, config in data.items():
                if isinstance(config, dict):
                    self._flags[name] = FlagConfig.from_dict(name, config)
            
            logger.info(f"Loaded {len(self._flags)} feature flags from {yaml_path}")
            
        except Exception as e:
            logger.error(f"Error loading feature flags: {e}")
    
    def _init_unleash(self, url: str, token: str) -> None:
        """Initialize Unleash client (if available)."""
        try:
            from UnleashClient import UnleashClient
            
            self._unleash_client = UnleashClient(
                url=url,
                custom_headers={'Authorization': token},
                app_name=self.app_name,
                environment=os.getenv('APP_ENVIRONMENT', 'development')
            )
            self._unleash_client.initialize_client()
            logger.info("Unleash client initialized")
            
        except ImportError:
            logger.warning("UnleashClient not installed, using YAML config only")
        except Exception as e:
            logger.error(f"Failed to initialize Unleash: {e}")
    
    def is_enabled(self, flag_name: str, context: Optional[Dict] = None) -> bool:
        """
        Check if a feature flag is enabled.
        
        Args:
            flag_name: Name of the feature flag
            context: Optional context for strategy evaluation
            
        Returns:
            bool: True if feature is enabled
        """
        # 1. Environment variable override (highest priority)
        env_override = os.getenv(f"FEATURE_FLAG_{flag_name.upper()}")
        if env_override is not None:
            return env_override.lower() in ('true', '1', 'yes', 'on')
        
        # 2. Unleash server
        if self._unleash_client:
            try:
                return self._unleash_client.is_enabled(flag_name, context)
            except Exception as e:
                logger.error(f"Unleash error for {flag_name}: {e}")
        
        # 3. YAML configuration
        flag = self._flags.get(flag_name)
        if flag:
            return flag.enabled
        
        # 4. Default to False
        logger.warning(f"Feature flag '{flag_name}' not found, defaulting to False")
        return False
    
    def get_config(self, flag_name: str) -> Optional[FlagConfig]:
        """Get full configuration for a flag."""
        return self._flags.get(flag_name)
    
    def list_flags(self) -> Dict[str, bool]:
        """List all flags and their current state."""
        return {
            name: self.is_enabled(name)
            for name in self._flags.keys()
        }
    
    def get_all_configs(self) -> Dict[str, FlagConfig]:
        """Get all flag configurations."""
        return self._flags.copy()


# Global instance (singleton pattern)
_flags_instance: Optional[FeatureFlags] = None


def get_flags() -> FeatureFlags:
    """Get the global feature flags instance."""
    global _flags_instance
    if _flags_instance is None:
        _flags_instance = FeatureFlags(
            unleash_url=os.getenv("UNLEASH_URL"),
            unleash_token=os.getenv("UNLEASH_API_TOKEN")
        )
    return _flags_instance


def reload_flags() -> FeatureFlags:
    """Reload feature flags (useful for testing or config changes)."""
    global _flags_instance
    _flags_instance = FeatureFlags(
        unleash_url=os.getenv("UNLEASH_URL"),
        unleash_token=os.getenv("UNLEASH_API_TOKEN")
    )
    return _flags_instance


# Convenience functions for common flags
def lineage_tracking_enabled() -> bool:
    """Check if data lineage tracking is enabled."""
    return get_flags().is_enabled("lineage_tracking")


def cdc_streaming_enabled() -> bool:
    """Check if CDC streaming to Kafka is enabled."""
    return get_flags().is_enabled("cdc_streaming")


def simrating_v2_enabled() -> bool:
    """Check if SimRating v2 is enabled."""
    return get_flags().is_enabled("simrating_v2")


def vlr_scraper_deprecated() -> bool:
    """Check if VLR scraper is deprecated."""
    return get_flags().is_enabled("vlr_scraper_deprecation")


def rotas_60tps_enabled() -> bool:
    """Check if 60 TPS mode is enabled (always True after TPS upgrade)."""
    return get_flags().is_enabled("rotas_60tps")
