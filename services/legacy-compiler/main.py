import os
import json
import logging
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field, ConfigDict
from pydantic_settings import BaseSettings
import httpx

# --- Configuration ---

class Settings(BaseSettings):
    TENET_VERIFICATION_URL: str = os.getenv("TENET_VERIFICATION_URL", "http://localhost:8001")
    PANDASCORE_API_KEY: str = os.getenv("PANDASCORE_API_KEY", "")
    SCRAPE_INTERVAL_HOURS: int = 6
    APP_VERSION: str = "0.1.0"

settings = Settings()

# --- Logging ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("legacy-compiler")

# --- Models ---

class TenetBaseModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        protected_namespaces=(),
    )

class CompileRequest(TenetBaseModel):
    match_id: str = Field(alias="matchId")
    game: str
    sources: List[str] = Field(default=["pandascore", "vlr", "video"])

class CompileStatus(TenetBaseModel):
    match_id: str = Field(alias="matchId")
    status: str # processing, verified, failed
    confidence: Optional[float] = Field(default=None)
    started_at: datetime = Field(alias="startedAt")

# --- Scrapers (Stubs) ---

async def fetch_vlr_data(match_id: str) -> Dict[str, Any]:
    logger.info(f"Scraping VLR.gg for match {match_id}")
    await asyncio.sleep(1) # Simulate network I/O
    return {"source": "vlr", "match_id": match_id, "data": {"map_stats": [], "player_performances": []}}

async def extract_video_metadata(match_id: str) -> Dict[str, Any]:
    logger.info(f"Extracting video metadata for match {match_id}")
    await asyncio.sleep(2) # Simulate OCR/CV processing
    return {"source": "video", "match_id": match_id, "data": {"round_timings": [], "kill_feed_events": []}}

async def fetch_pandascore_legacy(match_id: str) -> Dict[str, Any]:
    logger.info(f"Fetching historical PandaScore data for match {match_id}")
    await asyncio.sleep(0.5)
    return {"source": "pandascore", "match_id": match_id, "data": {"final_score": {}, "rosters": []}}

# --- Orchestration ---

async def run_compilation_pipeline(match_id: str, game: str, source_list: List[str]):
    logger.info(f"Starting legacy compilation for match {match_id}")
    
    tasks = []
    if "vlr" in source_list:
        tasks.append(fetch_vlr_data(match_id))
    if "video" in source_list:
        tasks.append(extract_video_metadata(match_id))
    if "pandascore" in source_list:
        tasks.append(fetch_pandascore_legacy(match_id))
        
    results = await asyncio.gather(*tasks)
    
    # Prepare for TeneT Verification
    verification_payload = {
        "entityId": match_id,
        "entityType": "match",
        "game": game,
        "sources": [
            {
                "sourceType": r["source"],
                "trustLevel": "HIGH" if r["source"] == "pandascore" else "MEDIUM",
                "weight": 1.0,
                "data": r["data"],
                "capturedAt": datetime.utcnow().isoformat()
            } for r in results
        ]
    }
    
    # Trigger Verification
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{settings.TENET_VERIFICATION_URL}/v1/verify",
                json=verification_payload,
                timeout=10.0
            )
            if resp.status_code == 200:
                verify_result = resp.json()
                logger.info(f"Match {match_id} verified with status: {verify_result['status']} (score: {verify_result['confidenceScore']})")
                # Here we would store to the "Truth Layer" (PostgreSQL/ClickHouse)
            else:
                logger.error(f"Verification failed for match {match_id}: {resp.text}")
    except Exception as e:
        logger.error(f"Error connecting to verification service: {e}")

# --- FastAPI App ---

app = FastAPI(
    title="NJZ Legacy Data Compiler",
    description="Static Truth Legacy data pipeline for NJZ eSports",
    version=settings.APP_VERSION,
)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "legacy-compiler", "version": settings.APP_VERSION}

@app.post("/v1/compile", response_model=CompileStatus)
async def trigger_compilation(request: CompileRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(run_compilation_pipeline, request.match_id, request.game, request.sources)
    
    return CompileStatus(
        match_id=request.match_id,
        status="processing",
        started_at=datetime.utcnow()
    )

@app.get("/ready")
async def ready():
    return {"status": "ready"}
