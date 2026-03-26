"""[Ver001.000] WebSocket endpoint for live player stats subscriptions."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set
import asyncio
import json
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ws", tags=["websocket-players"])

class PlayerStatsConnectionManager:
    def __init__(self):
        self.subscriptions: Dict[int, Set[WebSocket]] = {}  # player_id → connections

    async def subscribe(self, ws: WebSocket, player_id: int):
        await ws.accept()
        if player_id not in self.subscriptions:
            self.subscriptions[player_id] = set()
        self.subscriptions[player_id].add(ws)

    def unsubscribe(self, ws: WebSocket, player_id: int):
        if player_id in self.subscriptions:
            self.subscriptions[player_id].discard(ws)
            if not self.subscriptions[player_id]:
                del self.subscriptions[player_id]

    async def broadcast_player_update(self, player_id: int, data: dict):
        if player_id not in self.subscriptions:
            return
        dead = set()
        for ws in self.subscriptions[player_id]:
            try:
                await ws.send_json(data)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.subscriptions[player_id].discard(ws)

player_manager = PlayerStatsConnectionManager()

@router.websocket("/players/{player_id}/stats")
async def player_stats_ws(websocket: WebSocket, player_id: int):
    """Subscribe to live stats updates for a specific player."""
    await player_manager.subscribe(websocket, player_id)
    try:
        while True:
            # Keep alive — client sends pings, server echoes
            msg = await asyncio.wait_for(websocket.receive_text(), timeout=30)
            if msg == "ping":
                await websocket.send_text("pong")
    except (WebSocketDisconnect, asyncio.TimeoutError):
        player_manager.unsubscribe(websocket, player_id)
