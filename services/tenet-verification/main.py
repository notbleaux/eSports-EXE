"""
TeneT Key.Links Verification Service
Phase 0 stub — health endpoint only.
Full implementation: Phase 2.
"""
from fastapi import FastAPI

app = FastAPI(
    title="TeneT Verification Service",
    description="NJZ eSports TeneT Key.Links data verification bridge",
    version="0.0.1",
)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "tenet-verification", "phase": "0-stub"}


@app.get("/ready")
async def ready() -> dict:
    return {"status": "not_ready", "message": "Full implementation pending Phase 2"}
