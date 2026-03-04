"""
Pydantic models for the dual-game pipeline coordinator.

Defines data structures for extraction jobs, agents, batches, and configuration.
All models use Pydantic v2 for validation and serialization.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum, StrEnum
from typing import Any, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field, field_validator


# =============================================================================
# Enums
# =============================================================================

class GameType(StrEnum):
    """Supported esports games."""
    CS = "cs"
    VALORANT = "valorant"


class JobStatus(StrEnum):
    """Status values for extraction jobs."""
    PENDING = "pending"
    ASSIGNED = "assigned"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    RETRYING = "retrying"


class AgentStatus(StrEnum):
    """Status values for extraction agents."""
    IDLE = "idle"
    BUSY = "busy"
    OFFLINE = "offline"
    DEGRADED = "degraded"
    MAINTENANCE = "maintenance"


class JobPriority(Enum):
    """Priority levels for job scheduling."""
    CRITICAL = 0   # Real-time data, blocking operations
    HIGH = 1       # High-value tournaments, recent matches
    NORMAL = 2     # Standard scheduled extractions
    LOW = 3        # Backfill, historical data
    BACKGROUND = 4 # Maintenance, cleanup tasks


class ConflictType(StrEnum):
    """Types of data conflicts detected."""
    DUPLICATE = "duplicate"
    CONTENT_DRIFT = "content_drift"
    VERSION_MISMATCH = "version_mismatch"
    SCHEMA_VIOLATION = "schema_violation"


class ConflictStatus(StrEnum):
    """Resolution status for conflicts."""
    OPEN = "open"
    RESOLVED = "resolved"
    IGNORED = "ignored"
    PENDING_REVIEW = "pending_review"


class DataSource(StrEnum):
    """Supported data sources."""
    VLR_GG = "vlr_gg"
    HLTV = "hltv"
    RIOT_API = "riot_api"
    STEAM_API = "steam_api"
    KAGGLE = "kaggle"
    GRID_OPENACCESS = "grid_openaccess"
    MANUAL = "manual"
    UNKNOWN = "unknown"


# =============================================================================
# Base Models
# =============================================================================

class TimestampMixin(BaseModel):
    """Mixin for timestamp tracking."""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(json_encoders={datetime: lambda v: v.isoformat()})


# =============================================================================
# Job Models
# =============================================================================

class JobConfig(BaseModel):
    """Configuration for an extraction job."""
    source: DataSource = Field(default=DataSource.UNKNOWN)
    job_type: str = Field(default="extract")
    region: Optional[str] = None
    epoch: Optional[str] = None  # e.g., "2024-Q1", "v2024.01"
    tournament_id: Optional[str] = None
    match_id: Optional[str] = None
    player_ids: list[str] = Field(default_factory=list)
    extra_params: dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(extra="forbid")


class ExtractionJob(BaseModel):
    """
    Represents a single extraction job in the pipeline.
    
    Jobs are game-isolated to prevent resource contention between
    Counter-Strike and Valorant extraction processes.
    """
    id: UUID = Field(default_factory=uuid4)
    game: GameType
    priority: JobPriority = Field(default=JobPriority.NORMAL)
    status: JobStatus = Field(default=JobStatus.PENDING)
    config: JobConfig = Field(default_factory=JobConfig)
    
    # Assignment tracking
    assigned_agent: Optional[UUID] = None
    assigned_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    
    # Retry handling
    retry_count: int = Field(default=0, ge=0)
    max_retries: int = Field(default=3, ge=0, le=10)
    
    # Result tracking
    result: Optional[dict[str, Any]] = None
    error_message: Optional[str] = None
    error_code: Optional[str] = None
    
    # Timing
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Internal tracking
    _processing_time_ms: Optional[int] = None
    
    model_config = ConfigDict(
        extra="forbid",
        json_encoders={
            datetime: lambda v: v.isoformat() if v else None,
            UUID: lambda v: str(v),
            JobPriority: lambda v: v.value,
        }
    )

    @field_validator("priority", mode="before")
    @classmethod
    def validate_priority(cls, v: Any) -> JobPriority:
        """Ensure priority is a valid JobPriority enum."""
        if isinstance(v, int):
            return JobPriority(v)
        if isinstance(v, str):
            return JobPriority[v.upper()]
        return v

    def to_queue_key(self) -> tuple[int, datetime, UUID]:
        """
        Generate a sortable queue key for priority ordering.
        
        Returns tuple of (priority_value, created_at, job_id) for
        stable sorting with FIFO tie-breaking.
        """
        return (self.priority.value, self.created_at, self.id)

    def is_retryable(self) -> bool:
        """Check if job can be retried."""
        return self.retry_count < self.max_retries and self.status == JobStatus.FAILED

    def mark_assigned(self, agent_id: UUID) -> None:
        """Mark job as assigned to an agent."""
        self.assigned_agent = agent_id
        self.assigned_at = datetime.utcnow()
        self.status = JobStatus.ASSIGNED

    def mark_started(self) -> None:
        """Mark job as started."""
        self.started_at = datetime.utcnow()
        self.status = JobStatus.PROCESSING

    def mark_completed(self, result: dict[str, Any]) -> None:
        """Mark job as completed with result."""
        self.status = JobStatus.COMPLETED
        self.completed_at = datetime.utcnow()
        self.result = result
        if self.started_at:
            self._processing_time_ms = int(
                (self.completed_at - self.started_at).total_seconds() * 1000
            )

    def mark_failed(self, error: str, code: Optional[str] = None) -> None:
        """Mark job as failed with error details."""
        self.status = JobStatus.FAILED
        self.error_message = error
        self.error_code = code
        self.retry_count += 1
        if self.is_retryable():
            self.status = JobStatus.RETRYING


class JobBatch(BaseModel):
    """
    A batch of extraction jobs submitted together.
    
    Batches allow atomic operations and coordinated processing.
    """
    id: UUID = Field(default_factory=uuid4)
    game: GameType
    jobs: list[ExtractionJob] = Field(default_factory=list)
    priority: JobPriority = Field(default=JobPriority.NORMAL)
    
    # Metadata
    description: Optional[str] = None
    source: DataSource = Field(default=DataSource.UNKNOWN)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Status tracking
    completed_jobs: int = Field(default=0)
    failed_jobs: int = Field(default=0)
    
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat() if v else None,
            UUID: lambda v: str(v),
        }
    )

    def add_job(self, job: ExtractionJob) -> None:
        """Add a job to the batch, ensuring game consistency."""
        if job.game != self.game:
            raise ValueError(
                f"Cannot add {job.game.value} job to {self.game.value} batch"
            )
        job.priority = self.priority  # Inherit batch priority
        self.jobs.append(job)

    def get_pending_jobs(self) -> list[ExtractionJob]:
        """Get all pending jobs in the batch."""
        return [j for j in self.jobs if j.status == JobStatus.PENDING]

    def is_complete(self) -> bool:
        """Check if all jobs in batch are finished."""
        return all(
            j.status in (JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED)
            for j in self.jobs
        )

    def update_counts(self) -> None:
        """Update completion counters."""
        self.completed_jobs = sum(1 for j in self.jobs if j.status == JobStatus.COMPLETED)
        self.failed_jobs = sum(1 for j in self.jobs if j.status == JobStatus.FAILED)


# =============================================================================
# Agent Models
# =============================================================================

class AgentCapabilities(BaseModel):
    """Capabilities and specializations of an extraction agent."""
    games: list[GameType] = Field(default_factory=list)
    sources: list[DataSource] = Field(default_factory=list)
    max_concurrent_jobs: int = Field(default=1, ge=1, le=10)
    supports_batch: bool = Field(default=False)
    rate_limit_rps: float = Field(default=1.0, ge=0.1)  # Requests per second
    
    model_config = ConfigDict(extra="forbid")


class Agent(BaseModel):
    """
    Represents an extraction agent in the pipeline.
    
    Agents can be specialized by game (CS, Valorant) or be multi-game.
    """
    id: UUID = Field(default_factory=uuid4)
    name: str = Field(..., min_length=1, max_length=100)
    status: AgentStatus = Field(default=AgentStatus.IDLE)
    capabilities: AgentCapabilities = Field(default_factory=AgentCapabilities)
    
    # Current work
    current_job_id: Optional[UUID] = None
    current_batch_id: Optional[UUID] = None
    
    # Heartbeat tracking
    last_heartbeat: datetime = Field(default_factory=datetime.utcnow)
    heartbeat_interval_seconds: int = Field(default=60, ge=10)
    
    # Performance tracking
    total_jobs_completed: int = Field(default=0, ge=0)
    total_jobs_failed: int = Field(default=0, ge=0)
    avg_processing_time_ms: Optional[float] = None
    
    # Connection info
    host: Optional[str] = None
    port: Optional[int] = None
    version: Optional[str] = None
    
    # Timestamps
    registered_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(
        extra="forbid",
        json_encoders={
            datetime: lambda v: v.isoformat() if v else None,
            UUID: lambda v: str(v),
        }
    )

    def is_available(self) -> bool:
        """Check if agent is available to take work."""
        return (
            self.status == AgentStatus.IDLE
            and self.is_healthy()
        )

    def is_healthy(self) -> bool:
        """Check if agent has sent recent heartbeat."""
        if not self.last_heartbeat:
            return False
        seconds_since = (datetime.utcnow() - self.last_heartbeat).total_seconds()
        return seconds_since < (self.heartbeat_interval_seconds * 2)

    def can_process(self, game: GameType) -> bool:
        """Check if agent can process jobs for given game."""
        return game in self.capabilities.games

    def update_heartbeat(self) -> None:
        """Update agent heartbeat timestamp."""
        self.last_heartbeat = datetime.utcnow()

    def assign_job(self, job_id: UUID) -> None:
        """Assign a job to this agent."""
        self.current_job_id = job_id
        self.status = AgentStatus.BUSY

    def complete_job(self, success: bool, processing_time_ms: Optional[int] = None) -> None:
        """Mark current job as completed."""
        if success:
            self.total_jobs_completed += 1
        else:
            self.total_jobs_failed += 1
        
        # Update average processing time
        if processing_time_ms:
            if self.avg_processing_time_ms is None:
                self.avg_processing_time_ms = float(processing_time_ms)
            else:
                # Exponential moving average
                self.avg_processing_time_ms = (
                    0.9 * self.avg_processing_time_ms + 0.1 * processing_time_ms
                )
        
        self.current_job_id = None
        self.status = AgentStatus.IDLE

    def get_success_rate(self) -> float:
        """Calculate agent success rate percentage."""
        total = self.total_jobs_completed + self.total_jobs_failed
        if total == 0:
            return 100.0
        return round((self.total_jobs_completed / total) * 100, 2)


# =============================================================================
# Conflict Models
# =============================================================================

class ExtractionConflict(BaseModel):
    """
    Represents a detected data conflict.
    
    Conflicts are identified during extraction and require resolution.
    """
    id: UUID = Field(default_factory=uuid4)
    conflict_type: ConflictType
    status: ConflictStatus = Field(default=ConflictStatus.OPEN)
    
    # Source information
    game: GameType
    source_a: DataSource
    source_b: DataSource
    record_id_a: str
    record_id_b: str
    
    # Conflict details
    field_differences: dict[str, tuple[Any, Any]] = Field(default_factory=dict)
    severity: str = Field(default="medium")  # low, medium, high, critical
    
    # Resolution
    resolution: Optional[str] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    
    # Timestamps
    detected_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat() if v else None,
            UUID: lambda v: str(v),
        }
    )

    def resolve(self, resolution: str, resolver: str) -> None:
        """Mark conflict as resolved."""
        self.status = ConflictStatus.RESOLVED
        self.resolution = resolution
        self.resolved_by = resolver
        self.resolved_at = datetime.utcnow()


# =============================================================================
# Queue Models
# =============================================================================

class QueueStats(BaseModel):
    """Statistics for a game-specific queue."""
    game: GameType
    pending: int = Field(default=0, ge=0)
    processing: int = Field(default=0, ge=0)
    completed_24h: int = Field(default=0, ge=0)
    failed_24h: int = Field(default=0, ge=0)
    avg_wait_time_seconds: Optional[float] = None
    oldest_job_age_seconds: Optional[float] = None
    
    # Health assessment
    health: str = Field(default="healthy")  # healthy, warning, critical

    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat() if v else None,
        }
    )


class CoordinatorStatus(BaseModel):
    """Overall coordinator status."""
    queues: dict[str, QueueStats] = Field(default_factory=dict)
    agents: list[Agent] = Field(default_factory=list)
    active_conflicts: int = Field(default=0)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat() if v else None,
        }
    )


# =============================================================================
# API Request/Response Models
# =============================================================================

class SubmitJobRequest(BaseModel):
    """Request to submit a new extraction job."""
    game: GameType
    priority: JobPriority = Field(default=JobPriority.NORMAL)
    config: JobConfig = Field(default_factory=JobConfig)

    model_config = ConfigDict(extra="forbid")


class SubmitBatchRequest(BaseModel):
    """Request to submit a batch of jobs."""
    game: GameType
    priority: JobPriority = Field(default=JobPriority.NORMAL)
    configs: list[JobConfig] = Field(default_factory=list)
    description: Optional[str] = None

    @field_validator("configs")
    @classmethod
    def validate_configs_not_empty(cls, v: list[JobConfig]) -> list[JobConfig]:
        """Ensure batch has at least one job config."""
        if not v:
            raise ValueError("Batch must contain at least one job config")
        return v

    model_config = ConfigDict(extra="forbid")


class JobResponse(BaseModel):
    """Response containing job details."""
    job: ExtractionJob
    message: str = Field(default="success")


class BatchResponse(BaseModel):
    """Response containing batch details."""
    batch: JobBatch
    message: str = Field(default="success")


class AgentRegistrationRequest(BaseModel):
    """Request to register a new agent."""
    name: str = Field(..., min_length=1, max_length=100)
    capabilities: AgentCapabilities = Field(default_factory=AgentCapabilities)
    host: Optional[str] = None
    port: Optional[int] = None
    version: Optional[str] = None
    heartbeat_interval_seconds: int = Field(default=60, ge=10)

    model_config = ConfigDict(extra="forbid")


class AgentHeartbeatRequest(BaseModel):
    """Request to update agent heartbeat."""
    agent_id: UUID
    status: Optional[AgentStatus] = None
    current_job_id: Optional[UUID] = None

    model_config = ConfigDict(extra="forbid")


class HealthCheckResponse(BaseModel):
    """Health check response."""
    status: str = Field(default="healthy")  # healthy, degraded, unhealthy
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    details: dict[str, Any] = Field(default_factory=dict)
    
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat() if v else None,
        }
    )
