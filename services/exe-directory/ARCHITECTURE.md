[Ver001.000]

# eXe Directory Architecture
## SATOR-eXe-ROTAS Central Service Registry

---

## Overview

The **eXe Directory** is the central nervous system of the SATOR-eXe-ROTAS platform. It implements a **Service Discovery Pattern** that enables dynamic registration, health monitoring, and coordination of all interconnected components.

### Core Purpose

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           eXe DIRECTORY                                      │
│                    (Central Service Registry)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Service    │  │    Health    │  │    Parity    │  │    Data      │  │
│  │   Registry   │  │   Monitor    │  │   Checker    │  │   Router     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                 │                 │                 │            │
└─────────┼─────────────────┼─────────────────┼─────────────────┼────────────┘
          │                 │                 │                 │
    ┌─────┴─────┐     ┌─────┴─────┐     ┌─────┴─────┐     ┌─────┴─────┐
    │   RAWS    │     │   BASE    │     │ NJZ Plat  │     │  AXIOM    │
    │  (Stats)  │     │(Analytics)│     │ (Tools)   │     │  (Game)   │
    └───────────┘     └───────────┘     └───────────┘     └───────────┘
```

---

## Architecture Pattern

### Service Discovery Pattern

The eXe Directory implements a **Self-Registration** pattern:

1. **Services register themselves** on startup
2. **Heartbeat mechanism** maintains liveness
3. **Health checks** verify operational status
4. **Automatic deregistration** on graceful shutdown

```
Service Startup:
    ↓
Register with Directory (POST /register)
    ↓
Start Heartbeat Thread
    ↓
Receive Traffic
    ↓
Graceful Shutdown:
    ↓
Deregister (DELETE /services/{id})
```

---

## Components

### 1. Service Registry

**Purpose:** Central catalog of all services

**Key Tables:**
- `services` - Service definitions
- `service_instances` - Running instances
- `health_checks` - Historical health data

**Operations:**
- `POST /register` - Register new service
- `GET /services` - Discover services
- `DELETE /services/{id}` - Deregister

### 2. Health Monitor

**Purpose:** Continuous health validation

**Mechanism:**
- Polls `/health` endpoint on each service
- Stores response times and status codes
- Alerts on consecutive failures

**Config:**
```python
health_check_interval = 30 seconds
connection_timeout = 5 seconds
alert_threshold = 3 consecutive failures
```

### 3. Parity Checker

**Purpose:** Ensure RAWS ↔ BASE data consistency

**Tables:**
- `parity_configs` - Sync configurations
- `parity_checks` - Check results

**Process:**
```
1. Query record counts from RAWS
2. Query record counts from BASE  
3. Compare within tolerance
4. Store result with diff details
```

### 4. Data Router

**Purpose:** Route data between services

**Features:**
- Route definitions in `data_routes` table
- Transformation rules (JSON)
- Retry policies
- Event logging

---

## Data Flow

### Service Registration Flow

```
┌─────────────┐     POST /register      ┌──────────────┐
│   Service   │ ───────────────────────→│   Directory  │
│   (New)     │                         │   (SQLite)   │
└─────────────┘                         └──────────────┘
       │                                         │
       │←────────────────────────────────────────┤
       │        200 OK + Service Record          │
       │                                         │
       │───── POST /register/{id}/instance ─────→│
       │                                         │
       │←────────────────────────────────────────┤
       │        200 OK + Instance ID             │
       │                                         │
       ═════ Heartbeat (every 30s) ══════════════→
```

### Health Check Flow

```
┌──────────────────┐
│ HealthOrchestrator│
│   (30s interval)  │
└────────┬─────────┘
         │
    ┌────┴────┐
    │ For each│
    │ service │
    └────┬────┘
         │ GET /health
         ↓
    ┌─────────┐
    │ Service │
    │  (8001) │
    └────┬────┘
         │ 200 OK {status: "healthy"}
         ↓
    Store in health_checks table
```

### Parity Check Flow

```
┌──────────────────┐
│  ParityChecker   │
│  (on demand/     │
│   scheduled)     │
└────────┬─────────┘
         │
    ┌────┴──────────────────┐
    ↓                       ↓
┌───────┐              ┌───────┐
│ RAWS  │              │ BASE  │
│ GET   │              │ GET   │
│/count │              │/count │
└───┬───┘              └───┬───┘
    │                      │
    ↓ 1000 records         ↓ 998 records
    └──────────┬───────────┘
               │
          ┌────┴────┐
          │ Compare │ (tolerance: 0.5%)
          └────┬────┘
               │
          ┌────┴────┐
          │ Status: │
          │ MISMATCH│
          └────┬────┘
               ↓
         Store in parity_checks
