"""[Ver001.000] PandaScore data sync — seeds players, teams, and matches into PostgreSQL."""
import asyncio
import os
import sys
import httpx
import logging

# Add repo root to path
_ROOT = os.path.join(os.path.dirname(__file__), '..', '..', '..', '..')
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import text

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://sator:sator_dev_password@localhost:5432/sator")
PANDASCORE_TOKEN = os.getenv("PANDASCORE_API_KEY", "")
PS_BASE = "https://api.pandascore.co"

if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)


async def fetch_pandascore(client: httpx.AsyncClient, path: str, params: dict = None) -> list:
    """Fetch a paginated endpoint from PandaScore."""
    if not PANDASCORE_TOKEN:
        logger.warning("PANDASCORE_API_KEY not set — using empty dataset")
        return []
    headers = {"Authorization": f"Bearer {PANDASCORE_TOKEN}"}
    all_items = []
    page = 1
    while True:
        p = {"page": page, "per_page": 100, **(params or {})}
        resp = await client.get(f"{PS_BASE}{path}", headers=headers, params=p, timeout=30)
        if resp.status_code != 200:
            logger.warning(f"PandaScore {path} → HTTP {resp.status_code}")
            break
        items = resp.json()
        if not items:
            break
        all_items.extend(items)
        if len(items) < 100:
            break
        page += 1
        if page > 5:  # Safety cap: max 500 records per type
            break
    return all_items


async def sync_teams(session: AsyncSession, teams: list) -> int:
    count = 0
    for t in teams:
        await session.execute(text("""
            INSERT INTO teams (pandascore_id, name, slug, acronym, game, region, image_url)
            VALUES (:pid, :name, :slug, :acronym, :game, :region, :image_url)
            ON CONFLICT (pandascore_id) DO UPDATE
            SET name=EXCLUDED.name, slug=EXCLUDED.slug, image_url=EXCLUDED.image_url
        """), {
            "pid": str(t.get("id", "")), "name": t.get("name", ""), "slug": t.get("slug", ""),
            "acronym": t.get("acronym", ""), "game": "valorant", "region": t.get("location", ""),
            "image_url": t.get("image_url", ""),
        })
        count += 1
    return count


async def sync_players(session: AsyncSession, players: list) -> int:
    count = 0
    for p in players:
        await session.execute(text("""
            INSERT INTO players (pandascore_id, name, slug, handle, nationality, game)
            VALUES (:pid, :name, :slug, :handle, :nationality, :game)
            ON CONFLICT (pandascore_id) DO UPDATE
            SET name=EXCLUDED.name, slug=EXCLUDED.slug, handle=EXCLUDED.handle
        """), {
            "pid": str(p.get("id", "")), "name": p.get("name", ""),
            "slug": p.get("slug", ""), "handle": p.get("name", ""),
            "nationality": p.get("nationality", ""), "game": "valorant",
        })
        count += 1
    return count


async def main():
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with httpx.AsyncClient() as client:
        logger.info("Fetching Valorant teams from PandaScore...")
        teams = await fetch_pandascore(client, "/valorant/teams")
        logger.info(f"  → {len(teams)} teams")

        logger.info("Fetching Valorant players from PandaScore...")
        players = await fetch_pandascore(client, "/valorant/players")
        logger.info(f"  → {len(players)} players")

    async with async_session() as session:
        async with session.begin():
            tc = await sync_teams(session, teams)
            pc = await sync_players(session, players)
            logger.info(f"Synced {tc} teams, {pc} players")

    await engine.dispose()
    logger.info("Sync complete.")


if __name__ == "__main__":
    asyncio.run(main())
