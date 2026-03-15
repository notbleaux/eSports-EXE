[Ver002.000]
"""
Forum API Routes
===============
FastAPI endpoints for AREPO forum with JWT authentication.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from ..auth.auth_utils import get_current_active_user, get_optional_user, require_permissions, TokenData
from .forum_service import ForumService
from .forum_models import (
    ForumCategory, ForumThread, ForumPost,
    CreateThreadRequest, CreatePostRequest, VoteRequest,
    ThreadListResponse, ThreadDetailResponse
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/forum", tags=["forum"])


async def get_forum_service() -> ForumService:
    """Get ForumService instance."""
    from ...axiom_esports_data.api.src.db_manager import db
    return ForumService(db.pool)


# Public endpoints (no auth required)

@router.get("/categories", response_model=list[ForumCategory])
async def list_categories(
    service: ForumService = Depends(get_forum_service)
):
    """Get all forum categories."""
    try:
        return await service.get_categories()
    except Exception as e:
        logger.error(f"Failed to get categories: {e}")
        raise HTTPException(status_code=500, detail="Failed to load categories")


@router.get("/categories/{category_id}/threads", response_model=ThreadListResponse)
async def list_threads(
    category_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("last_post_at", pattern="^(last_post_at|created_at|views|upvotes)$"),
    service: ForumService = Depends(get_forum_service),
    current_user: Optional[TokenData] = Depends(get_optional_user)
):
    """
    List threads in a category.
    
    Authentication optional - provides personalized data if logged in.
    """
    try:
        user_id = current_user.user_id if current_user else None
        threads, total = await service.list_threads(
            category_id=category_id,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            user_id=user_id
        )
        return ThreadListResponse(
            threads=threads,
            total=total,
            page=page,
            page_size=page_size,
            has_more=page * page_size < total
        )
    except Exception as e:
        logger.error(f"Failed to list threads: {e}")
        raise HTTPException(status_code=500, detail="Failed to load threads")


@router.get("/threads/{thread_id}", response_model=ThreadDetailResponse)
async def get_thread(
    thread_id: int,
    service: ForumService = Depends(get_forum_service),
    current_user: Optional[TokenData] = Depends(get_optional_user)
):
    """
    Get thread details with posts.
    
    Authentication optional - provides personalized data if logged in.
    """
    try:
        user_id = current_user.user_id if current_user else None
        thread = await service.get_thread(thread_id, user_id)
        if not thread:
            raise HTTPException(status_code=404, detail="Thread not found")
        return thread
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get thread: {e}")
        raise HTTPException(status_code=500, detail="Failed to load thread")


@router.get("/threads/recent", response_model=ThreadListResponse)
async def get_recent_threads(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    service: ForumService = Depends(get_forum_service),
    current_user: Optional[TokenData] = Depends(get_optional_user)
):
    """
    Get recent threads across all categories.
    
    Authentication optional - provides personalized data if logged in.
    """
    try:
        user_id = current_user.user_id if current_user else None
        threads, total = await service.list_threads(
            category_id=None,
            page=page,
            page_size=page_size,
            sort_by="last_post_at",
            user_id=user_id
        )
        return ThreadListResponse(
            threads=threads,
            total=total,
            page=page,
            page_size=page_size,
            has_more=page * page_size < total
        )
    except Exception as e:
        logger.error(f"Failed to get recent threads: {e}")
        raise HTTPException(status_code=500, detail="Failed to load threads")


# Protected endpoints (auth required)

@router.post("/threads", response_model=ForumThread, status_code=status.HTTP_201_CREATED)
async def create_thread(
    request: CreateThreadRequest,
    current_user: TokenData = Depends(get_current_active_user),
    service: ForumService = Depends(get_forum_service)
):
    """
    Create a new thread.
    
    **Authentication required**
    """
    try:
        return await service.create_thread(current_user.user_id, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to create thread: {e}")
        raise HTTPException(status_code=500, detail="Failed to create thread")


@router.post("/threads/{thread_id}/posts", response_model=ForumPost, status_code=status.HTTP_201_CREATED)
async def create_post(
    thread_id: int,
    request: CreatePostRequest,
    current_user: TokenData = Depends(get_current_active_user),
    service: ForumService = Depends(get_forum_service)
):
    """
    Create a post/reply in a thread.
    
    **Authentication required**
    """
    try:
        return await service.create_post(current_user.user_id, thread_id, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to create post: {e}")
        raise HTTPException(status_code=500, detail="Failed to create post")


@router.post("/posts/{post_id}/vote")
async def vote_post(
    post_id: int,
    request: VoteRequest,
    current_user: TokenData = Depends(get_current_active_user),
    service: ForumService = Depends(get_forum_service)
):
    """
    Vote on a post (upvote/downvote).
    
    **Authentication required**
    """
    try:
        new_count, success = await service.vote_post(
            current_user.user_id, post_id, request.vote_type
        )
        return {"success": success, "upvotes": new_count}
    except Exception as e:
        logger.error(f"Failed to vote: {e}")
        raise HTTPException(status_code=500, detail="Failed to process vote")


@router.delete("/threads/{thread_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_thread(
    thread_id: int,
    current_user: TokenData = Depends(get_current_active_user),
    service: ForumService = Depends(get_forum_service)
):
    """
    Delete a thread (owner or moderator only).
    
    **Authentication required**
    """
    try:
        # Get thread to check ownership
        thread = await service.get_thread(thread_id, current_user.user_id)
        if not thread:
            raise HTTPException(status_code=404, detail="Thread not found")
        
        # Check permissions (owner or moderator/admin)
        is_owner = thread.author_id == current_user.user_id
        is_moderator = "moderator" in current_user.permissions or "admin" in current_user.permissions
        
        if not (is_owner or is_moderator):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this thread"
            )
        
        await service.delete_thread(thread_id)
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete thread: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete thread")


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: int,
    current_user: TokenData = Depends(get_current_active_user),
    service: ForumService = Depends(get_forum_service)
):
    """
    Delete a post (owner or moderator only).
    
    **Authentication required**
    """
    try:
        # Check ownership
        is_owner = await service.is_post_owner(post_id, current_user.user_id)
        is_moderator = "moderator" in current_user.permissions or "admin" in current_user.permissions
        
        if not (is_owner or is_moderator):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this post"
            )
        
        await service.delete_post(post_id)
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete post: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete post")


# Moderator endpoints

@router.post("/threads/{thread_id}/pin")
async def pin_thread(
    thread_id: int,
    pinned: bool = True,
    current_user: TokenData = Depends(require_permissions(["moderator"])),
    service: ForumService = Depends(get_forum_service)
):
    """
    Pin or unpin a thread (moderators only).
    
    **Requires moderator permission**
    """
    try:
        await service.set_thread_pinned(thread_id, pinned)
        return {"success": True, "pinned": pinned}
    except Exception as e:
        logger.error(f"Failed to pin thread: {e}")
        raise HTTPException(status_code=500, detail="Failed to update thread")


@router.post("/threads/{thread_id}/lock")
async def lock_thread(
    thread_id: int,
    locked: bool = True,
    current_user: TokenData = Depends(require_permissions(["moderator"])),
    service: ForumService = Depends(get_forum_service)
):
    """
    Lock or unlock a thread (moderators only).
    
    **Requires moderator permission**
    """
    try:
        await service.set_thread_locked(thread_id, locked)
        return {"success": True, "locked": locked}
    except Exception as e:
        logger.error(f"Failed to lock thread: {e}")
        raise HTTPException(status_code=500, detail="Failed to update thread")


# Health check
@router.get("/health")
async def forum_health(
    service: ForumService = Depends(get_forum_service)
):
    """Health check for forum service."""
    try:
        categories = await service.get_categories()
        return {
            "status": "healthy",
            "categories_loaded": len(categories),
            "service": "forum"
        }
    except Exception as e:
        logger.error(f"Forum health check failed: {e}")
        raise HTTPException(status_code=503, detail="Forum service unhealthy")
