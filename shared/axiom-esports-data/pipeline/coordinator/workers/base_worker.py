"""Abstract base class for extraction workers."""

from abc import ABC, abstractmethod
from typing import Optional
import asyncio
import aiohttp
import logging
import os
from uuid import UUID

from pipeline.coordinator.models import (
    ExtractionJob,
    AgentStatus,
    GameType,
    JobStatus,
    AgentCapabilities,
)

logger = logging.getLogger(__name__)


class BaseExtractionWorker(ABC):
    """Abstract base for game-specific extraction workers."""
    
    def __init__(
        self,
        agent_id: Optional[str],
        coordinator_url: str,
        api_key: str,
        name: str = "worker",
    ):
        self.agent_id: Optional[UUID] = UUID(agent_id) if agent_id else None
        self.coordinator_url = coordinator_url.rstrip('/')
        self.api_key = api_key
        self.name = name
        self.game_type: Optional[GameType] = None  # Override in subclass
        self._running = False
        self._current_job: Optional[ExtractionJob] = None
        self._session: Optional[aiohttp.ClientSession] = None
    
    async def run(self):
        """Main worker loop.
        
        1. Register with coordinator
        2. Start heartbeat loop (every 10s)
        3. Fetch work → Process → Report loop
        """
        self._running = True
        
        # Create persistent session
        self._session = aiohttp.ClientSession(
            headers={"Authorization": f"Bearer {self.api_key}"}
        )
        
        try:
            # Register agent
            await self._register()
            if not self.agent_id:
                logger.error("Failed to register agent, shutting down")
                return
            
            logger.info(f"Worker {self.name} registered as agent {self.agent_id}")
            
            # Start heartbeat in background
            heartbeat_task = asyncio.create_task(self._heartbeat_loop())
            
            try:
                while self._running:
                    try:
                        # Fetch work
                        work = await self._fetch_work()
                        
                        if work:
                            self._current_job = work
                            logger.info(f"Processing job {work.id} ({work.game.value})")
                            
                            try:
                                # Process job
                                result = await self.extract(work)
                                
                                # Report completion
                                await self._report_complete(work.id, result)
                                logger.info(f"Completed job {work.id}")
                                
                            except Exception as e:
                                logger.error(f"Extraction failed for job {work.id}: {e}")
                                await self._report_failure(work.id, str(e))
                            finally:
                                self._current_job = None
                        else:
                            # No work available, wait
                            await asyncio.sleep(5)
                            
                    except Exception as e:
                        logger.error(f"Worker error: {e}")
                        await asyncio.sleep(5)
                        
            finally:
                heartbeat_task.cancel()
                try:
                    await heartbeat_task
                except asyncio.CancelledError:
                    pass
        finally:
            await self._session.close()
            self._session = None
    
    def stop(self):
        """Signal worker to stop."""
        logger.info(f"Stopping worker {self.name}")
        self._running = False
    
    @abstractmethod
    async def extract(self, job: ExtractionJob) -> dict:
        """Perform extraction. Must be implemented by subclass.
        
        Args:
            job: Extraction job to process
            
        Returns:
            Dict containing extraction results
        """
        pass
    
    def get_capabilities(self) -> AgentCapabilities:
        """Get agent capabilities. Override in subclass."""
        return AgentCapabilities(
            games=[self.game_type] if self.game_type else [],
            max_concurrent_jobs=1,
        )
    
    async def _register(self):
        """Register with coordinator."""
        if not self._session:
            return
        
        try:
            capabilities = self.get_capabilities()
            data = {
                "name": self.name,
                "capabilities": capabilities.model_dump(),
            }
            
            async with self._session.post(
                f"{self.coordinator_url}/agents/register",
                json=data,
            ) as resp:
                if resp.status == 200:
                    response_data = await resp.json()
                    self.agent_id = UUID(response_data["agent_id"])
                else:
                    logger.error(f"Registration failed: {resp.status}")
        except Exception as e:
            logger.error(f"Registration error: {e}")
    
    async def _heartbeat_loop(self):
        """Send heartbeat every 10 seconds."""
        while self._running:
            try:
                await self._report_heartbeat()
            except Exception as e:
                logger.debug(f"Heartbeat error: {e}")
            await asyncio.sleep(10)
    
    async def _report_heartbeat(self):
        """Send heartbeat to coordinator."""
        if not self._session or not self.agent_id:
            return
        
        try:
            async with self._session.post(
                f"{self.coordinator_url}/agents/{self.agent_id}/heartbeat",
            ) as resp:
                return await resp.json()
        except Exception as e:
            logger.debug(f"Heartbeat request failed: {e}")
    
    async def _fetch_work(self) -> Optional[ExtractionJob]:
        """Fetch next job from coordinator."""
        if not self._session or not self.agent_id:
            return None
        
        try:
            async with self._session.get(
                f"{self.coordinator_url}/agents/{self.agent_id}/work",
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if data:
                        return ExtractionJob(**data)
                return None
        except Exception as e:
            logger.debug(f"Fetch work failed: {e}")
            return None
    
    async def _report_complete(self, job_id: UUID, result: dict):
        """Report job completion.
        
        Args:
            job_id: Completed job ID
            result: Extraction results
        """
        if not self._session:
            return
        
        try:
            async with self._session.post(
                f"{self.coordinator_url}/jobs/{job_id}/complete",
                json=result,
            ) as resp:
                return await resp.json()
        except Exception as e:
            logger.error(f"Failed to report completion: {e}")
    
    async def _report_failure(self, job_id: UUID, error: str):
        """Report job failure.
        
        Args:
            job_id: Failed job ID
            error: Error message
        """
        if not self._session:
            return
        
        try:
            async with self._session.post(
                f"{self.coordinator_url}/jobs/{job_id}/fail",
                json={"error": error},
            ) as resp:
                return await resp.json()
        except Exception as e:
            logger.error(f"Failed to report failure: {e}")
