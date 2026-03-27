"""
Webhook handlers for external data sources.

Currently supports:
- Pandascore webhooks (match updates, scores, results)

Future support:
- VLR.gg webhooks
- Liquipedia webhooks
- Third-party integration webhooks
"""

from .pandascore import router as pandascore_router

__all__ = ["pandascore_router"]