```

---

## API Endpoints

### Service Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register a service |
| POST | `/register/{id}/instance` | Register an instance |
| GET | `/services` | List all services |
| GET | `/services/{id}` | Get service details |
| DELETE | `/services/{id}` | Deregister service |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Directory self-health |
| GET | `/health/all` | Check all services |
| GET | `/health/{id}` | Check specific service |

### Parity
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/parity-check` | Trigger parity validation |
| GET | `/parity-status` | Get RAWS/BASE sync status |
| GET | `/parity-checks/history` | Check history |

### Data Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/routes` | Create data route |
| GET | `/routes` | List routes |

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/events` | System events log |

---

## Database Schema

### Core Tables

```sql
-- Services
services (
    service_id (PK), name, service_type, 
    host, port, base_url, health_endpoint,
    metadata (JSON), tags, priority, is_active
)

-- Instances
service_instances (
    id (PK), service_id (FK), instance_id (UK),
    host, port, status, last_heartbeat
)

-- Health History
health_checks (
    id (PK), service_id (FK), status,
    response_time_ms, status_code, checked_at
)

-- Parity Config
parity_configs (
    id (PK), source_service, target_service,
    table_name, check_interval_minutes, tolerance_percent
)

-- Parity Results
parity_checks (
    id (PK), config_id (FK), check_run_id,
    status, source_count, target_count, diff_count
)
```

---

## Service Types

| Type | Description | Examples |
|------|-------------|----------|
| `core` | Core platform services | RAWS, BASE |
| `platform` | NJZ platform tools | Dashboards, Admin |
| `game` | Game instances | AXIOM, Market Sim |
| `pipeline` | Data processing | ETL, sync jobs |

---

## Client Integration

### Python Client Usage

```python
from exe_directory_client import ServiceRegistryClient, ServiceConfig

# Initialize
client = ServiceRegistryClient("http://localhost:8000")

# Register
config = ServiceConfig(
    service_id="my-service",
    name="My Service",
    service_type="core",
    host="localhost",
    port=8080
)
client.register_service(config)

# Start heartbeat
client.start_heartbeat(interval_seconds=30)

# Discover other services
analytics = client.discover_service("core", healthy_only=True)

# Shutdown (auto-deregisters)
client.shutdown()
```

### Context Manager (Recommended)

```python
from exe_directory_client import registered_service, ServiceConfig

config = ServiceConfig(...)
with registered_service("http://localhost:8000", config) as client:
    # Run your service
    app.run()
# Auto-deregisters on exit
```

---

## Health Status Values

| Status | Meaning | Action |
|--------|---------|--------|
| `healthy` | Service operating normally | Route traffic |
| `degraded` | Service slow/partial issues | Route with caution |
| `unhealthy` | Service not responding | Stop routing, alert |
| `unknown` | Cannot determine status | Retry check |

---

## Deployment

### Directory Service
```bash
cd exe-directory
pip install -r requirements.txt
python main.py
# Runs on http://localhost:8000
```

### Each Service
```python
# In service startup code
client = ServiceRegistryClient()
client.register_service(config)
client.start_heartbeat()
```

---

## Monitoring

### Key Metrics
- Service count by status
- Average response times
- Parity check diffs
- Health check failures

### Alert Rules
- 3+ consecutive failures
- Response time > 5s
- Parity diff > tolerance

---

## Scaling Considerations

**Current Design (SQLite):**
- Single directory instance
- Suitable for ~100 services
- Local file-based storage

**Future Scaling Path:**
1. Replace SQLite with PostgreSQL
2. Add directory clustering (Raft consensus)
3. Implement service mesh (Istio/Linkerd)

---

## Security Notes

Current implementation is for internal/trusted networks:
- No authentication on endpoints
- No TLS requirement
- No request signing

For production hardening:
- Add API key authentication
- Enable HTTPS/TLS
- Add request rate limiting
- Implement service identity verification

---

## Summary

The eXe Directory provides:
1. **Service Discovery** - Find services dynamically
2. **Health Monitoring** - Know when services fail
3. **Parity Checking** - Keep RAWS/BASE in sync
4. **Data Routing** - Move data between services
5. **Event Logging** - Audit all operations

All with zero infrastructure cost using Python + SQLite + FastAPI.
