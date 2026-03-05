"""Tests for main FastAPI application."""

import pytest
from httpx import AsyncClient
from uuid import UUID

from pipeline.coordinator.main import app, queue_manager, agent_manager, conflict_resolver
from pipeline.coordinator.models import (
    GameType,
    JobPriority,
    JobConfig,
    DataSource,
    AgentCapabilities,
)


@pytest.fixture
async def client():
    """Create test client."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


class TestRootEndpoint:
    """Test root endpoint."""
    
    async def test_root(self, client):
        """Test root endpoint returns API info."""
        response = await client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "SATOR Pipeline Coordinator"
        assert "version" in data
        assert "endpoints" in data


class TestJobEndpoints:
    """Test job-related endpoints."""
    
    async def test_submit_job(self, client):
        """Test submitting a new job."""
        job_request = {
            "game": "cs",
            "priority": "NORMAL",
            "config": {
                "match_id": "12345",
                "source": "hltv",
            }
        }
        
        response = await client.post("/jobs/submit", json=job_request)
        
        assert response.status_code == 200
        data = response.json()
        assert "job_id" in data
        assert data["status"] == "pending"
        assert data["message"] == "Job submitted successfully"
    
    async def test_submit_duplicate_job(self, client):
        """Test submitting duplicate job detection."""
        job_request = {
            "game": "cs",
            "priority": "NORMAL",
            "config": {
                "match_id": "duplicate-test",
                "source": "hltv",
            }
        }
        
        # Submit first job
        response1 = await client.post("/jobs/submit", json=job_request)
        assert response1.status_code == 200
        first_job_id = response1.json()["job_id"]
        
        # Submit duplicate
        response2 = await client.post("/jobs/submit", json=job_request)
        
        assert response2.status_code == 200
        data = response2.json()
        assert data["status"] == "duplicate"
        assert data["job_id"] == first_job_id
    
    async def test_submit_batch(self, client):
        """Test submitting a batch of jobs."""
        batch_request = {
            "game": "valorant",
            "priority": "HIGH",
            "configs": [
                {"match_id": "match-1", "source": "vlr_gg"},
                {"match_id": "match-2", "source": "vlr_gg"},
                {"match_id": "match-3", "source": "vlr_gg"},
            ],
            "description": "Test batch",
        }
        
        response = await client.post("/jobs/submit-batch", json=batch_request)
        
        assert response.status_code == 200
        data = response.json()
        assert "batch_id" in data
        assert data["job_count"] == 3
        assert data["status"] == "submitted"
    
    async def test_get_job_status_not_found(self, client):
        """Test getting status of non-existent job."""
        response = await client.get("/jobs/invalid-uuid/status")
        
        assert response.status_code == 400
        assert "Invalid job ID" in response.json()["detail"]
    
    async def test_get_job_status_unknown(self, client):
        """Test getting status of unknown job."""
        response = await client.get(f"/jobs/12345678-1234-1234-1234-123456789abc/status")
        
        assert response.status_code == 404


class TestAgentEndpoints:
    """Test agent-related endpoints."""
    
    async def test_register_agent(self, client):
        """Test agent registration."""
        agent_request = {
            "name": "test-agent",
            "capabilities": {
                "games": ["cs"],
                "max_concurrent_jobs": 1,
            }
        }
        
        response = await client.post("/agents/register", json=agent_request)
        
        assert response.status_code == 200
        data = response.json()
        assert "agent_id" in data
        assert data["status"] == "idle"
    
    async def test_agent_heartbeat_unknown(self, client):
        """Test heartbeat from unknown agent."""
        response = await client.post("/agents/invalid-uuid/heartbeat")
        
        assert response.status_code == 400
    
    async def test_get_work_unknown_agent(self, client):
        """Test getting work for unknown agent."""
        response = await client.get("/agents/invalid-uuid/work")
        
        assert response.status_code == 400
    
    async def test_list_agents(self, client):
        """Test listing agents."""
        # Register an agent first
        await client.post("/agents/register", json={
            "name": "list-test-agent",
            "capabilities": {"games": ["cs", "valorant"]},
        })
        
        response = await client.get("/agents")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
    
    async def test_list_agents_by_game(self, client):
        """Test filtering agents by game."""
        response = await client.get("/agents?game=cs")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestHealthEndpoint:
    """Test health check endpoint."""
    
    async def test_health_check(self, client):
        """Test health endpoint returns status."""
        response = await client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] in ["healthy", "degraded", "unhealthy"]
        assert "details" in data


class TestMetricsEndpoint:
    """Test metrics endpoint."""
    
    async def test_get_metrics(self, client):
        """Test metrics endpoint returns stats."""
        response = await client.get("/metrics")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "queues" in data
        assert "agents" in data
        
        # Check queue structure
        for game in ["cs", "valorant"]:
            assert game in data["queues"]
            assert "pending" in data["queues"][game]
            assert "processing" in data["queues"][game]
            assert "health" in data["queues"][game]
        
        # Check agent structure
        assert "total" in data["agents"]
        assert "by_game" in data["agents"]
        assert "by_status" in data["agents"]
        assert "healthy" in data["agents"]


class TestEndToEnd:
    """End-to-end workflow tests."""
    
    async def test_full_workflow(self, client):
        """Test complete job submission and agent workflow."""
        # 1. Register an agent
        agent_response = await client.post("/agents/register", json={
            "name": "e2e-test-agent",
            "capabilities": {"games": ["cs"]},
        })
        assert agent_response.status_code == 200
        agent_id = agent_response.json()["agent_id"]
        
        # 2. Submit a job
        job_response = await client.post("/jobs/submit", json={
            "game": "cs",
            "priority": "NORMAL",
            "config": {"match_id": "e2e-match", "source": "hltv"},
        })
        assert job_response.status_code == 200
        job_id = job_response.json()["job_id"]
        
        # 3. Agent heartbeat
        heartbeat_response = await client.post(f"/agents/{agent_id}/heartbeat")
        assert heartbeat_response.status_code == 200
        
        # 4. Get work (should assign the job)
        work_response = await client.get(f"/agents/{agent_id}/work")
        # May or may not have work depending on timing
        
        # 5. Check job status
        status_response = await client.get(f"/jobs/{job_id}/status")
        assert status_response.status_code == 200
