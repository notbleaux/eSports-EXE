"""Tests for agent_manager module."""

import pytest
from datetime import datetime, timedelta
from uuid import uuid4

from pipeline.coordinator.agent_manager import AgentManager
from pipeline.coordinator.models import (
    AgentCapabilities,
    AgentStatus,
    GameType,
    ExtractionJob,
    JobConfig,
    DataSource,
    JobPriority,
)


class MockQueueManager:
    """Mock queue manager for testing."""
    
    def __init__(self):
        self.jobs = []
    
    async def dequeue(self, game: GameType):
        for job in self.jobs:
            if job.game == game and job.status.value == "pending":
                return job
        return None


@pytest.fixture
def queue_manager():
    return MockQueueManager()


@pytest.fixture
def agent_manager(queue_manager):
    return AgentManager(queue_manager)


@pytest.fixture
def cs_capabilities():
    return AgentCapabilities(
        games=[GameType.CS],
        max_concurrent_jobs=1,
    )


@pytest.fixture
def dual_capabilities():
    return AgentCapabilities(
        games=[GameType.CS, GameType.VALORANT],
        max_concurrent_jobs=2,
    )


class TestAgentRegistration:
    """Test agent registration functionality."""
    
    async def test_register_agent(self, agent_manager, cs_capabilities):
        """Test basic agent registration."""
        agent = await agent_manager.register_agent(
            name="test-agent-1",
            capabilities=cs_capabilities,
        )
        
        assert agent.name == "test-agent-1"
        assert agent.status == AgentStatus.IDLE
        assert GameType.CS in agent.capabilities.games
        assert agent.id is not None
    
    async def test_register_agent_with_host(self, agent_manager, cs_capabilities):
        """Test agent registration with host/port."""
        agent = await agent_manager.register_agent(
            name="test-agent-2",
            capabilities=cs_capabilities,
            host="192.168.1.100",
            port=8080,
            version="1.0.0",
        )
        
        assert agent.host == "192.168.1.100"
        assert agent.port == 8080
        assert agent.version == "1.0.0"
    
    async def test_deregister_agent(self, agent_manager, cs_capabilities):
        """Test agent deregistration."""
        agent = await agent_manager.register_agent(
            name="test-agent",
            capabilities=cs_capabilities,
        )
        
        success = await agent_manager.deregister_agent(agent.id)
        assert success is True
        
        # Verify agent is offline
        status = await agent_manager.get_agent_status(agent.id)
        assert status.status == AgentStatus.OFFLINE
    
    async def test_deregister_unknown_agent(self, agent_manager):
        """Test deregistration of non-existent agent."""
        success = await agent_manager.deregister_agent(uuid4())
        assert success is False


class TestAgentHeartbeat:
    """Test agent heartbeat functionality."""
    
    async def test_healthy_heartbeat(self, agent_manager, cs_capabilities):
        """Test heartbeat from healthy agent."""
        agent = await agent_manager.register_agent(
            name="test-agent",
            capabilities=cs_capabilities,
        )
        
        healthy = await agent_manager.heartbeat(agent.id)
        assert healthy is True
    
    async def test_heartbeat_unknown_agent(self, agent_manager):
        """Test heartbeat from unknown agent."""
        healthy = await agent_manager.heartbeat(uuid4())
        assert healthy is False
    
    async def test_heartbeat_timeout(self, agent_manager, cs_capabilities):
        """Test heartbeat detection of stale agent."""
        agent = await agent_manager.register_agent(
            name="test-agent",
            capabilities=cs_capabilities,
            heartbeat_interval_seconds=1,
        )
        
        # Simulate missed heartbeats by manipulating last_heartbeat
        agent.last_heartbeat = datetime.utcnow() - timedelta(seconds=10)
        
        healthy = await agent_manager.heartbeat(agent.id)
        assert healthy is False
        
        # Verify agent marked offline
        status = await agent_manager.get_agent_status(agent.id)
        assert status.status == AgentStatus.OFFLINE


