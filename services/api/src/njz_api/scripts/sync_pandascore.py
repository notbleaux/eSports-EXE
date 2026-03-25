"""
PandaScore Data Sync Script
Usage: python -m njz_api.scripts.sync_pandascore

Fetches teams, players, and matches from PandaScore API and upserts to DB.
Requires: DATABASE_URL and PANDASCORE_API_KEY environment variables.
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import insert as pg_insert

from sqlalchemy import select

from njz_api.clients.pandascore import PandaScoreClient
from njz_api.models.team import Team
from njz_api.models.player import Player
from njz_api.models.match import Match
from njz_api.models.player_stats import PlayerStats

DATABASE_URL = os.environ.get("DATABASE_URL", "")
PANDASCORE_API_KEY = os.environ.get("PANDASCORE_API_KEY", "")


async def sync_teams(client: PandaScoreClient, session: AsyncSession) -> None:
    """Fetch teams from PandaScore and upsert to DB."""
    for game in ["valorant", "cs2"]:
        if game == "valorant":
            teams = await client.get_valorant_teams()
        else:
            teams = await client.get_cs2_teams()

        for t in teams:
            stmt = pg_insert(Team).values(
                pandascore_id=t.get("id"),
                name=t.get("name", ""),
                slug=t.get("slug", ""),
                acronym=t.get("acronym"),
                game=game,
                region=t.get("location"),
            ).on_conflict_do_update(
                index_elements=["pandascore_id"],
                set_=dict(
                    name=t.get("name", ""),
                    slug=t.get("slug", ""),
                    acronym=t.get("acronym"),
                    region=t.get("location"),
                ),
            )
            await session.execute(stmt)

    await session.commit()
    print("Teams synced.")


async def sync_players(client: PandaScoreClient, session: AsyncSession) -> None:
    """Fetch players from PandaScore and upsert to DB."""
    for game in ["valorant", "cs2"]:
        if game == "valorant":
            players = await client.get_valorant_players()
        else:
            players = await client.get_cs2_players()

        for p in players:
            stmt = pg_insert(Player).values(
                pandascore_id=p.get("id"),
                name=p.get("name", ""),
                slug=p.get("slug", ""),
                nationality=p.get("nationality"),
                game=game,
            ).on_conflict_do_update(
                index_elements=["pandascore_id"],
                set_=dict(
                    name=p.get("name", ""),
                    slug=p.get("slug", ""),
                    nationality=p.get("nationality"),
                ),
            )
            await session.execute(stmt)

    await session.commit()
    print("Players synced.")


async def sync_player_stats(client: PandaScoreClient, session: AsyncSession) -> None:
    """For each player in DB, fetch recent stats from PandaScore and insert into player_stats."""
    import httpx

    result = await session.execute(select(Player))
    players = result.scalars().all()

    for player in players:
        raw_stats = None
        try:
            fetcher = (
                client.get_valorant_player_stats
                if player.game == "valorant"
                else client.get_cs2_player_stats
            )
            try:
                raw_stats = await fetcher(player.pandascore_id)
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429:
                    # Rate limited — wait 2s and retry once
                    await asyncio.sleep(2)
                    raw_stats = await fetcher(player.pandascore_id)
                elif e.response.status_code == 404:
                    # Player not found in PandaScore — skip silently
                    continue
                else:
                    raise

            for s in (raw_stats or [])[:10]:  # Last 10 matches per player
                kills = s.get("kills", 0) or 0
                deaths = s.get("deaths", 1) or 1
                assists = s.get("assists", 0) or 0
                try:
                    stmt = pg_insert(PlayerStats).values(
                        player_id=player.id,
                        game=player.game,
                        kills=kills,
                        deaths=deaths,
                        assists=assists,
                        headshot_pct=float(s.get("headshots_percentage", 0) or 0),
                        kd_ratio=round(kills / max(deaths, 1), 2),
                        acs=float(s.get("average_combat_score", 0) or 0),
                    ).on_conflict_do_nothing()
                    await session.execute(stmt)
                except Exception as db_err:
                    await session.rollback()
                    print(f"  DB insert failed for player {player.id}: {db_err}")
                    break

        except Exception as e:
            print(f"Stats fetch failed for player {player.id} ({player.slug}): {e}")
            continue

    await session.commit()
    print("Player stats synced.")


async def sync_matches(client: PandaScoreClient, session: AsyncSession) -> None:
    """Fetch upcoming matches and upsert to DB."""
    for game in ["valorant", "cs2"]:
        if game == "valorant":
            matches = await client.get_valorant_matches()
        else:
            matches = await client.get_cs2_matches()

        for m in matches:
            stmt = pg_insert(Match).values(
                pandascore_id=m.get("id"),
                name=m.get("name", ""),
                game=game,
                status=m.get("status", "not_started"),
                scheduled_at=m.get("scheduled_at"),
            ).on_conflict_do_update(
                index_elements=["pandascore_id"],
                set_=dict(
                    name=m.get("name", ""),
                    status=m.get("status", "not_started"),
                ),
            )
            await session.execute(stmt)

    await session.commit()
    print("Matches synced.")


async def main() -> None:
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL environment variable is not set.", file=sys.stderr)
        sys.exit(1)
    if not PANDASCORE_API_KEY:
        print("ERROR: PANDASCORE_API_KEY environment variable is not set.", file=sys.stderr)
        sys.exit(1)

    engine = create_async_engine(DATABASE_URL, echo=False)
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    client = PandaScoreClient(api_key=PANDASCORE_API_KEY)
    async with AsyncSessionLocal() as session:
        await sync_teams(client, session)
        await sync_players(client, session)
        await sync_matches(client, session)
        await sync_player_stats(client, session)

    await engine.dispose()
    print("Sync complete.")


if __name__ == "__main__":
    asyncio.run(main())
