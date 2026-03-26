from fastapi import FastAPI

app = FastAPI(
    title="NJZ API Gateway",
    description="Canonical API gateway for NJZ eSports Platform",
    version="0.0.1",
)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "api-gateway"}
