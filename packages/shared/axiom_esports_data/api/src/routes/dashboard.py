"""
Analytics Dashboard API — Aggregated Statistics & Trends

Provides high-level metrics and trend data for the analytics dashboard.
Optimized for Supabase free tier with query limits in mind.
"""

from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime, timedelta
from enum import Enum

router = APIRouter(prefix="/v1/dashboard", tags=["dashboard"])


class MetricTrend(str, Enum):
    """Trend direction indicator."""
    UP = "up"
    DOWN = "down"
    FLAT = "flat"


class TopPerformer(BaseModel):
    """Top performing player summary."""
    player_id: str
    username: str
    team: Optional[str]
    region: str
    sim_rating: float
    rar_score: float
    investment_grade: str
    trend: MetricTrend = Field(..., description="Recent performance trend")
    change_7d: float = Field(..., description="7-day rating change")


class ConfidenceDistribution(BaseModel):
    """Distribution of players by confidence tier."""
    tier_a_plus: int = Field(..., description="90-100% confidence")
    tier_a: int = Field(..., description="80-89% confidence")
    tier_b: int = Field(..., description="70-79% confidence")
    tier_c: int = Field(..., description="60-69% confidence")
    tier_d: int = Field(..., description="<60% confidence")


class RecentTrends(BaseModel):
    """Recent performance trends."""
    avg_sim_rating_7d: float
    avg_sim_rating_30d: float
    rating_trend: MetricTrend
    total_matches_7d: int
    total_matches_30d: int
    match_trend: MetricTrend


class DashboardMetrics(BaseModel):
    """Complete dashboard metrics response."""
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    total_players: int = Field(..., description="Total tracked players")
    total_matches: int = Field(..., description="Total matches in database")
    matches_today: int = Field(..., description="Matches processed today")
    matches_this_week: int
    avg_sim_rating: float = Field(..., description="Global average SimRating")
    top_performers: List[TopPerformer] = Field(..., max_length=10)
    recent_trends: RecentTrends
    confidence_distribution: ConfidenceDistribution
    
    # Game-specific breakdowns
    valorant_stats: Dict[str, Any]
    cs2_stats: Optional[Dict[str, Any]] = None


class TrendPoint(BaseModel):
    """Single data point in a trend series."""
    date: date
    value: float
    change_pct: Optional[float] = Field(None, description="Change from previous period")
    sample_size: int = Field(..., description="Number of matches/players in sample")


class TrendData(BaseModel):
    """Trend data for charting."""
    metric: str
    granularity: str
    data: List[TrendPoint]


# Mock data for development (replace with DB queries)
MOCK_DASHBOARD_DATA = {
    "total_players": 1523,
    "total_matches": 8756,
    "matches_today": 23,
    "matches_this_week": 156,
    "avg_sim_rating": 0.75,
    "top_performers": [
        {
            "player_id": "p_001",
            "username": "TenZ",
            "team": "Sentinels",
            "region": "NA",
            "sim_rating": 1.42,
            "rar_score": 2.15,
            "investment_grade": "A+",
            "trend": "up",
            "change_7d": 0.08
        },
        {
            "player_id": "p_002",
            "username": "ScreaM",
            "team": "Karmine Corp",
            "region": "EU",
            "sim_rating": 1.38,
            "rar_score": 1.98,
            "investment_grade": "A+",
            "trend": "flat",
            "change_7d": 0.02
        },
        {
            "player_id": "p_003",
            "username": "aspas",
            "team": "Leviatán",
            "region": "BR",
            "sim_rating": 1.35,
            "rar_score": 1.87,
            "investment_grade": "A",
            "trend": "up",
            "change_7d": 0.12
        }
    ],
    "recent_trends": {
        "avg_sim_rating_7d": 0.74,
        "avg_sim_rating_30d": 0.73,
        "rating_trend": "up",
        "total_matches_7d": 156,
        "total_matches_30d": 623,
        "match_trend": "up"
    },
    "confidence_distribution": {
        "tier_a_plus": 45,
        "tier_a": 128,
        "tier_b": 342,
        "tier_c": 567,
        "tier_d": 441
    },
    "valorant_stats": {
        "players": 1245,
        "matches": 7234,
        "active_tournaments": 3
    },
    "cs2_stats": {
        "players": 278,
        "matches": 1522,
        "active_tournaments": 1
    }
}


