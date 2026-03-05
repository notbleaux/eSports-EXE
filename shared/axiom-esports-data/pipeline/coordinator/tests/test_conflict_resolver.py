"""Tests for conflict_resolver module."""

import pytest
from uuid import uuid4

from pipeline.coordinator.conflict_resolver import ConflictResolver
from pipeline.coordinator.models import (
    ExtractionJob,
    GameType,
    JobConfig,
    DataSource,
    JobPriority,
    ConflictStatus,
    ConflictType,
)


@pytest.fixture
def resolver():
    return ConflictResolver()


@pytest.fixture
def cs_job():
    return ExtractionJob(
        game=GameType.CS,
        priority=JobPriority.NORMAL,
        config=JobConfig(match_id="match-123", source=DataSource.HLTV),
    )


@pytest.fixture
def val_job():
    return ExtractionJob(
        game=GameType.VALORANT,
        priority=JobPriority.NORMAL,
        config=JobConfig(match_id="match-456", source=DataSource.VLR_GG),
    )


class TestDuplicateDetection:
    """Test duplicate job detection."""
    
    async def test_no_duplicate_for_new_job(self, resolver, cs_job):
        """Test that new jobs are not duplicates."""
        duplicate = await resolver.check_duplicate(cs_job)
        assert duplicate is None
    
    async def test_duplicate_detection(self, resolver, cs_job):
        """Test detecting duplicate jobs."""
        # Register first job
        await resolver.register_job(cs_job)
        
        # Create identical job
        duplicate_job = ExtractionJob(
            game=GameType.CS,
            priority=JobPriority.HIGH,  # Different priority, same match
            config=JobConfig(match_id="match-123", source=DataSource.HLTV),
        )
        
        duplicate = await resolver.check_duplicate(duplicate_job)
        assert duplicate == cs_job.id
    
    async def test_no_duplicate_different_games(self, resolver, cs_job, val_job):
        """Test that same match_id different games are not duplicates."""
        # Register CS job
        await resolver.register_job(cs_job)
        
        # Create Valorant job with same match_id
        val_job.config.match_id = cs_job.config.match_id
        
        duplicate = await resolver.check_duplicate(val_job)
        assert duplicate is None
    
    async def test_no_duplicate_no_match_id(self, resolver):
        """Test jobs without match_id are not duplicates."""
        job = ExtractionJob(
            game=GameType.CS,
            priority=JobPriority.NORMAL,
            config=JobConfig(source=DataSource.HLTV),  # No match_id
        )
        
        duplicate = await resolver.check_duplicate(job)
        assert duplicate is None
    
    async def test_register_job_without_match_id(self, resolver):
        """Test registering job without match_id returns empty string."""
        job = ExtractionJob(
            game=GameType.CS,
            priority=JobPriority.NORMAL,
            config=JobConfig(source=DataSource.HLTV),
        )
        
        hash_value = await resolver.register_job(job)
        assert hash_value == ""


class TestDriftDetection:
    """Test content drift detection."""
    
    async def test_no_drift_identical_data(self, resolver):
        """Test no drift for identical data."""
        old_data = {"kills": 20, "deaths": 15, "assists": 5}
        new_data = {"kills": 20, "deaths": 15, "assists": 5}
        
        report = await resolver.detect_drift(old_data, new_data)
        
        assert report["has_drift"] is False
        assert report["change_count"] == 0
        assert len(report["changes"]) == 0
    
    async def test_drift_different_values(self, resolver):
        """Test drift detection for changed values."""
        old_data = {"kills": 20, "deaths": 15, "assists": 5}
        new_data = {"kills": 22, "deaths": 15, "assists": 7}
        
        report = await resolver.detect_drift(old_data, new_data)
        
        assert report["has_drift"] is True
        assert report["change_count"] == 2
        
        changes = {c["field"]: c for c in report["changes"]}
        assert "kills" in changes
        assert changes["kills"]["old"] == 20
        assert changes["kills"]["new"] == 22
    
    async def test_drift_new_fields(self, resolver):
        """Test drift detection for new fields."""
        old_data = {"kills": 20, "deaths": 15}
        new_data = {"kills": 20, "deaths": 15, "rating": 1.2}
        
        report = await resolver.detect_drift(old_data, new_data)
        
        assert report["has_drift"] is True
        
        changes = {c["field"]: c for c in report["changes"]}
        assert "rating" in changes
        assert changes["rating"]["old"] is None
        assert changes["rating"]["new"] == 1.2
    
    async def test_drift_removed_fields(self, resolver):
        """Test drift detection for removed fields."""
        old_data = {"kills": 20, "deaths": 15, "rating": 1.2}
        new_data = {"kills": 20, "deaths": 15}
        
        report = await resolver.detect_drift(old_data, new_data)
        
        assert report["has_drift"] is True
        
        changes = {c["field"]: c for c in report["changes"]}
        assert "rating" in changes
        assert changes["rating"]["old"] == 1.2
        assert changes["rating"]["new"] is None


