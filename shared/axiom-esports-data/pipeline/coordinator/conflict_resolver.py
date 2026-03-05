"""Duplicate detection and conflict resolution for pipeline jobs."""

from typing import Optional, Dict, List, Any
import hashlib
import logging
from datetime import datetime
from uuid import UUID

from pipeline.coordinator.models import (
    ExtractionJob,
    GameType,
    JobStatus,
    ExtractionConflict,
    ConflictType,
    ConflictStatus,
    DataSource,
)

logger = logging.getLogger(__name__)


class ConflictResolver:
    """Handles duplicate job detection and content drift analysis."""
    
    def __init__(self):
        self._job_hashes: Dict[str, UUID] = {}  # hash -> job_id
        self._conflicts: Dict[UUID, ExtractionConflict] = {}
    
    def _generate_job_hash(self, match_id: str, game_type: GameType) -> str:
        """Generate unique hash for job identification.
        
        Args:
            match_id: Match identifier
            game_type: Game type (CS/Valorant)
            
        Returns:
            16-character hex hash string
        """
        content = f"{match_id}:{game_type.value}"
        return hashlib.sha256(content.encode()).hexdigest()[:16]
    
    async def check_duplicate(self, job: ExtractionJob) -> Optional[UUID]:
        """Check if job duplicates existing or pending work.
        
        Args:
            job: New job to check
            
        Returns:
            Existing job_id if duplicate found, None if unique
        """
        match_id = job.config.match_id
        if not match_id:
            return None
        
        job_hash = self._generate_job_hash(match_id, job.game)
        existing_id = self._job_hashes.get(job_hash)
        
        if existing_id:
            logger.debug(f"Found duplicate job: {existing_id} for match {match_id}")
            return existing_id
        
        return None
    
    async def register_job(self, job: ExtractionJob) -> str:
        """Register a job hash for duplicate tracking.
        
        Args:
            job: Job to register
            
        Returns:
            The job hash that was registered
        """
        match_id = job.config.match_id
        if match_id:
            job_hash = self._generate_job_hash(match_id, job.game)
            self._job_hashes[job_hash] = job.id
            return job_hash
        return ""
    
    async def detect_drift(self, old_data: dict, new_data: dict) -> Dict[str, Any]:
        """Detect content drift between old and new extraction.
        
        Args:
            old_data: Previous extraction data
            new_data: New extraction data
            
        Returns:
            Drift report with changed fields
        """
        changes = []
        all_keys = set(old_data.keys()) | set(new_data.keys())
        
        for key in all_keys:
            old_val = old_data.get(key)
            new_val = new_data.get(key)
            
            if old_val != new_val:
                changes.append({
                    "field": key,
                    "old": old_val,
                    "new": new_val
                })
        
        return {
            "has_drift": len(changes) > 0,
            "changes": changes,
            "change_count": len(changes)
        }
    
    async def resolve_conflict(self, job_id1: UUID, job_id2: UUID) -> UUID:
        """Resolve conflict between competing jobs.
        
        Strategy: Keep higher priority, or more recent if same priority
        
        Args:
            job_id1: First job ID
            job_id2: Second job ID
            
        Returns:
            job_id to keep (other will be cancelled)
        """
        # This would normally query a database for job details
        # For now, return the first one as default
        logger.info(f"Resolving conflict between jobs {job_id1} and {job_id2}")
        return job_id1
    
    async def create_conflict(
        self,
        game: GameType,
        source_a: DataSource,
        source_b: DataSource,
        record_id_a: str,
        record_id_b: str,
        field_differences: Dict[str, tuple],
        severity: str = "medium",
    ) -> ExtractionConflict:
        """Create a new conflict record.
        
        Args:
            game: Game type
            source_a: First data source
            source_b: Second data source
            record_id_a: First record ID
            record_id_b: Second record ID
            field_differences: Dict of field differences
            severity: Conflict severity (low/medium/high/critical)
            
        Returns:
            Created conflict record
        """
        conflict = ExtractionConflict(
            game=game,
            conflict_type=ConflictType.CONTENT_DRIFT,
            source_a=source_a,
            source_b=source_b,
            record_id_a=record_id_a,
            record_id_b=record_id_b,
            field_differences=field_differences,
            severity=severity,
        )
        
        self._conflicts[conflict.id] = conflict
        logger.info(f"Created conflict {conflict.id} between {source_a.value} and {source_b.value}")
        return conflict
    
    async def get_conflict(self, conflict_id: UUID) -> Optional[ExtractionConflict]:
        """Get a conflict by ID.
        
        Args:
            conflict_id: UUID of conflict
            
        Returns:
            Conflict if found, None otherwise
        """
        return self._conflicts.get(conflict_id)
    
    async def list_conflicts(
        self,
        status: Optional[ConflictStatus] = None,
        game: Optional[GameType] = None,
    ) -> List[ExtractionConflict]:
        """List conflicts with optional filtering.
        
        Args:
            status: Optional status filter
            game: Optional game filter
            
        Returns:
            List of matching conflicts
        """
        conflicts = list(self._conflicts.values())
        
        if status:
            conflicts = [c for c in conflicts if c.status == status]
        
        if game:
            conflicts = [c for c in conflicts if c.game == game]
        
        return conflicts
    
    async def resolve_conflict_record(
        self,
        conflict_id: UUID,
        resolution: str,
        resolver: str,
    ) -> bool:
        """Mark a conflict as resolved.
        
        Args:
            conflict_id: UUID of conflict
            resolution: Resolution description
            resolver: Who resolved the conflict
            
        Returns:
            True if conflict was found and resolved
        """
        conflict = self._conflicts.get(conflict_id)
        if not conflict:
            return False
        
        conflict.resolve(resolution, resolver)
        logger.info(f"Resolved conflict {conflict_id}: {resolution}")
        return True
