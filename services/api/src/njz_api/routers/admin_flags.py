"""
Admin API for Feature Flags Management
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any

from ..auth import require_admin
from ..feature_flags import get_flags, FeatureFlags

router = APIRouter(prefix="/admin/flags", tags=["admin", "feature-flags"])


@router.get("", dependencies=[Depends(require_admin)])
async def list_all_flags() -> Dict[str, Any]:
    """
    List all feature flags and their current state.
    Requires admin authentication.
    """
    flags = get_flags()
    configs = flags.get_all_configs()
    
    return {
        "flags": [
            {
                "name": name,
                "enabled": flags.is_enabled(name),
                "description": config.description if config else "",
                "strategies": config.strategies if config else [],
            }
            for name, config in configs.items()
        ],
        "total": len(configs),
        "source": "yaml" if flags._unleash_client is None else "unleash"
    }


@router.get("/{flag_name}", dependencies=[Depends(require_admin)])
async def get_flag(flag_name: str) -> Dict[str, Any]:
    """Get details for a specific feature flag."""
    flags = get_flags()
    config = flags.get_config(flag_name)
    
    if not config:
        raise HTTPException(status_code=404, detail=f"Flag '{flag_name}' not found")
    
    return {
        "name": flag_name,
        "enabled": flags.is_enabled(flag_name),
        "description": config.description,
        "strategies": config.strategies,
    }


@router.post("/reload", dependencies=[Depends(require_admin)])
async def reload_flags() -> Dict[str, Any]:
    """Reload feature flags from configuration."""
    from ..feature_flags.client import reload_flags
    
    flags = reload_flags()
    return {
        "status": "reloaded",
        "count": len(flags.get_all_configs())
    }
