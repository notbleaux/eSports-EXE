# api/src/opera/__init__.py
"""
OPERA Service — Tournament Metadata Satellite for TRINITY + OPERA Architecture.

TiDB-backed tournament metadata management providing:
    - Tournament definitions and lifecycle management
    - Match scheduling and status tracking
    - Game patch versioning
    - Team and roster management
    - Circuit standings and leaderboards
    - Cross-reference support for SATOR linkage

Modules:
    tidb_client — TiDB connection pooling and CRUD operations

Usage:
    from api.src.opera import TiDBOperaClient
    
    client = TiDBOperaClient(
        host="tidb.example.com",
        port=4000,
        user="opera",
        password="secret",
        database="opera_metadata"
    )
    
    tournament = client.create_tournament({
        "name": "VCT 2026 Masters",
        "tier": "Masters",
        "game": "Valorant",
        "region": "International"
    })
"""
from api.src.opera.tidb_client import TiDBOperaClient

__all__ = [
    "TiDBOperaClient",
]
