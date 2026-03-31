"""
Celery Configuration for ROTAS Distributed Ingestion

Three sub-agent types:
- Fetcher: Pulls data from external APIs (PandaScore)
- Transformer: Normalizes and enriches raw data
- Writer: Persists to database with conflict resolution
"""

from celery import Celery
from celery.signals import task_failure, task_success
import os
import logging

logger = logging.getLogger(__name__)

# Redis broker configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "rotas_ingestion",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=[
        "njz_api.rotas.tasks.fetcher",
        "njz_api.rotas.tasks.transformer",
        "njz_api.rotas.tasks.writer",
    ]
)

# Task routing - directs specific tasks to specific queues
celery_app.conf.task_routes = {
    "fetcher.*": {"queue": "fetcher"},
    "transformer.*": {"queue": "transformer"},
    "writer.*": {"queue": "writer"},
}

# Task serialization
celery_app.conf.task_serializer = "json"
celery_app.conf.accept_content = ["json"]
celery_app.conf.result_serializer = "json"

# Task execution settings
celery_app.conf.task_track_started = True
celery_app.conf.task_time_limit = 600  # 10 minutes max per task
celery_app.conf.worker_prefetch_multiplier = 1  # Fair task distribution

# Result backend settings
celery_app.conf.result_expires = 3600  # Results expire after 1 hour
celery_app.conf.result_extended = True

# Retry configuration
celery_app.conf.task_default_retry_delay = 60  # 1 minute
celery_app.conf.task_max_retries = 3

# Monitoring
celery_app.conf.worker_send_task_events = True
celery_app.conf.task_send_sent_event = True


@task_success.connect
def handle_task_success(sender=None, result=None, **kwargs):
    """Handle successful task completion."""
    logger.info(f"Task {sender.name} completed successfully")


@task_failure.connect
def handle_task_failure(sender=None, task_id=None, exception=None, **kwargs):
    """Handle task failure - triggers alerts."""
    logger.error(f"Task {sender.name} failed: {exception}")
    # TODO: Integrate with alert manager for critical failures
