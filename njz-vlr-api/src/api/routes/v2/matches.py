"""
V2 Match API Routes
"""

from typing import Optional
from fastapi import APIRouter, Query, HTTPException

from src.scrapers.match_scraper import MatchScraper, MatchDetailsScraper
from src.core.config import CacheTTLS

router = APIRouter()


@router.get("/upcoming")
async def get_upcoming_matches(
    page: int = Query(default=1, ge=1, le=10),
):
    """Get upcoming matches"""
    async with MatchScraper() as scraper:
        result = await scraper.scrape(f"/matches?page={page}", match_type="upcoming")
        
        return {
            "status": "success",
            "data": {
                "matches": [m.dict() for m in result.data.upcoming],
                "page": page,
                "count": len(result.data.upcoming)
            },
            "cached": result.cache_hit
        }


@router.get("/live")
async def get_live_matches():
    """Get live match scores"""
    async with MatchScraper() as scraper:
        result = await scraper.scrape("/matches", match_type="live_score")
        
        return {
            "status": "success",
            "data": {
                "matches": [m.dict() for m in result.data.live],
                "count": len(result.data.live)
            },
            "cached": result.cache_hit
        }


@router.get("/results")
async def get_match_results(
    page: int = Query(default=1, ge=1, le=10),
):
    """Get completed match results"""
    async with MatchScraper() as scraper:
        result = await scraper.scrape(f"/matches/results?page={page}", match_type="results")
        
        return {
            "status": "success",
            "data": {
                "matches": [m.dict() for m in result.data.results],
                "page": page,
                "count": len(result.data.results)
            },
            "cached": result.cache_hit
        }


@router.get("/details/{match_id}")
async def get_match_details(match_id: str):
    """Get detailed match information"""
    if not match_id.isdigit():
        raise HTTPException(status_code=400, detail="match_id must be numeric")
    
    async with MatchDetailsScraper() as scraper:
        result = await scraper.scrape(f"/{match_id}", match_id=match_id)
        
        return {
            "status": "success",
            "data": result.data.dict(),
            "cached": result.cache_hit,
            "integrity": result.sha256[:16] if result.sha256 else None
        }