"""
FastAPI Dependencies for Feature Flags
"""

from fastapi import Request, Depends
from typing import Annotated
from .client import FeatureFlags, get_flags


async def get_feature_flags() -> FeatureFlags:
    """Dependency to inject feature flags into endpoints."""
    return get_flags()


FlagsDep = Annotated[FeatureFlags, Depends(get_feature_flags)]


async def require_feature_flag(flag_name: str):
    """
    Dependency factory to require a specific feature flag.
    
    Usage:
        @router.get("/new-feature")
        async def new_feature(
            flags: FlagsDep,
            _check: None = Depends(require_feature_flag("new_feature"))
        ):
            ...
    """
    def checker(flags: FlagsDep = Depends(get_feature_flags)):
        if not flags.is_enabled(flag_name):
            from fastapi import HTTPException
            raise HTTPException(
                status_code=404,
                detail=f"Feature '{flag_name}' is not enabled"
            )
        return None
    return checker
