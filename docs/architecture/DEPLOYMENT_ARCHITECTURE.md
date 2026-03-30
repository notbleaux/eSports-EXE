[Ver001.000] [Part: 1/1, Phase: 1/1, Progress: 100%, Status: Complete]

# Deployment Architecture
## Infrastructure Diagrams & Service Interactions

---

## 1. High-Level Infrastructure Overview

```mermaid
flowchart TB
    subgraph Users["👥 Users"]
        Browser["Web Browser"]
        Mobile["Mobile Device"]
        APIClient["API Client"]
    end
    
    subgraph Edge["🌐 Edge Layer (Vercel)"]
        CDN["Global CDN"]
        EdgeFunctions["Edge Functions"]
        SSL["SSL/TLS Termination"]
    end
    
    subgraph Application["🔧 Application Layer (Render)"]
        APIGateway["API Gateway\nFastAPI"]
        WebSocket["WebSocket Server"]
        Workers["Background Workers"]
    end
    
    subgraph Data["💾 Data Layer"]
        Postgres[("PostgreSQL\nSupabase")]
        Redis[("Redis\nUpstash")]
        Storage[("Object Storage\nSupabase S3")]
    end
    
    subgraph External["🌍 External Services"]
        Pandascore["Pandascore API"]
        OAuth["OAuth Providers\nGoogle/Discord/GitHub"]
        Sentry["Sentry\nError Tracking"]
    end
    
    Users --> Edge
    Edge --> Application
    Application --> Data
    Application --> External
```

---

## 2. Service Interaction Diagram

```mermaid
flowchart LR
    subgraph Vercel["⚡ Vercel (Web)"]
        WebApp["React Web App\nnjzitegeist.com"]
        Preview["Preview Deploys\n*.vercel.app"]
    end
    
    subgraph Render["🔧 Render (API)"]
        FastAPI["FastAPI Service\n/api/*"]
        Health["Health Checks\n/health"]
    end
    
    subgraph Supabase["🐘 Supabase (Database)"]
        Postgres[("PostgreSQL 15\nPrimary DB")]
        Auth["Auth Service\n(Optional)"]
        Storage["S3-compatible\nObject Storage"]
    end
    
    subgraph Upstash["⚡ Upstash (Cache)"]
        Redis[("Redis 7\nSession/Cache")]
    end
    
    subgraph External["🌍 External"]
        Pandascore["📊 Pandascore"]
    end
    
    WebApp -->|"HTTPS\n/api/v1/*"| FastAPI
    WebApp -->|"WSS\n/ws/*"| FastAPI
    
    FastAPI -->|"SQL\nPool: 20"| Postgres
    FastAPI -->|"Redis Protocol\nTLS"| Redis
    FastAPI -->|"HTTPS\nAPI Key"| Pandascore
    
    FastAPI -.->|"Health Check\nEvery 30s"| Health
```

---

## 3. Request Flow

### 3.1 API Request Flow

```mermaid
sequenceDiagram
    participant User as User Browser
    participant Vercel as Vercel Edge
    participant Render as Render API
    participant Redis as Upstash Redis
    participant Postgres as Supabase PG
    
    User->>Vercel: GET /api/v1/players/123
    Vercel->>Vercel: SSL Termination
    Vercel->>Vercel: Check Cache
    
    alt Cache Hit
        Vercel-->>User: 200 OK (Cached)
    else Cache Miss
        Vercel->>Render: Forward Request
        Render->>Render: Rate Limit Check
        Render->>Render: JWT Validation
        
        Render->>Redis: Check Session
        Redis-->>Render: Session Valid
        
        Render->>Postgres: SELECT * FROM players
        Postgres-->>Render: Player Data
        
        Render->>Redis: Cache Result (60s)
        Render-->>Vercel: 200 OK + JSON
        Vercel-->>User: 200 OK + JSON
    end
```

### 3.2 WebSocket Real-Time Flow

```mermaid
sequenceDiagram
    participant Client as Web Client
    participant Vercel as Vercel Edge
    participant Render as Render API
    participant Redis as Redis Pub/Sub
    participant Panda as Pandascore
    
    Client->>Vercel: WSS Connect /ws/live
    Vercel->>Render: Upgrade Connection
    Render->>Render: Authenticate JWT
    Render->>Redis: Subscribe to "matches:*"
    
    loop Live Updates
        Panda->>Render: Webhook: Match Event
        Render->>Redis: PUBLISH match:123
        Redis->>Render: Broadcast to subscribers
        Render->>Client: JSON: Match Update
    end
    
    Client->>Render: Disconnect
    Render->>Redis: Unsubscribe
```

