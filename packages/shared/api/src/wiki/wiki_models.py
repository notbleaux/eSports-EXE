"""
Wiki Pydantic Models
====================
Data models for wiki/knowledge base system.
"""

from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field


class WikiCategory(BaseModel):
    """Wiki article category."""
    id: int
    slug: str
    name: str
    description: Optional[str] = None
    icon: str = "file-text"
    sort_order: int = 0
    parent_id: Optional[int] = None
    is_help_category: bool = False
    article_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class WikiArticleSummary(BaseModel):
    """Article summary for list views."""
    id: int
    slug: str
    title: str
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    excerpt: Optional[str] = None
    tags: List[str] = []
    is_featured: bool = False
    view_count: int = 0
    helpful_count: int = 0
    published_at: Optional[datetime] = None
    updated_at: datetime


class WikiArticle(BaseModel):
    """Full wiki article."""
    id: int
    slug: str
    title: str
    category_id: Optional[int] = None
    category: Optional[WikiCategory] = None
    author_id: str
    content: str  # Markdown
    content_html: Optional[str] = None  # Rendered HTML
    excerpt: Optional[str] = None
    tags: List[str] = []
    is_published: bool = False
    is_help_article: bool = False
    is_featured: bool = False
    view_count: int = 0
    helpful_count: int = 0
    not_helpful_count: int = 0
    version: int = 1
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WikiArticleVersion(BaseModel):
    """Article revision history entry."""
    id: int
    article_id: int
    version: int
    editor_id: str
    content: str
    edit_summary: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class WikiNavigationItem(BaseModel):
    """Navigation menu item."""
    id: int
    menu_key: str
    parent_id: Optional[int] = None
    title: str
    article_slug: Optional[str] = None
    external_url: Optional[str] = None
    sort_order: int = 0
    icon: Optional[str] = None
    is_visible: bool = True
    children: List["WikiNavigationItem"] = []

    class Config:
        from_attributes = True


class ArticleFeedback(BaseModel):
    """User feedback on article."""
    is_helpful: bool
    feedback: Optional[str] = None
    created_at: datetime


# Request Models

class CreateArticleRequest(BaseModel):
    """Request to create a new article."""
    slug: str = Field(..., min_length=3, max_length=200, pattern=r"^[a-z0-9-]+$")
    title: str = Field(..., min_length=5, max_length=200)
    category_id: Optional[int] = None
    content: str = Field(..., min_length=10)
    excerpt: Optional[str] = None
    tags: List[str] = []
    is_published: bool = False
    is_help_article: bool = False


class UpdateArticleRequest(BaseModel):
    """Request to update an article."""
    title: Optional[str] = Field(None, min_length=5, max_length=200)
    category_id: Optional[int] = None
    content: Optional[str] = Field(None, min_length=10)
    excerpt: Optional[str] = None
    tags: Optional[List[str]] = None
    is_published: Optional[bool] = None
    is_featured: Optional[bool] = None


class ArticleFeedbackRequest(BaseModel):
    """Request to submit article feedback."""
    is_helpful: bool
    feedback: Optional[str] = Field(None, max_length=500)


class SearchArticlesRequest(BaseModel):
    """Request to search articles."""
    query: str = Field(..., min_length=2, max_length=100)
    category_id: Optional[int] = None
    is_help_only: bool = False
    limit: int = Field(20, ge=1, le=50)


class RevertArticleRequest(BaseModel):
    """Request to revert to a previous version."""
    version: int = Field(..., ge=1)
    edit_summary: Optional[str] = None
