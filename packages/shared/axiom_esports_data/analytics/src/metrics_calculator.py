"""
SATOR Metrics Calculator
========================
Calculates derived analytics from raw VLR data:
- SimRating: Composite 0-10 performance score
- RAR: Role Adjusted Rating
- Economy Rating: Efficiency metrics
- Career Stage: Rising/Peak/Declining classification
"""

import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any
from dataclasses import dataclass

import asyncpg

logger = logging.getLogger(__name__)

# Load configuration files
CONFIG_DIR = Path(__file__).parent.parent.parent / "config"

with open(CONFIG_DIR / "agent_roles.json") as f:
    AGENT_ROLES = json.load(f)

with open(CONFIG_DIR / "team_region_mapping.json") as f:
    TEAM_REGIONS = json.load(f)


@dataclass
class SimRatingResult:
    """SimRating calculation result."""
    sim_rating: float
    confidence: float
    components: Dict[str, float]


@dataclass
class RARResult:
    """Role Adjusted Rating result."""
    role_adjusted_value: float
    replacement_level: float
    rar_score: float
    investment_grade: str
    percentile: int


@dataclass
class EconomyResult:
    """Economy metrics result."""
    economy_rating: float
    adjusted_kill_value: float
    efficiency_score: float


class MetricsCalculator:
    """
    Calculates SATOR-specific derived metrics from raw stats.
    
    Usage:
        calc = MetricsCalculator(pool)
        simrating = await calc.calculate_simrating(player_id)
        rar = await calc.calculate_rar(player_id)
    """
    
    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool
    
    # ========== SimRating Calculation ==========
    
    async def calculate_simrating(self, player_id: str) -> Optional[SimRatingResult]:
        """
        Calculate SimRating for a player.
        
        Formula:
        SimRating = weighted_sum(normalized_stats) * 10
        
        Weights:
        - ACS: 35% (combat effectiveness)
        - KAST: 25% (participation)
        - ADR: 20% (consistent damage)
        - Headshot%: 10% (precision)
        - First Bloods: 10% (opening impact)
        """
        async with self.pool.acquire() as conn:
            # Get player averages
            row = await conn.fetchrow(
                """
                SELECT 
                    AVG(acs) as avg_acs,
                    AVG(kast_pct) as avg_kast,
                    AVG(adr) as avg_adr,
                    AVG(headshot_pct) as avg_hs,
                    AVG(first_blood) as avg_fb,
                    COUNT(*) as match_count
                FROM player_performance
                WHERE player_id = $1 AND acs IS NOT NULL
                """,
                player_id
            )
            
            if not row or row['match_count'] < 5:
                return None
            
            acs = row['avg_acs'] or 0
            kast = row['avg_kast'] or 0
            adr = row['avg_adr'] or 0
            hs = row['avg_hs'] or 0
            fb = row['avg_fb'] or 0
            matches = row['match_count']
            
            # Normalize components (0-1 scale)
            # ACS: 400 = 1.0, 0 = 0.0
            acs_norm = min(acs / 400, 1.0)
            
            # KAST: 100% = 1.0
            kast_norm = kast / 100
            
            # ADR: 200 = 1.0
            adr_norm = min(adr / 200, 1.0)
            
            # HS%: 50% = 1.0 (capped)
            hs_norm = min(hs / 50, 1.0)
            
            # First Bloods: 2.0 per match = 1.0
            fb_norm = min(fb / 2.0, 1.0)
            
            # Weighted sum
            weighted = (
                acs_norm * 0.35 +
                kast_norm * 0.25 +
                adr_norm * 0.20 +
                hs_norm * 0.10 +
                fb_norm * 0.10
            )
            
            # Scale to 0-10
            sim_rating = round(weighted * 10, 3)
            
            # Confidence based on match count
            confidence = min(matches / 20, 1.0)  # Max confidence at 20+ matches
            
            return SimRatingResult(
                sim_rating=sim_rating,
                confidence=round(confidence, 2),
                components={
                    "acs": round(acs_norm, 3),
                    "kast": round(kast_norm, 3),
                    "adr": round(adr_norm, 3),
                    "headshot": round(hs_norm, 3),
                    "first_blood": round(fb_norm, 3),
                }
            )
    
    # ========== RAR Calculation ==========
    
    async def calculate_rar(self, player_id: str) -> Optional[RARResult]:
        """
        Calculate Role Adjusted Rating (RAR).
        
        RAR compares player performance to the "replacement level"
        (average player at their position/role).
        
        Formula:
        - Role Adjusted Value (RAV) = ACS * (KAST% / 100)
        - Replacement Level (RL) = Average RAV for player's role
        - RAR Score = RAV / RL
        - Investment Grade = A+ (1.5+), A (1.3+), B (1.1+), C (0.9+), D (<0.9)
        """
        async with self.pool.acquire() as conn:
            # Get player's role and stats
            player_row = await conn.fetchrow(
                """
                SELECT 
                    role,
                    AVG(acs) as avg_acs,
                    AVG(kast_pct) as avg_kast,
                    COUNT(*) as match_count
                FROM player_performance
                WHERE player_id = $1 AND role IS NOT NULL AND acs IS NOT NULL
                GROUP BY role
                """,
                player_id
            )
            
            if not player_row or player_row['match_count'] < 5:
                return None
            
            role = player_row['role']
            avg_acs = player_row['avg_acs'] or 0
            avg_kast = player_row['avg_kast'] or 0
            
            # Calculate Role Adjusted Value
            rav = avg_acs * (avg_kast / 100)
            
            # Get replacement level for this role
            replacement_row = await conn.fetchrow(
                """
                SELECT AVG(acs * (kast_pct / 100)) as avg_rav
                FROM player_performance
                WHERE role = $1 AND acs IS NOT NULL AND kast_pct IS NOT NULL
                """,
                role
            )
            
            replacement_level = replacement_row['avg_rav'] or 200.0
            
            # Calculate RAR score
            rar_score = rav / replacement_level if replacement_level > 0 else 1.0
            rar_score = round(rar_score, 3)
            
            # Determine investment grade
            grade = self._rar_to_grade(rar_score)
            
            # Calculate percentile
            percentile_row = await conn.fetchrow(
                """
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN (acs * (kast_pct / 100)) <= $1 THEN 1 ELSE 0 END) as below
                FROM player_performance
                WHERE role = $2 AND acs IS NOT NULL AND kast_pct IS NOT NULL
                """,
                rav, role
            )
            
            percentile = 50
            if percentile_row and percentile_row['total'] > 0:
                percentile = int((percentile_row['below'] / percentile_row['total']) * 100)
            
            return RARResult(
                role_adjusted_value=round(rav, 2),
                replacement_level=round(replacement_level, 2),
                rar_score=rar_score,
                investment_grade=grade,
                percentile=percentile
            )
    
    def _rar_to_grade(self, rar: float) -> str:
        """Convert RAR score to investment grade."""
        if rar >= 1.5:
            return "A+"
        elif rar >= 1.3:
            return "A"
        elif rar >= 1.1:
            return "B"
        elif rar >= 0.9:
            return "C"
        else:
            return "D"
    
    # ========== Economy Metrics ==========
    
    async def calculate_economy_metrics(self, player_id: str) -> Optional[EconomyResult]:
        """
        Calculate economy-related performance metrics.
        
        Note: Full implementation requires round-level economy data.
        This is a simplified version using available stats.
        """
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT 
                    AVG(kills) as avg_kills,
                    AVG(adr) as avg_adr,
                    AVG(acs) as avg_acs,
                    COUNT(*) as match_count
                FROM player_performance
                WHERE player_id = $1
                """,
                player_id
            )
            
            if not row:
                return None
            
            kills = row['avg_kills'] or 0
            adr = row['avg_adr'] or 0
            acs = row['avg_acs'] or 0
            
            # Simplified economy rating (damage per kill efficiency)
            economy_rating = round(adr / max(kills, 1), 2)
            
            # Adjusted kill value (ACS normalized)
            adjusted_kill_value = round(acs / max(kills, 1), 2)
            
            # Efficiency score (composite)
            efficiency_score = round((economy_rating + adjusted_kill_value) / 2, 2)
            
            return EconomyResult(
                economy_rating=economy_rating,
                adjusted_kill_value=adjusted_kill_value,
                efficiency_score=efficiency_score
            )
    
    # ========== Career Stage Classification ==========
    
    async def classify_career_stage(self, player_id: str) -> Optional[Dict[str, Any]]:
        """
        Classify player's career stage based on performance trajectory.
        
        Stages:
        - Rising: Improving trend, below peak age
        - Peak: Stable high performance, at peak age
        - Declining: Decreasing trend, past peak age
        """
        async with self.pool.acquire() as conn:
            # Get recent vs older performance
            from datetime import datetime, timedelta
            
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            ninety_days_ago = datetime.utcnow() - timedelta(days=90)
            
            recent = await conn.fetchrow(
                """
                SELECT AVG(sim_rating) as avg_rating
                FROM player_performance
                WHERE player_id = $1 
                  AND realworld_time > $2
                  AND sim_rating IS NOT NULL
                """,
                player_id, thirty_days_ago
            )
            
            older = await conn.fetchrow(
                """
                SELECT AVG(sim_rating) as avg_rating
                FROM player_performance
                WHERE player_id = $1 
                  AND realworld_time > $2 
                  AND realworld_time <= $3
                  AND sim_rating IS NOT NULL
                """,
                player_id, ninety_days_ago, thirty_days_ago
            )
            
            if not recent or not older:
                return None
            
            recent_rating = recent['avg_rating'] or 0
            older_rating = older['avg_rating'] or 0
            
            # Determine trend
            diff = recent_rating - older_rating
            if diff > 0.2:
                trend = "rising"
                stage = "Rising"
            elif diff < -0.2:
                trend = "falling"
                stage = "Declining"
            else:
                trend = "stable"
                stage = "Peak"
            
            return {
                "career_stage": stage,
                "trend": trend,
                "recent_rating": round(recent_rating, 3),
                "older_rating": round(older_rating, 3),
                "change": round(diff, 3),
            }
    
    # ========== Batch Update ==========
    
    async def update_player_metrics(self, player_id: str) -> bool:
        """
        Calculate and store all metrics for a player.
        
        Returns True if successful.
        """
        try:
            simrating = await self.calculate_simrating(player_id)
            rar = await self.calculate_rar(player_id)
            economy = await self.calculate_economy_metrics(player_id)
            career = await self.classify_career_stage(player_id)
            
            async with self.pool.acquire() as conn:
                await conn.execute(
                    """
                    UPDATE player_performance
                    SET 
                        sim_rating = $1,
                        role_adjusted_value = $2,
                        replacement_level = $3,
                        rar_score = $4,
                        investment_grade = $5,
                        economy_rating = $6,
                        adjusted_kill_value = $7,
                        career_stage = $8,
                        updated_at = NOW()
                    WHERE player_id = $9
                    """,
                    simrating.sim_rating if simrating else None,
                    rar.role_adjusted_value if rar else None,
                    rar.replacement_level if rar else None,
                    rar.rar_score if rar else None,
                    rar.investment_grade if rar else None,
                    economy.economy_rating if economy else None,
                    economy.adjusted_kill_value if economy else None,
                    career['career_stage'] if career else None,
                    player_id
                )
            
            logger.info(f"Updated metrics for player {player_id}")
            return True
        
        except Exception as e:
            logger.error(f"Failed to update metrics for {player_id}: {e}")
            return False


# ========== Utility Functions ==========

def infer_role_from_agent(agent_name: Optional[str]) -> Optional[str]:
    """
    Infer player role from agent played.
    
    Returns: Duelist, Sentinel, Controller, Initiator, or None
    """
    if not agent_name:
        return None
    
    agent_lower = agent_name.lower().strip()
    
    # Check aliases first
    aliases = AGENT_ROLES.get("_aliases", {})
    if agent_lower in aliases:
        agent_lower = aliases[agent_lower]
    
    # Find role
    for role, agents in AGENT_ROLES.items():
        if role.startswith("_"):
            continue
        if agent_lower in agents:
            return role
    
    return None


def infer_region_from_team(team_tag: Optional[str]) -> Optional[str]:
    """
    Infer region from team tag.
    
    Returns: Americas, EMEA, Pacific, China, or None
    """
    if not team_tag:
        return None
    
    tag_upper = team_tag.upper().strip()
    
    # Check aliases
    aliases = TEAM_REGIONS.get("_aliases", {})
    if tag_upper in aliases:
        tag_upper = aliases[tag_upper]
    
    # Find region
    for region, teams in TEAM_REGIONS.items():
        if region.startswith("_"):
            continue
        if tag_upper in teams:
            return region
    
    return None


def get_full_team_name(team_tag: Optional[str]) -> Optional[str]:
    """Get full team name from tag."""
    if not team_tag:
        return None
    
    tag_upper = team_tag.upper().strip()
    
    for region, teams in TEAM_REGIONS.items():
        if region.startswith("_"):
            continue
        if tag_upper in teams:
            return teams[tag_upper].get("full_name")
    
    return None