class TestWorkAssignment:
    """Test work assignment functionality."""
    
    async def test_assign_work_cs_agent(self, agent_manager, queue_manager, cs_capabilities):
        """Test work assignment for CS agent."""
        agent = await agent_manager.register_agent(
            name="cs-agent",
            capabilities=cs_capabilities,
        )
        
        # Add a CS job to queue
        job = ExtractionJob(
            game=GameType.CS,
            priority=JobPriority.NORMAL,
            config=JobConfig(match_id="12345", source=DataSource.HLTV),
        )
        queue_manager.jobs.append(job)
        
        # Assign work
        assigned = await agent_manager.assign_work(agent.id)
        
        assert assigned is not None
        assert assigned.game == GameType.CS
        assert agent.status == AgentStatus.BUSY
    
    async def test_assign_work_no_matching_jobs(self, agent_manager, queue_manager, cs_capabilities):
        """Test work assignment when no matching jobs available."""
        agent = await agent_manager.register_agent(
            name="cs-agent",
            capabilities=cs_capabilities,
        )
        
        # Add a Valorant job only
        job = ExtractionJob(
            game=GameType.VALORANT,
            priority=JobPriority.NORMAL,
            config=JobConfig(match_id="12345", source=DataSource.VLR_GG),
        )
        queue_manager.jobs.append(job)
        
        # Try to assign work
        assigned = await agent_manager.assign_work(agent.id)
        
        assert assigned is None
    
    async def test_assign_work_busy_agent(self, agent_manager, cs_capabilities):
        """Test work assignment to busy agent."""
        agent = await agent_manager.register_agent(
            name="cs-agent",
            capabilities=cs_capabilities,
        )
        
        # Mark agent as busy
        await agent_manager.mark_busy(agent.id, uuid4())
        
        # Try to assign work
        assigned = await agent_manager.assign_work(agent.id)
        
        assert assigned is None
    
    async def test_mark_idle(self, agent_manager, cs_capabilities):
        """Test marking agent as idle."""
        agent = await agent_manager.register_agent(
            name="cs-agent",
            capabilities=cs_capabilities,
        )
        
        # Mark busy then idle
        await agent_manager.mark_busy(agent.id, uuid4())
        success = await agent_manager.mark_idle(agent.id, success=True, processing_time_ms=1000)
        
        assert success is True
        assert agent.status == AgentStatus.IDLE
        assert agent.total_jobs_completed == 1
        assert agent.avg_processing_time_ms == 1000.0


class TestAgentListing:
    """Test agent listing functionality."""
    
    async def test_list_all_agents(self, agent_manager, dual_capabilities):
        """Test listing all agents."""
        await agent_manager.register_agent(
            name="agent-1",
            capabilities=dual_capabilities,
        )
        await agent_manager.register_agent(
            name="agent-2",
            capabilities=dual_capabilities,
        )
        
        agents = await agent_manager.list_agents()
        assert len(agents) == 2
    
    async def test_list_agents_by_game(self, agent_manager, cs_capabilities, dual_capabilities):
        """Test filtering agents by game."""
        await agent_manager.register_agent(
            name="cs-agent",
            capabilities=cs_capabilities,
        )
        await agent_manager.register_agent(
            name="dual-agent",
            capabilities=dual_capabilities,
        )
        
        cs_agents = await agent_manager.list_agents(game_type=GameType.CS)
        assert len(cs_agents) == 2
        
        val_agents = await agent_manager.list_agents(game_type=GameType.VALORANT)
        assert len(val_agents) == 1
    
    async def test_list_agents_by_status(self, agent_manager, cs_capabilities):
        """Test filtering agents by status."""
        agent = await agent_manager.register_agent(
            name="cs-agent",
            capabilities=cs_capabilities,
        )
        await agent_manager.mark_busy(agent.id, uuid4())
        
        idle_agents = await agent_manager.list_agents(status=AgentStatus.IDLE)
        busy_agents = await agent_manager.list_agents(status=AgentStatus.BUSY)
        
        assert len(idle_agents) == 0
        assert len(busy_agents) == 1
