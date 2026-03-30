"""
WebSocket Affinity (Sticky Sessions)

Ensures WebSocket connections from the same user/session
are routed to the same server instance.

Uses Redis for distributed session tracking.
"""

import logging
from typing import Dict, Optional, Set
from uuid import UUID

import redis.asyncio as aioredis

logger = logging.getLogger(__name__)


class WebSocketAffinityManager:
    """
    Manages WebSocket connection affinity.
    
    For Kubernetes deployment with multiple pods,
    ensures users reconnect to the same pod.
    """
    
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_url = redis_url
        self._redis: Optional[aioredis.Redis] = None
        self._instance_id: Optional[str] = None
    
    async def _get_redis(self) -> aioredis.Redis:
        """Get Redis connection."""
        if self._redis is None:
            self._redis = aioredis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
        return self._redis
    
    def set_instance_id(self, instance_id: str):
        """Set the current instance ID (pod name)."""
        self._instance_id = instance_id
    
    async def get_assigned_instance(
        self,
        user_id: UUID,
        connection_type: str = "default"
    ) -> Optional[str]:
        """
        Get the assigned instance for a user.
        
        Args:
            user_id: User ID
            connection_type: Type of connection (e.g., "live_matches", "chat")
            
        Returns:
            Instance ID or None if not assigned
        """
        redis = await self._get_redis()
        key = f"ws:affinity:{user_id}:{connection_type}"
        
        try:
            instance = await redis.get(key)
            return instance
        except Exception as e:
            logger.error(f"Redis error getting affinity: {e}")
            return None
    
    async def assign_instance(
        self,
        user_id: UUID,
        instance_id: str,
        connection_type: str = "default",
        ttl_seconds: int = 3600
    ) -> bool:
        """
        Assign a user to an instance.
        
        Args:
            user_id: User ID
            instance_id: Instance ID (pod name)
            connection_type: Type of connection
            ttl_seconds: How long to maintain the assignment
            
        Returns:
            True if successful
        """
        redis = await self._get_redis()
        key = f"ws:affinity:{user_id}:{connection_type}"
        
        try:
            await redis.setex(key, ttl_seconds, instance_id)
            
            # Also track in instance's user set
            instance_key = f"ws:instance:{instance_id}:users"
            await redis.sadd(instance_key, str(user_id))
            await redis.expire(instance_key, ttl_seconds)
            
            return True
        except Exception as e:
            logger.error(f"Redis error setting affinity: {e}")
            return False
    
    async def clear_assignment(
        self,
        user_id: UUID,
        instance_id: str,
        connection_type: str = "default"
    ):
        """Clear a user's instance assignment."""
        redis = await self._get_redis()
        
        try:
            key = f"ws:affinity:{user_id}:{connection_type}"
            await redis.delete(key)
            
            # Remove from instance's user set
            instance_key = f"ws:instance:{instance_id}:users"
            await redis.srem(instance_key, str(user_id))
            
        except Exception as e:
            logger.error(f"Redis error clearing affinity: {e}")
    
    async def get_instance_users(self, instance_id: str) -> Set[str]:
        """Get all users assigned to an instance."""
        redis = await self._get_redis()
        
        try:
            instance_key = f"ws:instance:{instance_id}:users"
            users = await redis.smembers(instance_key)
            return users
        except Exception as e:
            logger.error(f"Redis error getting instance users: {e}")
            return set()
    
    async def migrate_users(
        self,
        from_instance: str,
        to_instance: str
    ) -> int:
        """
        Migrate all users from one instance to another.
        
        Used during rolling deployments.
        
        Returns:
            Number of users migrated
        """
        redis = await self._get_redis()
        
        try:
            # Get all users on old instance
            users = await self.get_instance_users(from_instance)
            
            migrated = 0
            for user_id in users:
                # Update assignment
                for conn_type in ["default", "live_matches", "chat"]:
                    key = f"ws:affinity:{user_id}:{conn_type}"
                    current = await redis.get(key)
                    
                    if current == from_instance:
                        await redis.set(key, to_instance)
                        migrated += 1
            
            return migrated // 3  # Divide by connection types
            
        except Exception as e:
            logger.error(f"Migration error: {e}")
            return 0
    
    async def is_affinity_valid(
        self,
        user_id: UUID,
        instance_id: str,
        connection_type: str = "default"
    ) -> bool:
        """
        Check if current instance matches affinity.
        
        Used by load balancer to determine if connection
        should be proxied to different instance.
        """
        assigned = await self.get_assigned_instance(user_id, connection_type)
        
        if assigned is None:
            # No existing assignment, this instance is valid
            return True
        
        return assigned == instance_id


# Global manager
_affinity_manager: Optional[WebSocketAffinityManager] = None


def get_affinity_manager(redis_url: str = "redis://localhost:6379") -> WebSocketAffinityManager:
    """Get the global affinity manager."""
    global _affinity_manager
    if _affinity_manager is None:
        _affinity_manager = WebSocketAffinityManager(redis_url)
    return _affinity_manager
