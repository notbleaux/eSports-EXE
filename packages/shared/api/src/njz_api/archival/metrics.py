"""
Module: njz_api.archival.metrics
Purpose: Prometheus metrics for archival system
Task: AS-7 - Metrics Integration
Date: 2026-03-28

[Ver001.000] - Initial metrics definitions
"""

import logging
from typing import Optional

# Import Prometheus client
try:
    from prometheus_client import CollectorRegistry, Counter, Gauge, Histogram
    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False
    logging.warning("prometheus_client not installed. Metrics will be no-ops.")

logger = logging.getLogger(__name__)


class ArchiveMetrics:
    """Prometheus metrics collector for archival system.
    
    Provides counters, gauges, and histograms for monitoring
    frame uploads, storage, garbage collection, and operations.
    
    Example:
        metrics = ArchiveMetrics()
        metrics.increment_frames_uploaded(5)
        metrics.observe_upload_duration(1.5)
    """
    
    def __init__(self, registry: Optional["CollectorRegistry"] = None):
        """Initialize metrics collector.
        
        Args:
            registry: Optional Prometheus registry to use
        """
        if not PROMETHEUS_AVAILABLE:
            self._noop = True
            return
            
        self._noop = False
        self._registry = registry
        
        # Counters
        self.frames_uploaded_total = Counter(
            "archive_frames_uploaded_total",
            "Total number of frames uploaded",
            ["status"],  # success, deduplicated, error
            registry=registry,
        )
        
        self.frames_deduplicated_total = Counter(
            "archive_frames_deduplicated_total",
            "Total number of frames skipped due to deduplication",
            registry=registry,
        )
        
        self.frames_deleted_total = Counter(
            "archive_frames_deleted_total",
            "Total number of frames deleted by GC",
            ["dry_run"],  # true, false
            registry=registry,
        )
        
        self.uploads_total = Counter(
            "archive_uploads_total",
            "Total number of upload requests",
            ["status"],  # success, error
            registry=registry,
        )
        
        self.gc_runs_total = Counter(
            "archive_gc_runs_total",
            "Total number of garbage collection runs",
            ["dry_run"],  # true, false
            registry=registry,
        )
        
        self.migration_runs_total = Counter(
            "archive_migration_runs_total",
            "Total number of storage migration runs",
            registry=registry,
        )
        
        # Gauges
        self.storage_bytes_total = Gauge(
            "archive_storage_bytes_total",
            "Total bytes used by archived frames",
            registry=registry,
        )
        
        self.frames_pinned_total = Gauge(
            "archive_frames_pinned_total",
            "Total number of pinned frames",
            registry=registry,
        )
        
        self.frames_total = Gauge(
            "archive_frames_total",
            "Total number of frames in storage",
            registry=registry,
        )
        
        # Histograms
        self.upload_duration_seconds = Histogram(
            "archive_upload_duration_seconds",
            "Time spent uploading frames",
            buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0],
            registry=registry,
        )
        
        self.gc_duration_seconds = Histogram(
            "archive_gc_duration_seconds",
            "Time spent in garbage collection",
            buckets=[1.0, 5.0, 10.0, 30.0, 60.0, 120.0, 300.0],
            registry=registry,
        )
        
        self.frame_size_bytes = Histogram(
            "archive_frame_size_bytes",
            "Size distribution of uploaded frames",
            buckets=[1024, 5120, 10240, 51200, 102400, 512000, 1048576],
            registry=registry,
        )
        
        logger.info("ArchiveMetrics initialized")
    
    def increment_frames_uploaded(self, count: int = 1, status: str = "success"):
        """Increment the frames uploaded counter.
        
        Args:
            count: Number of frames to increment
            status: Status label (success, deduplicated, error)
        """
        if self._noop:
            return
        self.frames_uploaded_total.labels(status=status).inc(count)
    
    def increment_frames_deduplicated(self, count: int = 1):
        """Increment the deduplication counter.
        
        Args:
            count: Number of deduplicated frames
        """
        if self._noop:
            return
        self.frames_deduplicated_total.inc(count)
    
    def increment_frames_deleted(self, count: int = 1, dry_run: bool = False):
        """Increment the frames deleted counter.
        
        Args:
            count: Number of deleted frames
            dry_run: Whether this was a dry run
        """
        if self._noop:
            return
        self.frames_deleted_total.labels(dry_run=str(dry_run).lower()).inc(count)
    
    def increment_uploads(self, status: str = "success"):
        """Increment the upload requests counter.
        
        Args:
            status: Status label (success, error)
        """
        if self._noop:
            return
        self.uploads_total.labels(status=status).inc()
    
    def increment_gc_runs(self, dry_run: bool = False):
        """Increment the GC runs counter.
        
        Args:
            dry_run: Whether this was a dry run
        """
        if self._noop:
            return
        self.gc_runs_total.labels(dry_run=str(dry_run).lower()).inc()
    
    def increment_migrations(self):
        """Increment the migration runs counter."""
        if self._noop:
            return
        self.migration_runs_total.inc()
    
    def set_storage_bytes(self, bytes_total: int):
        """Set the total storage bytes gauge.
        
        Args:
            bytes_total: Total bytes used by frames
        """
        if self._noop:
            return
        self.storage_bytes_total.set(bytes_total)
    
    def set_frames_pinned(self, count: int):
        """Set the pinned frames gauge.
        
        Args:
            count: Number of pinned frames
        """
        if self._noop:
            return
        self.frames_pinned_total.set(count)
    
    def set_frames_total(self, count: int):
        """Set the total frames gauge.
        
        Args:
            count: Total number of frames
        """
        if self._noop:
            return
        self.frames_total.set(count)
    
    def observe_upload_duration(self, duration_seconds: float):
        """Observe upload duration.
        
        Args:
            duration_seconds: Time spent uploading
        """
        if self._noop:
            return
        self.upload_duration_seconds.observe(duration_seconds)
    
    def observe_gc_duration(self, duration_seconds: float):
        """Observe GC duration.
        
        Args:
            duration_seconds: Time spent in GC
        """
        if self._noop:
            return
        self.gc_duration_seconds.observe(duration_seconds)
    
    def observe_frame_size(self, size_bytes: int):
        """Observe frame size.
        
        Args:
            size_bytes: Size of the frame in bytes
        """
        if self._noop:
            return
        self.frame_size_bytes.observe(size_bytes)


# Global metrics instance
_metrics: Optional[ArchiveMetrics] = None


def get_metrics() -> ArchiveMetrics:
    """Get the global metrics instance.
    
    Returns:
        ArchiveMetrics singleton
    """
    global _metrics
    if _metrics is None:
        _metrics = ArchiveMetrics()
    return _metrics


def reset_metrics():
    """Reset metrics instance (for testing)."""
    global _metrics
    _metrics = None
