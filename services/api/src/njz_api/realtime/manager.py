"""
Real-time Manager

Manages WebSocket connections, event distribution, and live state.
Coordinates between live calculators and prediction services.

[Ver001.000]
"""

import logging
import asyncio
from typing import Dict, List, Set, Optional, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, field

from .live_calculator import LiveStatsCalculator
from .predictions import PredictionService
from .schemas import (
    LiveMatchState,
    LiveEvent,
    MatchEventType,
    PredictionResult,
    ClientSubscription
)

logger = logging.getLogger(__name__)


@dataclass
class WebSocketConnection:
    """Represents an active WebSocket connection."""
    client_id: str
    websocket: Any  # FastAPI WebSocket
    subscriptions: Set[int] = field(default_factory=set)
    connected_at: datetime = field(default_factory=datetime.utcnow)
    last_heartbeat: datetime = field(default_factory=datetime.utcnow)
    is_alive: bool = True


class RealtimeManager:
    """
    Central manager for real-time match updates.
    
    Responsibilities:
    - Manage WebSocket connections
    - Track client subscriptions
    - Process and distribute events
    - Coordinate live calculations and predictions
    - Handle heartbeats and cleanup
    """
    
    def __init__(self):
        self.calculator = LiveStatsCalculator()
        self.predictor = PredictionService()
        
        # Connection management
        self._connections: Dict[str, WebSocketConnection] = {}
        self._match_subscribers: Dict[int, Set[str]] = {}  # match_id -> set of client_ids
        
        # Event handling
        self._event_queue: asyncio.Queue = asyncio.Queue()
        self._running = False
        
        # Configuration
        self.heartbeat_interval = 30  # seconds
        self.heartbeat_timeout = 60  # seconds
        self.cleanup_interval = 300  # 5 minutes
    
    async def start(self):
        """Start the real-time manager background tasks."""
        if self._running:
            return
        
        self._running = True
        
        # Start background tasks
        asyncio.create_task(self._heartbeat_monitor())
        asyncio.create_task(self._event_processor())
        asyncio.create_task(self._cleanup_task())
        
        logger.info("Realtime manager started")
    
    async def stop(self):
        """Stop the real-time manager."""
        self._running = False
        
        # Close all connections
        for conn in list(self._connections.values()):
            try:
                await conn.websocket.close()
            except:
                pass
        
        self._connections.clear()
        self._match_subscribers.clear()
        
        logger.info("Realtime manager stopped")
    
    # --- Connection Management ---
    
    async def connect(self, client_id: str, websocket: Any) -> WebSocketConnection:
        """
        Register a new WebSocket connection.
        
        Args:
            client_id: Unique client identifier
            websocket: FastAPI WebSocket object
            
        Returns:
            WebSocketConnection object
        """
        connection = WebSocketConnection(
            client_id=client_id,
            websocket=websocket
        )
        
        self._connections[client_id] = connection
        
        logger.info(f"Client {client_id} connected. Total: {len(self._connections)}")
        
        return connection
    
    async def disconnect(self, client_id: str):
        """Disconnect a client and clean up subscriptions."""
        if client_id not in self._connections:
            return
        
        connection = self._connections[client_id]
        
        # Remove from match subscribers
        for match_id in connection.subscriptions:
            if match_id in self._match_subscribers:
                self._match_subscribers[match_id].discard(client_id)
                
                # Clean up empty subscriber sets
                if not self._match_subscribers[match_id]:
                    del self._match_subscribers[match_id]
        
        # Remove connection
        del self._connections[client_id]
        
        logger.info(f"Client {client_id} disconnected. Total: {len(self._connections)}")
    
    async def subscribe(self, client_id: str, match_id: int) -> bool:
        """
        Subscribe a client to match updates.
        
        Args:
            client_id: Client ID
            match_id: Match ID to subscribe to
            
        Returns:
            True if successful
        """
        if client_id not in self._connections:
            logger.warning(f"Client {client_id} not found")
            return False
        
        connection = self._connections[client_id]
        connection.subscriptions.add(match_id)
        
        # Add to match subscribers
        if match_id not in self._match_subscribers:
            self._match_subscribers[match_id] = set()
        self._match_subscribers[match_id].add(client_id)
        
        logger.debug(f"Client {client_id} subscribed to match {match_id}")
        return True
    
    async def unsubscribe(self, client_id: str, match_id: int) -> bool:
        """Unsubscribe a client from match updates."""
        if client_id not in self._connections:
            return False
        
        connection = self._connections[client_id]
        connection.subscriptions.discard(match_id)
        
        # Remove from match subscribers
        if match_id in self._match_subscribers:
            self._match_subscribers[match_id].discard(client_id)
            
            if not self._match_subscribers[match_id]:
                del self._match_subscribers[match_id]
        
        logger.debug(f"Client {client_id} unsubscribed from match {match_id}")
        return True
    
    # --- Event Handling ---
    
    async def process_event(self, match_id: int, event: Dict[str, Any]):
        """
        Process a match event and update live state.
        
        Args:
            match_id: Match ID
            event: Event data
        """
        # Add to processing queue
        await self._event_queue.put((match_id, event))
    
    async def _event_processor(self):
        """Background task to process events from the queue."""
        while self._running:
            try:
                # Get event with timeout
                try:
                    match_id, event = await asyncio.wait_for(
                        self._event_queue.get(),
                        timeout=1.0
                    )
                except asyncio.TimeoutError:
                    continue
                
                # Process event
                await self._handle_event(match_id, event)
                
            except Exception as e:
                logger.error(f"Error in event processor: {e}")
    
    async def _handle_event(self, match_id: int, event: Dict[str, Any]):
        """Handle a single event."""
        try:
            # Update live calculator
            state = self.calculator.process_event(match_id, event)
            
            if not state:
                return
            
            # Generate prediction if match is active
            prediction = None
            if state.status == "live":
                prediction = await self.predictor.predict_live_match(state)
                state.win_probability_team1 = prediction.team1_win_probability
                state.win_probability_team2 = prediction.team2_win_probability
                state.predicted_winner = (
                    state.team1_id if prediction.team1_win_probability > 0.5
                    else state.team2_id
                )
            
            # Broadcast to subscribers
            await self._broadcast_update(match_id, state, prediction)
            
        except Exception as e:
            logger.error(f"Error handling event for match {match_id}: {e}")
    
    async def _broadcast_update(
        self,
        match_id: int,
        state: LiveMatchState,
        prediction: Optional[PredictionResult]
    ):
        """Broadcast update to all subscribers of a match."""
        if match_id not in self._match_subscribers:
            return
        
        # Prepare message
        message = {
            "type": "state_update",
            "match_id": match_id,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "current_round": state.current_round,
                "team1_score": state.team1_score,
                "team2_score": state.team2_score,
                "player_stats": {
                    str(pid): {
                        "kills": stats.kills,
                        "deaths": stats.deaths,
                        "assists": stats.assists,
                        "kda": stats.kda,
                        "acs": stats.acs,
                        "adr": stats.adr
                    }
                    for pid, stats in state.player_stats.items()
                },
                "win_probability": {
                    "team1": state.win_probability_team1,
                    "team2": state.win_probability_team2
                } if prediction else None
            }
        }
        
        # Send to all subscribers
        disconnected = []
        for client_id in self._match_subscribers[match_id]:
            if client_id not in self._connections:
                disconnected.append(client_id)
                continue
            
            connection = self._connections[client_id]
            if not connection.is_alive:
                disconnected.append(client_id)
                continue
            
            try:
                await connection.websocket.send_json(message)
            except Exception as e:
                logger.warning(f"Failed to send to client {client_id}: {e}")
                disconnected.append(client_id)
        
        # Clean up disconnected clients
        for client_id in disconnected:
            await self.disconnect(client_id)
    
    # --- Heartbeat & Cleanup ---
    
    async def update_heartbeat(self, client_id: str):
        """Update heartbeat timestamp for a client."""
        if client_id in self._connections:
            self._connections[client_id].last_heartbeat = datetime.utcnow()
    
    async def _heartbeat_monitor(self):
        """Background task to check client heartbeats."""
        while self._running:
            try:
                await asyncio.sleep(self.heartbeat_interval)
                
                now = datetime.utcnow()
                disconnected = []
                
                for client_id, connection in self._connections.items():
                    if (now - connection.last_heartbeat).seconds > self.heartbeat_timeout:
                        logger.warning(f"Client {client_id} heartbeat timeout")
                        disconnected.append(client_id)
                
                for client_id in disconnected:
                    await self.disconnect(client_id)
                    
            except Exception as e:
                logger.error(f"Error in heartbeat monitor: {e}")
    
    async def _cleanup_task(self):
        """Background task for periodic cleanup."""
        while self._running:
            try:
                await asyncio.sleep(self.cleanup_interval)
                
                # Clean up ended matches
                active_matches = self.calculator.get_all_active_matches()
                ended_matches = [
                    mid for mid in self._match_subscribers
                    if mid not in active_matches
                ]
                
                for match_id in ended_matches:
                    if match_id in self._match_subscribers:
                        # Notify subscribers that match ended
                        message = {
                            "type": "match_ended",
                            "match_id": match_id,
                            "timestamp": datetime.utcnow().isoformat()
                        }
                        
                        for client_id in list(self._match_subscribers[match_id]):
                            if client_id in self._connections:
                                try:
                                    await self._connections[client_id].websocket.send_json(message)
                                except:
                                    pass
                        
                        del self._match_subscribers[match_id]
                
                logger.debug(f"Cleanup complete. Active matches: {len(active_matches)}")
                
            except Exception as e:
                logger.error(f"Error in cleanup task: {e}")
    
    # --- Public API ---
    
    def get_match_state(self, match_id: int) -> Optional[LiveMatchState]:
        """Get current state of a match."""
        return self.calculator.get_match_state(match_id)
    
    def get_active_matches(self) -> List[int]:
        """Get list of active match IDs."""
        return self.calculator.get_all_active_matches()
    
    def get_subscriber_count(self, match_id: int) -> int:
        """Get number of subscribers for a match."""
        return len(self._match_subscribers.get(match_id, set()))
    
    def get_stats(self) -> Dict[str, Any]:
        """Get manager statistics."""
        return {
            "active_connections": len(self._connections),
            "active_matches": len(self.get_active_matches()),
            "total_subscriptions": sum(
                len(subs) for subs in self._match_subscribers.values()
            ),
            "event_queue_size": self._event_queue.qsize()
        }
