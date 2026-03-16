"""
Forum Pydantic Models
====================
Data models for AREPO forum system.
"""

from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field


class ForumCategory(BaseModel):
    """Forum category/section."""
    id: int
    name: str
    description: Optional[str] = None
    icon: str = "message-circle"
    sort_order: int = 0
    requires_token: int = 0
    thread_count: int = 0
    post_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class AuthorInfo(BaseModel):
    """Author information for posts/threads."""
    id: str
    username: str
    avatar_url: Optional[str] = None
    reputation: int = 0
    is_moderator: bool = False
    is_admin: bool = False


class PollOption(BaseModel):
    """Poll option with vote count."""
    option: str
    votes: int = 0


class ForumThread(BaseModel):
    """Forum discussion thread."""
    id: int
    category_id: int
    author: AuthorInfo
    title: str
    content: str
    is_poll: bool = False
    poll_options: Optional[List[PollOption]] = None
    poll_ends_at: Optional[datetime] = None
    views: int = 0
    upvotes: int = 0
    reply_count: int = 0
    is_pinned: bool = False
    is_locked: bool = False
    last_post_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ForumPost(BaseModel):
    """Individual post/reply in a thread."""
    id: int
    thread_id: int
    author: AuthorInfo
    content: str
    parent_id: Optional[int] = None
    upvotes: int = 0
    user_vote: Optional[int] = None  # 1, -1, or None
    is_solution: bool = False
    is_edited: bool = False
    edited_at: Optional[datetime] = None
    created_at: datetime
    replies: List["ForumPost"] = []

    class Config:
        from_attributes = True


class ThreadSummary(BaseModel):
    """Summary of thread for list views."""
    id: int
    title: str
    author: AuthorInfo
    reply_count: int
    views: int
    upvotes: int
    is_pinned: bool
    is_locked: bool
    last_post_at: datetime
    created_at: datetime


class ThreadListResponse(BaseModel):
    """Paginated thread list response."""
    threads: List[ThreadSummary]
    total: int
    page: int
    page_size: int
    has_more: bool


class ThreadDetailResponse(BaseModel):
    """Full thread with posts."""
    thread: ForumThread
    posts: List[ForumPost]
    is_subscribed: bool = False


# Request Models

class CreateThreadRequest(BaseModel):
    """Request to create a new thread."""
    category_id: int
    title: str = Field(..., min_length=5, max_length=200)
    content: str = Field(..., min_length=10, max_length=20000)
    is_poll: bool = False
    poll_options: Optional[List[str]] = None
    poll_duration_hours: Optional[int] = None


class CreatePostRequest(BaseModel):
    """Request to create a new post/reply."""
    content: str = Field(..., min_length=2, max_length=10000)
    parent_id: Optional[int] = None  # For nested replies


class VoteRequest(BaseModel):
    """Request to vote on a post."""
    vote_type: int = Field(..., pattern=r"^[1,-1]$")  # 1 or -1


class UpdateThreadRequest(BaseModel):
    """Request to update a thread."""
    title: Optional[str] = Field(None, min_length=5, max_length=200)
    content: Optional[str] = Field(None, min_length=10, max_length=20000)
    is_locked: Optional[bool] = None


class UpdatePostRequest(BaseModel):
    """Request to update a post."""
    content: str = Field(..., min_length=2, max_length=10000)


class MarkSolutionRequest(BaseModel):
    """Request to mark a post as solution."""
    post_id: int


# Search/Filter Models

class ThreadFilters(BaseModel):
    """Filters for thread list."""
    category_id: Optional[int] = None
    author_id: Optional[str] = None
    sort_by: str = "last_post_at"  # last_post_at, created_at, views, upvotes
    sort_order: str = "desc"  # asc, desc
    is_pinned: Optional[bool] = None


class SearchRequest(BaseModel):
    """Forum search request."""
    query: str = Field(..., min_length=3, max_length=100)
    category_id: Optional[int] = None
    search_in: str = "both"  # title, content, both
