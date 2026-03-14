[Ver001.000]
"""
Forum API Routes
===============
FastAPI endpoints for AREPO forum.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from .forum_service import ForumService
from .forum_models import (
    ForumCategory, ForumThread, ForumPost, ThreadSummary,
    CreateThreadRequest, CreatePostRequest, VoteRequest,
    ThreadListResponse, ThreadDetailResponse
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/forum", tags=["forum"])


async def get_forum_service() -> ForumService:
    """Get ForumService instance."""
    from ...database import get_db_pool
    pool = await get_db_pool()
    return ForumService(pool)


async def get_current_user_id() -> str:
    """Get current user ID from auth. Placeholder."""
    # TODO: Implement proper auth
    return "user_123"  # Mock user


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
    user_id: str = Depends(get_current_user_id)
):
    """List threads in a category."""
    try:
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


@router.post("/threads", response_model=ForumThread, status_code=status.HTTP_201_CREATED)
async def create_thread(
    request: CreateThreadRequest,
    service: ForumService = Depends(get_forum_service),
    user_id: str = Depends(get_current_user_id)
):
    """Create a new thread."""
    try:
        return await service.create_thread(user_id, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to create thread: {e}")
        raise HTTPException(status_code=500, detail="Failed to create thread")


@router.get("/threads/{thread_id}", response_model=ThreadDetailResponse)
async def get_thread(
    thread_id: int,
    service: ForumService = Depends(get_forum_service),
    user_id: Optional[str] = Depends(get_current_user_id)
):
    """Get thread details with posts."""
    try:
        thread = await service.get_thread(thread_id, user_id)
        if not thread:
            raise HTTPException(status_code=404, detail="Thread not found")
        return thread
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get thread: {e}")
        raise HTTPException(status_code=500, detail="Failed to load thread")


@router.post("/threads/{thread_id}/posts", response_model=ForumPost, status_code=status.HTTP_201_CREATED)
async def create_post(
    thread_id: int,
    request: CreatePostRequest,
    service: ForumService = Depends(get_forum_service),
    user_id: str = Depends(get_current_user_id)
):
    """Create a post/reply in a thread."""
    try:
        return await service.create_post(user_id, thread_id, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to create post: {e}")
        raise HTTPException(status_code=500, detail="Failed to create post")


@router.post("/posts/{post_id}/vote")
async def vote_post(
    post_id: int,
    request: VoteRequest,
    service: ForumService = Depends(get_forum_service),
    user_id: str = Depends(get_current_user_id)
):
    """Vote on a post (upvote/downvote)."""
    try:
        new_count, success = await service.vote_post(user_id, post_id, request.vote_type)
        return {"success": success, "upvotes": new_count}
    except Exception as e:
        logger.error(f"Failed to vote: {e}")
        raise HTTPException(status_code=500, detail="Failed to process vote")


@router.get("/threads/recent", response_model=ThreadListResponse)
async def get_recent_threads(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    service: ForumService = Depends(get_forum_service),
    user_id: str = Depends(get_current_user_id)
):
    """Get recent threads across all categories."""
    try:
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
