"""WebSocket endpoints for live match updates."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from datetime import datetime
import asyncio

router = APIRouter(prefix="/ws", tags=["websocket"])


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


@router.websocket("/matches/live")
async def live_matches(websocket: WebSocket) -> None:
    """
    WebSocket for live match feed. Sends heartbeat every 30s.
    Phase 5 will push PandaScore webhook events here.
    """
    await manager.connect(websocket)
    try:
        while True:
            await websocket.send_json({
                "type": "heartbeat",
                "timestamp": datetime.utcnow().isoformat(),
                "live_matches": [],
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