---

## 4. Infrastructure Components

### 4.1 Vercel (Frontend Hosting)

| Feature | Configuration |
|---------|---------------|
| **Framework** | React 18 + Vite |
| **Build Output** | Static + SPA |
| **Edge Network** | Global CDN (100+ locations) |
| **SSL** | Automatic, TLS 1.3 |
| **Domains** | njzitegeist.com, www.njzitegeist.com |
| **Preview Deploys** | Every PR gets unique URL |

**vercel.json Configuration:**
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://api.njzitegeist.com/api/$1" },
    { "source": "/ws/(.*)", "destination": "wss://api.njzitegeist.com/ws/$1" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ]
}
```

### 4.2 Render (API Hosting)

| Feature | Configuration |
|---------|---------------|
| **Service Type** | Web Service |
| **Runtime** | Python 3.11 |
| **Framework** | FastAPI (ASGI) |
| **Instance** | Starter (512MB RAM) |
| **Health Check** | /health every 30s |
| **Auto-deploy** | On push to main |
| **Custom Domain** | api.njzitegeist.com |

**render.yaml:**
```yaml
services:
  - type: web
    name: njz-api
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: njz-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          type: redis
          name: njz-cache
          property: connectionString
```

### 4.3 Supabase (Database)

| Feature | Configuration |
|---------|---------------|
| **Database** | PostgreSQL 15 |
| **Region** | us-east-1 |
| **Pooler Port** | 6543 (transaction mode) |
| **Direct Port** | 5432 (session mode) |
| **Storage** | 500MB (free tier) |
| **Backup** | Daily (7-day retention) |
| **Connection Limit** | 60 (pooler) |

**Connection Strategy:**
```python
# Use pooler for most operations
DATABASE_URL = "postgresql://postgres:[password]@db.[ref].supabase.co:6542/postgres"

# Use direct connection for migrations/admin
ADMIN_DATABASE_URL = "postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
```

### 4.4 Upstash (Redis Cache)

| Feature | Configuration |
|---------|---------------|
| **Type** | Redis 7 |
| **Region** | us-east-1 |
| **Max Data Size** | 256MB (free tier) |
| **Daily Commands** | 10,000 (free tier) |
| **TLS** | Required |
| **Eviction Policy** | allkeys-lru |

**Connection:**
```python
REDIS_URL = "rediss://default:[password]@[host]:6379"
# Note: rediss:// = TLS enabled
```

---

## 5. Network Architecture

### 5.1 VPC/Network Isolation

```mermaid
flowchart TB
    subgraph PublicInternet["🌐 Public Internet"]
        Users["Users"]
        ExternalAPIs["External APIs\nPandascore, OAuth"]
    end
    
    subgraph VercelEdge["⚡ Vercel Edge Network"]
        CDN["CDN"]
        Firewall["WAF"]
    end
    
    subgraph RenderNetwork["🔧 Render Network"]
        APIService["API Service"]
    end
    
    subgraph SupabaseNetwork["🐘 Supabase Network"]
        DBInstance["PostgreSQL Instance"]
        AuthService["Auth Service"]
    end
    
    subgraph UpstashNetwork["⚡ Upstash Network"]
        RedisInstance["Redis Instance"]
    end
    
    Users -->|HTTPS| CDN
    CDN --> Firewall
    Firewall -->|Proxy| APIService
    
    APIService -->|TLS| DBInstance
    APIService -->|TLS| RedisInstance
    APIService -->|HTTPS| ExternalAPIs
```

### 5.2 Security Groups / Firewall Rules

| Source | Destination | Port | Protocol | Action |
|--------|-------------|------|----------|--------|
| Any | Vercel Edge | 443 | HTTPS | Allow |
| Vercel IPs | Render API | 443 | HTTPS | Allow |
| Render API | Supabase | 6543 | PostgreSQL | Allow |
| Render API | Upstash | 6379 | Redis | Allow |
| Render API | Pandascore | 443 | HTTPS | Allow |
| Any | Render API | 22 | SSH | Deny |
| Any | Supabase | 5432 | PostgreSQL | Deny (use pooler) |

---

## 6. Scaling Architecture

### 6.1 Horizontal Scaling

```mermaid
flowchart TB
    subgraph LoadBalancer["Load Balancer"]
        ALB["Application LB\nRound Robin"]
    end
    
    subgraph APIInstances["API Instances"]
        API1["API Instance 1"]
        API2["API Instance 2"]
        API3["API Instance 3"]
    end
    
    subgraph SharedData["Shared Data"]
        Postgres[("PostgreSQL")]
        Redis[("Redis")]
    end
    
    ALB --> API1
    ALB --> API2
    ALB --> API3
    
    API1 --> SharedData
    API2 --> SharedData
    API3 --> SharedData
