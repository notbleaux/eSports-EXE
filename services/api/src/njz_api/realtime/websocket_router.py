"""
WebSocket Router for Real-time Match Updates

Provides WebSocket endpoints for:
- Live match subscriptions
- Real-time event streaming
- Prediction updates

Phase 2: Real-time Layer

[Ver001.000]
"""

import logging
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, HTTPException
from pydantic import BaseModel

from .manager import RealtimeManager
from .schemas import PredictionRequest
from .predictions import PredictionService

logger = logging.getLogger(__name__)

# Create router
websocket_router = APIRouter()

# Initialize manager (singleton)
realtime_manager = RealtimeManager()
prediction_service = PredictionService()


# --- REST Endpoints for Predictions ---

class PredictionResponse(BaseModel):
    """Prediction response model."""
    match_id: int
    team1_win_probability: float
    team2_win_probability: float
    confidence: float
    key_factors: list
    generated_at: str


@websocket_router.post(
    "/predictions/match",
    response_model=PredictionResponse,
    summary="Get match prediction",
    description="Get win probability prediction for a match."
)
async def get_match_prediction(request: PredictionRequest):
    """
    Generate a prediction for a match outcome.
    
    Can be used before or during a match. For live matches,
    use the WebSocket connection for real-time updates.
    """
    # Get live state if match is active
    live_state = realtime_manager.get_match_state(request.match_id)
    
    # Generate prediction
    result = await prediction_service.predict_match(request, live_state)
    
    return PredictionResponse(
        match_id=result.match_id,
        team1_win_probability=result.team1_win_probability,
        team2_win_probability=result.team2_win_probability,
        confidence=result.confidence,
        key_factors=result.key_factors,
        generated_at=result.generated_at.isoformat()
    )


@websocket_router.get(
    "/predictions/match/{match_id}",
    response_model=PredictionResponse,
    summary="Get cached prediction",
    description="Get the most recent prediction for a match."
)
async def get_cached_prediction(match_id: int):
    """Get the cached prediction for a match."""
    cached = prediction_service.get_cached_prediction(match_id)
    
    if not cached:
        raise HTTPException(
            status_code=404,
            detail=f"No prediction found for match {match_id}"
        )
    
    return PredictionResponse(
        match_id=cached.match_id,
        team1_win_probability=cached.team1_win_probability,
        team2_win_probability=cached.team2_win_probability,
        confidence=cached.confidence,
        key_factors=cached.key_factors,
        generated_at=cached.generated_at.isoformat()
    )


@websocket_router.get(
    "/realtime/active-matches",
    summary="Get active matches",
    description="Get list of matches with live updates available."
)
async def get_active_matches():
    """Get list of currently active matches."""
    active_matches = realtime_manager.get_active_matches()
    
    return {
        "active_matches": active_matches,
        "count": len(active_matches)
    }


@websocket_router.get(
    "/realtime/stats",
    summary="Get realtime stats",
    description="Get statistics about the real-time system."
)
async def get_realtime_stats():
    """Get real-time manager statistics."""
    stats = realtime_manager.get_stats()
    
    return stats


# --- WebSocket Endpoint ---

@websocket_router.websocket("/ws/live/{match_id}")
async def live_match_websocket(
    websocket: WebSocket,
    match_id: int,
    client_id: Optional[str] = Query(None, description="Unique client identifier")
):
    """
    WebSocket endpoint for live match updates.
    
    Connect to receive real-time:
    - Score updates
    - Player statistics
    - Round events
    - Win probability predictions
    
    ## Connection
    ```
    ws://api/ws/live/{match_id}?client_id=your_client_id
    ```
    
    ## Messages
    
    ### Client → Server
    - `subscribe`: Subscribe to match updates
    - `heartbeat`: Keep connection alive
    - `unsubscribe`: Stop receiving updates
    
    ### Server → Client
    - `state_update`: Full match state update
    - `event`: Individual match event
    - `prediction`: Updated win probability
    - `match_ended`: Match completion notice
    
    ## Example
    ```javascript
    const ws = new WebSocket('ws://api/ws/live/123?client_id=abc');
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log(data.type, data.data);
    };
    ```
    """
    # Generate client ID if not provided
    if not client_id:
        import uuid
        client_id = str(uuid.uuid4())[:8]
    
    # Accept connection
    await websocket.accept()
    
    # Register with manager
    connection = await realtime_manager.connect(client_id, websocket)
    
    try:
        # Subscribe to match
        await realtime_manager.subscribe(client_id, match_id)
        
        # Send initial state if available
        state = realtime_manager.get_match_state(match_id)
        if state:
            await websocket.send_json({
                "type": "initial_state",
                "match_id": match_id,
                "data": {
                    "current_round": state.current_round,
                    "team1_score": state.team1_score,
                    "team2_score": state.team2_score,
                    "status": state.status
                }
            })
        else:
            await websocket.send_json({
                "type": "info",
                "message": f"Match {match_id} not yet started or not found"
            })
        
        # Message loop
        while True:
            try:
                # Receive message with timeout
                message = await websocket.receive_json()
                
                # Process message
                msg_type = message.get("type")
                
                if msg_type == "heartbeat":
                    await realtime_manager.update_heartbeat(client_id)
                    await websocket.send_json({
                        "type": "heartbeat_ack",
                        "timestamp": datetime.utcnow().isoformat()
                    })
                
                elif msg_type == "subscribe":
                    # Client can subscribe to additional matches
                    new_match_id = message.get("match_id")
                    if new_match_id:
                        await realtime_manager.subscribe(client_id, new_match_id)
                        await websocket.send_json({
                            "type": "subscribed",
                            "match_id": new_match_id
                        })
                
                elif msg_type == "unsubscribe":
                    unsub_match_id = message.get("match_id", match_id)
                    await realtime_manager.unsubscribe(client_id, unsub_match_id)
                    await websocket.send_json({
                        "type": "unsubscribed",
                        "match_id": unsub_match_id
                    })
                
                elif msg_type == "get_state":
                    # Client requests current state
                    requested_match_id = message.get("match_id", match_id)
                    state = realtime_manager.get_match_state(requested_match_id)
                    if state:
                        await websocket.send_json({
                            "type": "state",
                            "match_id": requested_match_id,
                            "data": {
                                "current_round": state.current_round,
                                "team1_score": state.team1_score,
                                "team2_score": state.team2_score,
                                "player_stats": {
                                    str(pid): {
                                        "kills": s.kills,
                                        "deaths": s.deaths,
                                        "kda": s.kda,
                                        "acs": s.acs
                                    }
                                    for pid, s in state.player_stats.items()
                                }
                            }
                        })
                
                else:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Unknown message type: {msg_type}"
                    })
                    
            except Exception as e:
                logger.error(f"Error processing message from {client_id}: {e}")
                try:
                    await websocket.send_json({
                        "type": "error",
                        "message": str(e)
                    })
                except:
                    break
    
    except WebSocketDisconnect:
        logger.info(f"Client {client_id} disconnected")
    
    finally:
        # Clean up
        await realtime_manager.disconnect(client_id)


@websocket_router.on_event("startup")
async def startup_event():
    """Initialize real-time manager on startup."""
    await realtime_manager.start()
    logger.info("Realtime manager started")


@websocket_router.on_event("shutdown")
async def shutdown_event():
    """Clean up real-time manager on shutdown."""
    await realtime_manager.stop()
    logger.info("Realtime manager stopped")
