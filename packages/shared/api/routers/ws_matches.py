"""WebSocket endpoints for live match updates."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from datetime import datetime
from collections import deque
import asyncio

router = APIRouter(prefix="/ws", tags=["websocket"])

# In-memory buffer for recent live match events (last 50)
_live_event_buffer: deque = deque(maxlen=50)


class MatchConnectionManager:
    def __init__(self) -> None:
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket) -> None:
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, data: dict) -> None:
        for ws in list(self.active):
            try:
                await ws.send_json(data)
            except Exception:
                self.active.remove(ws)


manager = MatchConnectionManager()


async def push_match_event(event: dict) -> None:
    """
    Called by the webhook router when a PandaScore event arrives.
    Buffers the event and broadcasts to all connected WebSocket clients.
    """
    _live_event_buffer.append(event)
    message = {
        "type": "match_event",
        "event": event.get("event_type"),
        "match_id": event.get("match_id"),
        "data": event,
        "timestamp": event.get("received_at"),
    }
    await manager.broadcast(message)


@router.websocket("/matches/live")
async def live_matches(websocket: WebSocket) -> None:
    """
    WebSocket for live match feed.
    Sends heartbeat every 30s with buffered events.
    Pushes PandaScore webhook events to all clients via push_match_event().
    """
    await manager.connect(websocket)
    try:
        while True:
            await websocket.send_json({
                "type": "heartbeat",
                "timestamp": datetime.utcnow().isoformat(),
                "live_matches": list(_live_event_buffer)[-10:],
                "connected_clients": len(manager.active),
            })
            await asyncio.sleep(30)
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@router.websocket("/matches/{match_id}/live")
async def live_match_detail(websocket: WebSocket, match_id: int) -> None:
    """WebSocket for a specific match's live score updates."""
    await manager.connect(websocket)
    try:
        while True:
            await websocket.send_json({
                "type": "match_update",
                "match_id": match_id,
                "status": "polling",
                "timestamp": datetime.utcnow().isoformat(),
            })
            await asyncio.sleep(10)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
