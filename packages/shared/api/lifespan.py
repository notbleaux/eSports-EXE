"""FastAPI lifespan events for startup/shutdown."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
import os
import asyncio
from .database import init_pool, get_pool, close_pool


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan events."""
    # Startup
    print("🚀 Starting up SATOR API...")
    
    # Initialize database pool
    dsn = os.getenv("DATABASE_URL")
    if dsn:
        try:
            init_pool(dsn, min_size=5, max_size=20)
            await get_pool().connect()
            print("✓ Database pool initialized")
        except Exception as e:
            print(f"⚠ Database connection failed: {e}")
    else:
        print("⚠ DATABASE_URL not set - database features disabled")
    
    # Additional startup tasks
    print("✓ API ready")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down SATOR API...")
    await close_pool()
    print("✓ Cleanup complete")