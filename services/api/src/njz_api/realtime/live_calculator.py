"""
Live Stats Calculator

Calculates real-time statistics during active matches.
Updates metrics as events occur (kills, deaths, round ends, etc.)

[Ver001.000]
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from dataclasses import dataclass, field

from .schemas import LivePlayerStats, LiveMatchState, MatchEventType
from ..stats.calculators import ACSCalculator, ADRCalculator, KDACalculator

logger = logging.getLogger(__name__)


@dataclass
class RunningTotals:
    """Running totals for a player in a live match."""
    kills: int = 0
    deaths: int = 0
    assists: int = 0
    damage_dealt: int = 0
    first_bloods: int = 0
    clutches_won: int = 0
    rounds_survived: int = 0
    rounds_played: int = 0
    credits_spent: int = 0


class LiveStatsCalculator:
    """
    Calculator for real-time match statistics.
    
    Maintains running state and updates metrics as events arrive.
    """
    
    def __init__(self):
        self._match_states: Dict[int, LiveMatchState] = {}
        self._running_totals: Dict[int, Dict[int, RunningTotals]] = {}  # match_id -> player_id -> totals
    
    def initialize_match(
        self,
        match_id: int,
        team1_id: int,
        team2_id: int,
        team1_players: List[int],
        team2_players: List[int]
    ) -> LiveMatchState:
        """
        Initialize state for a new match.
        
        Args:
            match_id: Match ID
            team1_id: Team 1 ID
            team2_id: Team 2 ID
            team1_players: List of player IDs for team 1
            team2_players: List of player IDs for team 2
            
        Returns:
            Initialized match state
        """
        # Initialize player stats
        player_stats = {}
        
        for player_id in team1_players:
            player_stats[player_id] = LivePlayerStats(
                player_id=player_id,
                team_id=team1_id
            )
        
        for player_id in team2_players:
            player_stats[player_id] = LivePlayerStats(
                player_id=player_id,
                team_id=team2_id
            )
        
        # Create match state
        state = LiveMatchState(
            match_id=match_id,
            team1_id=team1_id,
            team2_id=team2_id,
            player_stats=player_stats
        )
        
        self._match_states[match_id] = state
        self._running_totals[match_id] = {
            pid: RunningTotals() for pid in team1_players + team2_players
        }
        
        logger.info(f"Initialized live match state for match {match_id}")
        return state
    
    def process_event(self, match_id: int, event: Dict[str, Any]) -> Optional[LiveMatchState]:
        """
        Process a match event and update live stats.
        
        Args:
            match_id: Match ID
            event: Event data with type, player_id, etc.
            
        Returns:
            Updated match state or None if match not found
        """
        if match_id not in self._match_states:
            logger.warning(f"Match {match_id} not initialized")
            return None
        
        state = self._match_states[match_id]
        event_type = event.get("event_type")
        player_id = event.get("player_id")
        
        try:
            if event_type == MatchEventType.KILL.value:
                self._process_kill(match_id, player_id, event)
            
            elif event_type == MatchEventType.DEATH.value:
                self._process_death(match_id, player_id, event)
            
            elif event_type == MatchEventType.ASSIST.value:
                self._process_assist(match_id, player_id)
            
            elif event_type == MatchEventType.ROUND_END.value:
                self._process_round_end(match_id, event)
            
            elif event_type == MatchEventType.SCORE_UPDATE.value:
                self._process_score_update(match_id, event)
            
            elif event_type == MatchEventType.ECONOMY_UPDATE.value:
                self._process_economy_update(match_id, event)
            
            # Recalculate all metrics
            self._recalculate_all_metrics(match_id)
            
            state.last_updated = datetime.utcnow()
            return state
            
        except Exception as e:
            logger.error(f"Error processing event for match {match_id}: {e}")
            return state
    
    def _process_kill(self, match_id: int, player_id: int, event: Dict[str, Any]):
        """Process a kill event."""
        if player_id not in self._running_totals[match_id]:
            return
        
        totals = self._running_totals[match_id][player_id]
        totals.kills += 1
        totals.damage_dealt += event.get("damage", 100)  # Default to 100 if not specified
        
        if event.get("first_blood"):
            totals.first_bloods += 1
        
        # Update state
        state = self._match_states[match_id]
        state.player_stats[player_id].kills = totals.kills
        state.player_stats[player_id].first_bloods = totals.first_bloods
        state.player_stats[player_id].damage_dealt = totals.damage_dealt
    
    def _process_death(self, match_id: int, player_id: int, event: Dict[str, Any]):
        """Process a death event."""
        if player_id not in self._running_totals[match_id]:
            return
        
        totals = self._running_totals[match_id][player_id]
        totals.deaths += 1
        
        # Check for clutch
        clutch_won = event.get("clutch_won")
        if clutch_won:
            totals.clutches_won += 1
        
        # Update state
        state = self._match_states[match_id]
        state.player_stats[player_id].deaths = totals.deaths
        state.player_stats[player_id].clutches_won = totals.clutches_won
    
    def _process_assist(self, match_id: int, player_id: int):
        """Process an assist event."""
        if player_id not in self._running_totals[match_id]:
            return
        
        totals = self._running_totals[match_id][player_id]
        totals.assists += 1
        
        state = self._match_states[match_id]
        state.player_stats[player_id].assists = totals.assists
    
    def _process_round_end(self, match_id: int, event: Dict[str, Any]):
        """Process round end event."""
        state = self._match_states[match_id]
        
        # Update round number
        state.current_round = event.get("round_number", state.current_round + 1)
        
        # Update survival counts for players who survived
        survivors = event.get("survivors", [])
        for player_id in survivors:
            if player_id in self._running_totals[match_id]:
                self._running_totals[match_id][player_id].rounds_survived += 1
                self._running_totals[match_id][player_id].rounds_played += 1
        
        # Update rounds played for all players
        for player_id in self._running_totals[match_id]:
            if player_id not in survivors:
                self._running_totals[match_id][player_id].rounds_played += 1
    
    def _process_score_update(self, match_id: int, event: Dict[str, Any]):
        """Process score update."""
        state = self._match_states[match_id]
        state.team1_score = event.get("team1_score", state.team1_score)
        state.team2_score = event.get("team2_score", state.team2_score)
    
    def _process_economy_update(self, match_id: int, event: Dict[str, Any]):
        """Process economy update."""
        state = self._match_states[match_id]
        
        # Update team banks
        state.team1_bank = event.get("team1_bank", state.team1_bank)
        state.team2_bank = event.get("team2_bank", state.team2_bank)
        
        # Update player credits spent
        for player_id, credits in event.get("credits_spent", {}).items():
            player_id = int(player_id)
            if player_id in self._running_totals[match_id]:
                self._running_totals[match_id][player_id].credits_spent += credits
    
    def _recalculate_all_metrics(self, match_id: int):
        """Recalculate all derived metrics for all players."""
        state = self._match_states[match_id]
        
        for player_id, totals in self._running_totals[match_id].items():
            player_stats = state.player_stats[player_id]
            
            # Calculate KDA
            kda_result = KDACalculator.calculate(
                totals.kills,
                totals.deaths,
                totals.assists
            )
            player_stats.kda = round(kda_result.value, 2)
            
            # Calculate ADR (Average Damage per Round)
            if totals.rounds_played > 0:
                adr_result = ADRCalculator.calculate(
                    totals.damage_dealt,
                    totals.rounds_played
                )
                player_stats.adr = round(adr_result.value, 1)
            
            # Calculate ACS (estimated)
            if totals.rounds_played > 0:
                acs_result = ACSCalculator.calculate_from_combat(
                    totals.kills,
                    totals.assists,
                    totals.damage_dealt,
                    totals.rounds_played
                )
                player_stats.acs = acs_result.value
            
            # Calculate damage per credit
            if totals.credits_spent > 0:
                player_stats.damage_per_credit = round(
                    totals.damage_dealt / totals.credits_spent, 2
                )
            
            player_stats.last_updated = datetime.utcnow()
    
    def get_match_state(self, match_id: int) -> Optional[LiveMatchState]:
        """Get current state of a match."""
        return self._match_states.get(match_id)
    
    def end_match(self, match_id: int) -> Optional[LiveMatchState]:
        """Mark a match as ended and return final state."""
        if match_id not in self._match_states:
            return None
        
        state = self._match_states[match_id]
        state.status = "ended"
        state.last_updated = datetime.utcnow()
        
        # Schedule cleanup after delay
        asyncio.create_task(self._delayed_cleanup(match_id))
        
        return state
    
    async def _delayed_cleanup(self, match_id: int, delay: int = 300):
        """Clean up match state after delay."""
        await asyncio.sleep(delay)
        self._cleanup_match(match_id)
    
    def _cleanup_match(self, match_id: int):
        """Clean up match state from memory."""
        if match_id in self._match_states:
            del self._match_states[match_id]
        if match_id in self._running_totals:
            del self._running_totals[match_id]
        
        logger.info(f"Cleaned up match {match_id}")
    
    def get_all_active_matches(self) -> List[int]:
        """Get list of all active match IDs."""
        return [
            match_id for match_id, state in self._match_states.items()
            if state.status == "live"
        ]
