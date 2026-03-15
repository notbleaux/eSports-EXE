"""Minimal API for testing lifespan issue."""
import os
from fastapi import FastAPI
from datetime import datetime, timezone

app = FastAPI(title="SATOR API Minimal Test", version="2.1.0")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "sator-api",
        "version": "2.1.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

@app.get("/live")
async def liveness_check():
    return {"status": "alive"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main_minimal:app", host="127.0.0.1", port=8000, log_level="debug")