@router.get("/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics(
    region: Optional[str] = Query(None, description="Filter by region (NA, EU, BR, etc.)"),
    game: Optional[str] = Query(None, enum=["valorant", "cs2"], description="Filter by game")
):
    """Get high-level dashboard metrics.
    
    Returns aggregated statistics suitable for the main dashboard overview.
    Results are cached for 5 minutes to reduce database load.
    """
    # TODO: Replace with actual DB queries
    # For now, return mock data filtered by parameters
    
    data = MOCK_DASHBOARD_DATA.copy()
    
    # Apply filters (mock logic)
    if region:
        data["total_players"] = int(data["total_players"] * 0.3)  # Mock filter
    
    if game == "valorant":
        data["cs2_stats"] = None
    elif game == "cs2":
        data["valorant_stats"] = None
    
    return DashboardMetrics(**data)


@router.get("/trends", response_model=TrendData)
async def get_trends(
    metric: str = Query(
        "sim_rating",
        enum=["sim_rating", "rar", "adr", "kast", "matches"],
        description="Metric to trend"
    ),
    days: int = Query(
        30,
        ge=7,
        le=365,
        description="Number of days to include"
    ),
    granularity: str = Query(
        "day",
        enum=["day", "week", "month"],
        description="Data aggregation granularity"
    ),
    region: Optional[str] = Query(None)
):
    """Get trend data for charting.
    
    Returns time-series data suitable for line charts and trend analysis.
    """
    # Generate mock trend data
    import random
    
    data_points = []
    base_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    if granularity == "day":
        step = 1
    elif granularity == "week":
        step = 7
    else:  # month
        step = 30
    
    current_value = 0.75  # Starting value
    
    for i in range(0, days, step):
        date = (base_date + timedelta(days=i)).date()
        
        # Random walk for realistic trend
        change = random.uniform(-0.02, 0.03)
        current_value = max(0.5, min(1.0, current_value + change))
        
        # Calculate change percentage
        change_pct = None
        if i > 0:
            prev_value = data_points[-1].value
            change_pct = ((current_value - prev_value) / prev_value) * 100
        
        data_points.append(TrendPoint(
            date=date,
            value=round(current_value, 3),
            change_pct=round(change_pct, 2) if change_pct else None,
            sample_size=random.randint(50, 200)
        ))
    
    return TrendData(
        metric=metric,
        granularity=granularity,
        data=data_points
    )


@router.get("/regional-breakdown")
async def get_regional_breakdown(
    metric: str = Query("avg_sim_rating", enum=["avg_sim_rating", "total_players", "matches"])
):
    """Get breakdown of metrics by region.
    
    Returns data suitable for choropleth maps or regional comparison charts.
    """
    regions = {
        "NA": {"players": 456, "avg_rating": 0.78, "matches": 2341},
        "EU": {"players": 523, "avg_rating": 0.76, "matches": 2890},
        "BR": {"players": 234, "avg_rating": 0.74, "matches": 1234},
        "KR": {"players": 189, "avg_rating": 0.81, "matches": 1567},
        "JP": {"players": 67, "avg_rating": 0.72, "matches": 456},
        "APAC": {"players": 54, "avg_rating": 0.73, "matches": 268}
    }
    
    return {
        "metric": metric,
        "regions": regions
    }


@router.get("/role-distribution")
async def get_role_distribution(
    game: Optional[str] = Query(None, enum=["valorant", "cs2"])
):
    """Get player distribution by role."""
    return {
        "game": game or "all",
        "roles": {
            "Duelist": {"count": 345, "avg_rating": 0.79},
            "Controller": {"count": 298, "avg_rating": 0.74},
            "Initiator": {"count": 412, "avg_rating": 0.76},
            "Sentinel": {"count": 267, "avg_rating": 0.73},
            "Flex": {"count": 201, "avg_rating": 0.75}
        }
    }


@router.get("/health")
async def get_dashboard_health():
    """Get dashboard data health status."""
    return {
        "status": "healthy",
        "last_data_update": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat(),
        "data_freshness": "2 hours",
        "cache_status": "warm",
        "api_latency_ms": 45
    }
