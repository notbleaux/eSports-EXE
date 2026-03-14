[Ver001.000]
"""
Forum Service
=============
Business logic for AREPO forum.
"""

import logging
from datetime import datetime, timedelta
from typing import List, Optional, Tuple

import asyncpg

from .forum_models import (
    ForumCategory, ForumThread, ForumPost, AuthorInfo, PollOption,
    CreateThreadRequest, CreatePostRequest, ThreadSummary, ThreadDetailResponse
)

logger = logging.getLogger(__name__)


class ForumService:
    """Service for forum operations."""
    
    def __init__(self, db_pool: asyncpg.Pool):
        self.db = db_pool
    
    async def get_categories(self) -> List[ForumCategory]:
        """Get all forum categories ordered by sort_order."""
        async with self.db.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, name, description, icon, sort_order,
                       requires_token, thread_count, post_count, created_at
                FROM forum_categories
                ORDER BY sort_order ASC
                """
            )
            return [ForumCategory(**dict(row)) for row in rows]
    
    async def get_category(self, category_id: int) -> Optional[ForumCategory]:
        """Get a specific category by ID."""
        async with self.db.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT id, name, description, icon, sort_order,
                       requires_token, thread_count, post_count, created_at
                FROM forum_categories WHERE id = $1
                """,
                category_id
            )
            return ForumCategory(**dict(row)) if row else None
    
    async def list_threads(
        self,
        category_id: Optional[int] = None,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "last_post_at",
        user_id: Optional[str] = None
    ) -> Tuple[List[ThreadSummary], int]:
        """List threads with pagination. Returns (threads, total_count)."""
        valid_sort_columns = {
            "last_post_at": "t.last_post_at",
            "created_at": "t.created_at",
            "views": "t.views",
            "upvotes": "t.upvotes",
        }
        sort_column = valid_sort_columns.get(sort_by, "t.last_post_at")
        
        offset = (page - 1) * page_size
        
        async with self.db.acquire() as conn:
            # Build WHERE clause
            where_clauses = ["t.is_pinned = FALSE"]
            params = []
            
            if category_id:
                params.append(category_id)
                where_clauses.append(f"t.category_id = ${len(params)}")
            
            where_sql = " AND ".join(where_clauses)
            
            # Get total count
            count_row = await conn.fetchrow(
                f"SELECT COUNT(*) FROM forum_threads t WHERE {where_sql}",
                *params
            )
            total = count_row['count']
            
            # Get pinned threads first
            pinned_rows = await conn.fetch(
                f"""
                SELECT t.id, t.title, t.author_id, t.reply_count, t.views,
                       t.upvotes, t.is_pinned, t.is_locked, t.last_post_at, t.created_at
                FROM forum_threads t
                WHERE {'t.category_id = $1 AND ' if category_id else ''} t.is_pinned = TRUE
                ORDER BY t.last_post_at DESC
                """,
                *([category_id] if category_id else [])
            )
            
            # Get regular threads
            regular_rows = await conn.fetch(
                f"""
                SELECT t.id, t.title, t.author_id, t.reply_count, t.views,
                       t.upvotes, t.is_pinned, t.is_locked, t.last_post_at, t.created_at
                FROM forum_threads t
                WHERE {where_sql}
                ORDER BY {sort_column} DESC
                LIMIT ${len(params) + 1} OFFSET ${len(params) + 2}
                """,
                *params, page_size, offset
            )
            
            # Combine and get author info
            all_rows = list(pinned_rows) + list(regular_rows)
            
            # Get unique author IDs
            author_ids = list(set(row['author_id'] for row in all_rows))
            
            # Fetch author info (mock - in real app, query users table)
            authors = {aid: AuthorInfo(id=aid, username=f"User_{aid[:8]}") for aid in author_ids}
            
            threads = []
            for row in all_rows:
                data = dict(row)
                data['author'] = authors.get(row['author_id'], AuthorInfo(id=row['author_id'], username="Unknown"))
                del data['author_id']
                threads.append(ThreadSummary(**data))
            
            return threads, total
    
    async def create_thread(
        self,
        user_id: str,
        request: CreateThreadRequest
    ) -> ForumThread:
        """Create a new thread."""
        async with self.db.acquire() as conn:
            async with conn.transaction():
                # Check category exists
                cat = await conn.fetchrow(
                    "SELECT id FROM forum_categories WHERE id = $1",
                    request.category_id
                )
                if not cat:
                    raise ValueError("Category not found")
                
                # Handle poll
                poll_options = None
                poll_ends_at = None
                if request.is_poll and request.poll_options:
                    poll_options = [{"option": opt, "votes": 0} for opt in request.poll_options[:10]]
                    if request.poll_duration_hours:
                        poll_ends_at = datetime.utcnow() + timedelta(hours=request.poll_duration_hours)
                
                # Create thread
                row = await conn.fetchrow(
                    """
                    INSERT INTO forum_threads
                    (category_id, author_id, title, content, is_poll, poll_options, poll_ends_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING id, category_id, author_id, title, content, is_poll,
                              poll_options, poll_ends_at, views, upvotes, reply_count,
                              is_pinned, is_locked, last_post_at, created_at, updated_at
                    """,
                    request.category_id, user_id, request.title, request.content,
                    request.is_poll, poll_options, poll_ends_at
                )
                
                logger.info(f"User {user_id} created thread {row['id']}")
                
                return await self._row_to_thread(row)
    
    async def get_thread(
        self,
        thread_id: int,
        user_id: Optional[str] = None
    ) -> Optional[ThreadDetailResponse]:
        """Get thread detail with posts."""
        async with self.db.acquire() as conn:
            # Get thread
            row = await conn.fetchrow(
                """
                SELECT t.* FROM forum_threads t WHERE t.id = $1
                """,
                thread_id
            )
            
            if not row:
                return None
            
            # Increment view count (if not already viewed by this user)
            if user_id:
                await conn.execute(
                    """
                    INSERT INTO forum_thread_views (thread_id, user_id)
                    VALUES ($1, $2)
                    ON CONFLICT DO NOTHING
                    """,
                    thread_id, user_id
                )
                
                # Count unique views
                view_count = await conn.fetchval(
                    "SELECT COUNT(*) FROM forum_thread_views WHERE thread_id = $1",
                    thread_id
                )
                await conn.execute(
                    "UPDATE forum_threads SET views = $1 WHERE id = $2",
                    view_count, thread_id
                )
            
            # Get posts
            post_rows = await conn.fetch(
                """
                SELECT id, thread_id, author_id, content, parent_id, upvotes,
                       is_solution, is_edited, edited_at, created_at
                FROM forum_posts
                WHERE thread_id = $1
                ORDER BY created_at ASC
                """,
                thread_id
            )
            
            # Get user votes
            user_votes = {}
            if user_id:
                vote_rows = await conn.fetch(
                    "SELECT post_id, vote_type FROM forum_votes WHERE user_id = $1",
                    user_id
                )
                user_votes = {row['post_id']: row['vote_type'] for row in vote_rows}
            
            # Build post tree
            posts_map = {}
            root_posts = []
            
            for prow in post_rows:
                post_data = dict(prow)
                post_data['author'] = AuthorInfo(id=prow['author_id'], username=f"User_{prow['author_id'][:8]}")
                post_data['user_vote'] = user_votes.get(prow['id'])
                del post_data['author_id']
                
                post = ForumPost(**post_data)
                posts_map[post.id] = post
                
                if post.parent_id:
                    parent = posts_map.get(post.parent_id)
                    if parent:
                        parent.replies.append(post)
                else:
                    root_posts.append(post)
            
            # Check subscription
            is_subscribed = False
            if user_id:
                sub = await conn.fetchrow(
                    "SELECT 1 FROM forum_subscriptions WHERE user_id = $1 AND thread_id = $2",
                    user_id, thread_id
                )
                is_subscribed = sub is not None
            
            thread = await self._row_to_thread(row)
            
            return ThreadDetailResponse(
                thread=thread,
                posts=root_posts,
                is_subscribed=is_subscribed
            )
    
    async def create_post(
        self,
        user_id: str,
        thread_id: int,
        request: CreatePostRequest
    ) -> ForumPost:
        """Create a new post/reply."""
        async with self.db.acquire() as conn:
            async with conn.transaction():
                # Check thread exists and not locked
                thread = await conn.fetchrow(
                    "SELECT is_locked FROM forum_threads WHERE id = $1",
                    thread_id
                )
                if not thread:
                    raise ValueError("Thread not found")
                if thread['is_locked']:
                    raise ValueError("Thread is locked")
                
                # Create post
                row = await conn.fetchrow(
                    """
                    INSERT INTO forum_posts
                    (thread_id, author_id, content, parent_id)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id, thread_id, author_id, content, parent_id,
                              upvotes, is_solution, is_edited, edited_at, created_at
                    """,
                    thread_id, user_id, request.content, request.parent_id
                )
                
                logger.info(f"User {user_id} created post {row['id']} in thread {thread_id}")
                
                return ForumPost(
                    id=row['id'],
                    thread_id=row['thread_id'],
                    author=AuthorInfo(id=user_id, username=f"User_{user_id[:8]}"),
                    content=row['content'],
                    parent_id=row['parent_id'],
                    upvotes=row['upvotes'],
                    is_solution=row['is_solution'],
                    is_edited=row['is_edited'],
                    edited_at=row['edited_at'],
                    created_at=row['created_at'],
                    replies=[]
                )
    
    async def vote_post(
        self,
        user_id: str,
        post_id: int,
        vote_type: int
    ) -> Tuple[int, bool]:
        """
        Vote on a post. Returns (new_vote_count, success).
        vote_type: 1 for upvote, -1 for downvote, 0 to remove vote
        """
        async with self.db.acquire() as conn:
            async with conn.transaction():
                # Get current vote
                current = await conn.fetchrow(
                    "SELECT vote_type FROM forum_votes WHERE user_id = $1 AND post_id = $2",
                    user_id, post_id
                )
                
                if vote_type == 0:
                    # Remove vote
                    if current:
                        await conn.execute(
                            "DELETE FROM forum_votes WHERE user_id = $1 AND post_id = $2",
                            user_id, post_id
                        )
                        # Update post upvotes
                        await conn.execute(
                            """
                            UPDATE forum_posts 
                            SET upvotes = upvotes - $1 
                            WHERE id = $2
                            """,
                            current['vote_type'], post_id
                        )
                else:
                    # Add or update vote
                    if current:
                        # Update existing
                        await conn.execute(
                            """
                            UPDATE forum_votes 
                            SET vote_type = $1, created_at = CURRENT_TIMESTAMP
                            WHERE user_id = $2 AND post_id = $3
                            """,
                            vote_type, user_id, post_id
                        )
                        # Adjust upvotes
                        diff = vote_type - current['vote_type']
                        await conn.execute(
                            "UPDATE forum_posts SET upvotes = upvotes + $1 WHERE id = $2",
                            diff, post_id
                        )
                    else:
                        # New vote
                        await conn.execute(
                            """
                            INSERT INTO forum_votes (user_id, post_id, vote_type)
                            VALUES ($1, $2, $3)
                            """,
                            user_id, post_id, vote_type
                        )
                        await conn.execute(
                            "UPDATE forum_posts SET upvotes = upvotes + $1 WHERE id = $2",
                            vote_type, post_id
                        )
                
                # Get new count
                new_count = await conn.fetchval(
                    "SELECT upvotes FROM forum_posts WHERE id = $1",
                    post_id
                )
                
                return new_count, True
    
    async def _row_to_thread(self, row) -> ForumThread:
        """Convert database row to ForumThread model."""
        data = dict(row)
        data['author'] = AuthorInfo(id=row['author_id'], username=f"User_{row['author_id'][:8]}")
        del data['author_id']
        
        # Parse poll options
        if row['poll_options']:
            data['poll_options'] = [PollOption(**opt) for opt in row['poll_options']]
        
        return ForumThread(**data)
