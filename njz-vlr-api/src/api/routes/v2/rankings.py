"""
V2 Rankings API Routes
"""

from fastapi import APIRouter, Query, HTTPException

from src.core.config import RegionCodes

router = APIRouter()


@router.get("")
async def get_rankings(
    region: str = Query(..., description="Region code (na, eu, ap, etc.)"),
):
    """Get team rankings for a region"""
    if not RegionCodes.validate(region):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid region. Valid: {', '.join(RegionCodes.VALID_REGIONS)}"
        )
    
    # TODO: Implement actual scraping
    return {
        "status": "success",
        "data": {
            "region": region,
            "rankings": [],
            "count": 0
        },
        "cached": False
    }