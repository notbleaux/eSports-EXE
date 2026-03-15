[Ver002.000]
"""
Wiki API Routes
===============
FastAPI endpoints for wiki/knowledge base with JWT authentication.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from ..auth.auth_utils import get_current_active_user, get_optional_user, require_permissions, TokenData
from .wiki_service import WikiService
from .wiki_models import (
    WikiCategory, WikiArticle, WikiArticleSummary, WikiNavigationItem,
    CreateArticleRequest, UpdateArticleRequest, ArticleFeedbackRequest
)
from ...axiom_esports_data.api.src.db_manager import db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/wiki", tags=["wiki"])


async def get_wiki_service() -> WikiService:
    """Get WikiService instance."""
    return WikiService(db.pool)


# Public endpoints

@router.get("/categories", response_model=list[WikiCategory])
async def list_categories(
    include_empty: bool = Query(False),
    service: WikiService = Depends(get_wiki_service)
):
    """List all wiki categories."""
    try:
        return await service.get_categories(include_empty)
    except Exception as e:
        logger.error(f"Failed to get categories: {e}")
        raise HTTPException(status_code=500, detail="Failed to load categories")


@router.get("/categories/{slug}", response_model=WikiCategory)
async def get_category(
    slug: str,
    service: WikiService = Depends(get_wiki_service)
):
    """Get category by slug."""
    category = await service.get_category_by_slug(slug)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.get("/articles", response_model=list[WikiArticleSummary])
async def list_articles(
    category_id: Optional[int] = Query(None),
    is_help: Optional[bool] = Query(None),
    is_featured: bool = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    service: WikiService = Depends(get_wiki_service)
):
    """List wiki articles."""
    try:
        articles, total = await service.list_articles(
            category_id=category_id,
            is_help=is_help,
            is_featured=is_featured,
            page=page,
            page_size=page_size
        )
        return articles
    except Exception as e:
        logger.error(f"Failed to list articles: {e}")
        raise HTTPException(status_code=500, detail="Failed to load articles")


@router.get("/articles/search", response_model=list[WikiArticleSummary])
async def search_articles(
    query: str = Query(..., min_length=2, max_length=100),
    category_id: Optional[int] = Query(None),
    is_help_only: bool = Query(False),
    limit: int = Query(20, ge=1, le=50),
    service: WikiService = Depends(get_wiki_service)
):
    """Search wiki articles."""
    try:
        return await service.search_articles(query, category_id, is_help_only, limit)
    except Exception as e:
        logger.error(f"Failed to search articles: {e}")
        raise HTTPException(status_code=500, detail="Search failed")


@router.get("/articles/{slug}", response_model=WikiArticle)
async def get_article(
    slug: str,
    current_user: Optional[TokenData] = Depends(get_optional_user),
    service: WikiService = Depends(get_wiki_service)
):
    """Get article by slug."""
    user_id = current_user.user_id if current_user else None
    article = await service.get_article_by_slug(slug, user_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article


@router.get("/navigation/{menu_key}", response_model=list[WikiNavigationItem])
async def get_navigation(
    menu_key: str,
    service: WikiService = Depends(get_wiki_service)
):
    """Get navigation items for a menu."""
    try:
        return await service.get_navigation(menu_key)
    except Exception as e:
        logger.error(f"Failed to get navigation: {e}")
        raise HTTPException(status_code=500, detail="Failed to load navigation")


# Help-specific endpoints

@router.get("/help/articles", response_model=list[WikiArticleSummary])
async def list_help_articles(
    category_slug: Optional[str] = Query(None),
    service: WikiService = Depends(get_wiki_service)
):
    """List help articles."""
    category_id = None
    if category_slug:
        cat = await service.get_category_by_slug(category_slug)
        if cat:
            category_id = cat.id
    
    articles, _ = await service.list_articles(
        category_id=category_id,
        is_help=True,
        page_size=50
    )
    return articles


@router.get("/help/search", response_model=list[WikiArticleSummary])
async def search_help(
    query: str = Query(..., min_length=2),
    service: WikiService = Depends(get_wiki_service)
):
    """Search help articles specifically."""
    return await service.search_articles(query, is_help_only=True, limit=10)


# Protected endpoints (auth required)

@router.post("/articles", response_model=WikiArticle, status_code=status.HTTP_201_CREATED)
async def create_article(
    request: CreateArticleRequest,
    current_user: TokenData = Depends(get_current_active_user),
    service: WikiService = Depends(get_wiki_service)
):
    """
    Create a new article.
    
    **Authentication required**
    """
    try:
        return await service.create_article(current_user.user_id, request)
    except Exception as e:
        logger.error(f"Failed to create article: {e}")
        raise HTTPException(status_code=500, detail="Failed to create article")


@router.patch("/articles/{article_id}", response_model=WikiArticle)
async def update_article(
    article_id: int,
    request: UpdateArticleRequest,
    current_user: TokenData = Depends(get_current_active_user),
    service: WikiService = Depends(get_wiki_service)
):
    """
    Update an existing article.
    
    **Authentication required** - Must be author or moderator
    """
    try:
        # Check if user is author or moderator
        article = await service.get_article_by_id(article_id)
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")
        
        is_author = article.author_id == current_user.user_id
        is_moderator = "moderator" in current_user.permissions or "admin" in current_user.permissions
        
        if not (is_author or is_moderator):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this article"
            )
        
        updated = await service.update_article(article_id, current_user.user_id, request)
        return updated
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update article: {e}")
        raise HTTPException(status_code=500, detail="Failed to update article")


@router.post("/articles/{article_id}/feedback")
async def submit_feedback(
    article_id: int,
    request: ArticleFeedbackRequest,
    current_user: TokenData = Depends(get_current_active_user),
    service: WikiService = Depends(get_wiki_service)
):
    """
    Submit feedback on an article.
    
    **Authentication required**
    """
    success = await service.submit_feedback(
        article_id, current_user.user_id, request.is_helpful, request.feedback
    )
    if success:
        return {"success": True, "message": "Feedback recorded"}
    raise HTTPException(status_code=500, detail="Failed to record feedback")


# Moderator endpoints

@router.delete("/articles/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_article(
    article_id: int,
    current_user: TokenData = Depends(require_permissions(["moderator"])),
    service: WikiService = Depends(get_wiki_service)
):
    """
    Delete an article (moderators only).
    
    **Requires moderator permission**
    """
    try:
        await service.delete_article(article_id)
        return None
    except Exception as e:
        logger.error(f"Failed to delete article: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete article")


@router.post("/articles/{article_id}/feature")
async def feature_article(
    article_id: int,
    featured: bool = True,
    current_user: TokenData = Depends(require_permissions(["moderator"])),
    service: WikiService = Depends(get_wiki_service)
):
    """
    Feature or unfeature an article (moderators only).
    
    **Requires moderator permission**
    """
    try:
        await service.set_article_featured(article_id, featured)
        return {"success": True, "featured": featured}
    except Exception as e:
        logger.error(f"Failed to feature article: {e}")
        raise HTTPException(status_code=500, detail="Failed to update article")


# Health check

@router.get("/health")
async def wiki_health(
    service: WikiService = Depends(get_wiki_service)
):
    """Health check for wiki service."""
    try:
        categories = await service.get_categories()
        return {
            "status": "healthy",
            "categories_loaded": len(categories),
            "service": "wiki"
        }
    except Exception as e:
        logger.error(f"Wiki health check failed: {e}")
        raise HTTPException(status_code=503, detail="Wiki service unhealthy")
