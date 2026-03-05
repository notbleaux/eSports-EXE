"""Agent lifecycle and work assignment for dual-game pipeline."""

from typing import Dict, Optional, List
from datetime import datetime, timedelta
from uuid import UUID, uuid4
import logging

from pipeline.coordinator.models import (
    Agent,
    AgentStatus,
    AgentCapabilities,
    GameType,
    ExtractionJob,
)

logger = logging.getLogger(__name__)


class AgentManager:
    """Manages extraction agent registration, health, and work assignment."""
    
    def __init__(self, queue_manager):
        self.queue = queue_manager
        self._agents: Dict[UUID, Agent] = {}
        self._heartbeat_timeout = timedelta(seconds=30)
    
    async def register_agent(
        self,
        name: str,
        capabilities: AgentCapabilities,
        host: Optional[str] = None,
        port: Optional[int] = None,
        version: Optional[str] = None,
        heartbeat_interval_seconds: int = 60,
    ) -> Agent:
        """Register a new extraction agent.
        
        Args:
            name: Agent name/identifier
            capabilities: Agent capabilities including supported games
            host: Optional host address
            port: Optional port number
            version: Optional agent version
            heartbeat_interval_seconds: Expected heartbeat interval
            
        Returns:
            Agent: The registered agent instance
        """
        agent = Agent(
            id=uuid4(),
            name=name,
            capabilities=capabilities,
            status=AgentStatus.IDLE,
            host=host,
            port=port,
            version=version,
            heartbeat_interval_seconds=heartbeat_interval_seconds,
            registered_at=datetime.utcnow(),
            last_heartbeat=datetime.utcnow(),
        )
        
        self._agents[agent.id] = agent
        logger.info(f"Registered agent {agent.id} ({name}) for games: {[g.value for g in capabilities.games]}")
        return agent
    
    async def deregister_agent(self, agent_id: UUID) -> bool:
        """Remove agent from active pool.
        
        Args:
            agent_id: UUID of agent to deregister
            
        Returns:
            True if agent was found and deregistered
        """
        agent = self._agents.get(agent_id)
        if not agent:
            return False
        
        agent.status = AgentStatus.OFFLINE
        logger.info(f"Deregistered agent {agent_id}")
        return True
    
    async def heartbeat(self, agent_id: UUID) -> bool:
        """Process agent heartbeat.
        
        Args:
            agent_id: UUID of agent sending heartbeat
            
        Returns:
            True if agent is healthy, False if timeout/missing
        """
        agent = self._agents.get(agent_id)
        if not agent:
            logger.warning(f"Heartbeat from unknown agent: {agent_id}")
            return False
        
        # Check if agent missed > 3 heartbeats
        now = datetime.utcnow()
        elapsed = (now - agent.last_heartbeat).total_seconds()
        max_expected = agent.heartbeat_interval_seconds * 3
        
        if elapsed > max_expected:
            logger.warning(f"Agent {agent_id} missed heartbeats (last: {elapsed:.0f}s ago)")
            await self._mark_offline(agent_id)
            return False
        
        # Update heartbeat timestamp
        agent.update_heartbeat()
        return True
    
    async def assign_work(self, agent_id: UUID) -> Optional[ExtractionJob]:
        """Assign next job to agent based on game_type compatibility.
        
        Args:
            agent_id: Agent requesting work
            
        Returns:
            ExtractionJob if work available, None if no jobs for this agent's games
        """
        agent = self._agents.get(agent_id)
        if not agent:
            logger.warning(f"Work assignment requested by unknown agent: {agent_id}")
            return None
        
        if not agent.is_available():
            logger.debug(f"Agent {agent_id} not available for work (status: {agent.status.value})")
            return None
        
        # Try each supported game type
        for game_type in agent.capabilities.games:
            job = await self.queue.dequeue(game_type)
            if job:
                agent.assign_job(job.id)
                job.mark_assigned(agent.id)
                logger.info(f"Assigned job {job.id} ({game_type.value}) to agent {agent_id}")
                return job
        
        return None
    
    async def mark_busy(self, agent_id: UUID, job_id: UUID) -> bool:
        """Mark agent as busy with specific job.
        
        Args:
            agent_id: Agent to mark busy
            job_id: Job being processed
            
        Returns:
            True if agent was found and marked busy
        """
        agent = self._agents.get(agent_id)
        if not agent:
            return False
        
        agent.status = AgentStatus.BUSY
        agent.current_job_id = job_id
        return True
    
    async def mark_idle(self, agent_id: UUID, success: bool = True, processing_time_ms: Optional[int] = None) -> bool:
        """Mark agent as idle after job completion.
        
        Args:
            agent_id: Agent to mark idle
            success: Whether the job completed successfully
            processing_time_ms: Optional processing time for metrics
            
        Returns:
            True if agent was found and marked idle
        """
        agent = self._agents.get(agent_id)
        if not agent:
            return False
        
        agent.complete_job(success, processing_time_ms)
        logger.debug(f"Agent {agent_id} marked idle (success={success})")
        return True
    
    async def get_agent_status(self, agent_id: UUID) -> Optional[Agent]:
        """Get current agent status.
        
        Args:
            agent_id: UUID of agent to query
            
        Returns:
            Agent if found, None otherwise
        """
        return self._agents.get(agent_id)
    
    async def list_agents(
        self,
        game_type: Optional[GameType] = None,
        status: Optional[AgentStatus] = None,
    ) -> List[Agent]:
        """List all agents, optionally filtered by game_type and status.
        
        Args:
            game_type: Optional filter by supported game
            status: Optional filter by agent status
            
        Returns:
            List of matching agents
        """
        agents = list(self._agents.values())
        
        if game_type:
            agents = [a for a in agents if game_type in a.capabilities.games]
        
        if status:
            agents = [a for a in agents if a.status == status]
        
        return agents
    
    async def get_healthy_agents(self) -> List[Agent]:
        """Get all healthy (responsive) agents.
        
        Returns:
            List of agents with recent heartbeats
        """
        return [a for a in self._agents.values() if a.is_healthy()]
    
    async def _mark_offline(self, agent_id: UUID) -> None:
        """Mark agent as offline due to missed heartbeats.
        
        Args:
            agent_id: UUID of agent to mark offline
        """
        agent = self._agents.get(agent_id)
        if agent:
            agent.status = AgentStatus.OFFLINE
            logger.warning(f"Agent {agent_id} marked offline due to missed heartbeats")
    
    async def update_agent_status(
        self,
        agent_id: UUID,
        status: AgentStatus,
        current_job_id: Optional[UUID] = None,
    ) -> bool:
        """Update agent status.
        
        Args:
            agent_id: UUID of agent to update
            status: New status value
            current_job_id: Optional current job ID
            
        Returns:
            True if agent was found and updated
        """
        agent = self._agents.get(agent_id)
        if not agent:
            return False
        
        agent.status = status
        if current_job_id is not None:
            agent.current_job_id = current_job_id
        
        return True
