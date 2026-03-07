# eXe Directory - Quick Start

## Installation

```bash
cd exe-directory
pip install -r requirements.txt
```

## Initialize Database

```bash
# Database is auto-initialized on first run
# Schema is in schema.sql
```

## Start Directory Service

```bash
# Development
python main.py

# Production (with uvicorn directly)
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Register a Service

```python
from exe_directory_client import ServiceRegistryClient, ServiceConfig

client = ServiceRegistryClient("http://localhost:8000")

config = ServiceConfig(
    service_id="my-service",
    name="My Service",
    service_type="core",  # core, game, pipeline, platform
    host="localhost",
    port=8080
)

client.register_service(config)
client.start_heartbeat()
```

## API Examples

### List Services
```bash
curl http://localhost:8000/services
```

### Check Health
```bash
curl http://localhost:8000/health/all
```

### Trigger Parity Check
```bash
curl -X POST http://localhost:8000/parity-check
```

### Get Parity Status
```bash
curl http://localhost:8000/parity-status
```

## Service Types

- `core` - Core platform services (RAWS, BASE)
- `platform` - NJZ platform tools
- `game` - Game instances (AXIOM, Market Sim)
- `pipeline` - Data processing services

## Default Ports

| Service | Port |
|---------|------|
| eXe Directory | 8000 |
| RAWS | 8001 |
| BASE | 8002 |
| NJZ Platform | 8003 |
| AXIOM Game | 8004 |
| NJZ Market | 8005 |
| Data Pipeline | 8006 |