```

### 6.2 Current vs Target Scale

| Metric | Current | Target (Growth) |
|--------|---------|-----------------|
| **API Instances** | 1 (Render Starter) | 2-3 (Render Standard) |
| **Database** | Shared (Supabase) | Dedicated (Supabase Pro) |
| **Cache** | 256MB (Upstash) | 1GB (Upstash) |
| **CDN** | Vercel Hobby | Vercel Pro |
| **Concurrent Users** | ~100 | ~1,000 |
| **Requests/Min** | ~1,000 | ~10,000 |

---

## 7. Backup & Disaster Recovery

### 7.1 Database Backups

| Type | Frequency | Retention | Storage |
|------|-----------|-----------|---------|
| **Automated** | Daily | 7 days | Supabase-managed |
| **Manual** | Before migrations | Indefinite | Downloaded locally |
| **Point-in-Time** | Continuous | 7 days | Supabase Pro feature |

### 7.2 Recovery Procedures

```bash
# Database Restore (from Supabase dashboard)
1. Go to Supabase Dashboard → Database → Backups
2. Select backup point
3. Click "Restore"
4. Update connection strings if necessary

# Code/Config Restore (from Git)
git clone https://github.com/notbleaux/eSports-EXE.git
cd eSports-EXE
git checkout [last-known-good-commit]
```

---

## 8. Monitoring & Alerting

### 8.1 Health Check Endpoints

| Endpoint | Service | Response |
|----------|---------|----------|
| `GET /health` | Render API | `{"status": "healthy"}` |
| `GET /ready` | Render API | `{"status": "ready", "db": "connected"}` |
| `GET /health/circuits` | Render API | Circuit breaker status |

### 8.2 Alert Thresholds

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| **API Latency (p95)** | >500ms | >1000ms | Scale up |
| **Error Rate** | >1% | >5% | Investigate |
| **Database CPU** | >70% | >90% | Optimize queries |
| **Cache Hit Rate** | <80% | <60% | Review caching |
| **Disk Usage** | >70% | >85% | Cleanup/Upgrade |

---

## 9. Cost Analysis

### 9.1 Current Monthly Costs (Free Tier)

| Service | Tier | Cost |
|---------|------|------|
| Vercel | Hobby | $0 |
| Render | Starter | $0 |
| Supabase | Free | $0 |
| Upstash | Free | $0 |
| **Total** | | **$0** |

### 9.2 Scaling Costs (Estimated)

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| Vercel | Pro | $20 |
| Render | Standard | $25 |
| Supabase | Pro | $25 |
| Upstash | Pay-as-you-go | ~$10 |
| **Total** | | **~$80** |

---

## 10. Deployment Workflow

```mermaid
flowchart LR
    subgraph Dev["Development"]
        Code["Code Changes"]
        Test["Local Testing"]
    end
    
    subgraph CI["CI/CD Pipeline"]
        Build["Build & Test"]
        Security["Security Scan"]
    end
    
    subgraph Staging["Staging"]
        DeployStg["Deploy to Staging"]
        E2E["E2E Tests"]
    end
    
    subgraph Prod["Production"]
        DeployProd["Deploy to Prod"]
        Monitor["Monitor"]
    end
    
    Code --> Test --> Build --> Security
    Security --> DeployStg --> E2E
    E2E --> DeployProd --> Monitor
```

---

## 11. Infrastructure as Code

### 11.1 Render Blueprint

```yaml
# render.yaml
services:
  - type: web
    name: njz-api
    runtime: python
    plan: starter
    buildCommand: |
      cd packages/shared
      pip install -r requirements.txt
    startCommand: |
      cd packages/shared/api
      uvicorn main:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /health
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
      - key: DATABASE_URL
        fromDatabase:
          name: njz-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          type: redis
          name: njz-cache
          property: connectionString

databases:
  - name: njz-db
    plan: starter

redis:
  - name: njz-cache
    plan: free
    ipAllowList: []
```

---

## 12. Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 001.000 | 2026-03-30 | Infrastructure Team | Initial deployment architecture |

### Related Documents

- [Canonical System Architecture](CANONICAL_SYSTEM_ARCHITECTURE.md)
- [API Versioning Policy](../API_VERSIONING_POLICY.md)
- [Security Hardening Guide](../SECURITY_HARDENING.md)

---

*End of Deployment Architecture Documentation*
