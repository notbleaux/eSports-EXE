"""
Redis cache layer for computed stats.

Provides caching for:
- Player aggregated stats
- Match performance summaries
- Live match stats
- Prediction results

[Ver001.000]
"""

import json
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from pydantic import BaseModel

from ..redis_cache import get_redis_client

logger = logging.getLogger(__name__)


class StatsCache:
    """
    Cache manager for player and match statistics.
    
    Uses Redis with TTL-based expiration.
    """
    
    # Cache key prefixes
    KEY_PLAYER_STATS = "stats:player"
    KEY_MATCH_SUMMARY = "stats:match"
    KEY_LIVE_MATCH = "stats:live"
    KEY_PREDICTION = "stats:prediction"
    KEY_LEADERBOARD = "stats:leaderboard"
    
    # Default TTLs (seconds)
    TTL_PLAYER_STATS = 300  # 5 minutes
    TTL_MATCH_SUMMARY = 600  # 10 minutes
    TTL_LIVE_MATCH = 30  # 30 seconds (frequently updated)
    TTL_PREDICTION = 60  # 1 minute
    TTL_LEADERBOARD = 300  # 5 minutes
    
    def __init__(self):
        self._redis = None
    
    async def _get_redis(self):
        """Get Redis connection (lazy initialization)."""
        if self._redis is None:
            self._redis = await get_redis_client()
        return self._redis
    
    # --- Player Stats Cache ---
    
    async def get_player_stats(
        self,
        player_id: int,
        game: str = "valorant",
        period_days: int = 30
    ) -> Optional[Dict[str, Any]]:
        """Get cached player stats."""
        try:
            redis = await self._get_redis()
            key = f"{self.KEY_PLAYER_STATS}:{game}:{player_id}:{period_days}"
            
            data = await redis.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.error(f"Error getting player stats from cache: {e}")
            return None
    
    async def set_player_stats(
        self,
        player_id: int,
        stats: Dict[str, Any],
        game: str = "valorant",
        period_days: int = 30,
        ttl: Optional[int] = None
    ) -> bool:
        """Cache player stats."""
        try:
            redis = await self._get_redis()
            key = f"{self.KEY_PLAYER_STATS}:{game}:{player_id}:{period_days}"
            
            # Add cache metadata
            stats_with_meta = {
                **stats,
                "_cached_at": datetime.utcnow().isoformat(),
                "_cache_ttl": ttl or self.TTL_PLAYER_STATS,
            }
            
            await redis.setex(
                key,
                ttl or self.TTL_PLAYER_STATS,
                json.dumps(stats_with_meta, default=str)
            )
            return True
        except Exception as e:
            logger.error(f"Error setting player stats in cache: {e}")
            return False
    
    async def invalidate_player_stats(
        self,
        player_id: int,
        game: str = "valorant"
    ) -> bool:
        """Invalidate all cached stats for a player."""
        try:
            redis = await self._get_redis()
            pattern = f"{self.KEY_PLAYER_STATS}:{game}:{player_id}:*"
            
            # Find and delete all keys matching pattern
            keys = []
            async for key in redis.scan_iter(match=pattern):
                keys.append(key)
            
            if keys:
                await redis.delete(*keys)
            
            return True
        except Exception as e:
            logger.error(f"Error invalidating player stats: {e}")
            return False
    
    # --- Match Summary Cache ---
    
    async def get_match_summary(self, match_id: int) -> Optional[Dict[str, Any]]:
        """Get cached match summary."""
        try:
            redis = await self._get_redis()
            key = f"{self.KEY_MATCH_SUMMARY}:{match_id}"
            
            data = await redis.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.error(f"Error getting match summary from cache: {e}")
            return None
    
    async def set_match_summary(
        self,
        match_id: int,
        summary: Dict[str, Any],
        ttl: Optional[int] = None
    ) -> bool:
        """Cache match summary."""
        try:
            redis = await self._get_redis()
            key = f"{self.KEY_MATCH_SUMMARY}:{match_id}"
            
            summary_with_meta = {
                **summary,
                "_cached_at": datetime.utcnow().isoformat(),
            }
            
            await redis.setex(
                key,
                ttl or self.TTL_MATCH_SUMMARY,
                json.dumps(summary_with_meta, default=str)
            )
            return True
        except Exception as e:
            logger.error(f"Error setting match summary in cache: {e}")
            return False
    
    # --- Live Match Cache ---
    
    async def get_live_match(self, match_id: int) -> Optional[Dict[str, Any]]:
        """Get cached live match stats."""
        try:
            redis = await self._get_redis()
            key = f"{self.KEY_LIVE_MATCH}:{match_id}"
            
            data = await redis.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.error(f"Error getting live match from cache: {e}")
            return None
    
    async def set_live_match(
        self,
        match_id: int,
        stats: Dict[str, Any],
        ttl: Optional[int] = None
    ) -> bool:
        """Cache live match stats with short TTL."""
        try:
            redis = await self._get_redis()
            key = f"{self.KEY_LIVE_MATCH}:{match_id}"
            
            await redis.setex(
                key,
                ttl or self.TTL_LIVE_MATCH,
                json.dumps(stats, default=str)
            )
            return True
        except Exception as e:
            logger.error(f"Error setting live match in cache: {e}")
            return False
    
    async def update_live_match_partial(
        self,
        match_id: int,
        updates: Dict[str, Any]
    ) -> bool:
        """
        Update specific fields in live match cache.
        
        Uses Redis hash for efficient partial updates.
        """
        try:
            redis = await self._get_redis()
            key = f"{self.KEY_LIVE_MATCH}:{match_id}"
            
            # Get current data
            current = await self.get_live_match(match_id)
            if current is None:
                current = {}
            
            # Merge updates
            current.update(updates)
            current["_last_update"] = datetime.utcnow().isoformat()
            
            # Save with short TTL
            return await self.set_live_match(match_id, current, self.TTL_LIVE_MATCH)
        except Exception as e:
            logger.error(f"Error updating live match: {e}")
            return False
    
    # --- Prediction Cache ---
    
    async def get_prediction(
        self,
        match_id: int,
        model_version: str = "latest"
    ) -> Optional[Dict[str, Any]]:
        """Get cached prediction result."""
        try:
            redis = await self._get_redis()
            key = f"{self.KEY_PREDICTION}:{match_id}:{model_version}"
            
            data = await redis.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.error(f"Error getting prediction from cache: {e}")
            return None
    
    async def set_prediction(
        self,
        match_id: int,
        prediction: Dict[str, Any],
        model_version: str = "latest",
        ttl: Optional[int] = None
    ) -> bool:
        """Cache prediction result."""
        try:
            redis = await self._get_redis()
            key = f"{self.KEY_PREDICTION}:{match_id}:{model_version}"
            
            prediction_with_meta = {
                **prediction,
                "_cached_at": datetime.utcnow().isoformat(),
                "_model_version": model_version,
            }
            
            await redis.setex(
                key,
                ttl or self.TTL_PREDICTION,
                json.dumps(prediction_with_meta, default=str)
            )
            return True
        except Exception as e:
            logger.error(f"Error setting prediction in cache: {e}")
            return False
    
    # --- Leaderboard Cache ---
    
    async def get_leaderboard(
        self,
        category: str,
        game: str = "valorant",
        limit: int = 10
    ) -> Optional[List[Dict[str, Any]]]:
        """Get cached leaderboard."""
        try:
            redis = await self._get_redis()
            key = f"{self.KEY_LEADERBOARD}:{game}:{category}:{limit}"
            
            data = await redis.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.error(f"Error getting leaderboard from cache: {e}")
            return None
    
    async def set_leaderboard(
        self,
        category: str,
        leaderboard: List[Dict[str, Any]],
        game: str = "valorant",
        limit: int = 10,
        ttl: Optional[int] = None
    ) -> bool:
        """Cache leaderboard."""
        try:
            redis = await self._get_redis()
            key = f"{self.KEY_LEADERBOARD}:{game}:{category}:{limit}"
            
            data_with_meta = {
                "leaderboard": leaderboard,
                "_cached_at": datetime.utcnow().isoformat(),
            }
            
            await redis.setex(
                key,
                ttl or self.TTL_LEADERBOARD,
                json.dumps(data_with_meta, default=str)
            )
            return True
        except Exception as e:
            logger.error(f"Error setting leaderboard in cache: {e}")
            return False
    
    # --- Cache Statistics ---
    
    async def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        try:
            redis = await self._get_redis()
            
            # Count keys by pattern
            player_keys = await redis.keys(f"{self.KEY_PLAYER_STATS}:*")
            match_keys = await redis.keys(f"{self.KEY_MATCH_SUMMARY}:*")
            live_keys = await redis.keys(f"{self.KEY_LIVE_MATCH}:*")
            prediction_keys = await redis.keys(f"{self.KEY_PREDICTION}:*")
            
            return {
                "player_stats_cached": len(player_keys),
                "match_summaries_cached": len(match_keys),
                "live_matches_cached": len(live_keys),
                "predictions_cached": len(prediction_keys),
                "total_cached": len(player_keys) + len(match_keys) + len(live_keys) + len(prediction_keys),
            }
        except Exception as e:
            logger.error(f"Error getting cache stats: {e}")
            return {}
    
    # --- Batch Operations ---
    
    async def get_player_stats_batch(
        self,
        player_ids: List[int],
        game: str = "valorant",
        period_days: int = 30
    ) -> Dict[int, Optional[Dict[str, Any]]]:
        """Get cached stats for multiple players (pipeline)."""
        try:
            redis = await self._get_redis()
            
            # Build keys
            keys = [
                f"{self.KEY_PLAYER_STATS}:{game}:{pid}:{period_days}"
                for pid in player_ids
            ]
            
            # Use pipeline for efficiency
            pipe = redis.pipeline()
            for key in keys:
                pipe.get(key)
            
            results = await pipe.execute()
            
            # Map back to player IDs
            return {
                pid: json.loads(data) if data else None
                for pid, data in zip(player_ids, results)
            }
        except Exception as e:
            logger.error(f"Error getting batch player stats: {e}")
            return {pid: None for pid in player_ids}
    
    async def clear_all_stats(self) -> bool:
        """Clear all cached stats (use with caution)."""
        try:
            redis = await self._get_redis()
            
            patterns = [
                f"{self.KEY_PLAYER_STATS}:*",
                f"{self.KEY_MATCH_SUMMARY}:*",
                f"{self.KEY_LIVE_MATCH}:*",
                f"{self.KEY_PREDICTION}:*",
                f"{self.KEY_LEADERBOARD}:*",
            ]
            
            for pattern in patterns:
                keys = []
                async for key in redis.scan_iter(match=pattern):
                    keys.append(key)
                if keys:
                    await redis.delete(*keys)
            
            logger.info("Cleared all stats cache")
            return True
        except Exception as e:
            logger.error(f"Error clearing stats cache: {e}")
            return False