class TestConflictResolution:
    """Test conflict resolution."""
    
    async def test_resolve_conflict(self, resolver):
        """Test basic conflict resolution."""
        job_id1 = uuid4()
        job_id2 = uuid4()
        
        result = await resolver.resolve_conflict(job_id1, job_id2)
        
        # Currently returns first job as default
        assert result == job_id1
    
    async def test_create_conflict(self, resolver):
        """Test creating conflict record."""
        conflict = await resolver.create_conflict(
            game=GameType.CS,
            source_a=DataSource.HLTV,
            source_b=DataSource.GRID_OPENACCESS,
            record_id_a="record-1",
            record_id_b="record-2",
            field_differences={"kills": (20, 22)},
            severity="medium",
        )
        
        assert conflict.game == GameType.CS
        assert conflict.conflict_type == ConflictType.CONTENT_DRIFT
        assert conflict.source_a == DataSource.HLTV
        assert conflict.source_b == DataSource.GRID_OPENACCESS
        assert conflict.status == ConflictStatus.OPEN
        assert conflict.severity == "medium"
    
    async def test_get_conflict(self, resolver):
        """Test retrieving conflict by ID."""
        conflict = await resolver.create_conflict(
            game=GameType.VALORANT,
            source_a=DataSource.VLR_GG,
            source_b=DataSource.RIOT_API,
            record_id_a="record-1",
            record_id_b="record-2",
            field_differences={},
        )
        
        retrieved = await resolver.get_conflict(conflict.id)
        
        assert retrieved is not None
        assert retrieved.id == conflict.id
    
    async def test_get_conflict_not_found(self, resolver):
        """Test retrieving non-existent conflict."""
        retrieved = await resolver.get_conflict(uuid4())
        assert retrieved is None
    
    async def test_list_conflicts(self, resolver):
        """Test listing conflicts."""
        # Create conflicts
        await resolver.create_conflict(
            game=GameType.CS,
            source_a=DataSource.HLTV,
            source_b=DataSource.GRID_OPENACCESS,
            record_id_a="r1",
            record_id_b="r2",
            field_differences={},
        )
        await resolver.create_conflict(
            game=GameType.VALORANT,
            source_a=DataSource.VLR_GG,
            source_b=DataSource.RIOT_API,
            record_id_a="r3",
            record_id_b="r4",
            field_differences={},
        )
        
        all_conflicts = await resolver.list_conflicts()
        assert len(all_conflicts) == 2
        
        cs_conflicts = await resolver.list_conflicts(game=GameType.CS)
        assert len(cs_conflicts) == 1
        assert cs_conflicts[0].game == GameType.CS
    
    async def test_list_conflicts_by_status(self, resolver):
        """Test filtering conflicts by status."""
        conflict = await resolver.create_conflict(
            game=GameType.CS,
            source_a=DataSource.HLTV,
            source_b=DataSource.GRID_OPENACCESS,
            record_id_a="r1",
            record_id_b="r2",
            field_differences={},
        )
        
        open_conflicts = await resolver.list_conflicts(status=ConflictStatus.OPEN)
        assert len(open_conflicts) == 1
        
        # Resolve conflict
        await resolver.resolve_conflict_record(conflict.id, "Use source A", "admin")
        
        resolved_conflicts = await resolver.list_conflicts(status=ConflictStatus.RESOLVED)
        assert len(resolved_conflicts) == 1
    
    async def test_resolve_conflict_record(self, resolver):
        """Test resolving a conflict."""
        conflict = await resolver.create_conflict(
            game=GameType.CS,
            source_a=DataSource.HLTV,
            source_b=DataSource.GRID_OPENACCESS,
            record_id_a="r1",
            record_id_b="r2",
            field_differences={},
        )
        
        success = await resolver.resolve_conflict_record(
            conflict.id,
            "Use HLTV data - more reliable",
            "admin",
        )
        
        assert success is True
        
        resolved = await resolver.get_conflict(conflict.id)
        assert resolved.status == ConflictStatus.RESOLVED
        assert resolved.resolution == "Use HLTV data - more reliable"
        assert resolved.resolved_by == "admin"
        assert resolved.resolved_at is not None
    
    async def test_resolve_conflict_not_found(self, resolver):
        """Test resolving non-existent conflict."""
        success = await resolver.resolve_conflict_record(
            uuid4(),
            "resolution",
            "admin",
        )
        
        assert success is False


class TestJobHash:
    """Test job hash generation."""
    
    async def test_hash_consistency(self, resolver):
        """Test that hash is consistent for same inputs."""
        hash1 = resolver._generate_job_hash("match-123", GameType.CS)
        hash2 = resolver._generate_job_hash("match-123", GameType.CS)
        
        assert hash1 == hash2
        assert len(hash1) == 16
    
    async def test_hash_uniqueness(self, resolver):
        """Test that different inputs produce different hashes."""
        hash_cs = resolver._generate_job_hash("match-123", GameType.CS)
        hash_val = resolver._generate_job_hash("match-123", GameType.VALORANT)
        hash_diff = resolver._generate_job_hash("match-456", GameType.CS)
        
        assert hash_cs != hash_val
        assert hash_cs != hash_diff
        assert hash_val != hash_diff
