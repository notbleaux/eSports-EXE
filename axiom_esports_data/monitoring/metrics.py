# Phase 6: Prometheus Metrics
from prometheus_client import Counter, Histogram, Gauge, start_http_server
from contextlib import suppress
import time

# Data pipeline metrics
scrapes_total = Counter(
    "tenet_scrapes_total", "Scrapes completed", ["source", "status"]
)
scrape_duration = Histogram("tenet_scrape_duration_seconds", "Scrape latency")
records_ingested = Counter(
    "tenet_records_ingested_total", "Records stored", ["table", "tenet"]
)

# Storage metrics
archive_uploads = Counter("tenet_archive_uploads_total", "Archive uploads", ["type"])
archive_size = Gauge("tenet_archive_size_bytes", "Archive sizes", ["storage", "tenet"])

# Lensing UI metrics (via API)
lenses_active = Gauge("tenet_lenses_active", "Active HUBs", ["user", "tenet"])
grid_resizes = Counter("tenet_grid_resizes_total", "Layout changes")

# System health
db_connections = Gauge("tenet_db_connections", "DB pool size")
celery_queue_length = Gauge("tenet_celery_queue_length", "Job queue")


class Metrics:
    @staticmethod
    def init_server(port: int = 9090):
        start_http_server(port)
        print(f"📊 Metrics server started on :{port}/metrics")

    @staticmethod
    def record_scrape(source: str, duration: float, status: str, records: int = 0):
        scrape_duration.observe(duration)
        scrapes_total.labels(source, status).inc()
        if records > 0:
            records_ingested.labels("matches", "valorant").inc(records)

    @staticmethod
    def record_archive(storage_type: str, tenet: str, size_bytes: int):
        archive_uploads.labels(storage_type).inc()
        archive_size.labels(storage_type, tenet).set(size_bytes)


if __name__ == "__main__":
    Metrics.init_server(9090)

    # Test metrics
    Metrics.record_scrape("vlr", 2.3, "success", 42)
    Metrics.record_archive("github", "valorant", 102400)

    # Keep server running
    while True:
        time.sleep(30)
